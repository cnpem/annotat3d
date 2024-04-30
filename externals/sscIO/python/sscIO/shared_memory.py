"""
    IMPORTANT: this file should not call mpi4py since that package interferes with invoking the MPI code via subprocess.
"""
import os
import numpy as np
import traceback
import sys
from .config import sscIO
import sysv_ipc as ipc
from ctypes import *
import SharedArray as sa
import math
import time

from .util import *

def create_shm_key(baseId=-1):
    """
    This function creates the shm key for the image

    Args:
        baseId (int): value that represents the index of the base ID of the image

    Returns:
        String: returns the shm key string

    """

    sscIO.ssc_create_shm_key.restype = c_int
    sscIO.ssc_create_shm_key.argtypes = [c_int]
    
    ret = sscIO.ssc_create_shm_key(baseId)

    return ret

def decode_shared_ssc_volume_info(shm_key):
    """
    Function that decode the volume info from a shm_key

    Args:
        shm_key (string): string that represents the shm_key of an image

    Returns:
        dict: Returns a dict that contains the shape, dtype, imaging type and data-offset volume

    """
    sscIO.ssc_decode_shared_volume_info.restype = c_bool
    sscIO.ssc_decode_shared_volume_info.argtypes = [c_int, POINTER(c_int), POINTER(c_int), POINTER(c_int), POINTER(c_char_p), POINTER(c_char_p), POINTER(c_ulong)]
    
    xsize = c_int()
    ysize = c_int()
    zsize = c_int()
    dtype = c_char_p()
    imaging_type = c_char_p()
    data_offset = c_ulong()

    print('Decoding')

    res = sscIO.ssc_decode_shared_volume_info(int(shm_key), byref(xsize), byref(ysize), byref(zsize), byref(dtype), byref(imaging_type), byref(data_offset))

    if not res:
        raise Exception("Unable to decode image from shared memory using key: {}".format(shm_key))

    return {'shape':(int(zsize.value), int(ysize.value), int(xsize.value)), 'dtype':str(dtype.value, 'utf-8'), 'imaging_type':str(imaging_type.value, 'utf-8'), 'data_offset':int(data_offset.value)}

def read_ssc_volume_from_shared_memory(shm_key, slice_range=(0,-1)):
    """
    This function reads an image volume from a shared memory process

    Args:
        shm_key (string): string that represents the shm_key of an image
        slice_range (tuple[int, int]): it's the range to choose how many slices to get

    Returns:
        array: return a numpy array that represents the image volume

    """

    # Reading shared volume information from encoded header
    res = decode_shared_ssc_volume_info(shm_key)

    shape = res['shape']
    dtype = res['dtype']
    data_offset = res['data_offset']
    imaging_type = res['imaging_type']
    
    slice_range = sanitize_coord_range(slice_range, shape[0])

    chunk_shape = (slice_range[1] - slice_range[0] + 1, shape[1], shape[2])

    # Determining number of bytes to be read from shared memory
    itemsize = int(np.dtype(dtype).itemsize)
    nbytes = np.prod(chunk_shape) * itemsize

    # Computing offset into the data, considering the data offset (after the header) and the 
    # slice_range offset
    offset = data_offset + slice_range[0] * shape[1] * shape[2] * itemsize

    # Connecting to shared memory
    shm = ipc.SharedMemory(shm_key, 0, 0)

    # Reading the corresponding volume portion from the shared memory location into a new numpy array
    # volume = np.zeros(shape=chunk_shape, dtype=dtype)
    volume = np.frombuffer(shm.read(nbytes, offset), dtype=dtype).reshape(chunk_shape)

    shm.detach()

    return volume

def alloc_shared_volume(shape, dtype, shm_key, array=None, imaging_type='tomo', voxel_size=(1.0, 1.0, 1.0)):
    """
    This function does the memory allocation for the shared volume operation

    Args:
        shape (tuple[int, int, int]): a tuple that represents the volume shape
        dtype (string): a string that's the volume dtype
        shm_key (string): string that represents the shm_key of an image
        array (array): array that represents the image
        imaging_type (string): string that represents the type of line the user choose for the image scan
        voxel_size(tuple[float, float, float]): A tuple that represents the voxel size of each axis

    Returns:
        (bool, int): return a bool string as True if everything goes well and False otherwise, returns the offset value

    """
    sscIO.ssc_alloc_shared_volume_and_return_data_offset.restype = c_bool
    sscIO.ssc_alloc_shared_volume_and_return_data_offset.argtypes = [c_int, c_int, c_int, c_int, c_float, c_float, c_float, c_char_p, c_char_p, c_char_p, POINTER(c_ulong)]

    offset = c_ulong()
    
    if array is not None:
        shape = array.shape
        dtype = array.dtype

    success = sscIO.ssc_alloc_shared_volume_and_return_data_offset(shm_key, shape[2], shape[1], shape[0], 
                                                                voxel_size[2], voxel_size[1], voxel_size[0],
                                                                str(dtype).encode('utf-8'), 
                                                                imaging_type.encode('utf-8'),
                                                                array.ctypes.data_as(POINTER(c_char)) if array is not None else None,
                                                                byref(offset))

    return success, int(offset.value)

def destroy_shared_volume(shm_key):
    """
    Function that destroys the shared volume from the memory

    Args:
        shm_key (string): string that represents the shm_key of an image

    Returns:
        bool: return a bool string as True if everything goes well and False otherwise

    """

    sscIO.ssc_destroy_shared_volume.restype = c_bool
    sscIO.ssc_destroy_shared_volume.argtypes = [c_int]
    
    success = sscIO.ssc_destroy_shared_volume(shm_key)

    return success
