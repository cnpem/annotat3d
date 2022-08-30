"""
This script is a local repository and contains functions such as save, load and delete this files
saved on the backend
"""

import numpy as np

# TODO : I need to document the dict for edit label menu and for the other functions as well

"""
dict that contains the loaded image, superpixel and label
"""
__images = dict()

"""
dict that contains the annotations and their respective coordinates
"""
__annotations = dict()

"""
dict that contains info about images and annotation to use in crop function
"""
__info = dict()

"""
dict that contains information about the path to the deep_model folder
"""
__deep_model = dict()

"""
dict that contains the saved data in dataset menu
"""
__dataset_data_module = dict()

"""
dict that contain saved label in dataset menu
"""
__dataset_label_module = dict()

"""
dict that contain saved weight in dataset menu
"""
__dataset_weight_module = dict()

"""
dict that contain saved data in batch_inference menu
"""
__inference_data = dict()

"""
dict that contain info about the saved data in batch_inference menu
"""
__inference_info = dict()

"""
list that contain the number of gpus to use in inference
"""
__inference_gpus = list()

"""
dict that contains the classifier information
"""
__model_complete = dict()

"""
dict that holds the superpixel_type, seed_spacing and compactness chosen by the user
"""
__superpixel_state = {
    "compactness": 1000,
    "seedsSpacing": 4,
    "method": "waterpixels",
    "use_pixel_segmentation": False
}

"""
dict that holds the feature_extraction_params chosen by the user
"""
__feature_extraction_params = dict()

__edit_label_options = {
    "is_merge_activated": False,
    "is_split_activated": False,
    "edit_label_merge_module": None,
    "edit_label_split_module": None
}


def set_edit_label_options(key: str = "", flag: bool = False or object):
    """

    Args:
        key:
        flag:

    Returns:

    """
    __edit_label_options[key] = flag


def get_edit_label_options(key: str = ""):
    """

    Args:
        key:

    Returns:

    """
    return __edit_label_options.get(key, None)


def set_feature_extraction_params(key: str = "", data: dict = None):
    """

    Args:
        key:
        data:

    Returns:

    """
    if (data is not None):
        __feature_extraction_params[key] = data


def get_feature_extraction_params(key: str = ""):
    """

    Args:
        key:

    Returns:

    """
    return __feature_extraction_params[key]


def set_superpixel_state(key: str = "", data: any = None):
    """
    Setter function for superpixel_state using a key and a data

    Args:
        key (str): key for the data
        data (any): data using a key as reference. This data can be a str or int

    Returns:
        None

    """
    __superpixel_state[key] = data


def get_superpixel_state():
    """
    Getter function for superpixel_state

    Returns:
        (dict): returns a dict that contains the superpixel type, seed_spacing and compactness

    """
    return __superpixel_state


def set_inference_info(key='image-0', data: dict = None):
    """
    Setter for _inference_info

    Args:
        key(str): a string to use as key. Usually, the key is "image-i" with i as a number
        data(dict): a dict that contains the inference data

    Returns:
        None

    """
    if data is not None:
        __inference_info[key] = data


def del_inference_info(key="image-0"):
    """
    Function that delete an inference info using a key

    Args:
        key(str): a string to use as key. Usually, the key is "image-i" with i as a number

    Returns:
        None

    """
    del __inference_info[key]


def del_all_inference_info():
    """
    Function that delete all inference info

    Returns:
        None

    """
    __inference_info.clear()


def get_inference_info(key="image-0"):
    """
    Function that get all inference info

    Args:
        key(str): a string to use as key. Usually, the key is "image-i" with i as a number

    Returns:
        None

    """
    return __inference_info.get(key, None)


def get_all_inference_info():
    """
    Function that get all inference_info values

    Returns:
        (_dict_values): returns a _dict_values with all values of inference_info

    """
    return __inference_info.values()


def set_deep_model(key='deep_learning', data: dict = None):
    """
    Function that set the deep_model path directory

    Args:
        key(str): string that represents the key for deep_model
        data(dict): a dict that contain the directory path about the directory of the deep learning workspace

    Returns:
        None

    """
    if data is not None:
        __deep_model[key] = data


