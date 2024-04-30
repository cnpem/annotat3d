"""
    IMPORTANT: this file should not call mpi4py since that package interferes with invoking the MPI code via subprocess
"""
import h5py
import os
import numpy as np
import traceback
import sys
import math
import time
import logging

from ..util import *
from ..shared_memory import *

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


def get_RAFT_volume_info_from_filename(filename):
    """
    This function is a parser that gets all information from any filename string and place into the image.
    Also, this functions return the x size, y size, z size and dtype of the volume

    Args:
        filename (string): The file path

    Returns:
        (int, int, int, string): x size of image, y size of image, z size of image, dtype string
        xsize: the x size got from the parser
        ysize: the y size got from the parser
        zsize: the z size got from the parser
        dtype: the dtype string got from the parser

    """

    import re
    pattern = re.compile(
        "([a-zA-Z0-9_\.\/\-]+)[a-zA-Z_\.\/\-0-9]*[_|\-]([0-9]+)x([0-9]+)x([0-9]+)[a-zA-Z_\.\/\-0-9]*[_|\-]([0-9]+)[b|bits|bit]|\.(b|raw)")
    number_pattern = re.compile("[0-9]+")
    numpy_pattern = re.compile(
        "([a-zA-Z0-9_\.\/\-]+)[a-zA-Z_\.\/\-0-9]*[_|\-]([0-9]+)x([0-9]+)x([0-9]+)[a-zA-Z_\.\/\-0-9]*[_|\-](int8|uint8|int16|uint16|int32|uint32|float32|complex64)|\.(b|raw)")
    match = pattern.search(str(filename))
    zsize = None
    ysize = None
    xsize = None
    dtype = None
    if match is not None:
        try:
            name = match.group(1)
        except:
            pass
        try:
            zsize = int(number_pattern.search(match.group(4)).group(0))
        except:
            pass
        try:
            ysize = int(number_pattern.search(match.group(3)).group(0))
        except:
            pass
        try:
            xsize = int(number_pattern.search(match.group(2)).group(0))
        except:
            pass
        try:
            dtype = int(number_pattern.search(match.group(5)).group(0))
            if dtype == 8:
                dtype = 'uint8'
            elif dtype == 16:
                dtype = 'uint16'
            elif dtype == 32:
                dtype = 'float32'
            elif dtype == 64:
                dtype = 'complex64'
        except:
            pass
        try:
            extension = match.group(6)
        except:
            pass

    if None in (xsize, ysize, zsize, dtype):
        match = numpy_pattern.search(str(filename))
        try:
            name = match.group(1)
        except:
            pass
        try:
            zsize = int(number_pattern.search(match.group(4)).group(0))
        except:
            pass
        try:
            ysize = int(number_pattern.search(match.group(3)).group(0))
        except:
            pass
        try:
            xsize = int(number_pattern.search(match.group(2)).group(0))
        except:
            pass
        try:
            dtype = match.group(5)
        except:
            pass
        try:
            extension = match.group(6)
        except:
            pass

    return xsize, ysize, zsize, dtype


