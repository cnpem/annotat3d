import h5py
import os
import numpy as np
import traceback
import sys
import SharedArray as sa
import math
import time
import logging

from ..util import *
from ..shared_memory import *
from .cat_info import *

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


def read_CAT_volume_HDF5(h5_filename, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1), timepoint=0,
                         convert_to_ndarray=True, use_MPI=False, **kwargs):
    """
    This function reads .HDF5 files and return an array, dtype and an error if something went wrong.
    Otherwise, error will not receive None as value. This function is used exclusively for the Caterete beamline

    Args:
        h5_filename (string): the .hdf5 path
        channel: (int) it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        timepoint (int): it's the index which slice the user want
        convert_to_ndarray (bool): it's a flag that converts the .npy into a numpy array
        use_MPI (bool): it's a flag that activate MPI
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in this function

    Returns:
        (array, string, string): .hdf5 array, the .hdf5 dtype, error string

    Notes:
        array: it's the .hdf5 array\n
        imaging_type: it's the .hdf5 dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """

    h5_filename = fix_storage_naming(h5_filename)

    arr = None
    error_msg = None
    imaging_type = None

    # print('--- Reading CAT HDF5 file {}'.format(h5_filename))    

    if not os.path.exists(h5_filename):
        error_msg = 'Exception: File {} not found'.format(h5_filename)
    else:
        volume_props, error_msg = get_CAT_HDF5_volume_info(h5_filename, channel=channel, slice_range=slice_range,
                                                           y_range=y_range, x_range=x_range, timepoint=timepoint)
        shape = volume_props['shape']
        dtype = volume_props['dtype']
        slice_range = volume_props['slice_range']
        y_range = volume_props['y_range']
        x_range = volume_props['x_range']
        imaging_type = volume_props['imaging_type']

        if use_MPI:
            from ..io_mpi import load_h5py_mpi
            f =  load_h5py_mpi(h5_filename)
        else:
            f = h5py.File(h5_filename, 'r')

        valid_file = False

        # Restored raw data file
        if 'data' in f:
            if len(shape) == 4:
                arr = f['data'][slice_range[0]:slice_range[1] + 1, channel, y_range[0]:y_range[1] + 1,
                      x_range[0]:x_range[1] + 1]

                if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and arr.shape[
                    2] > 0:
                    valid_file = True
            else:
                error_msg = 'Exception: Unable to parse reconstruction CAT HDF5 file format for %s' % h5_filename
        # CDI file
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
                error_msg = 'Exception: Unable to parse reconstruction CAT HDF5 file format for %s' % h5_filename
        elif 'entry' in f and 'data' in f['entry'] and 'data' in f['entry']['data']:
            if len(shape) == 4:
                arr = f['entry']['data']['data'][slice_range[0]:slice_range[1] + 1, channel, y_range[0]:y_range[1] + 1,
                      x_range[0]:x_range[1] + 1]

                if arr is not None and len(arr.shape) == 3 and arr.shape[0] > 0 and arr.shape[1] > 0 and arr.shape[
                    2] > 0:
                    valid_file = True
            else:
                error_msg = 'Exception: Unable to parse reconstruction CAT HDF5 file format for %s' % h5_filename

        f.close()

        if not valid_file:
            error_msg = 'Exception: Unable to load CAT HDF5 file format with parameters {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                h5_filename, slice_range, channel, y_range, x_range)

    if arr is not None and convert_to_ndarray:
        # IMPORTANT!! Returning an actual copy of the array, since the data is most likely going to be interpreted
        # as a contiguous array afterwards. Hence, we must ensure that fancy Numpy slicing does not interfere with 
        # that because it keeps a reference to the original data and sets striding accordingly to slice the array.               
        arr = np.array(arr)
    else:
        logger.warning('------ Warning: returning reference to HDF5 file dataset, instead of a Numpy array')

    # print('--- Imaging type ', imaging_type)

    return arr, imaging_type, error_msg


def write_CAT_volume_HDF5(volume, h5_filename, imaging_type, timepoint=0, channel=0, use_MPI=False, input_shape=None,
                          input_dtype=None, slice_range=None, compression="gzip", compression_opts=2, **kwargs):
    """
    This function writes .HDF5 files and return an array, dtype and an error if something went wrong.
    Otherwise, error will not receive None as value. This function is used exclusively for the MOGNO beamline

    Args:
        volume (HDF5): it's the image volume
        h5_filename (string): it's the .hdf5 path
        imaging_type: it's the .hdf5 dtype
        timepoint (int): it's the index which slice the user want. In this actual point, this flag does nothing in this function
        channel (int): it's the total image channels for the image
        use_MPI (bool): it's a flag that activate MPI
        input_shape (tuple[int, int, int]): it's the volume input shape
        input_dtype (string): it's the input volume dtype
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        compression (string): it's a sting that says what type of compression the user wants
        compression_opts (int): it's the total compression operations
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this actual point, this flag does nothing in this function

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

    if imaging_type not in ('pimega', 'pimega_restored', 'CDI'):
        error_msg = 'Unsupported imaging_type \"{}\" for CAT beamline'.format(imaging_type)

    if error_msg is None:
        try:
            if use_MPI:
                from ..io_mpi import load_h5py_mpi
                h5_file = load_h5py_mpi(h5_filename, 'w')
            else:
                h5_file = h5py.File(h5_filename, 'w')

            if imaging_type == 'pimega_restored':
                # Saving Pimega-type file
                base_group = h5_file
                dset_shape = (input_shape[0], 1) + input_shape[1:]
                chunk_shape = (1, 1) + input_shape[1:]
                dset_name = 'data'
            elif imaging_type == 'pimega':
                # Saving restored Pimega file
                base_group = h5_file.create_group('entry/data')
                dset_shape = (input_shape[0], 1) + input_shape[1:]
                chunk_shape = (1, 1) + input_shape[1:]
                dset_name = 'data'
            else:  # imaging_type == 'CDI':
                base_group = h5_file
                dset_shape = (1, 1) + input_shape
                chunk_shape = (1, 1, 1) + input_shape[1:]
                dset_name = 'slices'

            if compression is not None:
                dset = base_group.create_dataset(dset_name, shape=dset_shape, chunks=chunk_shape, dtype=input_dtype,
                                                 compression=compression, compression_opts=compression_opts)
            else:
                dset = base_group.create_dataset(dset_name, shape=dset_shape, dtype=input_dtype)

            if use_MPI:
                # VERY IMPORTANT: since every MPI process must execute the same actions that alter the HDF5 file
                # metadata (e.g., create groups and dataset as above), we must execute them but only perform
                # data assignment/writing for valid portions of the file
                if slice_range[0] < input_shape[0]:
                    with dset.collective:
                        dset[slice_range[0]:slice_range[1] + 1, channel] = volume
            else:
                dset[:, channel] = volume

            h5_file.close()

        except Exception as e:
            error_msg = 'Exception: Unable to create CAT HDF5 file! Exception: ' + str(e)

    return error_msg
