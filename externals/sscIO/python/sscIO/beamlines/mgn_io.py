import h5py
import os
import numpy as np
import traceback
import sys
import SharedArray as sa
import math
import time
import copy
import logging

from ..util import *
from ..shared_memory import *
from .mgn_info import *

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# file_handler = logging.FileHandler('io.log')
# file_handler.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# logger.addHandler(file_handler)
logger.addHandler(console_handler)

def read_RAFT_binary_file(filename, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                          **kwargs):
    """
    This function reads .raw and .b files and return the volume, dtype and an error if something went wrong.
    Otherwise, error will not receive None as value

    Args:
        filename (string): The image path
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        slice_range ((tuple[int, int])): it's the range to choose how many slices to get
        y_range ((tuple[int, int])): it's the y-range for each slice
        x_range ((tuple[int, int])): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        (array, string, string): volume array, image dtype string, error string

    Notes:
        volume: the volume image read\n
        imaging_type: the image dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    volume = None
    error_msg = None
    filename = fix_storage_naming(filename)

    volume_props, error_msg = get_RAFT_binary_file_info(filename, slice_range=slice_range, y_range=y_range,
                                                        x_range=x_range, **kwargs)
    shape = volume_props['shape']
    dtype = volume_props['dtype']
    slice_range = volume_props['slice_range']
    y_range = volume_props['y_range']
    x_range = volume_props['x_range']
    imaging_type = volume_props['imaging_type']

    if shape is not None and dtype is not None and error_msg is None:
        _, ysize, xsize = shape

        try:
            zsize = slice_range[1] - slice_range[0] + 1

            if zsize > 0:
                offset = slice_range[0] * xsize * ysize * np.dtype(dtype).itemsize

                with open(filename, 'rb') as f:
                    volume = np.fromfile(f, dtype=dtype, offset=offset, count=zsize*ysize*xsize).reshape((zsize, ysize, xsize))

                volume = volume[:, y_range[0]:y_range[1] + 1, x_range[0]:x_range[1] + 1]

                if volume is None or not (len(volume.shape) == 3 and min(volume.shape) > 0):
                    volume = None
                    error_msg = f'Unable to load Binary file format with parameters {filename} {slice_range} {y_range} {x_range}. The selected dimensions are incorrect.'
                elif volume.shape != (zsize, ysize, xsize):
                    """IMPORTANT!! Returning an actual copy of the array, since the data is most likely going to be interpreted
                    as a contiguous array afterwards. Hence, we must ensure that fancy Numpy slicing does not interfere with 
                    that because it keeps a reference to the original data and sets striding accordingly to slice the array."""
                    volume = copy.deepcopy(volume)
            else:
                volume = None
                error_msg = f'Unable to load Binary file format with parameters {filename} {slice_range} {y_range} {x_range}. The selected dimensions are incorrect.'

        except FileNotFoundError as e:
            error_msg = f'Unable to find file {filename}'
        except PermissionError as e:
            error_msg = f'No permission to access file {filename}'
        except Exception as e:
            error_msg = f'Unable to read volume with parameters {filename} {timepoint} {channel} {slice_range}. The selected dimensions are incorrect. Exception: {e}'
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_tb(exc_traceback)
    else:
        error_msg = f'Unable to determine volume information for raw file {filename}. Please specify shape=(zsize, ysize, xsize) and dtype.'

    return volume, imaging_type, error_msg


def read_RAFT_NPY_file(filename, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                       convert_to_ndarray=True, **kwargs):
    """
    This function reads .npy files and return the volume, dtype and an error if something went wrong.
    Otherwise, error will not receive None as value

    Args:
        filename (string): the file path
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        convert_to_ndarray (bool): it's a flag that converts the .npy into a numpy array
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        (array, string, string): volume array, image dtype string, error string

    Notes:
        volume: the volume image read\n
        imaging_type: the image dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value\n
    """

    filename = fix_storage_naming(filename)

    volume = None
    error_msg = None
    volume_props, error_msg = get_RAFT_NPY_file_info(filename, timepoint=timepoint, channel=channel,
                                                     slice_range=slice_range, y_range=y_range, x_range=x_range,
                                                     **kwargs)
    shape = volume_props['shape']
    dtype = volume_props['dtype']
    slice_range = volume_props['slice_range']
    y_range = volume_props['y_range']
    x_range = volume_props['x_range']
    imaging_type = volume_props['imaging_type']

    if shape is not None and dtype is not None and error_msg is None:
        # Trying to parse NPY image file
        try:
            # Mapping the volume to memory by default, since we may either read
            # only a portion of it to memory after slicing
            volume = np.load(filename, mmap_mode='r')
            if volume.ndim == 2:
                volume = volume[np.newaxis, :, :]

            logger.info('Reading NPY volume {} {}'.format(volume.dtype, volume.shape))

            zsize = ysize = xsize = None
            if len(volume.shape) == 3:
                zsize, ysize, xsize = volume.shape
            elif len(volume.shape) == 5:
                _, _, zsize, ysize, xsize = volume.shape

            if zsize is not None and ysize is not None and xsize is not None:
                slice_range = sanitize_coord_range(slice_range, zsize)
                y_range = sanitize_coord_range(y_range, ysize)
                x_range = sanitize_coord_range(x_range, xsize)

                zsize = slice_range[1] - slice_range[0] + 1

                if zsize > 0:
                    if len(volume.shape) == 3:
                        volume = volume[slice_range[0]:slice_range[1] + 1, y_range[0]:y_range[1] + 1,
                                 x_range[0]:x_range[1] + 1]
                    elif len(volume.shape) == 5:
                        volume = volume[timepoint, channel, slice_range[0]:slice_range[1] + 1,
                                 y_range[0]:y_range[1] + 1, x_range[0]:x_range[1] + 1]
                    else:
                        volume = None

                    if volume is None or not (len(volume.shape) in (3, 5) and min(volume.shape) > 0):
                        volume = None
                        error_msg = 'Unable to load NPY file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                            filename, timepoint, channel, slice_range, y_range, x_range)
                    elif convert_to_ndarray:
                        """IMPORTANT!! Returning an actual copy of the array, since the data is most likely going to be interpreted
                        as a contiguous array afterwards. Hence, we must ensure that fancy Numpy slicing does not interfere with 
                        that because it keeps a reference to the original data and sets striding accordingly to slice the array."""
                        volume = np.array(volume)
                else:
                    volume = None
                    error_msg = 'Unable to load NPY file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                        filename, timepoint, channel, slice_range, y_range, x_range)
            else:
                volume = None
                error_msg = 'Unable to load NPY file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                    filename, timepoint, channel, slice_range, y_range, x_range)

        except FileNotFoundError as e:
            error_msg = 'Unable to find file {}'.format(filename)
        except PermissionError as e:
            error_msg = 'No permission to access file {}'.format(filename)
        except Exception as e:
            error_msg = 'Unable to read volume with parameters {} {} {} {} {} {}. The selected dimensions are incorrect. Exception: {}'.format(
                filename, timepoint, channel, slice_range, y_range, x_range, str(e))
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_tb(exc_traceback)

    return volume, imaging_type, error_msg

def read_MGN_volume_HDF5(h5_filename, scan=0, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1),
                         x_range=(0, -1), convert_to_ndarray=True, use_MPI=False, **kwargs):
    """
    This function reads .HDF5 files and return an array, dtype and an error if something went wrong.
    Otherwise, error will not receive None as value. This function is used exclusively for the MOGNO beamline

    Args:
        h5_filename (string): the .hdf5 path
        scan (int): it's a flag that describe what kind of scan the user choose
        timepoint (int): it's the index which slice the user want
        channel: (int) it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        convert_to_ndarray (bool): it's a flag that converts the .npy into a numpy array
        use_MPI (bool): it's a flag that activate MPI
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        (array, string, string): .hdf5 array, the .hdf5 dtype, error string

    Notes:
        array: it's the .hdf5 array\n
        imaging_type: it's the .hdf5 dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """

    h5_filename = fix_storage_naming(h5_filename)

    arr = None
    valid_file = False
    error_msg = None
    imaging_type = "tomo"

    if not os.path.exists(h5_filename):
        error_msg = 'Exception: File {} not found'.format(h5_filename)
    else:
        volume_props, error_msg = get_MGN_HDF5_volume_info(h5_filename, scan=scan, timepoint=timepoint, channel=channel,
                                                           slice_range=slice_range, y_range=y_range, x_range=x_range)
        shape = volume_props['shape']
        dtype = volume_props['dtype']
        slice_range = volume_props['slice_range']
        y_range = volume_props['y_range']
        x_range = volume_props['x_range']
        imaging_type = volume_props['imaging_type']

        if use_MPI:
            from ..io_mpi import load_h5py_mpi
            f = load_h5py_mpi(h5_filename, 'r')
        else:
            f = h5py.File(h5_filename, 'r')

            # Giovanni file
        scan_str = 'scan_%03d' % scan
        if scan_str in f:
            if (len(shape) == 5):
                arr = f[scan_str][timepoint, channel, slice_range[0]:slice_range[1] + 1, y_range[0]:y_range[1] + 1,
                      x_range[0]:x_range[1] + 1]

                if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and arr.shape[
                    2] > 0:
                    valid_file = True
        # IMX file
        elif 'images' in f:
            arr = f['images'][slice_range[0]:slice_range[1] + 1, y_range[0]:y_range[1] + 1, x_range[0]:x_range[1] + 1]
            if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and arr.shape[2] > 0:
                valid_file = True
        # RAFT formats
        elif 'slices' in f:
            if len(shape) == 5:
                arr = f['slices'][timepoint, channel, slice_range[0]:slice_range[1] + 1, y_range[0]:y_range[1] + 1,
                      x_range[0]:x_range[1] + 1]

                if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and arr.shape[
                    2] > 0:
                    valid_file = True
            elif len(shape) == 3:
                arr = f['slices'][slice_range[0]:slice_range[1] + 1, y_range[0]:y_range[1] + 1,
                      x_range[0]:x_range[1] + 1]

                if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and arr.shape[
                    2] > 0:
                    valid_file = True
            else:
                error_msg = 'Unable to parse reconstruction old RAFT HDF5 file format for %s' % h5_filename
        # MGN format
        else:
            scan_modes = ['FlyScan', 'StepScan']
            for mode in scan_modes:
                if mode in f:
                    scan_str = 'scan_%03d' % scan
                    logger.info(
                        'Reading {} from FlyScan file {}, this may take a while...'.format(scan_str, h5_filename))

                    if scan_str in f[mode] and 'Data' in f[mode][scan_str] and 'scan' in f[mode][scan_str]['Data']:
                        # UGLY HEURISTIC TO "OPTIMIZE" READING CHUNKS OF EXTERNAL LINKS:
                        slice_range_heuristic_limit = 16
                        if y_range[1] - y_range[0] + 1 == shape[2] and x_range[1] - x_range[0] + 1 == shape[3] and \
                                slice_range[1] - slice_range[0] + 1 <= slice_range_heuristic_limit:
                            logger.info(
                                '--- Using ugly heuristic to read data from external HDF5 link... {} {} {}'.format(
                                    slice_range, y_range, x_range))

                            """IMPORTANT: since we are opening a link to a dataset, it is important to first convert the entire
                            file into a Numpy array before we can actually slice the data. Otherwise, slicing becomes very slow...
                            And yes, we do need to convert the resulting array again to an array below, since we need contiguous data
                            for RDMA data transfer and other issues. Otherwise, Numpy will just keep a reference to the data pointer
                            arr = f[mode][scan_str]['Data']['scan'][slice_range[0]:slice_range[1] + 1, channel]"""
                        else:
                            logger.info(
                                '--- Reading entire file before slicing, since data lies on an external HDF5 link this should be faster... {} {} {}'.format(
                                    slice_range, y_range, x_range))

                            """IMPORTANT: since we are opening a link to a dataset, it is important to first convert the entire
                            file into a Numpy array before we can actually slice the data. Otherwise, slicing becomes very slow...
                            And yes, we do need to convert the resulting array again to an array below, since we need contiguous data
                            for RDMA data transfer and other issues. Otherwise, Numpy will just keep a reference to the data pointer"""
                            arr = np.array(f[mode][scan_str]['Data']['scan'])[slice_range[0]:slice_range[1] + 1,
                                  channel, y_range[0]:y_range[1] + 1, x_range[0]:x_range[1] + 1]

                        if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and \
                                arr.shape[2] > 0:
                            valid_file = True
                        break
        f.close()

        if not valid_file:
            error_msg = 'Exception: Unable to load MGN HDF5 file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                h5_filename, timepoint, channel, slice_range, y_range, x_range)

            if 'scan' in kwargs:
                error_msg = 'Exception: Unable to load MGN HDF5 file format with parameters {} {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                    h5_filename, scan, timepoint, channel, slice_range, y_range, x_range)

    if arr is not None and convert_to_ndarray:
        """IMPORTANT!! Returning an actual copy of the array, since the data is most likely going to be interpreted
        as a contiguous array afterwards. Hence, we must ensure that fancy Numpy slicing does not interfere with 
        that because it keeps a reference to the original data and sets striding accordingly to slice the array."""
        arr = np.array(arr)

    return arr, imaging_type, error_msg


