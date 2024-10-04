import io
import os
import pickle
import socket
import zlib

import numpy as np
import sentry_sdk
import skimage.io
from flask import *
from flask_cors import CORS, cross_origin
from sscAnnotat3D import superpixels, utils
from sscAnnotat3D.__version__ import __version__
from sscAnnotat3D.api import annotation, filters
from sscAnnotat3D.api import image as apiimage
from sscAnnotat3D.api import io as apiio
from sscAnnotat3D.api import superpixel
from sscAnnotat3D.api.modules import (
    pixel_segmentation_module as apipixel_segmentation_module,
)
from sscAnnotat3D.api.modules import (
    superpixel_segmentation_module as apisuperpixel_segmentation_module,
)
from sscAnnotat3D.modules import superpixel_segmentation_module
from sscAnnotat3D.repository import data_repo

# sentry_sdk.init(
#    dsn="https://dcdb7e790b3747c3c10823e8ffcc0058@o4507488156057600.ingest.us.sentry.io/4507488327630848",
#    # Set traces_sample_rate to 1.0 to capture 100%
#    # of transactions for performance monitoring.
#    traces_sample_rate=1.0,
#    # Set profiles_sample_rate to 1.0 to profile 100%
#    # of sampled transactions.
#    # We recommend adjusting this value in production.
#    profiles_sample_rate=1.0,
# )


app = Flask(__name__)
# import pdb

CORS(app)

app.config["CORS_HEADERS"] = "Content-Type"

app.register_blueprint(apiio.app)
app.register_blueprint(annotation.app)
app.register_blueprint(superpixel.app)
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
        annotat3d_session.update(
            {
                "image_path": image_path,
                "dtype": image.dtype.name,
                "z": image.shape[0],
                "y": image.shape[1],
                "x": image.shape[2],
            }
        )

    if annot is not None:
        annotat3d_session.update({"annot_path": annot_path})

    print(annotat3d_session)
    return jsonify(annotat3d_session)


@app.route("/test", methods=["POST", "GET"])
@cross_origin()
def test():
    return "test", 200


@app.route("/get_env/<type_of_env>", methods=["POST", "GET"])
@cross_origin()
def get_env(type_of_env: str):

    loaded = data_repo.loadedEnv()

    if type_of_env == "load_env":
        env_dict = {
            "workspacePath": os.getenv("REACT_APP_WORKSPACE_PATH") or "",
            "imagePath": os.getenv("REACT_APP_IMAGE_PATH") or "",
            "superpixelPath": os.getenv("REACT_APP_SUPERPIXEL_PATH") or "",
            "labelPath": os.getenv("REACT_APP_LABEL_PATH") or "",
            "annotPath": os.getenv("REACT_APP_ANNOT_PATH") or "",
            "classificationPath": os.getenv("REACT_APP_CLASS_PATH") or "",
            "loadedOnce": loaded,
        }

    if type_of_env == "save_env":
        env_dict = {
            "workspacePath": os.getenv("REACT_APP_OUTPUT_PATH") or "",
            "imagePath": "",
            "superpixelPath": "",
            "labelPath": "",
            "annotPath": "",
            "classificationPath": "",
        }

    return jsonify(env_dict)


@app.route("/versions", methods=["POST", "GET"])
@cross_origin()
def versions():
    import sscIO
    import sscPySpin

    return jsonify(
        [
            dict(name="sscPySpin", version=sscPySpin.__version__),
            dict(name="sscIO", version=sscIO.__version__),
            dict(name="sscAnnotat3D", version=__version__),
        ]
    )


if __name__ == "__main__":

    import logging

    from dotenv import load_dotenv

    load_dotenv()

    LOG_LEVEL = os.getenv("ANNOTAT3D_LOG_LEVEL", "DEBUG")
    logging.root.setLevel(LOG_LEVEL)

    # WARNING: only one process can be used, as we store images in memory
    # to be able to use more processes we should find a better way to store data
    app.run(host=os.getenv("FLASK_RUN_HOST"), port=os.getenv("FLASK_RUN_PORT"), debug=True, processes=1, threaded=True)
