import os
import glob
import numpy as np
import traceback
import sys
import SharedArray as sa
import math
import time
import cbf

from ..util import *
from ..shared_memory import *
from .mnc_info import *


def read_MNC_volume_cbf(filename, timepoint=0, channel=0, slice_range=(0, -1), y_range=(0, -1), x_range=(0, -1),
                        convert_to_ndarray=True, **kwargs):
    """
    This function reads and creates a volume image from a path and return the volume, the image dtype and an error.
    This function is used exclusively for the MNC beamline

    Args:
        filename (string): the file path
        timepoint (int): it's the index which slice the user want
        channel (int): it's the total image channels for the image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images.

    Returns:
        (array, string, string): volume array, image dtype string, error string

    Notes:
        volume: the volume image read\n
        imaging_type: the image dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    filename = fix_storage_naming(filename)

    volume = None
    error_msg = None

    volume_props, error_msg = get_MNC_cbf_volume_info(filename,
                                                        timepoint=timepoint,
                                                        channel=channel,
                                                        slice_range=slice_range,
                                                        y_range=y_range,
                                                        x_range=x_range,
                                                        **kwargs)

    shape = volume_props['shape']
    dtype = volume_props['dtype']
    slice_range = volume_props['slice_range']
    y_range = volume_props['y_range']
    x_range = volume_props['x_range']
    imaging_type = volume_props['imaging_type']

    if shape is not None and dtype is not None and error_msg is None:
        # Trying to parse cbf image file
        try:
            # Mapping the volume to memory by default, since we may either read
            # only a portion of it to memory after slicing

            # if basename is not None:
            #     filename += basename

            zsize, ysize, xsize = shape
            volume = np.zeros(shape, dtype=dtype)
            files = glob.glob(filename + '*')

            # print('Reading cbf volume', volume.dtype, volume.shape)
            # print(files)

            for i, f in enumerate(sorted(files)):
                content = cbf.read(f)
                volume[i, :, :] = content.data

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
                        error_msg = 'Unable to load cbf file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                            filename, timepoint, channel, slice_range, y_range, x_range)
                    elif convert_to_ndarray:
                        # IMPORTANT!! Returning an actual copy of the array, since the data is most likely going to be interpreted
                        # as a contiguous array afterwards. Hence, we must ensure that fancy Numpy slicing does not interfere with 
                        # that because it keeps a reference to the original data and sets striding accordingly to slice the array.               
                        volume = np.array(volume)
                else:
                    volume = None
                    error_msg = 'Unable to load cbf file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
                        filename, timepoint, channel, slice_range, y_range, x_range)
            else:
                volume = None
                error_msg = 'Unable to load cbf file format with parameters {} {} {} {} {} {}. The selected dimensions are incorrect.'.format(
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
