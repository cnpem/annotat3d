import io
import os
import pickle
import socket
import zlib

import numpy as np
import skimage.io
from flask import *

from sscAnnotat3D.api import annotation, filters, io as apiio, superpixel, remotevis, image as apiimage
from sscAnnotat3D.__version__ import __version__
from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import superpixels, utils
from sscAnnotat3D.modules import superpixel_segmentation_module

from sscAnnotat3D.api.modules import superpixel_segmentation_module as apisuperpixel_segmentation_module, \
    pixel_segmentation_module as apipixel_segmentation_module

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
app.register_blueprint(apiimage.app)
app.register_blueprint(apisuperpixel_segmentation_module.app)
app.register_blueprint(apipixel_segmentation_module.app)
app.register_blueprint(filters.app)

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


@app.route('/test', methods=['POST', 'GET'])
@cross_origin()
def test():
    return 'test', 200

@app.route('/versions', methods=['POST', 'GET'])
@cross_origin()
def versions():
    import sscPySpin
    import sscIO
    import sscDeepsirius
    import ssc_remotevis
    return jsonify([
        dict(name='sscRemoteVis', version=ssc_remotevis.__version__),
        dict(name='sscPySpin', version=sscPySpin.__version__),
        dict(name='sscIO', version=sscIO.__version__),
        dict(name='sscAnnotat3D', version=__version__),
        dict(name='sscDeepsirius', version=sscDeepsirius.__version__)
    ])


if __name__ == "__main__":

    import logging

    LOG_LEVEL = os.getenv('ANNOTAT3D_LOG_LEVEL', 'DEBUG')
    logging.root.setLevel(LOG_LEVEL)

    #WARNING: only one process can be used, as we store images in memory
    #to be able to use more processes we should find a better way to store data
    app.run("0.0.0.0", 5000, True, processes=1, threaded=True)

    # address = socket.gethostbyname(socket.gethostname())
    # with socket.socket() as s:
    #     s.bind(("", 0))
    #     port = s.getsockname()[1]
    # print(f"Running on http://{address}:{port}/ (Press CTRL+C to quit)")
    # server = waitress.serve(app, host="0.0.0.0", port=port)
