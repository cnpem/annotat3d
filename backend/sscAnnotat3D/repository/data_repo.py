import numpy as np

# TODO : need to implement the docstring later

__images = dict()
__annotations = dict()
__info = dict()
__deep_model = dict()
__dataset_data_module = dict()
__dataset_label_module = dict()
__dataset_weight_module = dict()
__inference_data = dict()
__inference_info = dict()


def set_inference_info(key='image-0', data: dict = None):
    if data is not None:
        __inference_info[key] = data


def del_inference_info(key="image-0"):
    del __inference_info[key]


def del_all_inference_info():
    __inference_info.clear()


def get_inference_info(key="image-0"):
    return __inference_info.get(key, None)

def get_all_inference_info():
    return __inference_info.values()


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


def set_dataset_data(key='data-0', data: np.ndarray = None):
    if data is not None:
        __dataset_data_module[key] = data


def get_dataset_data(key='data-0'):
    return __dataset_data_module.get(key, None)


def get_all_dataset_data():
    return __dataset_data_module


def delete_dataset_data(key='data-0'):
    del __dataset_data_module[key]


def delete_all_dataset_data():
    __dataset_data_module.clear()


def set_dataset_label(key='label-0', label: np.ndarray = None):
    if label is not None:
        __dataset_label_module[key] = label


def get_dataset_label(key='label-0'):
    return __dataset_label_module.get(key, None)


def get_all_dataset_label():
    return __dataset_label_module


def delete_dataset_label(key='label-0'):
    del __dataset_label_module[key]


def delete_all_dataset_label():
    __dataset_label_module.clear()


def set_dataset_weight(key='weight-0', weight: np.ndarray = None):
    if weight is not None:
        __dataset_weight_module[key] = weight


def get_dataset_weight(key='weight-0'):
    return __dataset_weight_module.get(key, None)


def get_all_dataset_weight():
    return __dataset_weight_module


def delete_dataset_weight(key='weight-0'):
    del __dataset_weight_module[key]


def delete_all_dataset_weight():
    __dataset_weight_module.clear()


def set_inference_data(key="image-0", data: np.ndarray = None):
    if (data is not None):
        __inference_data[key] = data


def get_inference_data(key="image-0"):
    return __inference_data[key]


def get_all_inference_data():
    return __inference_data.values()


def del_inference_data(key="image-0"):
    del __inference_data[key]


def del_all_inference_data():
    __inference_data.clear()
