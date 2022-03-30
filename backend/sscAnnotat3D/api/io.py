from flask import Blueprint, request, jsonify
import sscIO.io

from sscAnnotat3D.repository import data_repo

from flask_cors import cross_origin

app = Blueprint('io', __name__)


@app.route("/open_image", methods=["POST"])
@cross_origin()
def open_image():

    try:
        image_path = request.json["image_path"]
    except Exception as e:
        return e, 400

    extension = image_path.split(".")[-1]
    raw_extensions = ["raw", "b"]
    tif_extensions = ["tif", "tiff"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return "failure trying to get the file extension", 400

    info = ""

    try:
        image, info = sscIO.io.read_volume(image_path, 'numpy')
    except:
        print(info)

    image_info = {"image_shape": image.shape, "image_ext": extension}

    test = jsonify(image_info)
    print("Fazendo um teste aqui : {}".format(test))

    data_repo.set_image(key='image', data=image)

    return image_info, 200


@app.route("/close_image", methods=["POST"])
@cross_origin()
def close_image():

    try:
        data_repo.delete_image(key='image')
    except:
        return "failure", 400

    return "success", 200
