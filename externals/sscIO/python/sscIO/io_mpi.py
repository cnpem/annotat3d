
"""
    IMPORTANT: this file contains functions that are invoked by MPI processes to read the volume
    of interest. 
    
    Each HDF5 reading function must be designed such that dataset metadata alterations should
    be done by all MPI processes, as required per the MPI-HDF5 design. The datasets need not
    be altered by all processes. Hence, we call the functions in this file using MPI usually
    reading blocks of slices for the output volume.

    To read new volume data formats using these MPI functions, please see the generic 
    read_volume/write_volume_HDF5 functions.
"""

import h5py
import os
import numpy as np
import traceback
import sys
from ctypes import *
import math
import time
import subprocess
import logging

from .io_info import *
from .io_base import *
from . import shared_memory

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


def read_volume_MPI_worker(filepath, shm_key, slice_range=(0,-1), y_range=(0,-1), x_range=(0,-1), output_type='ssc_volume', **kwargs):
    """
    This function reads an image volume using MPI

    Args:
        filepath (string): it's the image path
        shm_key (string): it's a string that represents the image key
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice
        output_type (string): it's a string that does the output type
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it.

    Returns:
        None

    """

    from mpi4py import MPI

    size = MPI.COMM_WORLD.size
    rank = MPI.COMM_WORLD.rank

    indices = None
    output_shape = None
    chunk_size = None
    data_offset = 0
    itemsize = 1
    dtype = None

    if rank == 0:
        logger.info('Reading file metadata')
        volume_props, error_msg = get_volume_info(filepath, slice_range=slice_range, y_range=y_range, x_range=x_range, **kwargs)
        input_shape = volume_props['shape']
        dtype = volume_props['dtype']
        slice_range = volume_props['slice_range']
        y_range = volume_props['y_range']
        x_range = volume_props['x_range']
        imaging_type = volume_props['imaging_type']

        if input_shape is None or error_msg is not None:
            logger.exception(error_msg)

        # Computing output shape since MPI will read the file based on that
        output_shape = (slice_range[1] - slice_range[0] + 1, y_range[1] - y_range[0] + 1, x_range[1] - x_range[0] + 1)

        logger.info(f'Output Shape {output_shape} {dtype}')
        logger.info(f'{volume_props}')

        logger.info('Creating shared array')
        # Create an array in shared memory.
        if output_type == 'ssc_volume':
            try:
                ret = shared_memory.decode_shared_ssc_volume_info(shm_key)
            except:
                success, data_offset = alloc_shared_volume(output_shape, dtype, shm_key, imaging_type=imaging_type)
                logger.info(f'SSC Volume created {success} {data_offset}')
            else:
                if ret['shape'] != output_shape or ret['dtype'] != dtype:
                    error_msg = f'The ssc_volume with key "{shm_key}" exists with format {ret["shape"]}:{ret["dtype"]} different than incoming file {output_shape}:{dtype}. Please delete it before reusing'
                    logger.exception(error_msg)
        else:
            try:
                volume = sa.attach(str(shm_key))
            except:
                sa.create(str(shm_key), shape=output_shape, dtype=dtype)
            else:
                if volume.shape != output_shape or volume.dtype != dtype:
                    error_msg = f'The SharedArray with key "{shm_key}" exists with format {volume.shape}:{volume.dtype} different than incoming file {output_shape}:{dtype}. Please delete it before reusing'
                    logger.exception(error_msg)

        itemsize = np.dtype(dtype).itemsize

        chunk_size = int(math.ceil(output_shape[0] / size))
        indices = np.array([chunk_size*i + slice_range[0] for i in range(0, size)])

    index = int(MPI.COMM_WORLD.scatter(indices, 0))
    output_shape = MPI.COMM_WORLD.bcast(output_shape, 0)
    dtype = MPI.COMM_WORLD.bcast(dtype, 0)
    chunk_size = MPI.COMM_WORLD.bcast(chunk_size, 0)
    data_offset = MPI.COMM_WORLD.bcast(data_offset, 0)
    itemsize = MPI.COMM_WORLD.bcast(itemsize, 0)
    
    MPI.COMM_WORLD.barrier()

    if rank == 0:
        logger.info("Reading volume with MPI!")
        start = time.time()

    index_last = int(min(index+chunk_size-1, slice_range[0] + output_shape[0]-1))

    arr, imaging_type, error_msg = read_volume(filepath, slice_range=(index,index_last), y_range=y_range, x_range=x_range, convert_to_ndarray=True, use_MPI=True, **kwargs)

    # Checking if the returned array refers to a valid position, since we 
    # might have more MPI processes than available slices to read
    if arr is not None and index <= index_last:
        if output_type == 'ssc_volume':
            shm_array = ipc.SharedMemory(shm_key, 0, mode=0o600)
        
            offset = data_offset + (index-slice_range[0])*output_shape[1]*output_shape[2]*itemsize

            try:
                shm_array.write(arr.tobytes(), int(offset))
            except Exception as e:
                logger.info(f'{e} offset {index} {output_shape} {itemsize} {offset} {arr.shape}')

            shm_array.detach()
        else:
            shm_array = sa.attach(str(shm_key))
            shm_array[index-slice_range[0]:index_last-slice_range[0]+1] = arr
            del shm_array         
    
    MPI.COMM_WORLD.barrier()

    if rank == 0:
        end = time.time() - start
        nbytes = np.prod(output_shape)*itemsize

        logger.info(f'{end}s')
        logger.info(f'{bytes_to_human(nbytes / end)}/s')

