import logging

import numpy as np
import sentry_sdk
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from sscAnnotat3D import utils
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscAnnotat3D.repository import data_repo, module_repo
from sscPySpin import feature_extraction as spin_feat_extraction
from sscPySpin.segmentation import (
    SPINImageForest,
    spin_flood_fill,
    spin_watershed_on_labels,
)
from werkzeug.exceptions import BadRequest

app = Blueprint("pixel_segmentation_module", __name__)

__default_selected_features = (
    spin_feat_extraction.SPINFilters.NONE,
    spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GAUSS,
    spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_DIFF_OF_GAUSS,
    spin_feat_extraction.SPINFilters.MEMBRANE_PROJECTIONS,
)
__default_selected_supervoxel_feat_pooling = (spin_feat_extraction.SPINSupervoxelPooling.MEAN,)

__default_feature_extraction_params = {
    "sigmas": (1, 2, 4, 8),
    "selected_features": __default_selected_features,
    "feat_selection_enabled": True,
    "feat_selection_clf_n_estimators": 50,
    "feat_selection_method_threshold": 0.01,
}

__default_classifier_params = {
    "classifier_type": "rf",
    "grid_search": False,
    "rf_n_estimators": 200,
    "svm_C": 1.0,
    "mlp_hidden_layer_sizes": (100, 10),
    "knn_n_neighbors": 5,
    "adaboost_n_estimators": 200,
}

__default_features_front = [
    {
        "active": False,
        "id": "fft_gauss",
        "name": "FFT Gauss",
        "type": "Smoothing",
        "description": "Filters structures (smoothing) of the specified gaussian filtering in fourier space. Promotes smoothing without worrying about edges.",
    },
    {
        "active": False,
        "id": "average",
        "name": "Average",
        "type": "Smoothing",
        "description": 'It is a method of "smoothing" images by reducing the amount of intensity variation inside a window (Noise removal)',
    },
    {
        "active": False,
        "id": "median",
        "name": "Median",
        "type": "Smoothing",
        "description": "It makes the target pixel intensity equal to the median value in the running window (Noise removal)",
    },
    {
        "active": False,
        "id": "sobel",
        "name": "Sobel",
        "type": "Edge detection",
        "description": "It creates an image emphasizing edges because it performs a 2-D spatial gradient measurement on an image and so emphasizes regions of high spatial frequency that correspond to edges.",
    },
    {
        "active": False,
        "id": "fft_dog",
        "name": "FFT Difference Of Gaussians",
        "type": "Edge detection",
        "description": "Calculates two gaussian blur images from the original image and subtracts one from the other. It is used to detect edges in the image.",
    },
    {
        "active": False,
        "id": "fft_gabor",
        "name": "FFT Gabor",
        "type": "Edge detection,Texture detection",
        "description": "It determines if there is any specific frequency content in the image in specific directions in a localized region around the point or region of analysis. In the spatial domain, it is a Gaussian kernel function modulated by a sinusoidal plane wave. It is one of the most suitable option for texture segmentation and boundary detection",
    },
    {
        "active": False,
        "id": "variance",
        "name": "Variance",
        "type": "Texture detection",
        "description": "It is a statistical measure of the amount of variation inside the window. This determines how uniform or not that filtering window is (important for assessing homogeneity and texture)",
    },
    {
        "active": False,
        "id": "lbp",
        "name": "Local Binary Pattern",
        "type": "Texture detection",
        "description": "It is a texture operator that tries to capture how are the neighborhoods allocated. It labels the pixels of an image by thresholding the neighborhood of each pixel and considers the result as a binary number.",
    },
    {
        "active": False,
        "id": "membrane_projections",
        "name": "Membrane Projections",
        "type": "Membrane Detection",
        "description": "Enhances membrane-like structures of the image through directional filtering.",
    },
    {
        "active": False,
        "id": "minimum",
        "name": "Minimum",
        "type": "Color Identification",
        "description": "It replaces the value of the pixel with the value of the darkest pixel inside the filtering window",
    },
    {
        "active": False,
        "id": "maximum",
        "name": "Maximum",
        "type": "Color Identification",
        "description": "It replaces the value of the pixel with the value of the lightest pixel inside the filtering window",
    },
    {
        "active": False,
        "id": "none",
        "name": "None (Original Image)",
        "type": "Identity",
        "description": "Used to guarantee the preservation of some characteristics of the original image.",
    },
]


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


