import logging

import numpy as np
import sentry_sdk
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from sscAnnotat3D import utils
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscAnnotat3D.repository import data_repo, module_repo

from werkzeug.exceptions import BadRequest

app = Blueprint("pixel_segmentation_module", __name__)

__default_selected_features = (
    ['Intensity', 'Texture', 'Edges']
)
__default_selected_supervoxel_feat_pooling = (['mean'])

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


@app.route("/pixel_segmentation_module/create", methods=["POST", "GET"])
@cross_origin()
def create():
    img = data_repo.get_image("image")

    annotation_slice_dict = module_repo.get_module("annotation").get_annotation_slice_dict()
    added_labels = module_repo.get_module("annotation").added_labels

    if len(annotation_slice_dict) == 0:
        return handle_exception(
            "unable to preprocess!. Please, at least create one label and background annotation and try again the preprocess."
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
    print(__default_feature_extraction_params)
    print(feature_extraction_params)

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

def _convert_dtype_to_str(img_dtype: np.dtype):
    """
    Build-in function to convert dtype to a str

    Args:
        img_dtype (np.dtype): np.dtype object that contains

    Returns:
        (str): returns the str version of the dtype

    """
    return np.dtype(img_dtype).name



