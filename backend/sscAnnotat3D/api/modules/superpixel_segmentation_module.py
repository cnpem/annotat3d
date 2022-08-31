import numpy as np

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest

from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D.modules.superpixel_segmentation_module import SuperpixelSegmentationModule
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscPySpin import feature_extraction as spin_feat_extraction
from sscPySpin.segmentation import spin_flood_fill, SPINImageForest

# TODO : We need to template sscIO for other superpixel types
# TODO : In this actual stage, we're forcing superpixel to be 32 int type

app = Blueprint('superpixel_segmentation_module', __name__)

__default_selected_features = (spin_feat_extraction.SPINFilters.NONE,
                               spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GAUSS,
                               spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_DIFF_OF_GAUSS,
                               spin_feat_extraction.SPINFilters.MEMBRANE_PROJECTIONS)
__default_selected_supervoxel_feat_pooling = (spin_feat_extraction.SPINSupervoxelPooling.MEAN,)

__default_feature_extraction_params = {
    'sigmas': (1, 2, 4, 8),
    'selected_features': __default_selected_features,
    'contextual_superpixel_feature_max_level': 0,
    'selected_supervoxel_feat_pooling': __default_selected_supervoxel_feat_pooling,
    'feat_selection_enabled': True,
    'feat_selection_clf_n_estimators': 50,
    'feat_selection_method_threshold': 0.01
}

__default_classifier_params = {
    'classifier_type': 'rf',
    'grid_search': False,
    'rf_n_estimators': 200,
    'svm_C': 1.0,
    'mlp_hidden_layer_sizes': (100, 10),
    'knn_n_neighbors': 5,
    'adaboost_n_estimators': 200
}

__default_features_front = [
    {
        "active": False,
        "id": 'fft_gauss',
        "name": 'FFT Gauss',
        "type": 'Smoothing',
        "description": 'Filters structures (smoothing) of the specified gaussian filtering in fourier space. Promotes smoothing without worrying about edges.'
    },
    {
        "active": False,
        "id": 'average',
        "name": 'Average',
        "type": 'Smoothing',
        "description": 'It is a method of "smoothing" images by reducing the amount of intensity variation inside a window (Noise removal)'
    },
    {
        "active": False,
        "id": 'median',
        "name": 'Median',
        "type": 'Smoothing',
        "description": 'It makes the target pixel intensity equal to the median value in the running window (Noise removal)'
    },
    {
        "active": False,
        "id": 'sobel',
        "name": 'Sobel',
        "type": 'Edge detection',
        "description": 'It creates an image emphasizing edges because it performs a 2-D spatial gradient measurement on an image and so emphasizes regions of high spatial frequency that correspond to edges.'
    },
    {
        "active": False,
        "id": 'fft_dog',
        "name": 'FFT Difference Of Gaussians',
        "type": 'Edge detection',
        "description": 'Calculates two gaussian blur images from the original image and subtracts one from the other. It is used to detect edges in the image.'
    },
    {
        "active": False,
        "id": 'fft_gabor',
        "name": 'FFT Gabor',
        "type": 'Edge detection,Texture detection',
        "description": 'It determines if there is any specific frequency content in the image in specific directions in a localized region around the point or region of analysis. In the spatial domain, it is a Gaussian kernel function modulated by a sinusoidal plane wave. It is one of the most suitable option for texture segmentation and boundary detection'
    },
    {
        "active": False,
        "id": 'variance',
        "name": 'Variance',
        "type": 'Texture detection',
        "description": 'It is a statistical measure of the amount of variation inside the window. This determines how uniform or not that filtering window is (important for assessing homogeneity and texture)'
    },
    {
        "active": False,
        "id": 'lbp',
        "name": 'Local Binary Pattern',
        "type": 'Texture detection',
        "description": 'It is a texture operator that tries to capture how are the neighborhoods allocated. It labels the pixels of an image by thresholding the neighborhood of each pixel and considers the result as a binary number.'
    },
    {
        "active": False,
        "id": 'membrane_projections',
        "name": 'Membrane Projections',
        "type": 'Membrane Detection',
        "description": 'Enhances membrane-like structures of the image through directional filtering.'
    },
    {
        "active": False,
        "id": 'minimum',
        "name": 'Minimum',
        "type": 'Color Identification',
        "description": 'It replaces the value of the pixel with the value of the darkest pixel inside the filtering window'
    },
    {
        "active": False,
        "id": 'maximum',
        "name": 'Maximum',
        "type": 'Color Identification',
        "description": 'It replaces the value of the pixel with the value of the lightest pixel inside the filtering window'
    },
    {
        "active": False,
        "id": 'none',
        "name": 'None (Original Image)',
        "type": 'Identity',
        "description": 'Used to guarantee the preservation of some characteristics of the original image.'
    }
]