def _default_features_front(features: dict = None):
    """
    Build-in function that creates the front-end features

    Args:
        features (dict): a dict that contains the raw features

    Returns:
        None

    """
    # This loop resets the dict to make for easily to create the front-end component
    for default_feature_front in __default_features_front:
        default_feature_front["active"] = False

    for feature_name in features["selected_features"]:
        exit_loop = False
        i = 0
        default_features_len = len(__default_features_front)
        while i < default_features_len and not exit_loop:
            default_features = __default_features_front[i]

            if feature_name == default_features["id"]:
                default_features["active"] = True
                exit_loop = True
                __default_features_front[i] = default_features

            i += 1


def _default_classifier_front(classifier_dict: dict = None):
    """
    Build-in function that creates the front-end classifier

    Args:
        classifier_dict (dict): a dict that contains the raw pooling

    Returns:
        (dict): returns a dict with the correct front-end template

    """
    if classifier_dict["classifier_type"] == "rf":
        return [
            {
                "id": "rf_n_estimators",
                "label": "Random Forest N. Trees",
                "value": classifier_dict["rf_n_estimators"],
                "input": "number",
            }
        ]

    elif classifier_dict["classifier_type"] == "svm":
        return [{"id": "svm_C", "label": "SVM C", "value": classifier_dict["svm_C"], "input": "number"}]

    elif classifier_dict["classifier_type"] == "mlp":
        return [
            {
                "id": "mlp_hidden_layer_sizes",
                "label": "N. hidden Neurons",
                "value": [*classifier_dict["mlp_hidden_layer_sizes"]],
                "input": "text",
            }
        ]

    elif classifier_dict["classifier_type"] == "adaboost":
        return [
            {
                "id": "adaboost_n_estimators",
                "label": "N. classifiers",
                "value": classifier_dict["adaboost_n_estimators"],
                "input": "number",
            }
        ]

    elif classifier_dict["classifier_type"] == "knn":
        return [
            {
                "id": "knn_n_neighbors",
                "label": "N. neighbors",
                "value": classifier_dict["knn_n_neighbors"],
                "input": "number",
            }
        ]

    return [{}]


def _debugger_print(msg: str, payload: any):
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


def features_to_spin_features(feature):
    if feature.lower() == "fft_gauss":
        return spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GAUSS
    elif feature.lower() == "fft_gabor":
        return spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GABOR
    elif feature.lower() == "none":
        return spin_feat_extraction.SPINFilters.NONE
    elif feature.lower() == "fft_dog":
        return spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_DIFF_OF_GAUSS
    elif feature.lower() == "sobel":
        return spin_feat_extraction.SPINFilters.SOBEL
    elif feature.lower() == "membrane_projections":
        return spin_feat_extraction.SPINFilters.MEMBRANE_PROJECTIONS
    elif feature.lower() == "minimum":
        return spin_feat_extraction.SPINFilters.ADJ_MIN
    elif feature.lower() == "maximum":
        return spin_feat_extraction.SPINFilters.ADJ_MAX
    elif feature.lower() == "average":
        return spin_feat_extraction.SPINFilters.ADJ_AVERAGE
    elif feature.lower() == "variance":
        return spin_feat_extraction.SPINFilters.ADJ_VARIANCE
    elif feature.lower() == "median":
        return spin_feat_extraction.SPINFilters.ADJ_MEDIAN
    elif feature.lower() == "lbp":
        return spin_feat_extraction.SPINFilters.LBP
    else:
        raise f"Unknown feature: {feature.lower()}"


