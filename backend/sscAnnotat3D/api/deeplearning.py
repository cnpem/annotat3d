"""
This script contains functions used for deep learning module
@Docs author : Gabriel Borin Macedo (gabriel.macedo@lnls.com.br or borinmacedo@gmail.com)
"""

from flask import Blueprint, request, send_file, jsonify
import pickle
import io
import zlib

from sscAnnotat3D.modules import annotation_module
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D import utils

from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest

app = Blueprint('deeplearning', __name__)

@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    """
    Function that handle with bad exceptions and returns a json that contains the error and a 400 error

    Args:
        error_msg (str): a string that contains the error

    Returns:
        (tuple[str, int]): this function returns respectively the json that contains the error message and the 400 error (tuple[Response, int])

    """
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)


@app.route("/open_new_workspace", methods=["POST"])
@cross_origin()
def open_new_workspace():
    try:
        workspace_path = request.json["workspace_path"]
    except Exception as e:
        return handle_exception(str(e))

    print("============================================\n")
    print("Workspace_path : {}".format(workspace_path))
    print("\n==============================================")

    return jsonify(workspace_path)