def write_MGN_volume_HDF5(volume, h5_filename, save_restored=False, timepoint=0, channel=0, use_MPI=False,
                          input_shape=None, input_dtype=None, slice_range=None, compression="gzip", compression_opts=2,
                          **kwargs):
    """
    This function writes .HDF5 files and return an array, dtype and an error if something went wrong.
    Otherwise, error will not receive None as value. This function is used exclusively for the MOGNO beamline

    Args:
        volume (HDF5): it's the image volume
        h5_filename (string): it's the .hdf5 path
        save_restored (bool): it's a flag that says if the file was restored. In this actual point, this flag does nothing in this function
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        use_MPI (bool): it's a flag that activate MPI
        input_shape (tuple[int, int, int]): it's the volume input shape
        input_dtype (string): it's the input volume dtype
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        compression (string): it's a sting that says what type of compression the user wants
        compression_opts (int): it's the total compression operations
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        string: error string, the type of error returned. If everything went well, it'll return None as value

    """

    h5_filename = fix_storage_naming(h5_filename)

    error_msg = None

    if use_MPI:
        if input_shape is None or input_dtype is None or slice_range is None:
            error_msg = 'For MPI-based saving, please specify the \"input_shape\", \"input_dtype\", and \"slice_range\" since the input \"volume\" is interpreted as a chunk of the final volume'
    else:
        input_shape = volume.shape

    if error_msg is None:
        try:
            if use_MPI:
                from ..io_mpi import load_h5py_mpi
                h5_file = load_h5py_mpi(h5_filename, 'w')
            else:
                h5_file = h5py.File(h5_filename, 'w')

            dset_shape = (1, 1) + input_shape
            # Compressing slice by slice
            chunk_shape = (1, 1, 1) + input_shape[1:]

            if compression is not None:
                dset = h5_file.create_dataset('slices', shape=dset_shape, chunks=chunk_shape, dtype=input_dtype,
                                              compression=compression, compression_opts=compression_opts)
            else:
                dset = h5_file.create_dataset('slices', shape=dset_shape, dtype=input_dtype)

            if use_MPI:
                """VERY IMPORTANT: since every MPI process must execute the same actions that alter the HDF5 file
                metadata (e.g., create groups and dataset as above), we must execute them but only perform
                data assignment/writing for valid portions of the volume (we allocate more processes
                than necessary to cover all slices)"""
                if slice_range[0] < input_shape[0]:
                    with dset.collective:
                        dset[timepoint, channel, slice_range[0]:slice_range[1] + 1] = volume
            else:
                dset[timepoint, channel] = volume

            h5_file.close()

        except Exception as e:
            error_msg = 'Exception: Unable to create CAT HDF5 file! Exception: ' + str(e)

    return error_msg


