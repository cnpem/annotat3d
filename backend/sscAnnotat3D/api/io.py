from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
import os.path

import sscIO.io
import numpy as np
import tifffile
from sscAnnotat3D.repository import data_repo

from flask_cors import cross_origin

app = Blueprint('io', __name__)

@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400

app.register_error_handler(400, handle_exception)

def _convert_dtype_to_str(dtype: np.dtype):

    if (dtype == "uint8"):
        return "uint8"

    if (dtype == "int16"):
        return "int16"

    if (dtype == "uint16"):
        return "uint16"

    if (dtype == "int32"):
        return "int32"

    if (dtype == "uint32"):
        return "uint32"

    if (dtype == "int64"):
        return "int64"

    if (dtype == "uint64"):
        return "uint64"

    if (dtype == "float32"):
        return "float32"

    if (dtype == "float64"):
        return "float64"

    if (dtype == "complex64"):
        return "complex64"

    return ""


@app.route("/open_image/<image_id>", methods=["POST"])
@cross_origin()
def open_image(image_id: str):

    try:
        image_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    file = image_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    if (file == ""):
        return handle_exception("Empty path isn't valid !")

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return handle_exception("The extension {} isn't supported !".format(extension))

    error_msg = ""

    try:
        use_image_raw_parse = request.json["use_image_raw_parse"]
        if (extension in tif_extensions or use_image_raw_parse):
            image, info = sscIO.io.read_volume(image_path, 'numpy')
            error_msg = "No such file or directory {}".format(image_path)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            image, info = sscIO.io.read_volume(image_path, 'numpy',
                                               shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]),
                                               dtype=image_dtype)

            error_msg = "Unable to reshape the volume {} into shape {} and type {}. " \
                        "Please change the dtype and shape and load the image again".format(file, request.json["image_raw_shape"],
                                                                                            image_dtype)
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(dtype=image.dtype)
    except:
        return handle_exception(error_msg)

    image_info = {"image_shape": image_shape, "image_ext": extension,
                  "image_name": file_name, "image_dtype": image_dtype}
    data_repo.set_image(key=image_id, data=image)
    return jsonify(image_info)


@app.route("/close_image", methods=["POST"])
@cross_origin()
def close_image():

    try:
        data_repo.delete_image(key='image')
    except:
        return handle_exception("failure trying to delete the image")

    return "success on deleting the image !", 200

#TODO: need to pass this function to sscIO
def _save_file(image_path: str, extension: str, image_dtype: str, image: np.array):

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff"]

    if (extension in tif_extensions):

        if (image.dtype != image_dtype):
            image = image.astype(image_dtype)

        try:
            tifffile.imwrite(image_path, image)
        except Exception as e:
            return handle_exception(str(e))

        return None

    elif (extension in raw_extensions):
        try:
            image = image.astype(image_dtype)
            image.tofile(image_path)
        except Exception as e:
            return handle_exception(str(e))

    else:
        return handle_exception("The extension {} isn't supported !".format(extension))


#TODO: need to implement a better error message
@app.route("/save_image/<image_id>", methods=["POST"])
@cross_origin()
def save_image(image_id: str):

    try:
        image_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    file = image_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    if (file == ""):
        return handle_exception("Empty path isn't valid !")

    image = data_repo.get_image(key=image_id)

    if (image.size == 0):
        return handle_exception("Unable to retrive the image !")

    save_status = _save_file(image_path, extension, image_dtype, image)

    if (save_status != None):
        return save_status

    image_shape = image.shape
    image_info = {"image_shape": image_shape, "image_ext": extension,
                  "image_name": file_name, "image_dtype": image_dtype}

    return jsonify(image_info)