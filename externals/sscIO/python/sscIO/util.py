"""
    IMPORTANT: this file should not call mpi4py since that package interferes with invoking the MPI code via subprocess
"""
import os
import numpy as np
import traceback
import sys
from .config import sscIO
from ctypes import *
    
def bytes_to_human(n):
    """
    Function that transforms bytes in machine form into a readable string

    Args:
        n (int): value that represents the index of the verbose list

    Returns:
        string: returns a string that represent the bytes

    """
    verbose = [
        [1000**5, "PB"],
        [1000**4, "TB"],
        [1000**3, "GB"],
        [1000**2, "MB"],
        [1000**1, "KB"],
        [1000**0, "B"]
    ]
    for factor, unit in verbose:
        if n >= factor:
            break
    return str(round(n / factor, 1)) + unit

def fix_storage_naming(data_path):
    """
    Function that fix the data storage naming

    Args:
        data_path (string): it's the path filename

    Returns:
        string: returns the string with the corrections

    """
    if(data_path.startswith('/ddn')):
        if(not os.path.exists(os.path.dirname(data_path))):
            if(not data_path.startswith('/ddn-nfs')):
                data_path = data_path.replace('/ddn', '/ddn-nfs')
        elif(data_path.startswith('/ddn-nfs')):
            if(not os.path.exists(os.path.dirname(data_path))):
                data_path = data_path.replace('/ddn-nfs', '/ddn')

    if(data_path.startswith('/ibira')):
        if(not os.path.exists(os.path.dirname(data_path))):
            if(not data_path.startswith('/ibira-nfs')):
                data_path = data_path.replace('/ibira', '/ibira-nfs')
    elif(data_path.startswith('/ibira-nfs')):
        if(not os.path.exists(os.path.dirname(data_path))):
            data_path = data_path.replace('/ibira-nfs', '/ibira')
    
    return data_path

def sanitize_coord_range(coord_range, size):
    """
    Function that sanitizes the range of coordinates

    Args:
        coord_range (list[int]): a list that contains the image coordinates
        size (int): it's the image list size

    Returns:
        (tuple[int, int]): returns a tuple that contains this corrections

    """
    range0 = min(coord_range[0], size - 1) if coord_range[0] >= 0 else min(size - 1, size+coord_range[0])
    range1 = min(coord_range[1], size - 1) if coord_range[1] >= 0 else min(size - 1, size+coord_range[1])
    
    return (int(range0), int(range1))

def valid_coord_range(coord_range):
    """
    Function that valid the range of the list

    Args:
        coord_range (list[int]): a list that contains the image coordinates

    Returns:
        bool: returns True if the range of the second variable is bigger than the frits one and False otherwise

    """
    return coord_range[1] >= coord_range[0]

def valid_volume_coord_range(slice_range, y_range, x_range):
    """
    Function that verify the image coordinate range volume for each slice chosen by the user

    Args:
        slice_range (tuple[int, int]): it's the range to choose how many slices to get
        y_range (tuple[int, int]): it's the y-range for each slice
        x_range (tuple[int, int]): it's the x-range for each slice

    Returns:
        bool: returns True if everything is in order and False otherwise

    """
    return valid_coord_range(slice_range) and valid_coord_range(y_range) and valid_coord_range(x_range)


def get_local_ip_to_reach_destination(remote_host):
    """
    Function that get the local ip and make a connection to a remote host

    Args:
        remote_host (string): string that represents the remote host ip

    Returns:
        string: returns the local ip string

    """
    sscIO.rv_get_local_ip_to_reach_destination2.restype = c_char_p
    sscIO.rv_get_local_ip_to_reach_destination2.argtypes = [c_char_p]

    local_ip_c = c_char_p()
    local_ip_c = sscIO.rv_get_local_ip_to_reach_destination2(remote_host.encode('utf-8'))

    local_ip = None

    if local_ip_c is not None:
        # When visualization server initizalition fails, NULL/None is returned
        local_ip = str(local_ip_c, 'utf-8')

    return local_ip
