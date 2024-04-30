"""
    IMPORTANT: this file should not call mpi4py since that package interferes with invoking the MPI code via subprocess
"""
import h5py
import os
import glob
import numpy as np
import cbf
import traceback
import sys
import math
import time

from ..util import *
from ..shared_memory import *


def get_MNC_cbf_volume_info(filename, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                            **kwargs):
    """
    This function reads the extension file and call the other functions to read the files based on his extension.
    This function is used exclusively for the MNC beamline

    Args:
        filename (string): the file path
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
         slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in this function

    Returns:
        (dict, string): dict that contains information about the image, error string

    Notes:
        volume_props: a dictionary that contains information got from the parser (shape, dtype, imaging type, slice range, y range and x range)\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """

    filename = fix_storage_naming(filename)

    imaging_type = "diffraction"
    error_msg = None
    shape = None
    dtype = None
    metadata = None
    xsize = ysize = zsize = None

    if os.path.isfile(filename):
        try:
            content = cbf.read(filename, parse_miniheader=True)
            metadata = content.miniheader
            volume = content.data
            shape = volume.shape
            dtype = volume.dtype

            zsize, ysize, xsize = 1, shape[0], shape[1]
            shape = None

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

    if zsize is not None and ysize is not None and xsize is not None:
        shape = (zsize, ysize, xsize)

    return dict(shape=shape,
                dtype=dtype,
                imaging_type=imaging_type,
                slice_range=slice_range,
                y_range=y_range,
                x_range=x_range,
                metadata=metadata), error_msg
