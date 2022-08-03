import io
import zlib

from flask import Blueprint, request, send_file, jsonify
from flask_cors import cross_origin

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import superpixels, utils

app = Blueprint('superpixel', __name__)


@app.route('/superpixel', methods=['POST', 'GET'])
@cross_origin()
def superpixel():
    img = data_repo.get_image(key='image')

    img_superpixel, num_superpixels = superpixels.superpixel_extraction(
        img,
        superpixel_type=request.json['superpixel_type'],
        seed_spacing=request.json['seed_spacing'],
        compactness=request.json['compactness'])

    data_repo.set_image(key='superpixel', data=img_superpixel)
    data_repo.set_superpixel_state("compactness", request.json['compactness'])
    data_repo.set_superpixel_state("seedsSpacing", request.json['seed_spacing'])
    data_repo.set_superpixel_state("method", request.json['superpixel_type'])
    data_repo.set_superpixel_state("use_pixel_segmentation", request.json['use_pixel_segmentation'])

    return jsonify("success")


@app.route('/get_superpixel_slice', methods=['POST', 'GET'])
@cross_origin()
def get_superpixel_slice():
    img_superpixels = data_repo.get_image('superpixel')

    if img_superpixels is None:
        return "failure", 400

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    slice_superpixels = img_superpixels[slice_range]
    slice_superpixels = superpixels.superpixel_slice_borders(
        slice_superpixels)

    compressed_slice_superpixels = zlib.compress(
        utils.toNpyBytes(slice_superpixels))

    return send_file(io.BytesIO(compressed_slice_superpixels),
                     "application/gzip")
