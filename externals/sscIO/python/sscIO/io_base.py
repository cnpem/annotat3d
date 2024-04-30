"""
    IMPORTANT: this file contains wrapper functions for all file formats of the beamlines. 
    
    Each HDF5 reading function must be designed such that dataset metadata alterations should
    be done by all MPI processes, as required per the MPI-HDF5 design. The datasets need not
    be altered by all processes. Hence, we call the functions in this file using MPI usually
    reading blocks of slices for the output volume.
"""
import os
import glob
import numpy as np
import traceback
import sys
import time
import subprocess

from .config import sscIO
from .util import *
from .shared_memory import *
from .beamlines.mgn_io import *
from .beamlines.cat_io import *
from .beamlines.mnc_io import *


def read_volume(filename, **kwargs):
    """
    Function that reads a generic image volume

    Args:
        filename (string): it's the path volume
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images

    Returns:
        (array, string, string): .hdf5 array, the .hdf5 dtype, error string

    Notes:
        array: it's the .hdf5 array\n
        imaging_type: it's the .hdf5 dtype\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    filename = fix_storage_naming(filename)
    success = False
    volume = None
    error_msg = None
    imaging_type = "tomo"

    if os.path.splitext(filename)[1].lower() in ['.tif', '.tiff']:
        try:
            volume, imaging_type, error_msg = read_TIFF_volume(filename, **kwargs)
        except Exception as e:
            raise e;
        else:
            return volume, imaging_type, error_msg
    else:
        ext = os.path.splitext(filename)[1].lower()
        if ext in ('.cbf'):
            try:
                volume, imaging_type, error_msg = read_MNC_volume_cbf(filename, **kwargs)
            except Exception as e:
                raise e;
            else:
                return volume, imaging_type, error_msg
        elif ext in ('', '.h5', '.hdf5') or os.path.isdir(filename):
            try:
                volume, imaging_type, error_msg = read_MGN_volume(filename, **kwargs)
                if error_msg is not None:
                    volume, imaging_type, error_msg = read_CAT_volume_HDF5(filename, **kwargs)
            except Exception as e:
                try:
                    volume, imaging_type, error_msg = read_MGN_volume(filename, **kwargs)
                except Exception as e:
                    raise e;
                else:
                    return volume, imaging_type, error_msg
            else:
                return volume, imaging_type, error_msg
        else:
            return read_MGN_volume(filename, **kwargs)


def write_volume_HDF5(volume, h5_filename, imaging_type, **kwargs):
    """
    Function that write an image volume as .hdf5 file

    Args:
        volume (array): it's a numpy array that represents the volume
        h5_filename (string): volume path
        imaging_type (string): it's the .hdf5 dtype
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it.

    Returns:
        string: the type of error returned. If everything went well, it'll return None as value

    """
    error_msg = None
    try:
        if imaging_type in ('tomo',):
            error_msg = write_MGN_volume_HDF5(volume, h5_filename, imaging_type=imaging_type, **kwargs)
        elif imaging_type in ('pimega', 'pimega_restored', 'CDI'):
            error_msg = write_CAT_volume_HDF5(volume, h5_filename, imaging_type=imaging_type, **kwargs)
        else:
            error_msg = 'Unknown imaging_type {}'.format(imaging_type)
    except Exception as e:
        error_msg = str(e)

    return error_msg