@app.route("/pixel_segmentation_module/create", methods=["POST", "GET"])
@cross_origin()
def create():
    img = data_repo.get_image("image")

    annotations = module_repo.get_module("annotation").annotation
    if annotations == {}:
        return handle_exception(
            "unable to apply!. Please, at least create one label and background annotation and try again the preprocess."
        )

    unique_ids = set()
    for key, value in annotations.items():
        unique_ids.add(value[-1])

    if len(unique_ids) <= 1:
        return handle_exception(
            "unable to preview!. Please, at least create one label and background annotation and try again the preprocess."
        )

    try:
        feature_extraction_params = request.json["feature_extraction_params"]
        data_repo.set_feature_extraction_params(key="feature_extraction_params", data=feature_extraction_params.copy())

        classifier_params = request.json["classifier_params"]
        classifier_values = request.json["classifier_values"]
        if isinstance(classifier_values["value"], str):
            value = eval(classifier_values["value"])
        elif isinstance(classifier_values["value"], list):
            value = (*classifier_values["value"],)
        else:
            value = classifier_values["value"]

        classifier_params[classifier_values["id"]] = value
    except:
        return handle_exception("error trying to get the request in /pixel_segmentation_module/create")

    print(feature_extraction_params["selected_features"])
    if "selected_features" in feature_extraction_params:
        feature_extraction_params["selected_features"] = [
            features_to_spin_features(f) for f in feature_extraction_params["selected_features"]
        ]

    print(__default_feature_extraction_params)
    print(feature_extraction_params)
    print(classifier_params)
    available = spin_feat_extraction.SPINFilters.available_filters()

    print(available)

    print(feature_extraction_params)
    print(classifier_params)

    if img is None:
        return handle_exception("Needs a valid image to create module.")

    segm_module = PixelSegmentationModule(img)

    full_feat_extraction_params = {**__default_feature_extraction_params, **feature_extraction_params}

    print("full")
    print(full_feat_extraction_params)

    segm_module.set_feature_extraction_parameters(**full_feat_extraction_params)

    full_classifier_params = {**__default_classifier_params, **classifier_params}
    segm_module.set_classifier_parameters(**full_classifier_params)

    module_repo.set_module("pixel_segmentation_module", segm_module)

    if segm_module.has_preprocess():
        segm_module.preprocess()

    return "success", 200


@app.route("/pixel_segmentation_module/preprocess", methods=["POST"])
@cross_origin()
def preprocess():
    segm_module = module_repo.get_module(key="pixel_segmentation_module")
    segm_module.preprocess()

    return "success", 200


def _merge_label(label_merging_scribbles: dict, img_label: np.ndarray, segm_module: object):
    """
    Build-in function that makes the merge of labels

    Notes:
        TODO : Need to implement a better way to merge the labels

    Args:
        label_merging_scribbles (dict): dict of annotations to merge
        img_label (np.ndarray): label imagem
        segm_module (object): classifier object that will merge this labels

    Returns:
        (np.ndarray): returns the new label image

    """

    label = np.empty(img_label.shape, dtype="int32")
    label[...] = img_label

    # all points that not are background
    coords = [coord for coord in label_merging_scribbles.keys() if label[coord] > 0]
    mk_lb = next(iter(label_merging_scribbles.values()))[0]
    spin_flood_fill(label, coords, mk_lb)

    segm_module.reset_classifier()
    return label


def _convert_dtype_to_str(img_dtype: np.dtype):
    """
    Build-in function to convert dtype to a str

    Args:
        img_dtype (np.dtype): np.dtype object that contains

    Returns:
        (str): returns the str version of the dtype

    """
    return np.dtype(img_dtype).name


def _split_label(labels_to_split: dict, user_annotations: dict, label_img: np.ndarray):
    """
    Build-in function that split labels

    Args:
        labels_to_split(dict): dict that contains the annotations to split
        user_annotations(dict): dict that contains all the annotations
        label_img (np.ndarray): label image

    Returns:
        (np.ndarray): returns the new label image

    """
    label_splitting_annotations = {k: v for k, v in user_annotations.items() if label_img[k] in labels_to_split}

    img = data_repo.get_image("image")

    if img is None:
        return None

    if _convert_dtype_to_str(img_dtype=img.dtype) != "int32":
        img = img.astype(np.int32)

    forest = SPINImageForest(img, radius=1.0, cost_dtype="float32")
    label_split = np.full(forest.img.shape, -1, dtype="int32")

    logging.debug("run watershed ...")
    with sentry_sdk.start_span(op="label split"):
        spin_watershed_on_labels(
            forest.img, forest.label, label_split, label_splitting_annotations, radius=1.0, conquer_background=True
        )
        logging.debug("watershed done.")

    return forest.label


