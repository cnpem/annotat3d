"""

This script contains some back-end functions for the deep learning module

@author : Gabriel Borin Macedo (gabriel.macedo@lnls.br or borinmacedo@gmail.com)

TODO : Don't forget to document the functions

"""
import glob
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
from sscDeepsirius.utils import dataset, image#, gpuu
from sscDeepsirius.controller.inference_controller import InferenceController
from sscDeepsirius.controller.host_network_controller import HostNetworkController as NetworkController

app = Blueprint('deep', __name__)


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


@app.route("/import_network", methods=["POST"])
@cross_origin()
def import_network():
    """
    Request for training from the frontend
    """
    importNetworkPath = request.json['path']
    importNetworkName = request.json['name']

    # try get the workspace path
    try:
        deepModel = data_repo.get_deep_model(key='deep_learning')
        workspacePath = deepModel['deep_model_path']
    except Exception as e:
        return handle_exception('Error trying to get the workspace path. Not found. : {}'.format(str(e)))

    # try network controller
    try:
        NTctrl = NetworkController(workspacePath, streaming_mode=True)
    except Exception as e:
        return handle_exception('Error trying to get Network controller object. : {}'.format(str(e)))

    # check if name doesnt already exists
    if importNetworkName in NTctrl.network_models:
        return handle_exception('Network Name {} already exists. Please create another name. {}'.format(importNetworkName))
    
    # try import model
    try:
        NTctrl.import_model(importNetworkPath, importNetworkName)
    except Exception as e:
        return handle_exception('Error trying to import model. : {} workspascePath is {}'.format(str(e), workspacePath))

    # get actual info from?
    # is it here? _dataset_info_runnable
    # maybe here? _data_info

    info = 'New network \n'+'Imported from path: '+importNetworkPath+'\n'+'New Name: '+importNetworkName

    print(glob.glob(workspacePath+'*'))

    return jsonify(info)


# todo: 

@app.route("/import_dataset", methods=["POST"])
@cross_origin()
def import_dataset():
    """
    Request for training from the frontend
    """
    importNetworkPath = request.json['path']
    importNetworkName = request.json['name']

    # try get the workspace path
    try:
        deepModel = data_repo.get_deep_model(key='deep_learning')
        workspacePath = deepModel['deep_model_path']
    except Exception as e:
        return handle_exception('Error: Unable to get the workspace path. Not found. : {}'.format(str(e)))

    # try network controller
    try:
        NTctrl = NetworkController(workspacePath, streaming_mode=True)
    except Exception as e:
        return handle_exception('Error: Unable to get Network controller object. : {}'.format(str(e)))

    # check if name doesnt already exists
    if importNetworkName in NTctrl.network_models:
        return handle_exception('Network Name {} already exists. Please create another name. {}'.format(importNetworkName))
    
    # try import model
    try:
        NTctrl.import_model(importNetworkPath, importNetworkName)
    except Exception as e:
        return handle_exception('Error: Unable to import model. : {} workspascePath is {}'.format(str(e), workspacePath))

    # get actual info from?
    # is it here? _dataset_info_runnable
    # maybe here? _data_info

    info = 'New network \n'+'Imported from path: '+importNetworkPath+'\n'+'New Name: '+importNetworkName

    print(glob.glob(workspacePath+'*'))

    return jsonify(info)

def log_msg(msg):
    data_repo.set_log_message(msg)

def run_training(params):
    _loss = {
        'Cross Entropy': 'CrossEntropy',
        'Dice': 'Dice',
        'Cross Entropy + Dice': 'DicePlusXEnt',
    }
    
    log_msg('loss ->')
    log_msg('{}'.format(_loss))

    num_gpus = params['num_gpus']
    loss_type = params['loss_type']
    optimiser = params['optimiser']
    cuda_devices = ','.join(map(str, num_gpus))
    batch_size = params['']
    max_iter = params['']
    learning_rate = params['learning_rate']

    run_mode = 'local' # fixed

    # try get the workspace path
    try:
        deepModel = data_repo.get_deep_model(key='deep_learning')
        workspacePath = deepModel['deep_model_path']
    except Exception as e:
        return handle_exception('Error: Unable to get the workspace path. Not found. : {}'.format(str(e)))

    # try network controller
    try:
        NTctrl = NetworkController(workspacePath, streaming_mode=True)
    except Exception as e:
        return handle_exception('Error: Unable to get Network controller object. : {}'.format(str(e)))

    try:
        network_instance = NTctrl.get_network_instance()
    except Exception as e:
        return handle_exception('Error: Unable to get Network instance. : {}'.format(str(e)))

    try:
        dataset_file = None
    except Exception as e:
        return handle_exception('Error: Unable to get Dataset file. : {}'.format(str(e)))


    if run_mode == 'local':
        network_instance, log = NTctrl.train(network_instance,
                                                dataset_file,
                                                num_gpus=num_gpus,
                                                cuda_devices=cuda_devices,
                                                batch_size=batch_size,
                                                max_iter=max_iter,
                                                lr=learning_rate,
                                                loss_type=loss_type,
                                                optimiser=optimiser,
                                                **self._custom_params_value())
    else:  #tepui
        msg = 'mode not available'
        # log = remote_utils.PipeStream()
        # partition_info = _tepui_partitions[self.partitionComboBox.currentText()]
        # with remote_modules.slurm.slurm(self._tepui_connection,
        #                                 partition_info['partition'],
        #                                 ngpus=partition_info['num_gpus']):
        #     with remote_modules.singularity.singularity(self._tepui_connection,
        #                                                 _annotat3d_singularity_img_path,
        #                                                 mount={'/ibira': '/ibira'}):
        #         remote_modules.deepsirius.train(self._tepui_connection,
        #                                         self._workspace,
        #                                         self.networkModelsComboBox.currentText(),
        #                                         self._dataset_file,
        #                                         batch_size=self.batchSizeSpinBox.value(),
        #                                         max_iter=self.maxIterSpinBox.value(),
        #                                         lr=self.learnRateSpinBox.value(),
        #                                         loss_type=loss_type,
        #                                         optimiser=optimiser,
        #                                         num_gpus=partition_info['num_gpus'],
        #                                         custom_param_values=self._custom_params_value(),
        #                                         out_stream=log,
        #                                         run_async=True)
        # print(type(log))
        # log = remote_utils.pipe_iter(log.pipe_recv)
        # print(type(log))

        # (c, workspace, network, dataset_file, partition, batch_size,
        # max_iter, lr, loss_type, optimiser, ngpus,
        # custom_param_values, **kwargs):

    return log

@app.route("/read_log", methods=["POST"])
@cross_origin()
def read_log():
    """
    Request for training from the frontend
    """
    print('on read log ')
    msg = data_repo.get_last_log_message()
    if msg == None:
        return ''
    
    return msg

@app.route("/train", methods=["POST"])
@cross_origin()
def training():
    """
    Request for training from the frontend
    """
    log_msg('Creating network instance ...\n')

    nreps = 10
    
    # understand this and keep going
    # sentry_transaction = sentry_sdk.start_transaction(name='Training', op='deeplearning')
    # sentry_transaction.__enter__()

    for n in range(nreps):
        print('this is the fake training still', n)
        log_msg('message '+str(n))

    log_msg('done training')
    
    return 'done training'

