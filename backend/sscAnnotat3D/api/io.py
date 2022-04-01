from flask import Blueprint, request
import sscIO.io

from sscAnnotat3D.repository import data_repo

from flask_cors import cross_origin

app = Blueprint('io', __name__)


@app.route("/open_image/<image_id>", methods=["POST"])
@cross_origin()
def open_image(image_id: str):

    try:
        image_path = request.json["image_path"]
    except:
        return "Error while trying to get the image path", 400

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return "Error while trying to get the image dtype", 400

    file = image_path.split("/")[-1]
    file_name = file.split(".")[0]

    if(file_name == ""):
        return "Empty path isn't valid !", 400

    extension = file.split(".")[-1]

    if(extension == file_name):
        return "The path {} is a invalid path !!".format(image_path), 400

    raw_extensions = ["raw", "b"]
    tif_extensions = ["tif", "tiff"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return "the extension .{} isn't supported !".format(extension), 400

    try:
        use_image_raw_parse = request.json["use_image_raw_parse"]
        if(extension in tif_extensions or use_image_raw_parse):
            image, info = sscIO.io.read_volume(image_path, 'numpy')

        else:
            image_raw_shape = request.json["image_raw_shape"]
            image, info = sscIO.io.read_volume(image_path, 'numpy',
                                               shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]),
                                               dtype=image_dtype)
        image_shape = image.shape
    except:
        return "Unable to reshape the volume {} into shape {} and type {}. " \
               "Please change the dtype and shape and load the image again".format(file, image_raw_shape,
                                                                                   image_dtype), 400

    image_info = {"image_shape": image_shape, "image_ext": extension,
                  "image_name": file_name, "image_dtype": image_dtype}
    data_repo.set_image(key=image_id, data=image)
    return image_info, 200


@app.route("/close_image", methods=["POST"])
@cross_origin()
def close_image():

    try:
        data_repo.delete_image(key='image')
    except:
        return "failure trying to delete the image", 400

    return "success on deleting the image !", 200