def read_MGN_volume(filename, scan=0, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                    **kwargs):
    """
    This function reads and creates a volume image from a path and return the volume, the image dtype and an error.
    This function is used exclusively for the MOGNO beamline

    Args:
        filename (string): the file path
        scan (int): it's a flag that describe what kind of scan the user choose
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in the function

    Returns:
        (array, string, string): volume array, image dtype string, error string

    Notes:
        volume: the volume image read\n
        imaging_type: the image dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    volume = None
    error_msg = None
    imaging_type = None
    ext = os.path.splitext(filename)[1].lower()
    if ext in ('', '.h5', '.hdf5') or os.path.isdir(filename):
        try:
            volume, imaging_type, error_msg = read_MGN_volume_HDF5(filename, scan=scan, timepoint=timepoint,
                                                                   channel=channel, slice_range=slice_range,
                                                                   y_range=y_range, x_range=x_range, **kwargs)
            if error_msg is not None:
                error_msg = 'Exception: Unable to load HDF5 file! Exception: ' + error_msg
        except Exception as e:
            error_msg = 'Exception: Unable to load HDF5 file! Exception: ' + str(e)
    elif ext == '.npy':
        try:
            volume, imaging_type, error_msg = read_RAFT_NPY_file(filename, timepoint=timepoint, channel=channel,
                                                                 slice_range=slice_range,
                                                                 y_range=y_range, x_range=x_range, **kwargs)
            if error_msg is not None:
                error_msg = 'Exception: Unable to load NPY file! Exception: ' + error_msg
        except Exception as e:
            error_msg = 'Exception: Unable to load NPY file! Exception: ' + str(e)
    else:
        try:
            volume, imaging_type, error_msg = read_RAFT_binary_file(filename, timepoint=timepoint, channel=channel,
                                                                    slice_range=slice_range,
                                                                    y_range=y_range, x_range=x_range, **kwargs)
            if error_msg is not None:
                error_msg = 'Exception: Unable to load binary file! Exception: ' + error_msg
        except Exception as e:
            error_msg = 'Exception: Unable to load binary file! Exception: ' + str(e)

    return volume, imaging_type, error_msg


def read_TIFF_volume(filename, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1), **kwargs):
    """
    This function reads a .Tif or .Tiff image and return the volume, the image dtype and an error.

    Args:
        filename (string): the file path
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in this function

    Returns:
        (string, string): error string, the type of error returned. If everything went well, it'll return None as value

    """
    import skimage.io
    filename = fix_storage_naming(filename)

    volume = None
    error_msg = None
    imaging_type = "tomo"

    if os.path.splitext(filename)[1].lower() in ('.tif', '.tiff'):
        try:
            volume = skimage.io.imread(filename)
        except Exception as e:
            error_msg = 'Exception: Unable to load TIFF file! Exception: ' + str(e)
        else:
            if len(volume.shape) == 2:
                # Converting to 3D volume
                y_range = sanitize_coord_range(y_range, volume.shape[0])
                x_range = sanitize_coord_range(x_range, volume.shape[1])

                volume = volume[x_range[0]:x_range[1] + 1, y_range[0]:y_range[1] + 1]
                volume = volume.reshape((1, volume.shape[0], volume.shape[1]))

            elif len(volume.shape) == 3:
                zsize = volume.shape[0]

                slice_range = sanitize_coord_range(slice_range, volume.shape[0])
                y_range = sanitize_coord_range(y_range, volume.shape[1])
                x_range = sanitize_coord_range(x_range, volume.shape[2])

                volume = volume[slice_range[0]:slice_range[1] + 1, y_range[0]:y_range[1] + 1, x_range[0]:x_range[1] + 1]
            else:
                error_msg = 'Exception: Only 2D and 3D TIFFs are supported! Image shape %s' % str(volume.shape)
                volume = None
    else:
        error_msg = 'Exception: Unable to load TIFF file! Unsupported file extension: ' + os.path.splitext(filename)[
            1].lower()

    if volume is not None and not (
            len(volume.shape) == 3 and volume.shape[0] > 0 and volume.shape[1] > 0 and volume.shape[2] > 0):
        volume = None
        error_msg = 'Exception: Unable to load TIFF file format with parameters {} {} {} {}. The selected dimensions are incorrect.'.format(
            filename, slice_range, y_range, x_range)
    else:
        """IMPORTANT!! Returning an actual copy of the array, since the data is most likely going to be interpreted
        as a contiguous array afterwards. Hence, we must ensure that fancy Numpy slicing does not interfere with 
        that because it keeps a reference to the original data and sets striding accordingly to slice the array.               
        volume = np.array(volume)"""

    return volume, imaging_type, error_msg
