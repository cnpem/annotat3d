import pickle
import numpy as np
import logging

from flask_cors import cross_origin
from flask import Blueprint, request, jsonify

from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D.modules.superpixel_segmentation_module import SuperpixelSegmentationModule
from sscPySpin import feature_extraction as spin_feat_extraction

# TODO : We need to template sscIO for other superpixel types
# TODO : In this actual stage, we're forcing superpixel to be 32 int type
# TODO : Implement the error template for flask in this script

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


@app.route('/superpixel_segmentation_module/create', methods=['POST', 'GET'])
@cross_origin()
def create():
    img = data_repo.get_image('image')
    img_superpixel = data_repo.get_image('superpixel')

    if (_convert_dtype_to_str(img_superpixel.dtype) != "int32"):
        img_superpixel = img_superpixel.astype("int32")

    feature_extraction_params = request.json['feature_extraction_params']
    classifier_params = request.json['classifier_params']

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
        return 'Needs a valid image and superpixel to create module.', 400

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
    segm_module = module_repo.get_module(key='superpixel_segmentation_module')
    segm_module.preprocess()

    return "success", 200


@app.route('/superpixel_segmentation_module/preview', methods=['POST'])
@cross_origin()
def preview():
    segm_module = module_repo.get_module(key='superpixel_segmentation_module')

    annotations = module_repo.get_module('annotation').annotation

    slice_num = request.json['slice']
    axis = request.json['axis']

    axis_dim = utils.get_axis_num(axis)

    if segm_module is None:
        return "Not a valid segmentation module", 400

    if not segm_module.has_preview():
        return "This module does not have a preview", 400

    try:
        label = segm_module.preview(annotations, [slice_num], axis_dim)
    except:
        import traceback
        stack_trace = traceback.format_exc()
        return jsonify({
            'error': 'Failure on Superpixel Segmentation Preview',
            'error_msg': stack_trace
        }), 500

    data_repo.set_image('label', label)

    return "success", 200


@app.route('/superpixel_segmentation_module/execute', methods=['POST'])
@cross_origin()
# TODO : need to make this function save .model for classification
# TODO : Implement the documentation here
def execute():
    segm_module = module_repo.get_module(key='superpixel_segmentation_module')

    annotations = module_repo.get_module('annotation').annotation

    if segm_module is None:
        return "Not a valid segmentation module", 400

    try:
        label = segm_module.execute(annotations)
    except Exception as e:
        import traceback
        stack_trace = traceback.format_exc()
        return jsonify({
            'error': 'Failure on Superpixel Segmentation Apply',
            'error_msg': stack_trace
        }), 500

    data_repo.set_image('label', label)

    _debugger_print("segm_module._feature_extraction_params", segm_module._feature_extraction_params)
    _debugger_print("segm_module._classifier_params", segm_module._classifier_params)
    model_complete = {
        'version': segm_module._classifier_version,
        'labels': np.unique(label),
        'classifier_params': segm_module._classifier_params,
        'superpixel_params': segm_module._superpixel_params,
        'feature_extraction_params': segm_module._feature_extraction_params,
        'classifier': segm_module._model,
        'feat_selector': segm_module._feat_selector,
        'feat_scaler': segm_module._feat_scaler
    }
    _debugger_print("model_complete", model_complete)
    data_repo.set_model_complete("model_complete", model_complete)
    path = "/home/borinmacedo/AnnotDocs/test.model"
    try:
        # IMPORTANT NOTE: since version 0.3.7, classifier loading was modified to use pickle instead of joblib because the later does
        # not seem to be well supported by RAPIDS. To prevent allow backwards compatibility, we are keepking joblib for training
        # data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
        # besides being far more critical than classifier loading/saving.
        with open(path, 'wb') as f:
            pickle.dump(model_complete, f)
    except Exception as e:
        f.close()
        raise Exception('Unable to save classification model! Error: %s' % str(e))
    else:
        logging.debug('Classifier saved successfully')

    return "success", 200
