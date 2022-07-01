import numpy as np

# TODO : need to implement the docstring later

__images = dict()
__annotations = dict()
__deep_model = dict()
__dataset_data_module = dict()
__dataset_label_module = dict()
__dataset_weight_module = dict()
__augment_checked_options = dict({
    0: {"augmentationOption": "vertical-flip", "isChecked": True},
    1: {"augmentationOption": "vertical-flip", "isChecked": True},
    2: {"augmentationOption": "rotate-90-degrees", "isChecked": True},
    3: {"augmentationOption": "rotate-less-90-degrees", "isChecked": True},
    4: {"augmentationOption": "contrast", "isChecked": True},
    5: {"augmentationOption": "linear-contrast", "isChecked": True},
    6: {"augmentationOption": "dropout", "isChecked": True},
    7: {"augmentationOption": "gaussian-blur", "isChecked": True},
    8: {"augmentationOption": "average-blur", "isChecked": True},
    9: {"augmentationOption": "additive-poisson-noise", "isChecked": True},
    10: {"augmentationOption": "elastic-deformation", "isChecked": True}})
__augment_ion_range = dict({
    0: {"ionNameMenu": "Contrast-Gamma", "actualRangeVal": {"lower": 0.95, "upper": 1.55}},
    1: {"ionNameMenu": "Linear Contrast-Gamma", "actualRangeVal": {"lower": 0.76, "upper": 1.24}},
    2: {"ionNameMenu": "Dropout-Gamma", "actualRangeVal": {"lower": 0.06, "upper": 0.14}},
    3: {"ionNameMenu": "Gaussian Blur-Sigma", "actualRangeVal": {"lower": 0.97, "upper": 2.13}},
    4: {"ionNameMenu": "Average Blur-K", "actualRangeVal": {"lower": 4.30, "upper": 8.70}},
    5: {"ionNameMenu": "Additive Poisson Noise-Scale", "actualRangeVal": {"lower": 6.00, "upper": 14.00}},
    6: {"ionNameMenu": "Elastic Deformation-Alpha", "actualRangeVal": {"lower": 15.07, "upper": 35.03}},
    7: {"ionNameMenu": "Elastic Deformation-Sigma", "actualRangeVal": {"lower": 1.57, "upper": 3.53}}})


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


def set_augmentation_options(key: int = 0, data: dict = None):
    if (data is not None):
        __augment_checked_options[key] = data


def set_augment_ion_range(key: int = 0, data: dict = None):
    if (data is not None):
        __augment_ion_range[key] = data


def get_augment_ion_range(key: int = 0):
    return __augment_ion_range.get(key, None)
