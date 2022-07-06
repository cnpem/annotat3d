import time
import logging
import os.path
import os
import sscIO.io
import numpy as np

from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
from flask_cors import cross_origin
from imgaug import augmenters as iaa

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D.deeplearning import DeepLearningWorkspaceDialog
from sscDeepsirius.utils import augmentation, dataset, sampling, image

# from backend.sscDeepsiriusLocal.deepsirius.utils import augmentation, dataset, sampling, image -> local files
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

    image_info = {"imageShape": image_shape, "imageExt": extension,
                  "imageName": file_name, "imageDtype": image_dtype}
    data_repo.set_image(key=image_id, data=image)
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
    image_info = {"imageShape": image_shape, "imageExt": save_status["extension"],
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


def elastic_augmenter(params=None):
    if params is None:
        params = {}
    alpha = params.get('alpha', (25.0, 50.0))
    sigma = params.get('sigma', [4.0, 6.0])
    return iaa.ElasticTransformation(alpha=alpha, name='elastic', sigma=sigma, mode='reflect').to_deterministic()


def fliph_augmenter(params=None):
    del params
    return iaa.Fliplr(1.0, name='flip_horizontal').to_deterministic()


def flipv_augmenter(params=None):
    del params
    return iaa.Flipud(1.0, name='flip_vertical').to_deterministic()


def contrast_augmenter(params=None):
    if params is None:
        params = {}
    contrast = params.get('contrast', (0.1, 1.9))
    return iaa.GammaContrast(contrast, name='contrast').to_deterministic()


def gaussian_augmenter(params=None):
    if params is None:
        params = {}
    sigma = params.get('sigma', (0.25, 1.0))
    return iaa.GaussianBlur(sigma=sigma, name='gaussian_blur').to_deterministic()


def average_augmenter(params=None):
    if params is None:
        params = {}
    k = params.get('k', (1, 2))
    return iaa.AverageBlur(k=k, name='average_blur').to_deterministic()


def rot90_augmenter(params=None):
    del params
    return iaa.Rot90(1, name='rot90').to_deterministic()


def rot270_augmenter(params=None):
    del params
    return iaa.Rot90(3, name='rot270').to_deterministic()


def linearContrast_augmenter(params=None):
    if params is None:
        params = {}
    linearContrast = params.get('linearContrast', (0.4, 1.6))
    return iaa.LinearContrast(linearContrast, name='linearContrast').to_deterministic()


def dropout_augmenter(params=None):
    if params is None:
        params = {}
    dropout = params.get('dropout', (0, 0.2))
    if (dropout[0] == dropout[1]):
        dropout = (dropout[0], dropout[0] + 0.001)
    return iaa.Dropout(p=dropout, name='dropout').to_deterministic()


def poisson_augmenter(params=None):
    if params is None:
        params = {}
    scale = params.get('scale', (1, 2))
    return iaa.AdditivePoissonNoise(scale, name='poisson_noise').to_deterministic()


def _augm_constructors():
    _constructors = {
        'elastic': elastic_augmenter,
        'flip_horizontal': fliph_augmenter,
        'flip_vertical': flipv_augmenter,
        'gaussian_blur': gaussian_augmenter,
        'contrast': contrast_augmenter,
        'average_blur': average_augmenter,
        'rot90': rot90_augmenter,
        'rot270': rot270_augmenter,
        'linearContrast': linearContrast_augmenter,
        'dropout': dropout_augmenter,
        'poisson_noise': poisson_augmenter
    }
    return _constructors


# TODO : change to z, y, x pattern everywhere ...
def _create_dataset(imgs: list, labels: list, weights: list,
                    output: str, nsamples: int, num_classes: int, size: tuple,
                    offset: tuple):
    logging.debug('uniform ...')
    logging.debug(imgs)
    logging.debug(labels)
    logging.debug(weights)

    weights = [None] * len(imgs)
    imgs_props = [{}] * len(imgs)
    labels_props = [{}] * len(labels)
    weights_props = [{}] * len(weights)

    logging.debug('imgs')
    logging.debug(imgs)
    logging.debug(labels)
    logging.debug(weights)

    logging.debug('props ....')
    logging.debug(imgs_props)
    logging.debug(labels_props)
    logging.debug(weights_props)

    if (not len(imgs) == len(labels) == len(weights) == len(imgs_props) == len(labels_props) == len(weights_props)):
        return [], handle_exception(
            "Number of image and labels mismatch.\n {} data images, {} label images, and {} weight images.".format(
                len(imgs), len(labels), len(weights)))

    try:
        data = dataset.create_dataset(output, len(imgs), nsamples, size, num_classes=num_classes,
                                      weight=(weights is not None))
    except Exception as e:
        return [], handle_exception(str(e))

    zz = list(zip(imgs, labels, weights,
                  imgs_props, labels_props, weights_props))

    logging.debug(zz)
    logging.debug(len(zz))

    i = 0
    for img_file, label_file, weight_file, \
        img_props, label_props, weight_props in zip(imgs, labels, weights,
                                                    imgs_props, labels_props, weights_props):

        logging.debug('img_file:', img_file, img_props)
        logging.debug('label_file:', label_file, label_props)
        img = img_file
        label = label_file
        weight = weight_file
        logging.debug('img: ', img)
        logging.debug('label: ', label)

        if (img.shape != label.shape):
            return [], handle_exception(
                "Image dimensions mismatch.\n{} -> {}\n{} -> {}\n".format(
                    img_file, img.shape, label_file, label.shape))
        lmin, lmax = label.min(), label.max()

        if (lmin != 0 or lmax > num_classes - 1):
            return [], handle_exception(
                "Invalid label values. Labels in the range [{},{}]. Check if the image is correct or set the num_classes={}.".format(
                    lmin, lmax, lmax + 1))

        img_samples, coords = sampling.uniform_samples(image.zyx_to_xyz(img), size, nsamples, offset)
        label_samples = sampling.get_samples(image.zyx_to_xyz(label), size, coords)

        data['data'][i, ...] = img_samples
        data['label'][i, ...] = label_samples

        if weight is not None:
            weight_samples = sampling.get_samples(image.zyx_to_xyz(weight), size, coords)
            data['weight'][i, ...] = weight_samples
        i += 1

    try:
        dataset.save_dataset(data)
    except Exception as e:
        return [], handle_exception(str(e))

    return data, ""


@app.route("/set_augment_ion_range", methods=["POST"])
@cross_origin()
def set_augment_ion_range():
    try:
        ion_range_id = request.json["ionRangeId"]
        ion_name_menu = request.json["ionNameMenu"]
        ion_range_name = request.json["ionRangeName"]
        actual_range_val = request.json["actualRangeVal"]
    except Exception as e:
        return handle_exception(str(e))

    new_data = {
        "ionNameMenu": ion_name_menu + "-" + ion_range_name,
        "actualRangeVal": {"lower": actual_range_val["lower"], "upper": actual_range_val["upper"]}}
    data_repo.set_augment_ion_range(ion_range_id, new_data)

    return jsonify("success on the dispatch")


@app.route("/set_augment_list", methods=["POST"])
@cross_origin()
def set_augment_list():
    try:
        checked_op = request.json["checked_element"]
    except Exception as e:
        return handle_exception(str(e))

    _debugger_print("Checked_op", checked_op)
    new_augment_elem = dict({checked_op["checkedId"]: {"augmentationOption": checked_op["augmentationOption"],
                                                       "isChecked": checked_op["isChecked"]}})
    data_repo.set_augmentation_options(checked_op["checkedId"], new_augment_elem)
    return jsonify({
        "checkedId": checked_op["checkedId"],
        "augmentationOption": checked_op["augmentationOption"],
        "isChecked": checked_op["isChecked"]})


@app.route("/create_dataset", methods=["POST"])
@cross_origin()
# TODO : need to implement the documentation
# TODO : need to implement the augmentation option into the dataset. For this, x can look into the file https://gitlab.cnpem.br/GCC/segmentation/Annotat3D/-/blob/master/sscAnnotat3D/deeplearning/deeplearning_dataset_dialog.py line 479
# TODO : don't forget to look in this link
# https://gitlab.cnpem.br/GCC/segmentation/Annotat3D/-/blob/master/sscAnnotat3D/deeplearning/deeplearning_dataset_dialog.py
# TODO : for the augmentation menu. I'll see .augment from tis script
def create_dataset():
    try:
        output = request.json["file_path"]
        sample = request.json["sample"]
        augmentation_vec = request.json["augmentation"]
    except Exception as e:
        return handle_exception(str(e))

    size = (sample["patchSize"][0], sample["patchSize"][1], sample["patchSize"][2])
    num_classes = sample["nClasses"]
    nsamples = sample["sampleSize"]
    offset = (0, 0, 0)
    _debugger_print("augmentation_vec", augmentation_vec)
    _debugger_print("augmentation_vec type", type(augmentation_vec))

    isChecked_vec = [isChecked_vec["isChecked"] for isChecked_vec in augmentation_vec]
    _debugger_print("isChecked_vec", isChecked_vec)
    checked_index = [i for i, val in enumerate(isChecked_vec) if val]
    _debugger_print("checked_index", checked_index)
    logging.debug('size = {}, nsamples = {}'.format(size, sample["sampleSize"]))

    imgs = list(data_repo.get_all_dataset_data().values())
    labels = list(data_repo.get_all_dataset_label().values())
    weights = list(data_repo.get_all_dataset_weight().values())

    data, error_status = _create_dataset(imgs, labels, weights,
                                         output, nsamples, num_classes,
                                         size, offset)

    test = []
    for x in checked_index:
        print("augmentation option : {}".format(x))
        test.append(x)

    _debugger_print("Checked option", test)

    try:
        augmentation.augment(output, output, test)
    except Exception as e:
        _debugger_print("Eita, deu caô :(", "F")
        _debugger_print("Error : ", str(e))
        return handle_exception(str(e))

    if (not data):
        return error_status

    return jsonify({"datasetFilename": output.split("/")[-1]})


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

    return jsonify(image_info)


@app.route("/close_inference_file/<file_id>", methods=["POST"])
@cross_origin()
def close_inference_file(file_id: str):
    _debugger_print("delete key", file_id)
    try:
        data_repo.del_inference_data(file_id)
        return jsonify("success on delete the key {} in Input Image inference".format(file_id))
    except Exception as e:
        return handle_exception(str(e))


@app.route("/close_all_files_dataset", methods=["POST"])
@cross_origin()
def close_all_inference_files():
    try:
        data_repo.del_all_inference_data()
        return jsonify("Success to delete all data")
    except Exception as e:
        return handle_exception(str(e))