def get_deep_model(key='deep_learning'):
    """
    Function that gets the path of deep learning workspace

    Args:
        key(str): string that represents the key for deep_model

    Returns:
        (dict): Returns a dict that contains information about the deep learning workspace

    """
    return __deep_model[key]


def set_image(key='image', data: np.ndarray = None):
    """
    Function that set an image, superpixel or label

    Args:
        key(str): string that represents the key to accesses the data. This key can be "image", "superpixel" or "label"
        data(np.ndarray): np.ndarray that contains the data information

    Returns:
        None

    """
    if data is not None:
        __images[key] = data


def get_image(key='image'):
    """
    Function that get an image, superpixel or label

    Args:
        key(str): string that represents the key to accesses the data. This key can be "image", "superpixel" or "label"

    Returns:
        (np.ndarray): returns the data based on the key

    """
    return __images.get(key, None)


def delete_image(key='image'):
    """
    Function that deletes an image, superpixel or label

    Args:
        key(str): string that represents the key to accesses the data. This key can be "image", "superpixel" or "label"

    Returns:
        None

    """
    del __images[key]


def set_annotation(key='annotation', data: dict = None):
    """
    Function that set an annotation

    Args:
        key(str): string that represents the key to accesses the data. This key is used as "annotation"
        data(dict):

    Returns:

    """
    if data is not None:
        __annotations[key] = data


def get_annotation(key='annotation'):
    """
    Function that gets an annotation

    Args:
        key(str): string that represents the key to accesses the data. This key is used as "annotation"

    Returns:
        (dict): Returns a dict that contains the annotations

    """
    return __annotations.get(key, None)


def delete_annotation(key='annotation'):
    """
    Function that deletes the annotation

    Args:
        key(str): string that represents the key to accesses the data. This key is used as annotation

    Returns:
        None

    """
    del __annotations[key]


def set_info(key='image_info', data: dict = None):
    """
    Function that set the image, superpixel or annotation info

    Notes:
        Crop feature also use this function to set new images, superpixels and annotations.

    Args:
        key(str): string that represents the key to accesses the data.
        data(dict): dict that contains information of image, superpixel or annotation.

    Returns:
        None

    """
    if data is not None:
        __info[key] = data


def get_info(key='image_info'):
    """
    Function that gets the image, superpixel or annotation info

    Args:
        key(str): string that represents the key to accesses the data.

    Returns:
        (dict): Returns a dict that contains information of image, superpixel or annotation.

    """
    return __info.get(key)


def delete_info(key):
    """
    Function that deletes the image, superpixel or annotation info

    Args:
        key(str): string that represents the key to accesses the data.

    Returns:
        None

    """
    del __info[key]


def set_dataset_data(key='data-0', data: np.ndarray = None):
    """
    Function that set the data in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "data-i" where's "i" is a integer
        data(np.ndarray): np.ndarray that contains the data information

    Returns:
        None

    """
    if data is not None:
        __dataset_data_module[key] = data


def get_dataset_data(key='data-0'):
    """
    Function that gets the data in dataset menu on deep learning

    Args:
        key (str): string that represents the key to accesses the data. This key is always "data-i" where's "i" is a integer

    Returns:
        (np.ndarray): np.ndarray that contains the data information

    """
    return __dataset_data_module.get(key, None)


def get_all_dataset_data():
    """
    Function that get all data in dataset menu on deep learning

    Returns:
        (dict): Returns a dict with the key "data-i" (where's "i" is a integer) and a np.ndarray as value

    """
    return __dataset_data_module


def delete_dataset_data(key='data-0'):
    """
    Function that deletes a data in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "data-i" where's "i" is a integer

    Returns:
        None

    """
    del __dataset_data_module[key]


def delete_all_dataset_data():
    """
    Function that deletes all data in dataset menu on deep learning

    Returns:
        None

    """
    __dataset_data_module.clear()


def set_dataset_label(key='label-0', label: np.ndarray = None):
    """
    Function that set the label in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "label-i" where's "i" is a integer
        label(np.ndarray): np.ndarray that contains the label information

    Returns:
        None

    """
    if label is not None:
        __dataset_label_module[key] = label


def get_dataset_label(key='label-0'):
    """
    Function that get the label in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "label-i" where's "i" is a integer

    Returns:
        (np.ndarray): np.ndarray that contains the label information

    """
    return __dataset_label_module.get(key, None)


