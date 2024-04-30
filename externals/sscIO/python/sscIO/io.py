import logging
import os
import numpy as np
import subprocess
import uuid
import SharedArray as sa
import multiprocessing as mp
import shlex

from . import shared_memory
from . import io_info

import tifffile

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


def read_volume(filepath, output_type, shm_key=None, use_MPI=False, reuse_shared_memory=True, nprocs=32, **kwargs):
    """ Reads volume.

    Reads a volume file, may use MPI for reading faster and store in shared memory for access

    Args:
        filepath (string): path to file
        output_type (string): output type in {'ssc_volume', 'numpy', 'shared_array'}
        shm_key (int): shared memory key, set to -1 for automatic key
        use_MPI (bool): set True to use MPI for faster reading HDF5 files
        reuse_shared_memory (bool): set True to allow the volume to be overwritten
        nprocs (int): number of MPI processes

    Returns:
        (array, string): volume array, imaging type string

    """
    output_type = output_type.lower()
    assert output_type in ('ssc_volume', 'numpy', 'shared_array')

    if not os.path.exists(filepath):
        error_msg = f'Exception: Unable to find file {filepath}'
        logger.exception(error_msg)

    if output_type == 'ssc_volume' and (shm_key is None or type(shm_key) != int):
        logger.exception(
            'For "ssc_volume" output, please set "shm_key" as an integer, with -1 denoting automatic selection')

    ext = os.path.splitext(filepath)[1].lower()

    # Using MPI only for HDF5. For other file types, using MPI seems
    # to slow down reading/writing
    if ext not in ('', '.h5', '.hdf5'):
        logger.warning(f'Warning: not using MPI to read non-HDF5 file with extension "{ext}"')
        use_MPI = False

    if not use_MPI:
        from . import io_base
        volume, imaging_type, error_msg = io_base.read_volume(filepath, **kwargs)

        if error_msg is not None:
            logger.exception(error_msg)

        return volume, imaging_type
    else:
        volume = imaging_type = error_msg = None
        nprocs = min(64, mp.cpu_count() // 2) if nprocs is None or nprocs <= 0 else nprocs

        # Adjusting the number of processes for reading of SLURM is being used
        if 'SLURM_NTASKS' in os.environ:
            nprocs = min(nprocs, int(os.environ['SLURM_NTASKS']))

        # Checking file properties before MPI
        volume_props, error_msg = io_info.get_volume_info(filepath)
        input_shape = volume_props['shape']
        dtype = volume_props['dtype']
        slice_range = volume_props['slice_range']
        y_range = volume_props['y_range']
        x_range = volume_props['x_range']
        imaging_type = volume_props['imaging_type']

        output_shape = (slice_range[1] - slice_range[0] + 1, y_range[1] - y_range[0] + 1, x_range[1] - x_range[0] + 1)

        return_numpy = False

        if input_shape is None or error_msg is not None:
            logger.exception(error_msg)

        if output_type == 'ssc_volume':
            shm_key = int(shm_key)
            shm_key = shared_memory.create_shm_key(shm_key) if shm_key is None or shm_key < 0 else shm_key
            try:
                ret = shared_memory.decode_shared_ssc_volume_info(shm_key)
            except Exception as e:
                # If shared memory does not exist, no worries. Just create a new one
                pass
            else:
                if not reuse_shared_memory:
                    error_msg = f'The ssc_volume with key "{shm_key}" exists. Call this function with reuse_shared_memory=True to allow the volume to be overwritten'
                    logger.exception(error_msg)

                if ret['shape'] != output_shape or ret['dtype'] != dtype:
                    error_msg = f'The ssc_volume with key "{shm_key}" exists with format {ret["shape"]}:{ret["dtype"]} different than incoming file {output_shape}:{dtype}. Please delete it before reusing'
                    logger.exception(error_msg)
                else:
                    logger.warning(f'--- Warning! Reusing ssc_volume {shm_key}')

        elif output_type == 'shared_array':
            # Automatically selecting shm_key for SharedArray, if necessary
            shm_key = str(shm_key) if shm_key is not None and type(shm_key) == str else str(uuid.uuid4())
            try:
                volume = sa.attach(shm_key)
            except:
                volume = None
            else:
                if not reuse_shared_memory:
                    error_msg = f'The SharedArray with key "{shm_key}" exists. Call this function with reuse_shared_memory=True to allow the volume to be overwritten'
                    logger.exception(error_msg)
                if volume.shape != output_shape or volume.dtype != dtype:
                    error_msg = f'The SharedArray with key "{shm_key}" exists with format {volume.shape}:{volume.dtype} different than incoming file {output_shape}:{dtype}. Please delete it before reusing'
                    logger.exception(error_msg)

                logger.warning(f'--- Warning! Reusing SharedArray {shm_key}')

        else:
            # Selecting a unique ID for the shared memory
            output_type = 'shared_array'
            shm_key = str(uuid.uuid4())
            return_numpy = True

        params = dict(kwargs)

        params.update({'filepath': filepath, 'output_type': output_type, 'shm_key': shm_key})

        logger.info(f'-- Calling MPI code to read {filepath} with {nprocs} processes')

        io_cmd = f'from sscIO import io_mpi; io_mpi.read_volume_MPI_worker(**{params})'
        mpi_cmd = f'mpirun --use-hwthread-cpus -n {nprocs} python3 -c '

        # Using shlex to split the command for safe shell usage, and attaching the IO Python command
        res = subprocess.run(shlex.split(mpi_cmd) + [io_cmd])

        logger.info(f'-- MPI command result: {res}')

        if return_numpy:
            # Copying shared memory to be returned
            volume = sa.attach(shm_key).copy()
        elif output_type == 'shared_array':
            volume = sa.attach(shm_key)
        else:
            ## Else, the shm_key is returned instead of the volume for posterior attachment
            volume = shm_key

        if output_type == 'shared_array':
            # Marking SharedArray for deletion, to prevent memory leaks. 
            # IMPORTANT: when 'volume' goes out of scope, the memory will
            # be deleted
            sa.delete(shm_key)

        if error_msg is not None or res.returncode != 0:
            # Destroying shared memory in case of error, before returning
            if output_type == 'ssc_volume':
                logger.error(f'--- Cleaning up shared memory {shm_key} due to error')
                shared_memory.destroy_shared_volume(shm_key)

            logger.exception(error_msg)

        return volume, imaging_type


def write_volume_HDF5(source, filepath, imaging_type=None, use_MPI=False, compression=None, compression_opts=None,
                      nprocs=64, **kwargs):
    """
    This function write a .hdf5 file

    Args:
        source (array): it's a numpy array that represents the volume
        filepath (string): volume path
        imaging_type (string): it's the .hdf5 dtype
        use_MPI (bool): set True to use MPI for faster reading HDF5 files
        compression (string): it's a sting that says what type of compression the user wants
        compression_opts (int): it's the total compression operations
        nprocs (int): number of MPI processes
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it.

    Returns:
        None

    """

    logger.info(f'Writing file {filepath} use_MPI {use_MPI}')
    error_msg = None

    if not use_MPI:
        from . import io_base
        error_msg = io_base.write_volume_HDF5(source, filepath, imaging_type, **kwargs)
    else:
        volume_shared_array_tmp = None
        try:
            import multiprocessing as mp

            nprocs = min(64, mp.cpu_count() // 2) if nprocs is None or nprocs <= 0 else nprocs

            # Adjusting the number of processes for reading of SLURM is being used
            if 'SLURM_NTASKS' in os.environ:
                nprocs = min(nprocs, int(os.environ['SLURM_NTASKS']))

            volume_shared_array_tmp = None
            num_slices = 0
            source_param = source
            # SharedArray source
            if type(source) == str:
                source_type = 'shared_array'
                # This will raise an error upon failure, so we do it to double check the validity of the array before MPI
                vol = sa.attach(source)
                num_slices = vol.shape[0]

                if imaging_type is None:
                    error_msg = 'Please select a valid imaging_type for the SharedArray'
                    # logger.error(error_msg)
                    logger.exception(error_msg)

                logger.info(f'-- Successfully attaching to SharedArray {source}')
            # Shared memory allocated volume using sscIO C API
            elif type(source) == int:
                source_type = 'ssc_volume'

                # This will raise an error upon failure, so we do it to double check the validity of the array before MPI
                ret = shared_memory.decode_shared_ssc_volume_info(source)

                num_slices = ret['shape'][0]

            else:  # Assuming Numpy-style array. We thus copy it as a SharedArray and then delete it if necessary
                source_type = 'shared_array'

                if type(source) == np.ndarray and source.base is not None and 'shared_array' in str(type(source.base)):
                    # Great! This is a SharedArray and we can use it
                    logger.info('-- Info: using SharedArray directly')
                    source_param = source.base.name

                    vol = sa.attach(source_param)
                    num_slices = vol.shape[0]
                else:  # This is should be Numpy-style array. Let's try to copy it into a temporary SharedArray
                    volume_shared_array_tmp = sa.create(str(uuid.uuid4()), shape=source.shape, dtype=source.dtype)
                    # Copying data into temporary SharedArray
                    volume_shared_array_tmp[:] = source
                    # Copying name as the source parameter
                    source_param = volume_shared_array_tmp.base.name

                    num_slices = source.shape[0]

                if imaging_type is None:
                    error_msg = 'Please select a valid imaging_type for the SharedArray'
                    # logger.error(error_msg)
                    logger.exception(error_msg)

            # Updating the number of processes to match the number of slices to be written, if 
            # that number is lower than the amount of selected processes
            nprocs = min(num_slices, nprocs)

            logger.info(f'-- Calling MPI code to write {filepath} with {nprocs} processes')

            params = dict(kwargs)
            params.update(
                {'source': source_param, 'filepath': filepath, 'imaging_type': imaging_type, 'source_type': source_type,
                 'compression': compression, 'compression_opts': compression_opts})

            io_cmd = f'from sscIO import io_mpi; io_mpi.write_volume_MPI_worker(**{params})'
            mpi_cmd = f'mpirun --use-hwthread-cpus -n {nprocs} python3 -c '

            subprocess.run(mpi_cmd.split() + [io_cmd])

            # Cleaning up temporary SharedArray
            if volume_shared_array_tmp is not None:
                sa.delete(volume_shared_array_tmp.base.name)
        except Exception as e:
            error_msg = str(e)

    if error_msg is not None:
        logger.exception(error_msg)


def _convert_dtype_to_str(dtype: np.dtype):

    if (dtype == "uint8"):
        return "uint8"

    if (dtype == "int16"):
        return "int16"

    if (dtype == "uint16"):
        return "uint16"

    if (dtype == "int32"):
        return "int32"

    if (dtype == "uint32"):
        return "uint32"

    if (dtype == "int64"):
        return "int64"

    if (dtype == "uint64"):
        return "uint64"

    if (dtype == "float32"):
        return "float32"

    if (dtype == "float64"):
        return "float64"

    if (dtype == "complex64"):
        return "complex64"


def save_volume(image_path: str, image_dtype: str, image: np.array):
    """
    Function that saves an image in numpy array format to any .raw, .b, .tif and .tiff file.

    Args:
        image_path (str): string that represents the image path
        image_dtype (str): string that represents the image dtype to save
        image (np.array): a numpy array that contains the image

    Returns:
        (dict): returns a dict that contains the error message. If the error_msg is empty, it means that
        the image was saved without problems

    """

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff"]

    file = image_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    error_status = {"error_msg": "", "file_name": file_name, "extension": extension}

    if (file == ""):
        error_status["error_msg"] = "Empty path isn't valid !"
        return error_status

    if (extension in tif_extensions):

        if (_convert_dtype_to_str(image.dtype) != image_dtype):
            image = image.astype(image_dtype)

        try:
            tifffile.imwrite(image_path, image)
        except Exception as e:
            error_status["error_msg"] = str(e)

        return error_status

    if (extension in raw_extensions):

        if (_convert_dtype_to_str(image.dtype) != image_dtype):
            image = image.astype(image_dtype)

        try:
            image.tofile(image_path)
        except Exception as e:
            error_status["error_msg"] = str(e)

        return error_status

    else:
        error_status["error_msg"] = "The extension {} isn't supported !".format(extension)
        return error_status