__default_pooling = [
    {
        "id": 'min',
        "name": 'Minimum',
        "active": False
    },
    {
        "id": 'max',
        "name": 'Maximum',
        "active": False
    },
    {
        "id": 'mean',
        "name": 'Mean',
        "active": True
    }
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
        while (i < default_pooling_name and not exit_loop):
            default_features = __default_pooling[i]

            if (pooling_name == default_features["id"]):
                default_features["active"] = True
                exit_loop = True
                __default_pooling[i] = default_features

            i += 1


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
        while (i < default_features_len and not exit_loop):
            default_features = __default_features_front[i]

            if (feature_name == default_features["id"]):
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
    if (classifier_dict["classifier_type"] == "rf"):
        return [{
            "id": 'rf_n_estimators',
            "label": 'Random Forest N. Trees',
            "value": classifier_dict["rf_n_estimators"],
            "input": 'number'
        }]

    elif (classifier_dict["classifier_type"] == "svm"):
        return [{
            "id": 'svm_C',
            "label": 'SVM C',
            "value": classifier_dict["svm_C"],
            "input": 'number'
        }]

    elif (classifier_dict["classifier_type"] == "mlp"):
        return [{
            "id": 'mlp_hidden_layer_sizes',
            "label": 'N. hidden Neurons',
            "value": [*classifier_dict["mlp_hidden_layer_sizes"]],
            "input": 'text'
        }]

    elif (classifier_dict["classifier_type"] == "adaboost"):
        return [{
            "id": 'adaboost_n_estimators',
            "label": 'N. classifiers',
            "value": classifier_dict["adaboost_n_estimators"],
            "input": 'number'
        }]

    elif (classifier_dict["classifier_type"] == "knn"):
        return [{
            "id": 'knn_n_neighbors',
            "label": 'N. neighbors',
            "value": classifier_dict["knn_n_neighbors"],
            "input": 'number'
        }]

    return [{}]


def _debugger_print(msg: str, payload: any):
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


def _convert_dtype_to_str(img_dtype: np.dtype):
    return np.dtype(img_dtype).name


def pooling_to_spin_pooling(pooling):
    if pooling.lower() == 'mean':
        return spin_feat_extraction.SPINSupervoxelPooling.MEAN
    elif pooling.lower() == 'max':
        return spin_feat_extraction.SPINSupervoxelPooling.MAX
    elif pooling.lower() == 'min':
        return spin_feat_extraction.SPINSupervoxelPooling.MIN


def features_to_spin_features(feature):
    if feature.lower() == 'fft_gauss':
        return spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GAUSS
    elif feature.lower() == 'fft_gabor':
        return spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GABOR
    elif feature.lower() == 'none':
        return spin_feat_extraction.SPINFilters.NONE
    elif feature.lower() == 'fft_dog':
        return spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_DIFF_OF_GAUSS
    elif feature.lower() == 'sobel':
        return spin_feat_extraction.SPINFilters.SOBEL
    elif feature.lower() == 'membrane_projections':
        return spin_feat_extraction.SPINFilters.MEMBRANE_PROJECTIONS
    elif feature.lower() == 'minimum':
        return spin_feat_extraction.SPINFilters.ADJ_MIN
    elif feature.lower() == 'maximum':
        return spin_feat_extraction.SPINFilters.ADJ_MAX
    elif feature.lower() == 'average':
        return spin_feat_extraction.SPINFilters.ADJ_AVERAGE
    elif feature.lower() == 'variance':
        return spin_feat_extraction.SPINFilters.ADJ_VARIANCE
    elif feature.lower() == 'median':
        return spin_feat_extraction.SPINFilters.ADJ_MEDIAN
    elif feature.lower() == 'lbp':
        return spin_feat_extraction.SPINFilters.LBP
    else:
        raise f'Unknown feature: {feature.lower()}'


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


@app.route('/superpixel_segmentation_module/create', methods=['POST', 'GET'])
@cross_origin()
def create():
    """
    Function that creates the process on the image

    Notes:
        This function is used on preprocess on SuperpixelSegmentationModuleCard.tsx

    Returns:
        (str): returns a string "successes" if everything goes well and an error otherwise

    """
    img = data_repo.get_image('image')
    img_superpixel = data_repo.get_image('superpixel')

    annotations = module_repo.get_module('annotation').annotation
    if (annotations == {}):
        return handle_exception(
            "unable to apply!. Please, at least create one label and background annotation and try again the preprocess.")

    dict_tuple_values = [*annotations.values()]
    unique_ids = set()
    for tuple_values in dict_tuple_values:
        id, _ = tuple_values
        unique_ids.add(id)
    if (len(unique_ids) <= 1):
        return handle_exception(
            "unable to preview!. Please, at least create one label and background annotation and try again the preprocess.")

    if (_convert_dtype_to_str(img_superpixel.dtype) != "int32"):
        img_superpixel = img_superpixel.astype("int32")

    try:
        feature_extraction_params = request.json['feature_extraction_params']
        data_repo.set_feature_extraction_params(key="feature_extraction_params",
                                                data=feature_extraction_params.copy())

        classifier_params = request.json['classifier_params']
        classifier_values = request.json["classifier_values"]
        if (isinstance(classifier_values["value"], str)):
            value = eval(classifier_values["value"])
        elif (isinstance(classifier_values["value"], list)):
            value = (*classifier_values["value"],)
        else:
            value = classifier_values["value"]

        classifier_params[classifier_values["id"]] = value
    except:
        return handle_exception("error trying to get the request in /superpixel_segmentation_module/create")

    if 'selected_supervoxel_feat_pooling' in feature_extraction_params:
        feature_extraction_params['selected_supervoxel_feat_pooling'] = [
            pooling_to_spin_pooling(p) for p in feature_extraction_params['selected_supervoxel_feat_pooling']
        ]

    print(feature_extraction_params['selected_features'])
    if 'selected_features' in feature_extraction_params:
        feature_extraction_params['selected_features'] = [
            features_to_spin_features(f) for f in feature_extraction_params['selected_features']
        ]

    print(__default_feature_extraction_params)
    print(feature_extraction_params)
    print(classifier_params)
    available = spin_feat_extraction.SPINFilters.available_filters()

    print(available)
    print(feature_extraction_params)
    print(classifier_params)

    if img is None or img_superpixel is None:
        return handle_exception('Needs a valid image and superpixel to create module.')

    segm_module = SuperpixelSegmentationModule(img, img_superpixel)

    full_feat_extraction_params = {
        **__default_feature_extraction_params,
        **feature_extraction_params
    }

    print('full')
    print(full_feat_extraction_params)

    segm_module.set_feature_extraction_parameters(**full_feat_extraction_params)

    full_classifier_params = {**__default_classifier_params, **classifier_params}
    segm_module.set_classifier_parameters(**full_classifier_params)

    module_repo.set_module('superpixel_segmentation_module', segm_module)

    if segm_module.has_preprocess():
        segm_module.preprocess()

    return "success", 200


@app.route('/superpixel_segmentation_module/preprocess', methods=['POST'])
@cross_origin()
def preprocess():
    """
    Notes:
        This function isn't being called anywhere Annotat3D

    Returns:
        (str): returns a string "successes" if everything goes well and an error otherwise

    """
    segm_module = module_repo.get_module(key='superpixel_segmentation_module')
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

    label = np.empty(img_label.shape, dtype='int32')
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
    label_splitting_annotations = {
        k: v
        for k, v in user_annotations.items() if label_img[k] in labels_to_split
    }

    img = data_repo.get_image("image")

    if (img is None):
        return None

    if (_convert_dtype_to_str(img_dtype=img.dtype) != "int32"):
        img = img.astype(np.int32)

    forest = SPINImageForest(img, radius=1.0, cost_dtype='float32')


@app.route('/superpixel_segmentation_module/preview', methods=['POST'])
@cross_origin()
def preview():
    """
    Function that creates the classifier preview in one slice of image

    Returns:
        (str): returns a string "successes" if everything goes well and an error otherwise

    """
    segm_module = module_repo.get_module(key='superpixel_segmentation_module')

    annotations = module_repo.get_module('annotation').annotation
    if (annotations == {}):
        return handle_exception(
            "unable to preview!. Please, at least create one label and background annotation and try again the preprocess.")

    slice_num = request.json['slice']
    axis = request.json['axis']

    axis_dim = utils.get_axis_num(axis)

    if segm_module is None:
        return "Not a valid segmentation module", 400

    if not segm_module.has_preview():
        return "This module does not have a preview", 400

    try:
        label = segm_module.preview(annotations, [slice_num], axis_dim)
    except Exception as e:
        dict_tuple_values = [*annotations.values()]
        unique_ids = set()
        for tuple_values in dict_tuple_values:
            id, _ = tuple_values
            unique_ids.add(id)
        if (len(unique_ids) <= 1):
            return handle_exception(
                "unable to preview!. Please, at least create one label and background annotation and try again the preprocess.")
        return handle_exception("unable to preview! {}".format(str(e)))

    data_repo.set_image('label', label)

    return "success", 200


@app.route('/superpixel_segmentation_module/execute', methods=['POST'])
@cross_origin()
def execute():
    """
    Function that apply to all slices of an image

    Notes:
        This function is used on apply in SuperpixelSegmentationModuleCard.tsx

    Returns:
        (str): returns a string "successes" if everything goes well and an error otherwise

    """
    segm_module = module_repo.get_module(key='superpixel_segmentation_module')

    annotations = module_repo.get_module('annotation').annotation
    if (annotations == {}):
        return handle_exception(
            "unable to apply!. Please, at least create one label and background annotation and try again the preprocess.")

    if segm_module is None:
        return "Not a valid segmentation module", 400

    try:
        label = segm_module.execute(annotations)
    except Exception as e:
        dict_tuple_values = [*annotations.values()]
        unique_ids = set()
        for tuple_values in dict_tuple_values:
            id, _ = tuple_values
            unique_ids.add(id)
        if (len(unique_ids) <= 1):
            return handle_exception(
                "unable to preview!. Please, at least create one label and background annotation and try again the preprocess.")
        return handle_exception("unable to preview! {}".format(str(e)))

    try:
        edit_label_merge_module = data_repo.get_edit_label_options(key="edit_label_merge_module")
        edit_label_split_module = data_repo.get_edit_label_options(key="edit_label_split_module")
    except Exception as e:
        return handle_exception(str(e))

    if (edit_label_merge_module is not None and edit_label_merge_module.get_annotation()):
        _debugger_print("doing the merge on apply", "RIGHT NOW")
        label = _merge_label(edit_label_merge_module.get_annotation(), label, segm_module)

    if (edit_label_split_module is not None and edit_label_split_module.get_annotation()):
        _debugger_print("doing the split on apply", "RIGHT NOW")
        _split_label(edit_label_split_module.get_annotation(), annotations, label)

    data_repo.set_image('label', label)

    return jsonify("success")


@app.route('/save_classifier', methods=['POST'])
@cross_origin()
def save_classifier():
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
        segm_module = module_repo.get_module(key='superpixel_segmentation_module')
    except Exception as e:
        return handle_exception(str(e))

    if (segm_module is None):
        return handle_exception("Please, load a classifier first !")

    try:
        superpixel_state = data_repo.get_superpixel_state()
    except:
        return handle_exception("Unable to get superpixel_state")

    try:
        feature_extraction_params = data_repo.get_feature_extraction_params("feature_extraction_params")
    except Exception as e:
        return handle_exception(str(e))

    resp, msg, model_complete = segm_module.save_classifier(path, superpixel_state, feature_extraction_params)

    if (not resp):
        return handle_exception(msg)

    data_repo.set_classification_model("model_complete", model_complete)

    return jsonify("successes")


@app.route('/load_classifier', methods=['POST'])
@cross_origin()
def load_classifier():
    """
    Function that loads a classifier .model and update the back-end and front-end components

    Returns:
        (dict): Returns a dict that contains information to dispatch and update the front-end classifier

    """
    try:
        path = request.json["classificationPath"]
    except Exception as e:
        return handle_exception(str(e))

    img = data_repo.get_image('image')
    img_superpixel = data_repo.get_image('superpixel')
    segm_module = SuperpixelSegmentationModule(img, img_superpixel)
    resp, msg, classifier = segm_module.load_classifier(path)

    if (not resp):
        return handle_exception(msg)

    module_repo.set_module('superpixel_segmentation_module', segm_module)
    data_repo.set_classification_model("model_complete", classifier)

    superpixel_state = classifier["superpixel_params"]
    _debugger_print("superpixel_state", superpixel_state)

    front_end_superpixel = {
        "method": superpixel_state["superpixel_type"],
        "compactness": superpixel_state["waterpixels_compactness"],
        "seedsSpacing": superpixel_state["waterpixels_seed_spacing"],
    }

    params_front = _default_classifier_front(classifier["classifier_params"])
    front_end_classifier = {
        "classifier": classifier["classifier_params"]["classifier_type"],
        "params": params_front
    }

    chosen_features = classifier["feature_extraction_params_front"]
    _default_features_front(chosen_features)

    if (not superpixel_state["pixel_segmentation"]):
        _default_pooling_front(chosen_features)
        module_repo.set_module('superpixel_segmentation_module', segm_module)

    else:
        segm_module = PixelSegmentationModule(img)
        module_repo.set_module('pixel_segmentation_module', segm_module)

    feature_extraction_params = {
        "pooling": __default_pooling,
        "feats": __default_features_front,
        "multiscale": chosen_features["sigmas"],
        "thresholdSelection": chosen_features["feat_selection_method_threshold"] if chosen_features[
            "feat_selection_enabled"] else None
    }

    front_end_payload = {
        "superpixel_parameters": front_end_superpixel,
        "use_pixel_segmentation": classifier["superpixel_params"]["pixel_segmentation"],
        "classifier_parameters": front_end_classifier,
        "feature_extraction_params": feature_extraction_params
    }

    return jsonify(front_end_payload)
