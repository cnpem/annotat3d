from flask import Blueprint, request, send_file
import numpy as np
import io
import zlib

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import superpixels, utils

from flask_cors import cross_origin

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

    # print(img_superpixel.mean(), img_superpixel.shape)

    data_repo.set_image(key='superpixel', data=img_superpixel)

    return "success", 200


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

    # print(np.mean(slice_superpixels), np.std(slice_superpixels),
          # slice_superpixels.shape)

    compressed_slice_superpixels = zlib.compress(
        utils.toNpyBytes(slice_superpixels))

    return send_file(io.BytesIO(compressed_slice_superpixels),
                     "application/gzip")


