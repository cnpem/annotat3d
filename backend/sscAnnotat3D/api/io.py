from flask import Blueprint, request, jsonify
import numpy as np
import sscIO.io
import pickle
import zlib
import io

from sscAnnotat3D.repository import data_repo

from flask_cors import cross_origin

app = Blueprint('io', __name__)


@app.route("/open_image", methods=["POST"])
@cross_origin()
def open_image():

    try:
        image_path = request.json["image_path"]
    except:
        return "failure", 400

    extension = image_path.split(".")[-1]
    raw_extensions = ["raw", "b"]
    tif_extensions = ["tif", "tiff"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return "failure", 400

    image, info = sscIO.io.read_volume(image_path, 'numpy')

    print("Shape json : {}".format(jsonify(image.shape)))
    data_repo.set_image(key='image', data=image)

    return jsonify(image.shape), 200


@app.route("/close_image", methods=["POST"])
@cross_origin()
def close_image():

    try:
        data_repo.delete_image(key='image')
    except:
        return "failure", 400

    return "success", 200
