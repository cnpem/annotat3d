from tkinter.messagebox import NO
import numpy as np

__images = dict()
__annotations = dict()
__deep_model = dict()
__info = dict()

def set_deep_model(key='deep_learning', data: dict = None):
    if data is not None:
        __deep_model[key] = data

def get_deep_model(key='deep_learning'):
    return __deep_model[key]

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

def set_info(key='image_info', data: dict = None):
    if data is not None:
        __info[key] = data

def get_info(key='image_info'):
    return __info.get(key)

def delete_info(key):
    del __info[key]

