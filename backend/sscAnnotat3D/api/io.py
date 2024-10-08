import os
import os.path
import time

import numpy as np
import sscIO.io
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
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

    print('slice_num: \n',slice_num, slice_num == -1)
    if slice_num >= 0:
        img_slice = image[slice_range]
        histogram, bin_edges = np.histogram(img_slice, bins=255)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        img_max = np.max(img_slice)
        img_min = np.min(img_slice)

    elif slice_num == -1:
        histogram, bin_edges = np.histogram(image, bins=255)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        img_max = np.max(image)
        img_min = np.min(image)

    # round bin_centers for pretty show in frontend
    if np.issubdtype(bin_centers.dtype, np.floating):
        # Round the array to two decimal places
        bin_centers = np.round(bin_centers, decimals=2)

    end = time.process_time()
    print(f"Elapsed time during histogram calculation: {end-start} seconds")

    # it is necessary to convert the numpy datatype to a numpy datatype for json
    data_type = image.dtype
    if data_type == float:

        def python_typer(x):
            return float(x)

    else:

        def python_typer(x):
            return int(x)

    # Mount response following HistogramInfoInterface.ts definition
    histogram_info = {}
    histogram_info["data"] = histogram.tolist()
    histogram_info["maxValue"] = python_typer(img_max)
    histogram_info["minValue"] = python_typer(img_min)
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
