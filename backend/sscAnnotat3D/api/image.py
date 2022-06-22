from flask import Blueprint, request, send_file, jsonify
from werkzeug.exceptions import BadRequest
import zlib
import io

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import utils, label

from flask_cors import cross_origin

app = Blueprint('image', __name__)

@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400

app.register_error_handler(400, handle_exception)


@app.route('/is_available_image/<image_id>', methods=["POST"])
@cross_origin()
def is_available_image(image_id: str):
    image = data_repo.get_image(image_id)
    return jsonify({ 'available': image is not None })

@app.route("/get_image_slice/<image_id>", methods=["POST"])
@cross_origin()
def get_image_slice(image_id: str):

    image = data_repo.get_image(key=image_id)

    if image is None:
        return handle_exception(f"Image {image_id} not found.")

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    img_slice = image[slice_range]

    get_contour = request.json.get('contour', False)

    if get_contour:
        img_slice = label.label_slice_contour(img_slice)

    import time

    npy_st = time.time()
    byte_slice = utils.toNpyBytes(img_slice)
    npy_en = time.time()

    comp_st = time.time()
    compressed_byte_slice = zlib.compress(byte_slice)
    comp_en = time.time()

    print('npy time: ', npy_en - npy_st)
    print('compress time: ', comp_en - comp_st)

    return send_file(io.BytesIO(compressed_byte_slice), "application/gzip")


@app.route("/get_image_info/<image_id>", methods=["POST"])
@cross_origin()
def get_image_info(image_id: str):
    img = data_repo.get_image(image_id)

    if img is None:
        return handle_exception(f"Image {image_id} not found.")

    image_info = data_repo.get_info()

    return jsonify(image_info)

