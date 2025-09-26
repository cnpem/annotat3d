import logging

import numpy as np
import sentry_sdk
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from sscAnnotat3D import utils
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscAnnotat3D.modules.superpixel_segmentation_module import (
    SuperpixelSegmentationModule,
)
from sscAnnotat3D.repository import data_repo, module_repo
from sscPySpin import feature_extraction as spin_feat_extraction
from sscPySpin.segmentation import (
    SPINImageForest,
    spin_flood_fill,
    spin_watershed_on_labels,
)
from werkzeug.exceptions import BadRequest

# TODO : In this actual stage, we're forcing superpixel to be 32 int type

app = Blueprint("superpixel_segmentation_module", __name__)

__default_selected_features = (
    ['Intensity', 'Texture', 'Edges']
)
__default_selected_supervoxel_feat_pooling = (['mean'])

__default_feature_extraction_params = {
    "sigmas": (1, 2, 4, 8),
    "selected_features": __default_selected_features,
    "contextual_superpixel_feature_max_level": 0,
    "selected_supervoxel_feat_pooling": __default_selected_supervoxel_feat_pooling,
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

__default_pooling = [
    {"id": "min", "name": "Minimum", "active": False},
    {"id": "max", "name": "Maximum", "active": False},
    {"id": "mean", "name": "Mean", "active": True},
]


def _default_pooling_front(pooling: dict = None):
    """
    Build-in function that creates the front-end pooling

    Args:
        pooling (dict): a dict that contains the raw pooling

    Returns:
        None

    """
    # This loop resets the dict to make for easily to create the front-end component
    for pool in __default_pooling:
        pool["active"] = False

    for pooling_name in pooling["selected_supervoxel_feat_pooling"]:
        exit_loop = False
        i = 0
        default_pooling_name = len(__default_pooling)
        while i < default_pooling_name and not exit_loop:
            default_features = __default_pooling[i]

            if pooling_name == default_features["id"]:
                default_features["active"] = True
                exit_loop = True
                __default_pooling[i] = default_features

            i += 1

def _debugger_print(msg: str, payload: any):
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


def _convert_dtype_to_str(img_dtype: np.dtype):
    return np.dtype(img_dtype).name


def pooling_to_spin_pooling(pooling):
    if pooling.lower() == "mean":
        return spin_feat_extraction.SPINSupervoxelPooling.MEAN
    elif pooling.lower() == "max":
        return spin_feat_extraction.SPINSupervoxelPooling.MAX
    elif pooling.lower() == "min":
        return spin_feat_extraction.SPINSupervoxelPooling.MIN


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


@app.route("/superpixel_segmentation_module/create", methods=["POST", "GET"])
@cross_origin()
def create():
    """
    Function that creates the process on the image

    Notes:
        This function is used on preprocess on SuperpixelSegmentationModuleCard.tsx

    Returns:
        (str): returns a string "successes" if everything goes well and an error otherwise

    """
    img = data_repo.get_image("image")
    img_superpixel = data_repo.get_image("superpixel")

    annotation_slice_dict = module_repo.get_module("annotation").get_annotation_slice_dict()
    added_labels = module_repo.get_module("annotation").added_labels

    if len(annotation_slice_dict) == 0:
        return handle_exception(
            "unable to apply!. Please, at least create one label and background annotation and try again the preprocess."
        )

    if _convert_dtype_to_str(img_superpixel.dtype) != "int32":
        img_superpixel = img_superpixel.astype("int32")

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
        return handle_exception("error trying to get the request in /superpixel_segmentation_module/create")

    logging.debug("feature_extraction_params: {}".format(feature_extraction_params["selected_features"]))

    logging.debug('__default_feature_extraction_params"{}'.format(__default_feature_extraction_params))
    logging.debug("feature_extraction_params: {}".format(feature_extraction_params))
    logging.debug("classifier_params: {}".format(classifier_params))
    logging.debug("feature_extraction_params: {}".format(feature_extraction_params))
    logging.debug("classifier_params: {}".format(classifier_params))

    if img is None or img_superpixel is None:
        return handle_exception("Needs a valid image and superpixel to create module.")

    segm_module = SuperpixelSegmentationModule(img, img_superpixel)

    full_feat_extraction_params = {**__default_feature_extraction_params, **feature_extraction_params}

    logging.debug("full")
    logging.debug("full_feat_extraction_params: {}".format(full_feat_extraction_params))

    segm_module.set_feature_extraction_parameters(**full_feat_extraction_params)

    full_classifier_params = {**__default_classifier_params, **classifier_params}
    segm_module.set_classifier_parameters(**full_classifier_params)

    module_repo.set_module("superpixel_segmentation_module", segm_module)

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
