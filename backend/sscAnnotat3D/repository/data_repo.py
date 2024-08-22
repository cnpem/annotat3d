"""
This script is a local repository and contains functions such as save, load and delete this files
saved on the backend
"""

import numpy as np

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
dict that contains the classifier information
"""
__model_complete = dict()

"""
dict that holds the superpixel_type, seed_spacing and compactness chosen by the user
"""
__superpixel_state = {"compactness": 1000, "seedsSpacing": 4, "method": "waterpixels", "use_pixel_segmentation": False}

"""
dict that holds the feature_extraction_params chosen by the user
"""
__feature_extraction_params = dict()

"""
dict that contains the flag if env variables hass been lodaded before
"""
_loadedEnv = {
    "loaded": False,
}


def contiguous(array: np.ndarray) -> np.ndarray:
    """
    Check if the array is configous if not, make it contigous (bug fixfor the cython wrapper in backend spin).


    Args:
        array (np.ndarray): contigous, none or non contigous array
    Returns:
        array (np.ndarray): contigous array

    """
    if array is None:
        pass

    elif not array.flags["C_CONTIGUOUS"]:
        array = np.ascontiguousarray(array)

    return array


def set_feature_extraction_params(key: str = "", data: dict = None):
    """
    Setter for __feature_extraction_params

    Args:
        key(str): key for the value
        data(dict): data that contains the feature extraction

    Returns:
        None

    """
    if data is not None:
        __feature_extraction_params[key] = data


def get_feature_extraction_params(key: str = ""):
    """
    Getter for __feature_extraction_params

    Args:
        key(str): key for the value

    Returns:
        (dict): data that contains the feature extraction

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


def set_image(key="image", data: np.ndarray = None):
    """
    Function that set an image, superpixel or label

    Args:
        key(str): This key can be "image", "superpixel" or "label"
        data(np.ndarray): np.ndarray that contains the data information

    Returns:
        None

    """
    if data is not None:
        __images[key] = contiguous(data)


def get_image(key="image"):
    """
    Function that get an image, superpixel or label

    Args:
        key(str): This key can be "image", "superpixel" or "label"

    Returns:
        (np.ndarray): returns the data based on the key

    """
    return contiguous(__images.get(key, None))


def get_images_keys():
    """
    Function that get all availables keys.
    Possible keys: image, superpixel, label and annotation.

    Returns:
        list: list of avaible keys

    """
    return list(__images.keys())  # + list(__annotations.keys())


def delete_image(key="image"):
    """
    Function that deletes an image, superpixel or label

    Args:
        key(str): This key can be "image", "superpixel" or "label"

    Returns:
        None

    """
    del __images[key]


def set_annotation(key="annotation", data: dict = None):
    """
    Function that set an annotation

    Args:
        key(str): This key is used as "annotation"
        data(dict):

    Returns:

    """
    if data is not None:
        __annotations[key] = data


def get_annotation(key="annotation"):
    """
    Function that gets an annotation

    Args:
        key(str): This key is used as "annotation"

    Returns:
        (dict): Returns a dict that contains the annotations

    """
    return __annotations.get(key, None)


def delete_annotation(key="annotation"):
    """
    Function that deletes the annotation

    Args:
        key(str): This key is used as annotation

    Returns:
        None

    """
    del __annotations[key]


def set_info(key="image_info", data: dict = None):
    """
    Function that set the image, superpixel or annotation info

    Notes:
        Crop feature also use this function to set new images, superpixels and annotations.

    Args:
        key(str): string that represents the key to access the data.
        data(dict): dict that contains information of image, superpixel or annotation.

    Returns:
        None

    """
    if data is not None:
        __info[key] = data


def get_info(key="image_info"):
    """
    Function that gets the image, superpixel or annotation info

    Args:
        key(str): string that represents the key to access the data.

    Returns:
        (dict): Returns a dict that contains information of image, superpixel or annotation.

    """
    return __info.get(key)


def delete_info(key):
    """
    Function that deletes the image, superpixel or annotation info

    Args:
        key(str): string that represents the key to access the data.

    Returns:
        None

    """
    del __info[key]


def set_classification_model(key="model_complete", model: dict = None):
    """
    Function that set the classifier model in superpixel segmentation

    Args:
        key(str): This key is always "model_complete"
        model(str): dict that contains information about the classification model

    Returns:
        None

    """
    if model is not None:
        __model_complete[key] = model


def get_classification_model(key="model_complete"):
    """
    Function that get the classifier model in superpixel segmentation

    Args:
        key(str): This key is always "model_complete"

    Returns:
        (dict): returns a dict that contains information about the classification model

    """
    return __model_complete.get(key, None)


def loadedEnv(key="loaded"):
    """
    Function that returns if the env variables has been loaded before

    Args:
        key(str): This key is always "loaded"

    Returns:
        (bool): returns the state

    """
    previous = _loadedEnv.get(key, None)

    _loadedEnv["loaded"] = True

    return previous