def get_RAFT_binary_file_info(filename, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1), **kwargs):
    """
    This function get the information about the parser function and create a dictionary that contain
    all the file information. Also, this function is used exclusively for binary (.b) or raw (.raw) images

    Args:
        filename (string): the file path
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        (dict, string): dictionary that contain all the file information, error string

    Notes:
        dict: a dictionary that contains information got from the parser (shape, dtype, imaging type, slice range, y range and x range)\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    volume = None
    error_msg = None
    filename = fix_storage_naming(filename)

    shape_dtype_available = 'shape' in kwargs and 'dtype' in kwargs and None not in (kwargs['shape'], kwargs['dtype'])
    shape = None
    dtype = None
    imaging_type = "tomo"

    if not os.path.exists(filename):
        error_msg = 'Exception: File {} not found'.format(filename)
    else:
        if not shape_dtype_available:
            # Trying to parse raw image file
            xsize, ysize, zsize, dtype = get_RAFT_volume_info_from_filename(filename)
            if None not in (xsize, ysize, zsize, dtype) and xsize > 0 and ysize > 0 and zsize > 0:
                shape = (zsize, ysize, xsize)
        else:
            shape = kwargs['shape']
            dtype = kwargs['dtype']

        if shape is not None and dtype is not None:
            zsize, ysize, xsize = shape
            slice_range = sanitize_coord_range(slice_range, zsize)
            y_range = sanitize_coord_range(y_range, ysize)
            x_range = sanitize_coord_range(x_range, xsize)
        else:
            slice_range = None
            y_range = None
            x_range = None
            error_msg = 'Unable to determine shape and/or dtype for raw file!'

    # if return_ranges:
    #     return shape, dtype, imaging_type, error_msg, slice_range, y_range, x_range
    #
    # return shape, dtype, imaging_type, error_msg
    return dict(shape=shape,
                dtype=dtype,
                imaging_type=imaging_type,
                slice_range=slice_range,
                y_range=y_range,
                x_range=x_range), error_msg


def get_RAFT_NPY_file_info(filename, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                           **kwargs):
    """
    This function get the information about the parser function and create a dictionary that contain
    all the file information. Also, this function is used exclusively for binary .npy files

    Args:
        filename (string): the file path
        timepoint (int): timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in this function
    Returns:
        (dict, string): dictionary that contain all the file information, error string

    Notes:
        dict: a dictionary that contains information got from the parser (shape, dtype, imaging type, slice range, y range and x range)\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    filename = fix_storage_naming(filename)

    imaging_type = "tomo"
    error_msg = None
    shape = None
    dtype = None

    if not os.path.exists(filename):
        error_msg = 'Exception: File {} not found'.format(filename)
    else:
        # Trying to parse raw image file
        try:
            volume = np.load(filename, mmap_mode='r')
            if volume.ndim == 2:
                volume = volume[np.newaxis, :, :]

            shape = volume.shape
            dtype = volume.dtype

            zsize = ysize = xsize = None
            if len(shape) == 3:
                zsize, ysize, xsize = shape
            elif len(shape) == 5:
                _, _, zsize, ysize, xsize = shape

            if zsize is not None and ysize is not None and xsize is not None:
                slice_range = sanitize_coord_range(slice_range, zsize)
                y_range = sanitize_coord_range(y_range, ysize)
                x_range = sanitize_coord_range(x_range, xsize)

        except FileNotFoundError as e:
            shape = None
            dtype = None
            error_msg = 'Unable to find file {}'.format(filename)
        except PermissionError as e:
            shape = None
            dtype = None
            error_msg = 'No permission to access file {}'.format(filename)
        except Exception as e:
            shape = None
            dtype = None
            error_msg = 'Unable to read volume with parameters {} {} {} {} {} {}. The selected dimensions are incorrect. Exception: {}'.format(
                filename, timepoint, channel, slice_range, y_range, x_range, str(e))
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_tb(exc_traceback)

    # if return_ranges:
    #     return shape, dtype, imaging_type, error_msg, slice_range, y_range, x_range
    #
    # return shape, dtype, imaging_type, error_msg

    return dict(shape=shape,
                dtype=dtype,
                imaging_type=imaging_type,
                slice_range=slice_range,
                y_range=y_range,
                x_range=x_range), error_msg


def get_MGN_volume_info(filename, scan=0, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                        **kwargs):
    """
    This function reads the extension file and call the other functions to read the files based on his extension.
    This function is used exclusively for the MOGNO beamline

    Args:
        filename (string): the file path
        scan (int): it's a flag that describe what kind of scan the user choose
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        (dict, string): dict that contains information about the image, error string

    Notes:
        volume_props: a dictionary that contains information got from the parser (shape, dtype, imaging type, slice range, y range and x range)\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """

    volume_props = error_msg = None

    ext = os.path.splitext(filename)[1].lower()
    if ext in ('', '.h5', '.hdf5') or os.path.isdir(filename):
        try:
            volume_props, error_msg = get_MGN_HDF5_volume_info(filename, scan=scan, timepoint=timepoint,
                                                               channel=channel, slice_range=slice_range,
                                                               y_range=y_range, x_range=x_range, **kwargs)
            if error_msg is not None:
                error_msg = 'Exception: Unable to load HDF5 file! Exception: ' + error_msg
        except Exception as e:
            error_msg = 'Exception: Unable to load HDF5 file! Exception: ' + str(e)
    elif ext == '.npy':
        try:
            volume_props, error_msg = get_RAFT_NPY_file_info(filename, timepoint=timepoint, channel=channel, slice_range=slice_range,
                                         y_range=y_range, x_range=x_range, **kwargs)

            if error_msg is not None:
                error_msg = 'Exception: Unable to load NPY file! Exception: ' + error_msg
        except Exception as e:
            error_msg = 'Exception: Unable to load NPY file! Exception: ' + str(e)
    else:
        try:
            volume_props, error_msg = get_RAFT_binary_file_info(filename, timepoint=timepoint, channel=channel, slice_range=slice_range,
                                            y_range=y_range, x_range=x_range, **kwargs)

            if error_msg is not None:
                error_msg = 'Exception: Unable to load binary file! Exception: ' + error_msg
        except Exception as e:
            error_msg = 'Exception: Unable to load binary file! Exception: ' + str(e)

    return volume_props, error_msg


