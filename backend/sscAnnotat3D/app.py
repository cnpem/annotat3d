import io
import pickle
import socket
import zlib

import numpy as np
import skimage.io
from flask import *

from sscAnnotat3D.api import annotation, io as apiio, superpixel, remotevis
from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import superpixels, utils
from sscAnnotat3D.modules import superpixel_segmentation_module
from flask_cors import CORS, cross_origin


app = Flask(__name__)
# import pdb

CORS(app)

app.config['CORS_HEADERS'] = 'Content-Type'

# pdb.set_trace()
app.register_blueprint(apiio.app)
app.register_blueprint(annotation.app)
app.register_blueprint(superpixel.app)
app.register_blueprint(remotevis.app)

image = None
image_path = None
annot = None
annot_path = None


# https://flask.palletsprojects.com/en/2.0.x/patterns/favicon/a
@app.route("/favicon.ico")
def favicon():
    return send_from_directory("static", "favicon.ico")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/reconnect_session", methods=["GET"])
def reconnect_session():

    annotat3d_session = {}

    image = data_repo.get_image()

    if image is None and annot is None:
        return "failure", 400

    if image is not None:
        annotat3d_session.update({
            "image_path": image_path,
            "dtype": image.dtype.name,
            "z": image.shape[0],
            "y": image.shape[1],
            "x": image.shape[2],
        })

    if annot is not None:
        annotat3d_session.update({"annot_path": annot_path})

    print(annotat3d_session)
    return jsonify(annotat3d_session)


@app.route("/get_image_slice/<image_id>", methods=["POST"])
def get_image_slice(image_id: str):

    image = data_repo.get_image(key=image_id)

    if image is None:
        return "failure", 400

    z = request.json["z"]

    img_slice = image[z, :, :]

    import time

    npy_st = time.time()
    byte_slice = utils.toNpyBytes(img_slice)
    npy_en = time.time()

    comp_st = time.time()
    compressed_byte_slice = zlib.compress(byte_slice)
    comp_en = time.time()

    print('z: ', z)

    print('npy time: ', npy_en - npy_st)
    print('compress time: ', comp_en - comp_st)

    # print(img_slice.mean(), img_slice.std())

    # print("gzip bytes", len(compressed_byte_slice))
    return send_file(io.BytesIO(compressed_byte_slice), "application/gzip")

@app.route('/test', methods=['POST', 'GET'])
def test():
    return 'test'

@app.route('/get_superpixel_slice', methods=['POST', 'GET'])
def get_superpixel_slice():

    z = request.json["z"]

    img_superpixels = data_repo.get_image('superpixel')

    if img_superpixels is None:
        return "failure", 400

    slice_superpixels = img_superpixels[z, ...]
    slice_superpixels = superpixels.superpixel_slice_borders(
        slice_superpixels)

    # print(np.mean(slice_superpixels), np.std(slice_superpixels),
          # slice_superpixels.shape)

    compressed_slice_superpixels = zlib.compress(
        utils.toNpyBytes(slice_superpixels))

    return send_file(io.BytesIO(compressed_slice_superpixels),
                     "application/gzip")


@app.route("/get_annot_slice", methods=["POST"])
@cross_origin()
def get_annot_slice():

    return "slice", 200

    annot = data_repo.get_annotation()
    image = data_repo.get_image()

    if annot is None:
        return "failure", 400

    z = request.json["z"]
    print("z", z)

    img_slice = np.ones(image[z, :, :].shape)
    img_slice = img_slice * -1
    for coords in annot:
        if coords[0] == z:
            img_slice[coords[1], coords[2]] = annot[coords][0]

    # slice = slice.astype(np.int16)
    print("annot_slice", img_slice[0])
    print("annot_dtype", img_slice.dtype)
    print("annot_shape", img_slice.shape, img_slice.reshape(-1).shape)
    # print("annot_bytes", len(img_slice.tobytes()))

    # print(img_slice.mean(), img_slice.std())

    img_slice = zlib.compress(img_slice.tobytes())
    # print("annot_gzip_bytes", len(img_slice))

    return send_file(io.BytesIO(img_slice), "application/gzip")


if __name__ == "__main__":
    app.run("0.0.0.0", 5000, True)

    # address = socket.gethostbyname(socket.gethostname())
    # with socket.socket() as s:
    #     s.bind(("", 0))
    #     port = s.getsockname()[1]
    # print(f"Running on http://{address}:{port}/ (Press CTRL+C to quit)")
    # server = waitress.serve(app, host="0.0.0.0", port=port)
