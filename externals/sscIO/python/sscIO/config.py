from ctypes import *
import os, sys
import site
import numpy as np
import numpy.ctypeslib as npct
from enum import IntEnum
import ctypes.util
from distutils.sysconfig import get_python_lib


def load_library(libname, paths = ['']):
    """
    Function that load all external C libs

    Args:
        libname (string): a string that represents the C library name
        paths (list[string]): a list of string that contains all C libraries to compile the libname string

    Returns:
        obj `ctypes.CDLL`: an object that have the string lib path and the memory handle for this operation

    """
    for path in paths:
        #print('>>>', path)
        try:
            lib = CDLL(os.path.join(path, libname), mode=RTLD_GLOBAL)
            #print(path, libname)
            return lib
        except Exception as e:
            pass
            #print('Error loading pysin: ', e)
    return None

search_paths = ['', os.getenv('LD_LIBRARY_PATH', ''), get_python_lib(), site.getusersitepackages(), *site.getsitepackages()]

if ctypes.util.find_library('gomp') is not None:
    load_library(ctypes.util.find_library('gomp'), paths=search_paths)
else:
    raise Exception('Please install the OpenMP package! Unable to load remote visualization API')

try:
    sscIO = load_library('libsscIO.so', paths=search_paths)
except:
    raise Exception('Unable to find libsscIO! Please compile them, add them to LD_LIBRARY_PATH accordingly, and *load the same version of the websockets library used for compilation*')

# Define the types we need.
class CtypesEnum(IntEnum):
    """A ctypes-compatible IntEnum superclass."""
    @classmethod
    def from_param(cls, obj):
        return int(obj)

def wrapped_ndptr(*args, **kwargs):
    """
    Wrapping ndpointer function to allow the passing of None as parameter, thereby allowing the C function to receive NULL

    Args:
        *args (any): a c point that will point for the np array
        **kwargs (any): it's the np array

    Returns:
        (type, dict): the type of the point and an dict that contains the pointer

    References:
        https://stackoverflow.com/questions/32120178/how-can-i-pass-null-to-an-external-library-using-ctypes-with-an-argument-decla

    """
    base = npct.ndpointer(*args, **kwargs)
    def from_param(cls, obj):
        if obj is None:
            return obj
        return base.from_param(obj)
    return type(base.__name__, (base,), {'from_param': classmethod(from_param)})