def get_MGN_HDF5_volume_info(h5_filename, scan=0, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1),
                             x_range=(0, -1), **kwargs):
    """
    This function get the information about the parser function and create a dictionary that contain
    all the file information. Also, this function is used exclusively for HDF5(.hdf5) images and
    used exclusively for the MOGNO beamline

    Args:
        h5_filename (string): the .hdf5 path
        scan (int): it's a flag that describe what kind of scan the user choose
        timepoint (int): it's the index which slice the user want
        channel: (int) it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in this function

    Returns:
        (dict, string): a dictionary that contains information got from the parser (shape, dtype, imaging_type, slice_range, y_range, x_range, n_scans, nchannels, n_timepoints), error string mensage

    """

    h5_filename = fix_storage_naming(h5_filename)

    valid_file = False
    shape = None
    dtype = None
    error_msg = None
    volume_props = None
    n_scans = n_timepoints = n_channels = 1
    imaging_type = "tomo"

    if not os.path.exists(h5_filename):
        error_msg = 'Exception: File {} not found'.format(h5_filename)
    else:
        f = h5py.File(h5_filename, 'r')

        # Giovanni file
        scan_str = 'scan_%03d' % scan
        if scan_str in f:
            n_scans = len([1 for k in f.keys() if k.startswith('scan_')])
            shape = f[scan_str].shape
            dtype = f[scan_str].dtype
            n_timepoints = shape[0]
            n_channels = shape[1]

            if len(shape) == 5:
                slice_range = sanitize_coord_range(slice_range, shape[2])
                y_range = sanitize_coord_range(y_range, shape[3])
                x_range = sanitize_coord_range(x_range, shape[4])

                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)
        # IMX file
        elif 'images' in f:
            shape = f['images'].shape
            dtype = f['images'].dtype

            slice_range = sanitize_coord_range(slice_range, shape[0])
            y_range = sanitize_coord_range(y_range, shape[1])
            x_range = sanitize_coord_range(x_range, shape[2])

            valid_file = valid_volume_coord_range(slice_range, y_range, x_range)
        # RAFT formats
        elif 'slices' in f:
            shape = f['slices'].shape
            dtype = f['slices'].dtype

            if len(shape) == 5:
                n_timepoints = shape[0]
                n_channels = shape[1]

                slice_range = sanitize_coord_range(slice_range, shape[2])
                y_range = sanitize_coord_range(y_range, shape[3])
                x_range = sanitize_coord_range(x_range, shape[4])

                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)
            elif len(shape) == 3:
                slice_range = sanitize_coord_range(slice_range, shape[0])
                y_range = sanitize_coord_range(y_range, shape[1])
                x_range = sanitize_coord_range(x_range, shape[2])

                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)
            else:
                error_msg = 'Unable to parse reconstruction old RAFT HDF5 file format for %s' % h5_filename
        # MGN format
        else:
            scan_modes = ['FlyScan', 'StepScan']
            for mode in scan_modes:
                if mode in f:
                    n_scans = len([1 for k in f[mode].keys() if k.startswith('scan_')])
                    scan_str = 'scan_%03d' % scan
                    logger.info('Reading {} from FlyScan file {}, this may take a while...'.format(scan_str, h5_filename))

                    if scan_str in f[mode] and 'Data' in f[mode][scan_str] and 'scan' in f[mode][scan_str]['Data']:
                        shape = f[mode][scan_str]['Data']['scan'].shape
                        dtype = f[mode][scan_str]['Data']['scan'].dtype
                        n_channels = shape[1]

                        slice_range = sanitize_coord_range(slice_range, shape[0])
                        y_range = sanitize_coord_range(y_range, shape[2])
                        x_range = sanitize_coord_range(x_range, shape[3])

                        valid_file = valid_volume_coord_range(slice_range, y_range, x_range)
                        break

        if not valid_file:
            error_msg = 'Exception: Unable to load MGN HDF5 file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                h5_filename, timepoint, channel, slice_range, y_range, x_range)

            if 'scan' in kwargs:
                error_msg = 'Exception: Unable to load MGN HDF5 file format with parameters {} {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                    h5_filename, scan, timepoint, channel, slice_range, y_range, x_range)

        f.close()

    return dict(shape=shape,
                dtype=dtype,
                imaging_type=imaging_type,
                slice_range=slice_range,
                y_range=y_range,
                x_range=x_range,
                n_scans=n_scans,
                nchannels=n_channels,
                n_timepoints=n_timepoints), error_msg
