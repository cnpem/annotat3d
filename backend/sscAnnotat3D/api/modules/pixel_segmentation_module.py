from flask import Blueprint, request, jsonify

import numpy as np

from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscPySpin import feature_extraction as spin_feat_extraction

from flask_cors import cross_origin

app = Blueprint('pixel_segmentation_module', __name__)

__default_selected_features = (spin_feat_extraction.SPINFilters.NONE,
                               spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GAUSS,
                               spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_DIFF_OF_GAUSS,
                               spin_feat_extraction.SPINFilters.MEMBRANE_PROJECTIONS)
__default_selected_supervoxel_feat_pooling = (spin_feat_extraction.SPINSupervoxelPooling.MEAN, )


__default_feature_extraction_params = {
    'sigmas': (1, 2, 4, 8),
    'selected_features': __default_selected_features,
    'feat_selection_enabled': True,
    'feat_selection_clf_n_estimators': 50,
    'feat_selection_method_threshold': 0.01
}

__default_classifier_params = {
    'classifier_type': 'rf',
    'grid_search': False,
    'rf_n_estimators': 200,
    'svm_C': 1.0,
    'mlp_hidden_layer_sizes': (100,10),
    'knn_n_neighbors': 5,
    'adaboost_n_estimators': 200
}

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

@app.route('/pixel_segmentation_module/create', methods=['POST', 'GET'])
@cross_origin()
def create():
    img = data_repo.get_image('image')

    feature_extraction_params = request.json['feature_extraction_params']
    classifier_params = request.json['classifier_params']

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

    if img is None:
        return 'Needs a valid image to create module.', 400

    segm_module = PixelSegmentationModule(img)

    full_feat_extraction_params = {
        **__default_feature_extraction_params,
        **feature_extraction_params
    }

    print('full')
    print(full_feat_extraction_params)

    segm_module.set_feature_extraction_parameters(**full_feat_extraction_params)

    full_classifier_params = {**__default_classifier_params, **classifier_params}
    segm_module.set_classifier_parameters(**full_classifier_params)

    module_repo.set_module('pixel_segmentation_module', segm_module)

    if segm_module.has_preprocess():
        segm_module.preprocess()

    return "success", 200

@app.route('/pixel_segmentation_module/preprocess', methods=['POST'])
@cross_origin()
def preprocess():
    segm_module = module_repo.get_module(key='pixel_segmentation_module')
    segm_module.preprocess()

    return "success", 200

@app.route('/pixel_segmentation_module/preview', methods=['POST'])
@cross_origin()
def preview():

    segm_module = module_repo.get_module(key='pixel_segmentation_module')

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
    except Exception as e:
        import traceback
        stack_trace = traceback.format_exc()
        return jsonify({
            'error': 'Failure on Pixel Segmentation Preview',
            'error_msg': stack_trace
        }), 500
    data_repo.set_image('label', label)

    return "success", 200


@app.route('/pixel_segmentation_module/execute', methods=['POST'])
@cross_origin()
def execute():

    segm_module = module_repo.get_module(key='pixel_segmentation_module')

    annotations = module_repo.get_module('annotation').annotation

    if segm_module is None:
        return "Not a valid segmentation module", 400

    try:
        label = segm_module.execute(annotations)
    except Exception as e:
        import traceback
        stack_trace = traceback.format_exc()
        return jsonify({
            'error': 'Failure on Pixel Segmentation Apply',
            'error_msg': stack_trace
        }), 500

    # print(label.mean(), label.shape)

    data_repo.set_image('label', label)

    print(segm_module._feature_extraction_params)
    print(segm_module._classifier_params)

    return "success", 200