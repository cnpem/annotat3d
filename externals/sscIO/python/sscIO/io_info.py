"""
    IMPORTANT: this file should not call mpi4py since that package interferes with invoking the MPI code via subprocess
"""
import os
import numpy as np
import traceback
import sys
import time
import subprocess

from .util import * 
from .beamlines.mgn_info import get_MGN_volume_info
from .beamlines.cat_info import get_CAT_HDF5_volume_info
from .beamlines.mnc_info import get_MNC_cbf_volume_info

def get_volume_info(filename, **kwargs):
    """
    Function that parse the image info depending on the image extension

    Args:
        filename (string): it's the path image
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it.

    Returns:
        (dict, string): dict that contains information about the image, error string

    Notes:
        volume_props: a dictionary that contains information got from the parser (shape, dtype, imaging type, slice range, y range and x range)\n
        error_msg: the type of error returned. If everything went well, it'll return None as value

    """
    filename = fix_storage_naming(filename)
    volume_props = error_msg = None

    if os.path.splitext(filename)[1].lower() in ['.tif', '.tiff']:
        raise Exception('Unable to parse information for TIFF file type')
    else:
        ext = os.path.splitext(filename)[1].lower()
        if ext in ('.cbf'):
            try:
                volume_props, error_msg = get_MNC_cbf_volume_info(filename, **kwargs)
            except Exception as e:
                error_msg = f'Exception: Unable to load MNC cbf file {e}'
        elif ext in ('', '.h5', '.hdf5') or os.path.isdir(filename):
            try:
                volume_props, error_msg = get_MGN_volume_info(filename, **kwargs)

                if error_msg is not None:
                    volume_props, error_msg = get_CAT_HDF5_volume_info(filename, **kwargs)
            except Exception as e:
                try:
                    volume_props, error_msg = get_MGN_volume_info(filename, **kwargs)
                except Exception as e:
                    error_msg = f'Exception: Unable to load MGN HDF5 file {e}'
        else:
            volume_props, error_msg = get_MGN_volume_info(filename, return_ranges=True, **kwargs)

    return volume_props, error_msg
