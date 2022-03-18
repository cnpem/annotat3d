import numpy as np

__images = dict()
__annotations = dict()

def set_image(key='image', data: np.ndarray = None):
    if data is not None:
        __images[key] = data

def get_image(key='image'):
    return __images.get(key, None)

def delete_image(key='image'):
    del __images[key]

def set_annotation(key='annotation', data: dict = None):
    if data is not None:
        __annotations[key] = data

def get_annotation(key='annotation'):
    return __annotations.get(key, None)

def delete_annotation(key='annotation'):
    del __annotations[key]
