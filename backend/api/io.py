from flask import Blueprint, request
import numpy as np
from sscIO import io
import pickle
import zlib

from repository import data_repo

app = Blueprint('io', __name__)


@app.route("/open_image", methods=["POST"])
def open_image():

    image_path = request.json["image_path"]

    extension = image_path.split(".")[-1]
    raw_extensions = ["raw", "b"]
    tif_extensions = ["tif", "tiff"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return "failure", 400

    image, info = io.read_volume(image_path, 'numpy')

    print("shape", image.shape)
    print("dtype", image.dtype)

    data_repo.set_image(key='image', data=image)

    return "success", 200


@app.route("/close_image", methods=["POST"])
def close_image():

    try:
        data_repo.delete_image(key='image')
    except:
        return "failure", 400

    return "success", 200
