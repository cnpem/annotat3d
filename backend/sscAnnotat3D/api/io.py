import glob
import time
import logging
import os.path
import os
import sscIO.io
import numpy as np

from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
from flask_cors import cross_origin

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D.deeplearning import DeepLearningWorkspaceDialog
from sscDeepsirius.utils.dataset import create_dataset_web
from sscDeepsirius.utils.augmentation import augment_web
from sscDeepsirius.utils import dataset

app = Blueprint('io', __name__)


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


@app.route("/open_files_dataset/<file_id>", methods=["POST"])
@cross_origin()
def open_files_dataset(file_id: str):
    """
    Function used to open files in dataset menu

    Notes:
        This function is used to read files in SamplingComp.tsx

    Args:
        file_id (str): string used to load a file based on this id

    Returns:
        (dict): This function returns a dict that contains information about the loaded file

    """
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
            image, info = sscIO.io.read_volume(file_path, 'numpy')
            end = time.process_time()
            error_msg = "No such file or directory {}".format(file_path)

            if (_convert_dtype_to_str(image.dtype) != file_dtype and (file_id == "image" or file_id == "label")):
                image = image.astype(file_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            start = time.process_time()
            image, info = sscIO.io.read_volume(file_path, 'numpy',
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

    if (file_id.split("-")[0] == "data"):
        data_repo.set_dataset_data(key=file_id, data=image)

    elif (file_id.split("-")[0] == "label"):
        data_repo.set_dataset_label(key=file_id, label=image)

    elif (file_id.split("-")[0] == "weight"):
        data_repo.set_dataset_weight(key=file_id, weight=image)

    else:
        return handle_exception("invalid option \"{}\" to feed the back-end".format(file_id))

    return jsonify(image_info)


@app.route("/close_files_dataset/<file_id>", methods=["POST"])
@cross_origin()
def close_files_dataset(file_id: str):
    """
    Function that close a file in dataset menu using an id as reference

     Notes:
        This function is used to read files in SamplingComp.tsx

    Args:
        file_id (str): an id used to delete the image

    Examples:
        the id received is always data-n, label-n or weight-n

    Returns:
        (str): returns a string "success on delete the key data-n\ label-n\ weight-n on data repository" on success and "data-n\ label-n\ weight-n is an invalid key to get the data from repository" otherwise.

    """
    if (file_id.split("-")[0] == "data"):
        try:
            data_repo.delete_dataset_data(key=file_id)
            return jsonify("success on delete the key {} on data repository".format(file_id))
        except:
            return handle_exception("{} is an invalid key to get the data from repository".format(file_id))

    elif (file_id.split("-")[0] == "label"):
        try:
            data_repo.delete_dataset_label(key=file_id)
            return jsonify("success on delete the key {} on label repository".format(file_id))
        except:
            return handle_exception("{} is an invalid key to get the label from repository".format(file_id))

    elif (file_id.split("-")[0] == "weight"):
        try:
            data_repo.delete_dataset_weight(key=file_id)
            return jsonify("success on delete the key {} on weight repository".format(file_id))
        except:
            return handle_exception("{} is an invalid key to get the weight from repository".format(file_id))

    else:
        return handle_exception("{} is an invalid key".format(file_id))


@app.route("/close_all_files_dataset/<file_id>", methods=["POST"])
@cross_origin()
def close_all_files_dataset(file_id: str):
    """
        Function that close all files in dataset menu using an id as reference

         Notes:
            This function is used to read files in SamplingComp.tsx

        Args:
            file_id (str): an id used to delete all the images

        Examples:
            the id received is always data, label or weight

        Returns:
            (str): returns a string "success on delete all the keys from data\ label\ weight dataset" on success and "data\ label\ weight is an invalid key to delete the data from repository" otherwise.

        """
    if (file_id.split("-")[0] == "data"):
        try:
            data_repo.delete_all_dataset_data()
            return jsonify("success on delete all the keys from {} dataset".format(file_id))
        except:
            return handle_exception("{} is an invalid key to delete the data from repository".format(file_id))

    elif (file_id.split("-")[0] == "label"):
        try:
            data_repo.delete_all_dataset_label()
            return jsonify("success on delete all the keys from {} dataset".format(file_id))
        except:
            return handle_exception("{} is an invalid key to delete the label from repository".format(file_id))

    elif (file_id.split("-")[0] == "weight"):
        try:
            data_repo.delete_all_dataset_weight()
            return jsonify("success on delete all the keys from {} dataset".format(file_id))
        except:
            return handle_exception("{} is an invalid key to delete the weight from repository".format(file_id))

    else:
        return handle_exception("{} is an invalid key".format(file_id))


@app.route("/open_image/<image_id>", methods=["POST"])
@cross_origin()
def open_image(image_id: str):
    """
    Function used to open images, superpixel images or label images

    Notes:
        This function is used on FileLoadDialog.tsx

    Args:
        image_id (str): string that can be "image", "label" or "superpixel" used as key to load this images

    Returns:
        (dict): This function returns a dict that contains information about the loaded file

    """

    try:
        image_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    file = image_path.split("/")[-1]
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
            image, info = sscIO.io.read_volume(image_path, 'numpy')
            error_msg = "No such file or directory {}".format(image_path)

            if (_convert_dtype_to_str(image.dtype) != image_dtype and (image_id == "image" or image_id == "label")):
                image = image.astype(image_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            image, info = sscIO.io.read_volume(image_path, 'numpy',
                                               shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]),
                                               dtype=image_dtype)

            error_msg = "Unable to reshape the volume {} into shape {} and type {}. " \
                        "Please change the dtype and shape and load the image again".format(file, request.json[
                "image_raw_shape"],
                                                                                            image_dtype)
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(image.dtype)
    except:
        return handle_exception(error_msg)

    data_repo.set_image(key=image_id, data=image)

    image_info = {"imageShape": {'x': image_shape[2], 'y': image_shape[1], 'z': image_shape[0]}, "imageExt": extension,
                  "imageName": file_name, "imageDtype": image_dtype, "imageFullPath": image_path}

    if image_id == 'image':
        data_repo.set_info(data=image_info)

    return jsonify(image_info)


@app.route("/close_image/<image_id>", methods=["POST"])
@cross_origin()
def close_image(image_id: str):
    """
    Function used to close a file based on the id of the callout.

    Args:
        image_id (str): string that can be "image", "label" or "superpixel" used as key to close this images

    Returns:
        (str): Returns a string "success on deleting the image !" if the image was deleted and "failure trying to delete the image" otherwise

    """

    try:
        data_repo.delete_image(key=image_id)
    except:
        return handle_exception("failure trying to delete the image")

    return "success on deleting the image !", 200


@app.route("/save_image/<image_id>", methods=["POST"])
@cross_origin()
def save_image(image_id: str):
    """
    Function used to save an image, a superpixel or a label

    Notes:
        This function is used on FileSaveDialog.tsx

    Args:
        image_id (str): string that can be "image", "label" or "superpixel" used as key to save this images

    Returns:
        (dict): This function returns a dict that contains information about the loaded file

    """

    try:
        image_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    image = data_repo.get_image(key=image_id)

    if (image.size == 0):
        return handle_exception("Unable to retrieve the image !")

    save_status = sscIO.io.save_volume(image_path, image_dtype, image)

    if (save_status["error_msg"] != ""):
        return handle_exception(save_status["error_msg"])

    image_shape = image.shape
    image_info = {"imageShape": {'x': image_shape[2], 'y': image_shape[1], 'z': image_shape[0]},
                  "imageExt": save_status["extension"],
                  "imageName": save_status["file_name"], "imageDtype": image_dtype}

    return jsonify(image_info)


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
    except Exception as e:
        return handle_exception(str(e))

    if (workspace_path == ""):
        return handle_exception("Empty path isn't valid !")

    deep_model = DeepLearningWorkspaceDialog()
    save_status, error_desc = deep_model.open_new_workspace(workspace_path)

    if (save_status):
        data_repo.set_deep_model(data={"deep_model_path": workspace_path})
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
        data_repo.set_deep_model(data={"deep_model_path": workspace_path})
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

    data, error_status = create_dataset_web(imgs, labels, weights,
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
        data, error_status = augment_web(output, initial_output, augmenter_params, data)

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
            image, info = sscIO.io.read_volume(file_path, 'numpy')
            end = time.process_time()
            error_msg = "No such file or directory {}".format(file_path)

            if (_convert_dtype_to_str(image.dtype) != file_dtype and (file_id == "image" or file_id == "label")):
                image = image.astype(file_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            start = time.process_time()
            image, info = sscIO.io.read_volume(file_path, 'numpy',
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
