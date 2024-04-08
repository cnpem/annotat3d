import os
import os.path
import time

import numpy as np
import sscIO.io
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from skimage.exposure import histogram as skimage_histogram
from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo
from werkzeug.exceptions import BadRequest

app = Blueprint("io", __name__)


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    """
    Function to handle error message from flask
    """
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)


def _convert_dtype_to_str(img_dtype: np.dtype):
    """
    Convert a datatype to a string
    """
    return np.dtype(img_dtype).name


def _debugger_print(msg: str, payload: any):
    """
    Custom print for debugging
    """
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


@app.route("/open_files_dataset/<file_id>", methods=["POST"])
@cross_origin()
def open_files_dataset(file_id: str):
    """
    Function used to open files in dataset menu

    Notes:
        This function is used to read files in SamplingComp.tsx

    Args:
        file_id (str): string used to load a file based on this id

    Returns:
        (dict): This function returns a dict that contains information about the loaded file

    """
    try:
        file_path = request.json["image_path"]
    except Exception as e:
        print(e)
        return handle_exception("Error while trying to get the image path")

    try:
        file_dtype = request.json["image_dtype"]
    except Exception as e:
        print(e)
        return handle_exception("Error while trying to get the image dtype")

    file = file_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    if file == "":
        return handle_exception("Empty path isn't valid !")

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff", ".npy", ".cbf"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return handle_exception("The extension {} isn't supported !".format(extension))

    error_msg = ""

    try:
        use_image_raw_parse = request.json["use_image_raw_parse"]
        if extension in tif_extensions or use_image_raw_parse:
            start = time.process_time()
            image, info = sscIO.io.read_volume(file_path, "numpy")
            end = time.process_time()
            error_msg = "No such file or directory {}".format(file_path)

            if _convert_dtype_to_str(image.dtype) != file_dtype and (file_id == "image" or file_id == "label"):
                image = image.astype(file_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            start = time.process_time()
            image, info = sscIO.io.read_volume(
                file_path, "numpy", shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]), dtype=file_dtype
            )
            end = time.process_time()
            error_msg = (
                "Unable to reshape the volume {} into shape {} and type {}. "
                "Please change the dtype and shape and load the image again".format(
                    file, request.json["image_raw_shape"], file_dtype
                )
            )
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(image.dtype)
    except Exception as e:
        print(e)
        return handle_exception(error_msg)

    image_info = {
        "fileName": file_name + extension,
        "shape": image_shape,
        "type": image_dtype,
        "scan": info,
        "time": np.round(end - start, 2),
        "size": np.round(image.nbytes / 1000000, 2),
        "filePath": file_path,
    }

    if file_id.split("-")[0] == "data":
        data_repo.set_dataset_data(key=file_id, data=image)

    elif file_id.split("-")[0] == "label":
        data_repo.set_dataset_label(key=file_id, label=image)

    elif file_id.split("-")[0] == "weight":
        data_repo.set_dataset_weight(key=file_id, weight=image)

    else:
        return handle_exception('invalid option "{}" to feed the back-end'.format(file_id))

    return jsonify(image_info)


@app.route("/close_files_dataset/<file_id>", methods=["POST"])
@cross_origin()
def close_files_dataset(file_id: str):
    """
    Function that close a file in dataset menu using an id as reference

     Notes:
        This function is used to read files in SamplingComp.tsx

    Args:
        file_id (str): an id used to delete the image

    Examples:
        the id received is always data-n, label-n or weight-n

    Returns:
        (str): returns a string "success on delete the key data-n label-n
        weight-n on data repository" on success and "data-n label-n weight-n
        is an invalid key to get the data from repository" otherwise.

    """
    if file_id.split("-")[0] == "data":
        try:
            data_repo.delete_dataset_data(key=file_id)
            return jsonify("success on delete the key {} on data repository".format(file_id))
        except Exception as e:
            print(e)
            return handle_exception("{} is an invalid key to get the data from repository".format(file_id))

    elif file_id.split("-")[0] == "label":
        try:
            data_repo.delete_dataset_label(key=file_id)
            return jsonify("success on delete the key {} on label repository".format(file_id))
        except Exception as e:
            print(e)
            return handle_exception("{} is an invalid key to get the label from repository".format(file_id))

    elif file_id.split("-")[0] == "weight":
        try:
            data_repo.delete_dataset_weight(key=file_id)
            return jsonify("success on delete the key {} on weight repository".format(file_id))
        except Exception as e:
            print(e)
            return handle_exception("{} is an invalid key to get the weight from repository".format(file_id))

    else:
        return handle_exception("{} is an invalid key".format(file_id))