def write_volume_MPI_worker(source, filepath, source_type='ssc_volume', compression="gzip", compression_opts=2, imaging_type=None, **kwargs):
    """
    Function that writes an image volume using MPI

    Args:
        source (array): it's a numpy array that represents the image array
        filepath (string): it's the image path
        source_type (string): it's a string that represents the image source type
        compression (string): it's a sting that says what type of compression the user wants
        compression_opts (int): it's the total compression operations
        imaging_type (string): the image dtype
        **kwargs (any): it's a dict that maps each keyword to the value that we pass alongside it. In this case, it's the flag to read the images. In this actual point, this flag does nothing in this function

    Returns:
        None

    """

    from mpi4py import MPI

    size = MPI.COMM_WORLD.size
    rank = MPI.COMM_WORLD.rank

    indices = None
    input_shape = None
    dtype = None
    chunk_size = None

    if rank == 0:
        if source_type == 'ssc_volume':
            ret = shared_memory.decode_shared_ssc_volume_info(int(source))
            
            input_shape = ret['shape']
            dtype = ret['dtype']
            imaging_type = ret['imaging_type'] if imaging_type is None else imaging_type

        elif source_type == 'shared_array':
            volume = sa.attach(str(source))
            input_shape = volume.shape
            dtype = volume.dtype

            if imaging_type is None:
                error_msg = 'Please select a valid imaging_type for the SharedArray'
                logger.exception(error_msg)

        chunk_size = int(max(1,math.floor(input_shape[0] / size)))
        indices = np.array([chunk_size*i for i in range(size)])

    index = MPI.COMM_WORLD.scatter(indices, 0)
    chunk_size = MPI.COMM_WORLD.bcast(chunk_size, 0)
    input_shape = MPI.COMM_WORLD.bcast(input_shape, 0)
    dtype = MPI.COMM_WORLD.bcast(dtype, 0)
    imaging_type = MPI.COMM_WORLD.bcast(imaging_type, 0)

    MPI.COMM_WORLD.barrier()

    if rank == 0:
        start = time.time()

    volume_chunk = None

    index_last = int(min(index+chunk_size-1, input_shape[0]-1)) if rank < size -1 else input_shape[0]-1
    slice_range = (index, index_last)
    
    # IMPORTANT: only fetching valid volume chunks from shared memory
    if index < input_shape[0]:
        if source_type == 'ssc_volume':        
            volume_chunk = shared_memory.read_ssc_volume_from_shared_memory(int(source), slice_range=slice_range)
        else:
            volume = sa.attach(str(source))
            volume_chunk = volume[slice_range[0]:slice_range[1]+1]

    # Writing volume_chunk to disk. IMPORTANT: for invalid chunks (i.e., whose slice range) volume_chunk is set to None, because each MPI process must still alter
    # HDF5 metadata
    error_msg = write_volume_HDF5(volume_chunk, filepath, imaging_type=imaging_type, timepoint=0, channel=0, use_MPI=True, 
                                    input_shape=input_shape, input_dtype=dtype, slice_range=slice_range, 
                                    compression=compression, compression_opts=compression_opts)

    MPI.COMM_WORLD.barrier()

    if rank == 0:
        end = time.time() - start
        logger.info(f'{end}s')
        logger.info(f'{bytes_to_human(np.prod(input_shape)*np.dtype(dtype).itemsize / end)}/s')


def load_h5py_mpi(h5_filename, mode='r'):
    """ Load a H5PY volume with the MPI drivers.

    Args:
        filepath (string): path to file
        mode (string): File mode access ('r'/'w')

    Returns:
        (h5py.File): H5py file handler
    """
    from mpi4py import MPI
    return h5py.File(h5_filename, mode, driver='mpio', comm=MPI.COMM_WORLD)
