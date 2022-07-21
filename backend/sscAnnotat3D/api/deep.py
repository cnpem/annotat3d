"""

This script contains some back-end functions to deep learning module

@author : Gabriel Borin Macedo (gabriel.macedo@lnls.br or borinmacedo@gmail.com)

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
from sscDeepsirius.cython import standardize

from sscAnnotat3D.repository import data_repo
from sscDeepsirius.utils import dataset, image
from sscDeepsirius.controller.inference_controller import InferenceController

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


# For more references, i can see this script
# https://gitlab.cnpem.br/GCC/segmentation/Annotat3D/-/blob/master/sscAnnotat3D/deeplearning/deeplearning_inference_dialog.py
# Also, i need to see this link for Inference menu in ssc-DeeepSirius
# https://gitlab.cnpem.br/GCC/segmentation/sscDeepsirius/-/blob/0.14.0/sscDeepsirius/controller/inference_controller.py
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

    _depth_prob_map_dtype = {'16-bits': np.dtype('float16'), '32-bits': np.dtype('float32')}
    images_list = [*data_repo.get_all_inference_info()]
    images_list = [x["filePath"] for x in images_list]
    images_props = [{} for _ in images_list]
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

    inference_controller = InferenceController("",
                                               ",".join(tepuiGPU[0]),
                                               use_tensorrt=isInferenceOpChecked)

    inference_controller.load_graph(model_file, input_node + ":0", output_node + ":0")
    _debugger_print("batch_size", batch_size)
    _debugger_print("patch_size", patch_size)
    _debugger_print("(batch_size, *patch_size)", (batch_size, *patch_size))
    _debugger_print("border", border)
    _debugger_print("padding", padding)
    _debugger_print("num_classes", num_classes)
    # TODO : need to see why this's having problem running
    # It's seems that is some memory problem this issue. Think i'll need to test this branch in the HPC
    inference_controller.optimize_batch((batch_size, *patch_size),
                                        border,
                                        padding=padding,
                                        num_classes=num_classes)

    for image_file, image_props in zip(images_list, images_props):
        f, _ = os.path.splitext(os.path.basename(image_file))

        t1 = time.time()
        logging.debug('props: {}'.format(image_props))
        data = image.read(image_file, **image_props)
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

        image.save_inference(output_folder,
                             f,
                             output_data,
                             num_classes,
                             image_props,
                             save_prob_map=output["probabilityMap"],
                             save_label=output["label"],
                             output_dtype=output["outputBits"],
                             ext=output["outputExt"])

    return jsonify("successes")


"""
input_node = metadata['input_node']
output_node = metadata['output_node']

model_file = os.path.join(deeplearning_workspace_dialog.__workspace__, 'frozen', self._frozen_file)

if self._check_run_local():

    self._inference_controller = InferenceController('',
                                                     ','.join(map(str, self._active_gpus)),
                                                     use_tensorrt=self.tensorrtCheckBox.isChecked())

    self._inference_controller.load_graph(model_file, input_node + ':0', output_node + ':0')

    # utils.pyqt_trace()

    self._inference_controller.optimize_batch((batch_size, *patch_size),
                                              border,
                                              padding=padding,
                                              num_classes=num_classes)

else:  # tepui
    if self._tepui_connection is None:
        self._connect_tepui()

images_list = self._image_list_component.files
images_props = self._image_list_component.props

logging.debug('images_list: {}'.format(images_list))
logging.debug('images_props: {}'.format(images_props))

image_bar = progressbar.get('infer_image')
overall_bar = progressbar.get('infer_overall')

overall_bar.set_max(len(images_list))

ext = self.fileExtCombo.currentText()[-3:]

import time
try:
    for image_file, image_props in zip(images_list, images_props):
        f, _ = os.path.splitext(os.path.basename(image_file))

        if self._check_run_local():

            t1 = time.time()
            logging.debug('props: {}'.format(image_props))
            data = image.read(image_file, **image_props)
            t2 = time.time()
            logging.debug('Read image: {}'.format(t2 - t1))
            t1 = time.time()
            # optimize to avoid unecessary copy
            logging.debug('{}'.format(data.shape))
            data = sscDeepsirius.cython.standardize(data, mean, std, 64)
            t2 = time.time()
            logging.debug('Rotate and cast image: {}'.format(t2 - t1))
            # data = self._pad(data, padding)
            logging.debug('')
            dtype = _depth_prob_map_dtype[self.probMapDtypeComboBox.currentText()]
            output = self._inference_controller.inference(data, output_dtype=dtype, pbar=image_bar)

            image.save_inference(output_folder,
                                 f,
                                 output,
                                 num_classes,
                                 image_props,
                                 save_prob_map=self.probMapCheckBox.isChecked(),
                                 save_label=self.labelCheckBox.isChecked(),
                                 output_dtype=dtype,
                                 ext=ext)

        else:  # tepui
            logging.debug('Run tepui for ... {}'.format(image_file))
            log = remote_utils.PipeStream()
            partition_info = _tepui_partitions[self.partitionComboBox.currentText()]
            with remote_modules.slurm.slurm(self._tepui_connection,
                                            partition_info['partition'],
                                            ngpus=partition_info['num_gpus']):
                with remote_modules.singularity.singularity(self._tepui_connection,
                                                            _annotat3d_singularity_img_path,
                                                            mount={'/ibira': '/ibira'}):
                    logging.debug('run inference ...')
                    remote_modules.deepsirius.inference(self._tepui_connection,
                                                        model_file,
                                                        image_file,
                                                        output_folder,
                                                        border,
                                                        padding,
                                                        partition_info['num_gpus'],
                                                        ext=ext,
                                                        out_stream=log)
                    logging.debug('done ...')

        overall_bar.inc()

except Exception as e:
    error_dialog = QtWidgets.QErrorMessage()
    error_dialog.showMessage('Ops! We have an inference problem!')
    logging.debug('{}'.format(str(e)))
finally:
    image_bar.reset()
    overall_bar.reset()
    if self._inference_controller is not None:
        self._inference_controller.destroy()
        self._inference_controller = None


return run
"""