@app.route("/close_all_files_dataset/<file_id>", methods=["POST"])
@cross_origin()
def close_all_files_dataset(file_id: str):
    """
    Function that close all files in dataset menu using an id as reference

     Notes:
        This function is used to read files in SamplingComp.tsx

    Args:
        file_id (str): an id used to delete all the images

    Examples:
        the id received is always data, label or weight

    Returns:
        (str): returns a string "success on delete all the keys from data label weight dataset"
        on success and "data label weight is an invalid key to delete the data from repository" otherwise.

    """
    if file_id.split("-")[0] == "data":
        try:
            data_repo.delete_all_dataset_data()
            return jsonify("success on delete all the keys from {} dataset".format(file_id))
        except Exception as e:
            print(e)
            return handle_exception("{} is an invalid key to delete the data from repository".format(file_id))

    elif file_id.split("-")[0] == "label":
        try:
            data_repo.delete_all_dataset_label()
            return jsonify("success on delete all the keys from {} dataset".format(file_id))
        except Exception as e:
            print(e)
            return handle_exception("{} is an invalid key to delete the label from repository".format(file_id))

    elif file_id.split("-")[0] == "weight":
        try:
            data_repo.delete_all_dataset_weight()
            return jsonify("success on delete all the keys from {} dataset".format(file_id))
        except Exception as e:
            print(e)
            return handle_exception("{} is an invalid key to delete the weight from repository".format(file_id))

    else:
        return handle_exception("{} is an invalid key".format(file_id))


@app.route("/get_image_histogram/<image_id>", methods=["POST"])
@cross_origin()
def get_image_histogram(image_id):
    """
    Function used to calculate and return current image histogram

    Notes:
        This API request requires that an image was already loaded, otherwise an exception will be launched

    Args:
        None

    Returns:
        (list): List containing the calculated image histogram for the previously loaded image

    """
    start = time.process_time()

    image = data_repo.get_image(key=image_id)
    if image is None:
        return handle_exception(f"Image {image_id} not found.")

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    img_slice = image[slice_range]

    histogram, bin_centers = skimage_histogram(img_slice)

    end = time.process_time()
    print(f"Elapsed time during histogram calculation: {end-start} seconds")
    # it is necessary to convert the numpy datatype to a numpy datatype for json
    data_type = img_slice.dtype
    if data_type == float:

        def python_typer(x):
            return float(x)

    else:

        def python_typer(x):
            return int(x)

    # Mount response following HistogramInfoInterface.ts definition
    histogram_info = {}
    histogram_info["data"] = histogram.tolist()
    histogram_info["maxValue"] = python_typer(np.max(bin_centers))
    histogram_info["minValue"] = python_typer(np.min(bin_centers))
    histogram_info["bins"] = bin_centers.tolist()

    return jsonify(histogram_info)