def get_all_dataset_label():
    """
    Function that get all label in dataset menu on deep learning

    Returns:
        (dict): Returns a dict with the key "label-i" (where's "i" is a integer) and a np.ndarray as value

    """
    return __dataset_label_module


def delete_dataset_label(key='label-0'):
    """
    Function that delete the label in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "label-i" where's "i" is a integer

    Returns:
        None

    """
    del __dataset_label_module[key]


def delete_all_dataset_label():
    """
    Function that delete all the label in dataset menu on deep learning

    Returns:
        None

    """
    __dataset_label_module.clear()


def set_dataset_weight(key='weight-0', weight: np.ndarray = None):
    """
     Function that set the weight in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "weight-i" where's "i" is a integer
        weight(np.ndarray): np.ndarray that contains the weight information

    Returns:
        None

    """
    if weight is not None:
        __dataset_weight_module[key] = weight


def get_dataset_weight(key='weight-0'):
    """
     Function that get the weight in dataset menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "weight-i" where's "i" is a integer

    Returns:
        (np.ndarray): np.ndarray that contains the weight information

    """
    return __dataset_weight_module.get(key, None)


def get_all_dataset_weight():
    """
    Function that get all label in dataset menu on deep learning

    Returns:
        (dict): Returns a dict with the key "weight-i" (where's "i" is a integer) and a np.ndarray as value

    """
    return __dataset_weight_module


def delete_dataset_weight(key='weight-0'):
    """
    Function that delete the weight in dataset menu on deep learning

    Args:
        key(str): key(str): string that represents the key to accesses the data. This key is always "weight-i" where's "i" is a integer

    Returns:
        None

    """
    del __dataset_weight_module[key]


def delete_all_dataset_weight():
    """
    Function that deletes all weights in dataset menu on deep learning

    Returns:
        None

    """
    __dataset_weight_module.clear()


def set_inference_data(key="image-0", data: np.ndarray = None):
    """
    Function that set an image in batch_inference menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "image-i" where's "i" is a integer
        data(np.ndarray): np.ndarray that contains the image information

    Returns:
        None

    """
    if (data is not None):
        __inference_data[key] = data


def get_inference_data(key="image-0"):
    """
    Function that get an image in batch_inference menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "image-i" where's "i" is a integer

    Returns:
        (np.ndarray): np.ndarray that contains the image information

    """
    return __inference_data[key]


def get_all_inference_data():
    """
    Function that get all the images in batch_inference menu on deep learning

    Returns:
        (_dict_values): returns a _dict_values with all values of inference_data

    """
    return __inference_data.values()


def get_all_inference_keys():
    """
    Function that get all the inference_data keys

    Returns:
        (_dict_values): returns a _dict_values with all keys of inference_data

    """
    return __inference_data.keys()


def del_inference_data(key="image-0"):
    """
    Function that delete an image in batch_inference menu on deep learning

    Args:
        key(str): string that represents the key to accesses the data. This key is always "image-i" where's "i" is a integer

    Returns:
        None

    """
    del __inference_data[key]


def del_all_inference_data():
    """
    Function that delete all images in batch_inference menu on deep learning

    Returns:
        None

    """
    __inference_data.clear()


def set_inference_gpus(data: list = None):
    """
    Function that set the number of gpu's to use in batch_inference menu on deep learning

    Args:
        data(list): a list of integers that contains all the gpus to use

    Returns:
        None

    """
    if (data is not None):
        __inference_gpus = data


def get_inference_gpus():
    """
    Function that get the number of gpu's to use in batch_inference menu on deep learning

    Returns:
        (list): Returns a list that contains all the gpu to use in batch_inference

    """
    return __inference_gpus


def set_classification_model(key="model_complete", model: dict = None):
    """
    Function that set the classifier model in superpixel segmentation

    Args:
        key(str): string that represents the key to accesses the data. This key is always "model_complete"
        model(str): dict that contains information about the classification model

    Returns:
        None

    """
    if (model is not None):
        __model_complete[key] = model


def get_classification_model(key="model_complete"):
    """
    Function that get the classifier model in superpixel segmentation

    Args:
        key(str): string that represents the key to accesses the data. This key is always "model_complete"

    Returns:
        (dict): returns a dict that contains information about the classification model

    """
    return __model_complete.get(key, None)
