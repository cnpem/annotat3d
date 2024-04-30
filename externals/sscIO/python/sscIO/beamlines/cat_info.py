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

from ..util import *
from ..shared_memory import *


def get_CAT_HDF5_volume_info(h5_filename, channel=0, timepoint=0, slice_range=(0,-1), y_range=(0,-1), x_range=(0,-1), **kwargs):
    """
    This function get the information about the parser function and create a dictionary that contain
    all the file information. Also, this function is used exclusively for HDF5(.hdf5) images and
    used exclusively for the Caterete beamline

    Args:
        h5_filename (string): the .hdf5 path
        channel: (int) it's the total image channels for the image. In this actual stage, channel does nothing in this function
        timepoint (int): it's the index which slice the user want. In this actual stage, channel does nothing in this function
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
    imaging_type = None
    error_msg = None
    n_scans = n_channels = n_timepoints = 1
    
    if not os.path.exists(h5_filename):
        error_msg = 'Exception: File {} not found'.format(h5_filename)
    else:
        f = h5py.File(h5_filename, 'r')  

        # Restored raw data file
        if 'data' in f:
            shape = f['data'].shape
            dtype = f['data'].dtype

            if len(shape) == 4:
                slice_range = sanitize_coord_range(slice_range, shape[0])
                y_range = sanitize_coord_range(y_range, shape[2])
                x_range = sanitize_coord_range(x_range, shape[3])
                n_channels = shape[1]
                
                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)

                if valid_file:
                    imaging_type = "pimega_restored"
            else:
                error_msg = 'Exception: Unable to parse reconstruction CAT HDF5 file format for %s' % h5_filename
        # CDI file
        elif 'slices' in f:
            shape = f['slices'].shape
            dtype = f['slices'].dtype

            if len(shape) == 5:
                slice_range = sanitize_coord_range(slice_range, shape[2])               
                y_range = sanitize_coord_range(y_range, shape[3])
                x_range = sanitize_coord_range(x_range, shape[4])
                n_timepoints = shape[0]
                n_channels = shape[1]

                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)

                if valid_file:
                    imaging_type = "CDI"
            elif len(shape) == 3:
                slice_range = sanitize_coord_range(slice_range, shape[0])           
                y_range = sanitize_coord_range(y_range, shape[1])
                x_range = sanitize_coord_range(x_range, shape[2])

                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)

                if valid_file:
                    imaging_type = "CDI"
            else:
                error_msg = 'Exception: Unable to parse reconstruction CAT HDF5 file format for %s' % h5_filename
        elif 'entry' in f and 'data' in f['entry'] and 'data' in f['entry']['data']:
            shape = f['entry']['data']['data'].shape
            dtype = f['entry']['data']['data'].dtype

            if(len(shape) == 4):
                slice_range = sanitize_coord_range(slice_range, shape[0])
                # Forcing the entire frame to be loaded, since raw pimega data is still reconstructed
                y_range = (0, -1)
                x_range = (0, -1)
                y_range = sanitize_coord_range(y_range, shape[2])
                x_range = sanitize_coord_range(x_range, shape[3])
                n_channels = shape[1]

                valid_file = valid_volume_coord_range(slice_range, y_range, x_range)

                if valid_file:
                    imaging_type = "pimega"
            else:
                error_msg = 'Exception: Unable to parse reconstruction CAT HDF5 file format for %s' % h5_filename

        if not valid_file:
            error_msg = 'Exception: Unable to load CAT HDF5 file format with parameters {} {}. The selected dimensions are incorrect.'.format(h5_filename, slice_range)
        
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
