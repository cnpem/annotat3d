import numpy as np

__images = dict()
__annotations = dict()
__deep_model = dict()
__dataset_data_module = dict()
__dataset_label_module = dict()
__dataset_weight_module = dict()

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

def set_dataset_data(key='data-0', data: np.ndarray = None):
    if data is not None:
        __dataset_data_module[key] = data

def get_dataset_data(key='data-0'):
    return __dataset_data_module[key]

def del_dataset_data(key='data-0'):
    del __dataset_data_module[key]

def set_dataset_label(key='label-0', label: np.ndarray = None):
    if label is not None:
        __dataset_label_module[key] = label

def get_dataset_label(key='label-0'):
    return __dataset_label_module[key]

def del_dataset_label(key='label-0'):
    del __dataset_label_module[key]

def set_dataset_weight(key='weight-0', weight: np.ndarray = None):
    if weight is not None:
        __dataset_weight_module[key] = weight

def get_dataset_weight(key='weight-0'):
    return __dataset_weight_module[key]

def del_dataset_weight(key='weight-0'):
    del __dataset_weight_module[key]