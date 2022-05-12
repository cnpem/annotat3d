from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
import os.path

import sscIO.io
import numpy as np
from sscAnnotat3D.repository import data_repo
from sscAnnotat3D.modules import annotation_module

from flask_cors import cross_origin

app = Blueprint('io', __name__)


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)

def _convert_dtype_to_str(dtype: np.dtype):

    return np.dtype(dtype).name


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
    tif_extensions = [".tif", ".tiff", ".npy", ".cbf"]

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
                        "Please change the dtype and shape and load the image again".format(file, request.json[
                "image_raw_shape"],
                                                                                            image_dtype)
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(dtype=image.dtype)
    except:
        return handle_exception(error_msg)

    image_info = {"image_shape": image_shape, "image_ext": extension,
                  "image_name": file_name, "image_dtype": image_dtype}
    data_repo.set_image(key=image_id, data=image)
    return jsonify(image_info)


@app.route("/load_label_from_file_load_dialog/", methods=["POST"])
@cross_origin()
def load_label_from_file_load_dialog():
    image = data_repo.get_image("label")
    kwargs = {"image": image}
    annot_module = annotation_module.AnnotationModule(image.shape, **kwargs)
    label_list = annot_module.load_label_from_file_load_dialog(image)
    return jsonify(label_list)

@app.route("/close_image/<image_id>", methods=["POST"])
@cross_origin()
def close_image(image_id: str):
    try:
        data_repo.delete_image(key=image_id)
    except:
        return handle_exception("failure trying to delete the image")

    return "success on deleting the image !", 200


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

    image = data_repo.get_image(key=image_id)

    if (image.size == 0):
        return handle_exception("Unable to retrieve the image !")

    save_status = sscIO.io.save_volume(image_path, image_dtype, image)

    if (save_status["error_msg"] != ""):
        return handle_exception(save_status["error_msg"])

    image_shape = image.shape
    image_info = {"image_shape": image_shape, "image_ext": save_status["extension"],
                  "image_name": save_status["file_name"], "image_dtype": image_dtype}

    return jsonify(image_info)
