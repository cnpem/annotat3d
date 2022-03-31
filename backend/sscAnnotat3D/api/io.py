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

    file = image_path.split("/")[-1]
    file_name = file.split(".")[0]

    extension = file.split(".")[-1]
    raw_extensions = ["raw", "b"]
    tif_extensions = ["tif", "tiff"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return "failure trying to get the file extension", 400

    info = ""
    image_name = image_path.split("/")
    print(image_name)

    try:
        image, info = sscIO.io.read_volume(image_path, 'numpy')
    except:
        print(info)

    image_info = {"image_shape": image.shape, "image_ext": extension,
                  "image_name": file_name, "image_dtype": ""}

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
