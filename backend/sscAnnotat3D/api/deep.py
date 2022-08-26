"""

This script contains some back-end functions for the deep learning module

@author : Gabriel Borin Macedo (gabriel.macedo@lnls.br or borinmacedo@gmail.com)

TODO : Don't forget to document the functions

"""
import glob
from mimetypes import init
from pkgutil import extend_path
from re import T
from tkinter.messagebox import NO
import numpy as np
import os
import logging
import time
import sentry_sdk

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest
from tensorflow.python.client import device_lib

from sscDeepsirius.cython import standardize
from sscAnnotat3D.repository import data_repo
from annotat3dumal.backend.sscAnnotat3D.modules.deep_network_module import deepNetworkModule
from sscDeepsirius.utils import dataset, image
from sscDeepsirius.controller.inference_controller import InferenceController
from sscDeepsirius.controller.host_network_controller import HostNetworkController as NetworkController


activeNet = deepNetworkModule()

app = Blueprint('deep', __name__)

# 

def init_logger(init_msg : str = '\nStarting message logger queue.\n'):
    data_repo.init_logger(init_msg)

def log_msg(msg):
    data_repo.set_log_message(msg)


"""
    Reads from a queue of messages stored on data_repo. 
    Args:

    Returns:
        (str): An empty string if the queue is empty.
"""
@app.route("/read_log_queue", methods=["POST"])
@cross_origin()
def read_log_queue():
    """
    Request for training from the frontend
    """
    msg = data_repo.dequeue_log_message()
    if msg == None:
        return ''
    
    return msg


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    """
    Function to handle error exception and returns to the user

    Args:
        error_msg (str): variable that contains the error

    Returns:
        (tuple): This function returns a tuple that contains the error as a JSON and an int 400

    """
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)


def _convert_dtype_to_str(img_dtype: np.dtype):
    """
    Build-in function to convert dtype to a str

    Args:
        img_dtype (np.dtype): np.dtype object that contains

    Returns:
        (str): returns the str version of the dtype

    """
    return np.dtype(img_dtype).name


def _debugger_print(msg: str, payload: any):
    """
    Build-in function to user as debugger

    Args:
        msg(str): string message to user in debugger
        payload(any): a generic payload

    Returns:
        None

    """
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


@app.route("/get_available_gpus", methods=["POST"])
@cross_origin()
def get_available_gpus():
    """
    Function that verify all the available gpus for inference and show to the user

    Returns:
        (dict): returns a dict that contains all the gpus to use for inference

    """
    local_device_protos = device_lib.list_local_devices()
    list_devices = [x.name for x in local_device_protos if x.device_type == 'GPU']
    gpus = []
    gpu_device_names = []
    i = 0
    for device in list_devices:
        gpu_number = int(device.split(":")[-1])
        gpus.append(gpu_number)
        gpu_device_names.append({
            "key": i,
            "value": "GPU {}".format(gpu_number),
            "label": device
        })

    data_repo.set_inference_gpus(gpus)
    return jsonify(gpu_device_names)


