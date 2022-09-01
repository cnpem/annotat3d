"""

This script contains some back-end functions for the deep learning module

@authors : Gabriel Borin Macedo (gabriel.macedo@lnls.br or borinmacedo@gmail.com)
         : Bruno Carlos (bruno.carlos@lnls.br)

TODO : Don't forget to document the functions

"""
import glob
import numpy as np
import os
import logging
import time

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest
from tensorflow.python.client import device_lib

from sscIO.io import read_volume
from sscDeepsirius.cython import standardize
from sscAnnotat3D.repository import data_repo
from sscDeepsirius.utils import dataset, image, augmentation
from sscDeepsirius.controller.inference_controller import InferenceController
from sscDeepsirius.controller.host_network_controller import HostNetworkController 
from sscAnnotat3D.deeplearning import DeepLearningWorkspaceDialog


app = Blueprint('deep', __name__)

def init_logger(init_msg : str = '\nStarting message logger queue.\n'):
    data_repo.init_logger(init_msg)

def log_msg(msg):
    data_repo.set_log_message(msg)


@app.route("/read_log_queue", methods=["POST"])
@cross_origin()
def read_log_queue():
    """
        Reads from a queue of messages stored on data_repo. 
        Args:

        Returns:
            (str): An empty string if the queue is empty.
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
    print("----------------------------------------------------------\n")

# removed from io.py and placed here
@app.route("/open_new_workspace", methods=["POST"])
@cross_origin()
def open_new_workspace():
    """
    Function that opens a new workspace

    Notes:
        the request.json["workspace_path"] receives only the parameter "selected_labels"(str)

    Returns:
        (str): returns a string that contains the new workspace path

    """
    try:
        workspace_path = request.json["workspace_path"]
        workspace_root = request.json["workspace_root"]
    except Exception as e:
        return handle_exception(str(e))

    if (workspace_root == ""):
        return handle_exception("Empty path isn't valid !")

    deep_model = DeepLearningWorkspaceDialog()
    save_status, error_desc = deep_model.open_new_workspace(workspace_path)

    if (save_status):
        data_repo.set_deep_model_info(key='workspace_path', data=workspace_path)
        return jsonify(workspace_path)

    return handle_exception("unable to create the Workspace ! : {}".format(error_desc))


@app.route("/load_workspace", methods=["POST"])
@cross_origin()
def load_workspace():
    """
    Function that loads a created workspace

    Notes:
        the request.json["workspace_path"] receives only the parameter "selected_labels"(str)

    Returns:
        (str): returns a string that contains the loaded workspace path

    """
    try:
        workspace_path = request.json["workspace_path"]
    except Exception as e:
        return handle_exception(str(e))

    deep_model = DeepLearningWorkspaceDialog()
    check_valid_workspace = deep_model.check_workspace(workspace_path)

    if (check_valid_workspace):
        data_repo.set_deep_model_info(key='workspace_path', data=workspace_path)
        return jsonify(check_valid_workspace)

    return handle_exception("path \"{}\" is a invalid workspace path!".format(workspace_path))


def _augmenters_list(augmentation_vec: list = None, ion_range_vec: list = None):
    """
    Build-in function that formats the front-end data into the correct structure in the function augment_web

    Args:
        augmentation_vec (list): a list that contains all the elements to augment
        ion_range_vec (list): a list that contains the value of ion-rage of some augment parameters

    Returns:
        (list): returns a list that contains the params to augment and the respective values

    """
    augmenters = []

    # vertical-flip option
    if (augmentation_vec[0]["isChecked"]):
        augmenters.append("vertical-flip")

    # horizontal-flip option
    if (augmentation_vec[1]["isChecked"]):
        augmenters.append("horizontal-flip")

    # rotate-90-degrees option
    if (augmentation_vec[2]["isChecked"]):
        augmenters.append("rotate-90-degrees")

    # rotate-less-90-degrees (rotate 270 degrees) option
    if (augmentation_vec[3]["isChecked"]):
        augmenters.append("rotate-less-90-degrees")

    # contrast option
    if (augmentation_vec[4]["isChecked"]):
        # c_min, c_max = ion_range_vec[0]["ionRangeLimit"].values
        c_lower, c_upper = ion_range_vec[0]["actualRangeVal"].values()
        augmenters.append(
            dict(type="contrast",
                 contrast=(c_lower, c_upper)))
        _debugger_print("test for ion-range in contrast", augmentation_vec[-1])

    # linear-contrast option
    if (augmentation_vec[5]["isChecked"]):
        c_lower, c_upper = ion_range_vec[1]["actualRangeVal"].values()
        augmenters.append(
            dict(type="linear-contrast",
                 linearContrast=(c_lower, c_upper)))
        _debugger_print("test for ion-range in linear-contrast", augmentation_vec[-1])

    # dropout option
    if (augmentation_vec[6]["isChecked"]):
        c_lower, c_upper = ion_range_vec[2]["actualRangeVal"].values()
        augmenters.append(
            dict(type="dropout",
                 dropout=(c_lower, c_upper)))
        _debugger_print("test for ion-range in dropout", augmentation_vec[-1])

    # gaussian-blur option
    if (augmentation_vec[7]["isChecked"]):
        c_lower, c_upper = ion_range_vec[3]["actualRangeVal"].values()
        augmenters.append(
            dict(type="gaussian-blur",
                 sigma=(c_lower, c_upper)))
        _debugger_print("test for ion-range in gaussian-blur", augmentation_vec[-1])

    # average-blur option
    if (augmentation_vec[8]["isChecked"]):
        c_lower, c_upper = ion_range_vec[4]["actualRangeVal"].values()
        augmenters.append(
            dict(type="average-blur",
                 k=(c_lower, c_upper)))
        _debugger_print("test for ion-range in average-blur", augmentation_vec[-1])

    # additive-poisson-noise option
    if (augmentation_vec[9]["isChecked"]):
        c_lower, c_upper = ion_range_vec[5]["actualRangeVal"].values()
        augmenters.append(
            dict(type="additive-poisson-noise",
                 k=(c_lower, c_upper)))
        _debugger_print("test for ion-range in additive-poisson-noise", augmentation_vec[-1])

    # elastic-deformation option
    if (augmentation_vec[10]["isChecked"]):
        c_lower_alpha, c_upper_alpha = ion_range_vec[6]["actualRangeVal"].values()
        c_lower_sigma, c_upper_sigma = ion_range_vec[7]["actualRangeVal"].values()
        augmenters.append(
            dict(type="elastic-deformation",
                 alpha=(c_lower_alpha, c_upper_alpha),
                 sigma=(c_lower_sigma, c_upper_sigma)))
        _debugger_print("test for ion-range in elastic-deformation", augmentation_vec[-1])

    _debugger_print("augmenters param", augmenters)
    return augmenters


@app.route("/create_dataset", methods=["POST"])
@cross_origin()
def create_dataset():
    """
    Function that creates the .h5 dataset

    Notes:
        This function is used in DatasetComp.tsx

    Returns:
        (dict): returns a dict that contains the dataset .h5 name. Otherwise, will return an error for the front-end

    """

    try:
        output = request.json["file_path"]
        sample = request.json["sample"]
        augmentation_vec = request.json["augmentation"]
        ion_range_vec = request.json["ion_range_vec"]
    except Exception as e:
        return handle_exception(str(e))

    size = (sample["patchSize"][0], sample["patchSize"][1], sample["patchSize"][2])
    num_classes = sample["nClasses"]
    nsamples = sample["sampleSize"]
    offset = (0, 0, 0)
    logging.debug('size = {}, nsamples = {}'.format(size, sample["sampleSize"]))
    augmenter_params = _augmenters_list(augmentation_vec, ion_range_vec)

    imgs = list(data_repo.get_all_dataset_data().values())
    labels = list(data_repo.get_all_dataset_label().values())
    weights = list(data_repo.get_all_dataset_weight().values())

    data, error_status = dataset.create_dataset_web(imgs, labels, weights,
                                            output, nsamples, num_classes,
                                            size, offset)

    if (not data):
        return handle_exception(error_status)

    initial_output = output
    splited_str = output.split("/")
    dataset_name = splited_str[-1]
    new_dataset_name = splited_str[-1].split(".")[0] + "_augment" + ".h5"
    output = output.replace(dataset_name, new_dataset_name)

    if (augmenter_params):
        data, error_status = augmentation.augment_web(output, initial_output, augmenter_params, data)

    if (not data):
        return handle_exception(error_status)

    dataset.save_dataset(data)

    return jsonify({"datasetFilename": initial_output.split("/")[-1]})


@app.route("/open_inference_files/<file_id>", methods=["POST"])
@cross_origin()
def open_inference_files(file_id: str):
    _debugger_print("new key", file_id)
    try:
        file_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        file_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    file = file_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    if (file == ""):
        return handle_exception("Empty path isn't valid !")

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff", ".npy", ".cbf"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return handle_exception("The extension {} isn't supported !".format(extension))

    error_msg = ""

    try:
        use_image_raw_parse = request.json["use_image_raw_parse"]
        if (extension in tif_extensions or use_image_raw_parse):
            start = time.process_time()
            image, info = read_volume(file_path, 'numpy')
            end = time.process_time()
            error_msg = "No such file or directory {}".format(file_path)

            if (_convert_dtype_to_str(image.dtype) != file_dtype and (file_id == "image" or file_id == "label")):
                image = image.astype(file_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            start = time.process_time()
            image, info = read_volume(file_path, 'numpy',
                                               shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]),
                                               dtype=file_dtype)
            end = time.process_time()
            error_msg = "Unable to reshape the volume {} into shape {} and type {}. " \
                        "Please change the dtype and shape and load the image again".format(file, request.json[
                "image_raw_shape"], file_dtype)
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(image.dtype)
    except:
        return handle_exception(error_msg)

    image_info = {"fileName": file_name + extension,
                  "shape": image_shape,
                  "type": image_dtype,
                  "scan": info,
                  "time": np.round(end - start, 2),
                  "size": np.round(image.nbytes / 1000000, 2),
                  "filePath": file_path}

    data_repo.set_inference_data(key=file_id, data=image)
    data_repo.set_inference_info(key=file_id, data=image_info)

    return jsonify(image_info)


@app.route("/close_inference_file/<file_id>", methods=["POST"])
@cross_origin()
def close_inference_file(file_id: str):
    """
    Function that deletes a file in inference a menu using a key as string

    Args:
        file_id (str): string used as key to delete the file

    Returns:
        (str): Returns a string that contains the error or "success on delete the key i in Input Image inference"

    """
    try:
        data_repo.del_inference_data(file_id)
        data_repo.del_inference_info(file_id)
        return jsonify("success on delete the key {} in Input Image inference".format(file_id))
    except Exception as e:
        return handle_exception(str(e))


@app.route("/close_all_files_dataset", methods=["POST"])
@cross_origin()
def close_all_inference_files():
    """
    Function that delete all the files in inference menu

    Returns:
        (str): Returns a string that contains the error or "Success to delete all data"

    """
    try:
        data_repo.del_all_inference_data()
        data_repo.del_all_inference_info()
        return jsonify("Success to delete all data")
    except Exception as e:
        return handle_exception(str(e))



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
        i+=1

    data_repo.set_available_gpus(gpus)
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
        workspace_path = data_repo.get_deep_model_info('workspace_path')
    except Exception as e:
        return handle_exception(str(e))

    try:
        frozen_path_pb = glob.glob(workspace_path + "frozen/*.pb")
        frozen_path_PB = glob.glob(workspace_path + "frozen/*.PB")
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

    try:
        workspace_path = data_repo.get_deep_model_info('workspace_path')
    except Exception as e:
        return handle_exception(str(e))

    _depth_prob_map_dtype = {'16-bits': np.dtype('float16'), '32-bits': np.dtype('float32')}
    images_list = [*data_repo.get_all_inference_keys()]
    images_props = [*data_repo.get_all_inference_info()]
    images_list_name = [*data_repo.get_all_inference_info()]
    images_list_name = [x["filePath"] for x in images_list_name]
    output_folder = output["outputPath"]
    model_file_h5 = os.path.join(workspace_path, "frozen", network + ".meta.h5")
    model_file = os.path.join(workspace_path, "frozen", network)
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


