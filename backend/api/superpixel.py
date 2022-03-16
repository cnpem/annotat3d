from flask import Blueprint, request
import numpy as np

from repository import data_repo
from sscAnnotat3D import superpixels

app = Blueprint('superpixel', __name__)


@app.route('/superpixel', methods=['POST', 'GET'])
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