@app.route("/get_frozen_data", methods=["POST"])
@cross_origin()
def get_frozen_data():
    """
    Function that verify all the frozen data in frozen directory created in the workspace menu

    Returns:
        (dict): returns a dict with all the meta_files for the user to choose and use in inference

    """
    try:
        deep_model = data_repo.get_deep_model()
    except Exception as e:
        return handle_exception(str(e))

    try:
        frozen_path_pb = glob.glob(deep_model["deep_model_path"] + "frozen/*.pb")
        frozen_path_PB = glob.glob(deep_model["deep_model_path"] + "frozen/*.PB")
        frozen_path = [*frozen_path_pb, *frozen_path_PB]
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
    """
    Function that run the inference

    Returns:
        (str): returns a string "successes" if the operation occurs without any error and an exception otherwise

    """
    try:
        output = request.json["output"]
        patches = request.json["patches"]
        network = request.json["network"]
        isInferenceOpChecked = request.json["isInferenceOpChecked"]
    except Exception as e:
        return handle_exception(str(e))

    if (output["outputPath"] == ""):
        return handle_exception("Empty path isn't valid !")

    _depth_prob_map_dtype = {'16-bits': np.dtype('float16'), '32-bits': np.dtype('float32')}
    images_list = [*data_repo.get_all_inference_keys()]
    images_props = [*data_repo.get_all_inference_info()]
    images_list_name = [*data_repo.get_all_inference_info()]
    images_list_name = [x["filePath"] for x in images_list_name]
    output_folder = output["outputPath"]
    model_file_h5 = os.path.join(data_repo.get_deep_model()["deep_model_path"], "frozen", network + ".meta.h5")
    model_file = os.path.join(data_repo.get_deep_model()["deep_model_path"], "frozen", network)
    error_message = ""
    try:
        metadata = dataset.load_metadata(model_file_h5)
    except Exception as e:
        return handle_exception(str(e))

    patch_size = metadata['patch_size']
    num_classes = metadata.get('num_classes', 2)

    border = (patches["patchBorder"][0], patches["patchBorder"][1], patches["patchBorder"][2])
    padding = (patches["volumePadding"][0], patches["volumePadding"][1], patches["volumePadding"][2])

    if (len(images_list) > 0):
        if (any(np.array(padding) > np.array(patch_size))):
            error_message = 'One of Volume Padding axis is greater than Patch Size axis'
        elif (any(np.array(border) > np.array(patch_size))):
            error_message = 'One of Patch Border axis is greater than Patch Size axis'
        elif (output["probabilityMap"] == False and output["label"] == False):
            error_message = 'Please select the output type'
        else:
            if output_folder:
                logging.debug('{}'.format(output_folder))

            else:
                error_message = 'Please specify the output path.'

    else:
        error_message = 'Please specify the list of images to segment.'

    if (error_message != ""):
        _debugger_print("error in run_inference func", error_message)
        return handle_exception(error_message)

    batch_size = metadata['batch_size']
    input_node = metadata['input_node']
    output_node = metadata['output_node']

    mean = np.float32(metadata['mean'])
    std = np.float32(metadata['std'])

    logging.debug('images_list: {}'.format(images_list))
    logging.debug('images_props: {}'.format(images_props))

    gpus = data_repo.get_inference_gpus()

    inference_controller = InferenceController("",
                                               ",".join(map(str, gpus)),
                                               use_tensorrt=isInferenceOpChecked)

    inference_controller.load_graph(model_file, input_node + ":0", output_node + ":0")

    try:
        inference_controller.optimize_batch((batch_size, *patch_size),
                                            border,
                                            padding=padding,
                                            num_classes=num_classes)
    except:
        return handle_exception("Not enough GPU memory to use in inference")

    for image_file_name, image_file, image_props_file in zip(images_list_name, images_list, images_props):
        f, _ = os.path.splitext(os.path.basename(image_file_name))
        data = data_repo.get_inference_data(image_file)
        image_props = {
            "shape": [image_props_file["shape"][0], image_props_file["shape"][1], image_props_file["shape"][2]],
            "dtype": data.dtype}

        t1 = time.time()
        t2 = time.time()
        logging.debug('Read image: {}'.format(t2 - t1))
        t1 = time.time()
        # optimize to avoid unecessary copy
        logging.debug('{}'.format(data.shape))
        data = standardize(data, mean, std, 64)
        t2 = time.time()
        logging.debug('Rotate and cast image: {}'.format(t2 - t1))
        dtype = _depth_prob_map_dtype[output["outputBits"]]

        output_data = inference_controller.inference(data, output_dtype=dtype)

        try:
            image.save_inference(output_folder,
                                 f,
                                 output_data,
                                 num_classes,
                                 image_props,
                                 save_prob_map=output["probabilityMap"],
                                 save_label=output["label"],
                                 output_dtype=dtype,
                                 ext=output["outputExt"][1:])
        except Exception as e:
            return handle_exception("Error to save the inference : {}".format(str(e)))

    return jsonify("successes")

# ---
# Functions for the Network module
# ---

@app.route("/network/set_workspace", methods=["POST"])
@cross_origin()
def set_workspace():
    """
        Sets the workspace path on the active network by searching for it on the respository.

    Args:
        payload(any): a generic payload

    Returns:
        None
    """
    global activeNet

    try:
        deepModelRef = data_repo.get_deep_model(key='deep_learning')
        return activeNet.set_workspace_path(deepModelRef['deep_model_workspace_path'])
    except Exception as e:
        return handle_exception('Error trying to get the workspace path. Not found. : {}'.format(str(e)))


@app.route("/network/import_network", methods=["POST"])
@cross_origin()
def import_network():
    """
    Request for training from the frontend
    """
    importNetworkPath = request.json['path']
    importNetworkName = request.json['name']

    
    # try import model
    try:
        NTctrl.import_model(importNetworkPath, importNetworkName)
    except Exception as e:
        return handle_exception('Error trying to import model. : {} workspascePath is {}'.format(str(e), workspacePath))

    info = 'New network \n'+'Imported from path: '+importNetworkPath+'\n'+'New Name: '+importNetworkName

    return jsonify(info)


@app.route("/network/import_network_custom_settings", methods=["POST"])
@cross_origin()
def import_network_custom_settings():
    """
    Import a json with settings specific to a network in a dictionary form to be rendered as an input on the frontend.
    layout: {'setting_name_1': {'option_11', 'option_12', 'option_1n'}, 'setting_name_2': {'option_21', 'option_22', 'option_2n'}}
    Requires an active network.

    Returns: 
        customSettings (dic): dictionary of the custom settings for the active network

    """
    customSettings = #data_repo.?

    return jsonify(customSettings)


@app.route("/network/import_dataset", methods=["POST"])
@cross_origin()
def import_dataset():
    """
    Request for training from the frontend
    """
    global activeNet

    importDatasetPath = request.json['path']

    return jsonify(info)


@app.route("/network/train", methods=["POST"])
@cross_origin()
def train():
    """
    Request training for the network by setting training parameters and calling the training method of the active nework.

    Args:
        msg(str): string message to user in debugger
        payload(any): a generic payload

    Returns:
        None

    """
    global activeNet

    num_gpus = request.json['num_gpus']
    loss_type = request.json['loss_type']
    optimiser =request.json['optimiser']
    cuda_devices = data_repo.get_inference_gpus()
    batch_size = request.json['']
    max_iter = request.json['']
    learning_rate = request.json['learning_rate']

    params = {
        'num_gpus': num_gpus,
        'loss_type': loss_type,
        'optimiser': optimiser,
        'cuda_devices': cuda_devices,
        'batch_size': batch_size,
        'max_iter': max_iter,
        'learning_rate': learning_rate
    }

    activeNet.activate(params)

    activeNet.set_network_controller()

        
    log_msg('done training')
    return 'done training'

