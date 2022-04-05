
from flask import Blueprint, request, send_file, jsonify
import numpy as np
import pickle
import zlib
import io

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import utils

from flask_cors import cross_origin

app = Blueprint('image', __name__)

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
        return "failure", 400

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    img_slice = image[slice_range]

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

