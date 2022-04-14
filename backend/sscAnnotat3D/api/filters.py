
from flask import Blueprint, request, send_file, jsonify
import numpy as np
import pickle
import zlib
import io

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import utils, label

from sscPySpin import filters

from flask_cors import cross_origin

app = Blueprint('filter', __name__)

@app.route('/bm3d/preview/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def bm3d_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    twostep = request.json['twostep']

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)))

    output_img = filters.filter_bm3d(input_img_3d, sigma, twostep)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200

@app.route('/bm3d/apply/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def bm3d_apply(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    twostep = request.json['twostep']

    output_img = filters.filter_bm3d(input_img, sigma, twostep)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200