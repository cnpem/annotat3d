"""

This script contains some back-end functions to deep learning module

@author : Gabriel Borin Macedo (gabriel.macedo@lnls.br or borinmacedo@gmail.com)

TODO : Don't forget to document the functions

"""
import glob
import numpy as np
import os
import logging

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest

from sscAnnotat3D.repository import data_repo
from sscDeepsirius.utils import dataset

app = Blueprint('deep', __name__)


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)


def _convert_dtype_to_str(img_dtype: np.dtype):
    return np.dtype(img_dtype).name


def _debugger_print(msg: str, payload: any):
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


@app.route("/get_frozen_data", methods=["POST"])
@cross_origin()
def get_frozen_data():
    try:
        deep_model = data_repo.get_deep_model()
    except Exception as e:
        return handle_exception(str(e))

    try:
        frozen_path = glob.glob(deep_model["deep_model_path"] + "frozen/*.h5")
    except Exception as e:
        return handle_exception(str(e))

    meta_files = []

    for i in range(0, len(frozen_path)):
        file_name = frozen_path[i].split("/")[-1]
        meta_files.append({
            "key": i,
            "value": file_name,
            "label": file_name
        })

    return jsonify(meta_files)


@app.route("/run_inference", methods=["POST"])
@cross_origin()
def run_inference():
    try:
        output = request.json["output"]
        patches = request.json["patches"]
        batch = request.json["batch"]
        network = request.json["network"]
        tepuiGPU = request.json["tepuiGPU"]
        isInferenceOpChecked = request.json["isInferenceOpChecked"]
    except Exception as e:
        return handle_exception(str(e))

    _debugger_print("output", output)
    images_list = data_repo.get_all_inference_data()
    output_folder = output["outputPath"]
    error_message = ""
    metadata = dataset.load_metadata(
        os.path.join(data_repo.get_deep_model()["deep_model_path"], "frozen", network))

    patch_size = metadata['patch_size']
    border = (patches["patchBorder"][0], patches["patchBorder"][1], patches["patchBorder"][2])
    padding = (patches["volumePadding"][0], patches["volumePadding"][1], patches["volumePadding"][2])
    _debugger_print("probMap", output["probabilityMap"])
    _debugger_print("label", output["label"])
    _debugger_print("res", not output["probabilityMap"] and not output["label"])

    if (len(images_list) > 0):
        if (any(np.array(padding) > np.array(patch_size))):
            error_message = 'One of Volume Padding axis is greater than Patch Size axis'
        elif (any(np.array(border) > np.array(patch_size))):
            error_message = 'One of Patch Border axis is greater than Patch Size axis'
        elif (output["probabilityMap"] == False and output["label"] == False):
            error_message = 'Please select the output type'
        else:
            if output_folder:
                # This's the second part implementation i need to do
                # self._inference_thread = utils.ThreadWorker(self._run_inference_runnable())
                logging.debug('VETOR _output_folder_inference: ')
                logging.debug('{}'.format(output_folder))

            else:
                error_message = 'Please specify the output path.'

    else:
        error_message = 'Please specify the list of images to segment.'

    if (error_message != ""):
        _debugger_print("error in run_inference func", error_message)
        return handle_exception(error_message)

    return jsonify("successes")