@app.route("/open_image/<image_id>", methods=["POST"])
@cross_origin()
def open_image(image_id: str):
    """
    Function used to open images, superpixel images or label images

    Notes:
        This function is used on FileLoadDialog.tsx

    Args:
        image_id (str): string that can be "image", "label" or "superpixel" used as key to load this images

    Returns:
        (dict): This function returns a dict that contains information about the loaded file

    """

    try:
        image_path = request.json["image_path"]
    except Exception as e:
        print(e)
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except Exception as e:
        print(e)
        return handle_exception("Error while trying to get the image dtype")

    file = image_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    if file == "":
        return handle_exception("Empty path isn't valid !")

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff", ".npy", ".cbf"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return handle_exception("The extension {} isn't supported !".format(extension))

    error_msg = ""

    try:
        use_image_raw_parse = request.json["use_image_raw_parse"]
        if extension in tif_extensions or use_image_raw_parse:
            image, info = sscIO.io.read_volume(image_path, "numpy")
            error_msg = "No such file or directory {}".format(image_path)

            if _convert_dtype_to_str(image.dtype) != image_dtype and (image_id == "image" or image_id == "label"):
                image = image.astype(image_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            image, info = sscIO.io.read_volume(
                image_path,
                "numpy",
                shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]),
                dtype=image_dtype,
            )

            error_msg = (
                "Unable to reshape the volume {} into shape {} and type {}. "
                "Please change the dtype and shape and load the image again".format(
                    file, request.json["image_raw_shape"], image_dtype
                )
            )
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(image.dtype)
    except Exception as e:
        print(e)
        return handle_exception(error_msg)

    data_repo.set_image(key=image_id, data=image)

    image_info = {
        "imageShape": {"x": image_shape[2], "y": image_shape[1], "z": image_shape[0]},
        "imageExt": extension,
        "imageName": file_name,
        "imageDtype": image_dtype,
        "imageFullPath": image_path,
    }

    label_list = []
    if image_id == "image":
        data_repo.set_info(data=image_info)

    elif image_id == "label":
        set_unique_labels_id = np.unique(image)
        for label_value in set_unique_labels_id:
            # I force label_value to be int just jsonify doen't accept numpy dtypes.
            label_value = int(label_value)
            label_list.append(
                {
                    "labelName": "Label {}".format(label_value) if label_value > 0 else "Background",
                    "id": label_value,
                    "color": [],
                }
            )

    image_info["labelList"] = label_list

    return jsonify(image_info)


@app.route("/close_image/<image_id>", methods=["POST"])
@cross_origin()
def close_image(image_id: str):
    """
    Function used to close a file based on the id of the callout.

    Args:
        image_id (str): string that can be "image", "label" or "superpixel" used as key to close this images

    Returns:
        (str): Returns a string "success on deleting the image !" if the image was deleted
        and "failure trying to delete the image" otherwise

    """

    try:
        data_repo.delete_image(key=image_id)
    except Exception as e:
        print(e)
        return handle_exception("failure trying to delete the image")

    return "success on deleting the image !", 200


@app.route("/save_image/<image_id>", methods=["POST"])
@cross_origin()
def save_image(image_id: str):
    """
    Function used to save an image, a superpixel or a label

    Notes:
        This function is used on FileSaveDialog.tsx

    Args:
        image_id (str): string that can be "image", "label" or "superpixel" used as key to save this images

    Returns:
        (dict): This function returns a dict that contains information about the loaded file

    """

    try:
        image_path = request.json["image_path"]
    except Exception as e:
        print(e)
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except Exception as e:
        print(e)
        return handle_exception("Error while trying to get the image dtype")

    image = data_repo.get_image(key=image_id)

    if image.size == 0:
        return handle_exception("Unable to retrieve the image !")

    save_status = sscIO.io.save_volume(image_path, image_dtype, image)

    if save_status["error_msg"] != "":
        return handle_exception(save_status["error_msg"])

    image_shape = image.shape
    image_info = {
        "imageShape": {"x": image_shape[2], "y": image_shape[1], "z": image_shape[0]},
        "imageExt": save_status["extension"],
        "imageName": save_status["file_name"],
        "imageDtype": image_dtype,
    }

    return jsonify(image_info)