@app.route("/pixel_segmentation_module/preview", methods=["POST"])
@cross_origin()
def preview():
    segm_module = module_repo.get_module(key="pixel_segmentation_module")

    annotations = module_repo.get_module("annotation").annotation
    if annotations == {}:
        return handle_exception(
            "unable to preview!. Please, at least create one label and background annotation and try again the preprocess."
        )

    # TODO: refactor all the superpixel and pixel segmentation modules to the new annotation dict, not the previous one
    annotation_dict = {}
    for key, value in annotations.items():
        if value[-1] != -1:
            annotation_dict[key] = (value[-1], 1)
            annotations = annotation_dict

    annotations = annotation_dict

    slice_num = request.json["slice"]
    axis = request.json["axis"]

    axis_dim = utils.get_axis_num(axis)

    if segm_module is None:
        return "Not a valid segmentation module", 400

    if not segm_module.has_preview():
        return "This module does not have a preview", 400

    try:
        label, selected_features_names = segm_module.preview(annotations, [slice_num], axis_dim)
    except Exception as e:
        unique_ids = set()
        for key, value in annotations.items():
            unique_ids.add(value)
        if len(unique_ids) <= 1:
            return handle_exception(
                "unable to preview!. Please, at least create one label and background annotation and try again the preprocess."
            )
        return handle_exception("unable to preview! {}".format(str(e)))

    data_repo.set_image("label", label)

    return jsonify({"selected_features_names": selected_features_names}), 200


@app.route("/pixel_segmentation_module/execute", methods=["POST"])
@cross_origin()
def execute():
    segm_module = module_repo.get_module(key="pixel_segmentation_module")

    annotations = module_repo.get_module("annotation").annotation
    if annotations == {}:
        return handle_exception(
            "unable to apply!. Please, at least create one label and background annotation and try again the preprocess."
        )

    if segm_module is None:
        return "Not a valid segmentation module", 400

    # TODO: refactor all the superpixel and pixel segmentation modules to the new annotation dict, not the previous one
    annotation_dict = {}
    for key, value in annotations.items():
        if value[-1] != -1:
            annotation_dict[key] = (value[-1], 1)
            annotations = annotation_dict

    annotations = annotation_dict

    try:
        label, selected_features_names = segm_module.execute(annotations)
    except Exception as e:
        unique_ids = set()
        for key, value in annotations.items():
            unique_ids.add(value)
        if len(unique_ids) <= 1:
            return handle_exception(
                "unable to execute!. Please, at least create one label and background annotation and try again the preprocess."
            )
        return handle_exception("unable to execute! {}".format(str(e)))

    data_repo.set_image("label", label)

    return jsonify({"selected_features_names": selected_features_names}), 200


@app.route("/save_classifier_pixel", methods=["POST"])
@cross_origin()
def save_classifier_pixel():
    """
    Function that saves the classifier in a .model file

    Notes:
        This function is used in FileSaveDialog.tsx

    Returns:
        (str): returns a string "successes" if everything goes well and an error otherwise

    """
    try:
        path = request.json["classificationPath"]
    except Exception as e:
        return handle_exception(str(e))

    try:
        segm_module = module_repo.get_module(key="pixel_segmentation_module")
    except Exception as e:
        return handle_exception(
            "Unable to get save the classifier !. Please, run again the preprocess and apply in Pixel Segmentation menu and try again this operation"
        )

    if segm_module is None:
        return handle_exception("Please, load a classifier first !")

    try:
        superpixel_state = data_repo.get_superpixel_state()
        superpixel_state["use_pixel_segmentation"] = True
    except:
        return handle_exception("Unable to get superpixel_state")

    try:
        feature_extraction_params = data_repo.get_feature_extraction_params("feature_extraction_params")
    except Exception as e:
        return handle_exception(str(e))

    resp, msg, model_complete = segm_module.save_classifier(path, superpixel_state, feature_extraction_params)

    if not resp:
        return handle_exception(msg)

    data_repo.set_classification_model("model_complete", model_complete)

    return jsonify("successes")
