#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# -----------------------------------------------------------------------------
# Copyright (c) Vispy Development Team. All Rights Reserved.
# Distributed under the (new) BSD License. See LICENSE.txt for more info.
# -----------------------------------------------------------------------------
# vispy: gallery 2

import gc
import json
import logging
import math
import multiprocessing as mp
import os.path
import pickle
import shutil
import time
from abc import ABC, abstractmethod
from operator import itemgetter
from pathlib import Path

import joblib
# from sklearn.utils import parallel_backend # future fix for sklearn 0.20.x
import numpy as np
import psutil
import scipy as sp
import sentry_sdk
import sscPySpin.classification as spin_class
import sscPySpin.feature_extraction as spin_feat_extraction
import sscPySpin.image as spin_img
import sscPySpin.segmentation as spin_seg
from sklearn import ensemble, model_selection, neighbors, neural_network, svm
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.feature_selection import SelectFromModel
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils import assert_all_finite, parallel_backend

from .. import aux_functions as functions
from .. import utils
from .segmentation_module import SegmentationModule

# from .widgets_parameters import SuperpixelSegmentationParamWidget

__rapids_support__ = utils.rapids_support()

if __rapids_support__:
    import cuml
    # from cuml.dask import ensemble as cuensemble
    from cuml import ensemble as cuensemble
    from cuml import svm as cusvm

__svc_params__ = {'C': [10 ** i for i in range(-5, 6)]}
__rfc_params__ = {'n_estimators': [10 ** i for i in range(1, 3)]}
__mlp_params__ = {
    'hidden_layer_sizes': [(100,), (
        50,
        10,
    ), (30, 20, 10)]
}
__knn_params__ = {'n_neighbors': [1, 3, 5, 7]}
__adaboost_params__ = {'n_estimators': [10 ** i for i in range(1, 3)]}

__max_mem_usage__ = int(512 * 1024 ** 3)
__max_available_mem_usage_percentage__ = 0.8


def create_classifier(classifier, **params):
    if classifier == 'svm':
        # return cusvm.SVC(**params)
        return svm.LinearSVC(**params)
    elif classifier == 'rf':
        # return cuensemble.RandomForestClassifier(**params)
        return ensemble.RandomForestClassifier(**params, n_jobs=-1)
    elif classifier == 'mlp':
        return neural_network.MLPClassifier(**params)
    elif classifier == 'knn':
        return neighbors.KNeighborsClassifier(**params, n_jobs=-1)
    elif classifier == 'adaboost':
        return ensemble.AdaBoostClassifier(**params)
    elif classifier == 'curf':
        return cuensemble.RandomForestClassifier(**params)
        # return cuensemble.RandomForestClassifier()
    elif classifier == 'cusvm':
        return cusvm.SVC(kernel='linear', **params)
    else:
        raise Exception('Invalid classifier')


# from profilehooks import timecall
# from decorate_all_methods import decorate_all_methods
from sklearn import metrics


# @decorate_all_methods(
# timecall(immediate=False),
# exclude=['_create_grid_search', '_extract_parameters_from_dict'])
class ClassifierSegmentationModule(SegmentationModule):
    def __init__(self,
                 image,
                 auto_save=False,
                 workspace=os.path.join(Path.home().absolute().as_posix()),
                 parent=None,
                 **kwargs):

        self._label = None
        self._features = None
        self._loaded_training_superpixel_features_prop = []
        self._loaded_training_superpixel_labels = []
        self._cached_superpixel_features_dict = None
        self._cached_superpixel_features_preview = None
        self._cached_superpixel_features_ids = None

        self._feat_scaler = StandardScaler()
        self._flag_classifier_loaded = False
        self.max_superpixel_label = 0
        self._auto_save = auto_save
        self._workspace = workspace
        self._image = image.astype('int32') if image.dtype != 'int32' else image

        self._training_features = []
        self._training_features_raw = []  # Raw training features before scaling, used for saving features if necessary
        self._training_labels = []
        self._training_labels_raw = []
        self._training_superpixel_ids = {}

        self._available_classifiers = {'rf': None, 'svm': None, 'mlp': None, 'knn': None, 'adaboost': None}
        if __rapids_support__:
            self._available_classifiers = {**self._available_classifiers, 'curf': None, 'cusvm': None}

        self._image_path = kwargs['image_path'] if 'image_path' in kwargs else ''
        self._parent = parent
        self._flag_classifier_loaded = False
        # Set containing the parameters that should not be modified by the user
        self._locked_params = set()

        self._auto_saved_data_loaded = False

        # Available classifiers
        self._default_feat_scaler = StandardScaler()
        self._default_feat_selector = None
        self._feat_selector = None
        self._feat_scaler = None
        self._model = None

        default_classifier = 'rf' if 'classifier' not in kwargs else kwargs['classifier']

        if default_classifier not in self._available_classifiers:
            raise 'Classifier %s not available!!' % default_classifier

        # Preview data
        self.preview_slice_range = 0

        # Default parameter values
        selected_features = (spin_feat_extraction.SPINFilters.NONE,
                             spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_GAUSS,
                             spin_feat_extraction.SPINFilters.MULTI_SCALE_FFT_DIFF_OF_GAUSS,
                             spin_feat_extraction.SPINFilters.MEMBRANE_PROJECTIONS)
        selected_supervoxel_feat_pooling = (spin_feat_extraction.SPINSupervoxelPooling.MEAN,)

        default_waterpixels_compactness = 10.0 if self._image.dtype == 'uint8' else 10000.0
        default_n_estimators = 200
        default_svm_C = 1.0
        default_grid_search = False
        default_mlp_hidden = (100,)
        default_knn_k = 1

        self._superpixel_params = {
            'superpixel_type': 'waterpixels',
            'pixel_segmentation': False,
            'waterpixels_compactness': default_waterpixels_compactness,
            'waterpixels_seed_spacing': 4,
            'slic_compactness': 0.6,
            'slic_seed_spacing': 7
        }
        self._feature_extraction_params = {
            'sigmas': (1, 2, 4, 8),
            'selected_features': selected_features,
            'contextual_superpixel_feature_max_level': 0,
            'selected_supervoxel_feat_pooling': selected_supervoxel_feat_pooling,
            'feat_selection_enabled': True,
            'feat_selection_clf_n_estimators': 50,
            'feat_selection_method_threshold': 0.01
        }
        self._classifier_params = {
            'classifier_type': 'rf',
            'grid_search': default_grid_search,
            'rf_n_estimators': default_n_estimators,
            'svm_C': default_svm_C,
            'mlp_hidden_layer_sizes': default_mlp_hidden,
            'knn_n_neighbors': default_knn_k,
            'adaboost_n_estimators': default_n_estimators,
            'curf_n_estimators': default_n_estimators,
            'cusvm_C': default_svm_C
        }

        self._grid_params = {
            'svm': __svc_params__,
            'rf': __rfc_params__,
            'mlp': __mlp_params__,
            'adaboost': __adaboost_params__,
            'curf': __rfc_params__,
            'cusvm': __svc_params__
        }

        # Updating default parameter values with user input
        self.set_superpixel_parameters(**kwargs)
        self.set_feature_extraction_parameters(**kwargs)
        self.set_classifier_parameters(**kwargs)

        self._classifier_version_list = {'1.0': '1.0'}
        self._classifier_version = self._classifier_version_list['1.0']

        self._training_data_version_list = {'1.0': '1.0', '1.1': '1.1'}
        self._training_data_version = self._training_data_version_list['1.1']

        self.reset_features(True)
        self.reset_classifier()

        self.marker_mode_support = {'from_user', 'extend', 'erase'}

        super().__init__()

    @property
    def _loaded_training_superpixel_features(self):
        return self._loaded_training_superpixel_features_prop

    @_loaded_training_superpixel_features.setter
    def _loaded_training_superpixel_features(self, val):
        self._loaded_training_superpixel_features_prop = val

        if len(self._loaded_training_superpixel_features_prop) > 0:
            self._lock_params(feat_params=True, superpixel_params=False, classifier_params=False)

    def _unlock_params(self):
        if len(self._loaded_training_superpixel_features) > 0:
            self._lock_params(feat_params=True, superpixel_params=False, classifier_params=False)
        else:
            self._lock_params(feat_params=False, superpixel_params=False, classifier_params=False)

    def _lock_params(self, feat_params=True, superpixel_params=True, classifier_params=True):
        self._locked_params = set()

        # Locking all parameters since they cannot be changed once the classifier is loaded
        if superpixel_params:
            self._locked_params = self._locked_params.union(self._superpixel_params.keys())
        if feat_params:
            self._locked_params = self._locked_params.union(self._feature_extraction_params.keys())
        if classifier_params:
            self._locked_params = self._locked_params.union(self._classifier_params.keys())

    @staticmethod
    def _create_grid_search(grid_params, base_model):
        return model_selection.GridSearchCV(cv=3,
                                            estimator=base_model,
                                            param_grid=grid_params,
                                            n_jobs=-1,
                                            scoring=gridsearch_scorer)

    @staticmethod
    def _extract_parameters_from_dict(parameters, key):
        key = key + '_'
        return dict(((k[len(key):], val) for k, val in parameters.items() if k.startswith(key)))

    @abstractmethod
    def _extract_features_for_training(self, annotations, features, **kwargs):
        pass

    # does not implement load label capability
    def load_label(self, label):
        pass

    def _train_classifier(self, annotations, superpixel_features, **kwargs):

        logging.info('Train classifier ...')

        start = end = 0
        classifier_trained = False

        logging.debug('loaded_training_superpixel_features: {}'.format(
            np.array(self._loaded_training_superpixel_features).shape))

        if len(annotations) > 0 or len(self._loaded_training_superpixel_features) > 0:

            self._verify_loaded_classifier_update(annotations)

            self.reset_classifier()

            self._extract_features_for_training(annotations, superpixel_features, **kwargs)

            if len(self._loaded_training_superpixel_features) > 0:
                logging.debug('--- (Training features loaded): Incorporating loaded training features')

                # for f in self._loaded_training_superpixel_features:
                self._training_features_raw = np.vstack(
                    (self._training_features_raw, self._loaded_training_superpixel_features))
                # for l in self._loaded_training_superpixel_labels:
                self._training_labels_raw = np.array(
                    [*self._training_labels_raw, *self._loaded_training_superpixel_labels])

            logging.debug('training features raw appended: {}'.format(self._training_features_raw.shape))
            logging.debug('training features: {}'.format(self._training_features.shape))

            logging.debug('-- Computing feature scaling parameters from training data')

            if self._training_features.shape != self._training_features_raw.shape:
                self._training_features = np.array(self._training_features_raw, dtype='float32')

            sentry_sdk.set_context('Feature params', {
                'dtype': self._training_features_raw.dtype,
                'shape': self._training_features_raw.shape
            })

            sentry_sdk.set_context('Classifier params', self._classifier_params)

            sstart = time.time()
            with sentry_sdk.start_span(op='normalize data'):
                with parallel_backend('threading'):
                    self._feat_scaler = StandardScaler()
                    self._feat_scaler.fit(self._training_features_raw)
                    spin_feat_extraction.spin_standardize_feature_vectors(self._training_features_raw,
                                                                          self._training_features,
                                                                          self._feat_scaler.mean_,
                                                                          self._feat_scaler.scale_)
                    # self._training_features = self._feat_scaler.fit_transform(self._training_features_raw)
                    logging.debug('training labels raw: {}'.format(self._training_labels_raw))
                    self._training_labels = np.array(self._training_labels_raw)
            send = time.time()

            logging.debug('Scaling feature time: {}s'.format(send - sstart))

            logging.debug('training features after scaling: {}'.format(self._training_features.shape))

            start = time.time()

            logging.info("Fitting...")

            if self._feat_selector is not None and self._feature_extraction_params['feat_selection_enabled']:
                logging.debug('-- Learning feature selection')

                X = np.array(self._training_features, dtype='float32')

                with sentry_sdk.start_span(op='feature selection'):
                    with parallel_backend('threading'):
                        # X = self._feat_selector.fit_transform(X, self._training_labels)
                        logging.debug('Fit ...')
                        self._feat_selector.fit(X, self._training_labels)
                        logging.debug('Transform ...')
                        X = spin_feat_extraction.spin_transform_selected_features(
                            X, self._feat_selector.get_support(indices=True))

                    old_shape = self._training_features.shape if type(self._training_features) == np.ndarray else (len(
                        self._training_features), len(self._training_features[0]))
                    new_shape = X.shape if type(X) == np.ndarray else (len(X), len(X[0]))

                    selected = self._feat_selector.get_support(indices=True)
                    sigmas = np.array(self._feature_extraction_params['sigmas'], dtype='float32')
                    selected_features = np.array(self._feature_extraction_params['selected_features'], dtype='int32')
                    selected_supervoxel_feat_pooling = np.array(
                        self._feature_extraction_params['selected_supervoxel_feat_pooling'], dtype='int32')

                    logging.debug('---- Selected features:')
                    logging.debuged = []
                    for i in selected:
                        filter_id = spin_feat_extraction.spin_filter_get_filter_id(i, 1,
                                                                                   selected_supervoxel_feat_pooling,
                                                                                   selected_features, sigmas)
                        name = spin_feat_extraction.SPINFilters.filter_name(filter_id)
                        if not name in logging.debuged:
                            logging.debuged.append(name)
                            logging.debug('----- {}'.format(spin_feat_extraction.SPINFilters.filter_name(filter_id)))

            else:
                logging.debug('-- Using all features for training')
                X = self._training_features

            logging.debug('-- Training model')

            grid_params = self._grid_params.get(self._classifier_params['classifier_type'], {})

            # Forcing the threading backend for joblib to be used since this module is run in a secondary Qt thread. Hence, joblib cannot invoke
            # multiple processes and an error is issued. Since scikit-learn implements prediction and training by releasing the GIL, we are able
            # to use threading as the backend.

            logging.debug('training labels: {}'.format(self._training_labels))
            Y = np.array(self._training_labels, dtype='int32')
            logging.debug('Y: {}'.format(Y))

            use_grid_search = self._classifier_params['grid_search']

            if use_grid_search and grid_params:
                logging.debug('Grid Searching parameters ...')
                with sentry_sdk.start_span(op='grid search'):
                    with parallel_backend('threading'):
                        grid_search = self._create_grid_search(grid_params, self._model)
                        grid_search.fit(X, Y)
                    self._model = grid_search.best_estimator_

            with sentry_sdk.start_span(op='model fit'):
                with parallel_backend('threading'):
                    self._model.fit(X, Y)

            end = time.time()
            classifier_trained = True

            self._flag_classifier_loaded = False
        else:
            if self._flag_classifier_loaded:
                logging.debug('Using pre-loaded model')

                classifier_trained = True

        training_time = end - start

        if classifier_trained:
            logging.debug("--> Completed")

        return classifier_trained, training_time

    def change_classifier(self, classifier):
        classifier = classifier.lower()

        self._classifier_params['classifier_type'] = classifier
        self._model = self._available_classifiers[classifier]

        logging.debug('\n\n***Classifier type: {}'.format(type(self._model)))
        logging.debug('Changing classifier to {}'.format(classifier.upper()))

    def _debugger_print(self, msg: str, payload: any):
        print("\n----------------------------------------------------------")
        print("{} : {}".format(msg, payload))
        print("-------------------------------------------------------------\n")

    def save_classifier(self, path):
        labels = np.unique(self._training_labels)
        model_complete = {
            'version': self._classifier_version,
            'labels': labels,
            'classifier_params': self._classifier_params,
            'superpixel_params': self._superpixel_params,
            'feature_extraction_params': self._feature_extraction_params,
            'classifier': self._model,
            'feat_selector': self._feat_selector,
            'feat_scaler': self._feat_scaler
        }

        self._debugger_print("model_complete", model_complete)

        # joblib.dump(model_complete,  path)

        try:
            # IMPORTANT NOTE: since version 0.3.7, classifier loading was modified to use pickle instead of joblib because the later does
            # not seem to be well supported by RAPIDS. To prevent allow backwards compatibility, we are keepking joblib for training
            # data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
            # besides being far more critical than classifier loading/saving.
            with open(path, 'wb') as f:
                pickle.dump(model_complete, f)
        except Exception as e:
            f.close()
            return False, 'Unable to save classification model! Error: %s' % str(e), {}
        else:
            logging.debug('Classifier saved successfully')

        return True, "", model_complete

    def load_classifier(self, path):

        try:

            """IMPORTANT NOTE: since version 0.3.7, classifier loading was modified to use pickle instead of joblib because the later does
            not seem to be well supported by RAPIDS. To prevent allow backwards compatibility, we are keepking joblib for training
            data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
            besides being far more critical than classifier loading/saving."""
            with open(path, 'rb') as f:
                model_complete = pickle.load(f)

        except Exception as e:
            f.close()
            error_msg = 'Invalid classifier file! Unable to load classification model! Error: %s.\n\n' % str(e)
            error_msg += ('IMPORTANT NOTE: since Annotat3D version 0.3.7, classifiers saved with previous versions '
                          'of the software are no longer fully supported and may fail to load.')
            return False, error_msg, {}

        logging.debug('After deserializing classifier file')

        try:
            classifier_version = model_complete['version']
        except Exception as e:
            return False, 'Invalid classifier file! Unable to load classification model! Error: %s' % str(e), {}
        else:
            if classifier_version != self._classifier_version:
                return False, 'Invalid classifier file! Classifier version does not match current model!', {}
        try:
            self._model = model_complete['classifier']
        except Exception as e:
            return False, 'Invalid classifier file! Unable to load classification model! Error: %s' % str(e), {}

        try:
            self._superpixel_params = model_complete['superpixel_params']
            self._feature_extraction_params = model_complete['feature_extraction_params']
            self._classifier_params = model_complete['classifier_params']

        except Exception as e:
            return False, 'Invalid classifier file! Unable to load parameters! (Error: %s)' % str(e), {}

        try:
            self._feat_selector = model_complete['feat_selector']
            self._default_feat_selector = self._feat_selector
        except:
            return False, 'Invalid classifier file! Unable to load feature selection model!', {}

        try:
            self._feat_scaler = model_complete['feat_scaler']
            self._default_feat_scaler = self._feat_scaler
        except:
            return False, 'Invalid classifier file! Unable to load feature scaling method', {}

        try:
            labels = model_complete['labels']
        except:
            return False, 'Invalid classifier file! Unable to load labels', {}

        classifier = self._classifier_params['classifier_type']

        self._available_classifiers[classifier] = self._model

        if classifier not in self._available_classifiers:
            return False, 'Invalid classifier type ' + classifier, {}

        self._flag_classifier_loaded = True

        if self._parent is not None:
            self._parent.include_labels(labels)

        logging.debug('Classifier loaded successfully')

        functions.log_usage(op_type='load_classifier',
                            feature_extraction_params=str(self._feature_extraction_params),
                            classifier_params=str(self._classifier_params),
                            superpixel_params=str(self._superpixel_params))

        labels = np.unique(self._training_labels)
        model_complete = {
            'version': self._classifier_version,
            'labels': labels,
            'classifier_params': self._classifier_params,
            'superpixel_params': self._superpixel_params,
            'feature_extraction_params': self._feature_extraction_params,
            'classifier': self._model,
            'feat_selector': self._feat_selector,
            'feat_scaler': self._feat_scaler
        }

        self._debugger_print("model_complete loaded", model_complete)

        return True, "", model_complete

    def _load_training_data_v1_1(self, training_data):
        version = training_data['version']
        newest_version = self._training_data_version

        if version != '1.1':
            raise 'This seems to be an older version of training data file (file version: %s, current version %s). Superpixel estimation and classification parameters were not stored in the file. Please set them according to the original specifications, otherwise classification results may differ.' % (
                version, newest_version)
            return False

        try:
            superpixel_params = training_data['superpixel_params']
        except Exception as e:
            raise Exception('Invalid training_data file! Unable to load classification parameters!')

        try:
            classifier_params = training_data['classifier_params']
        except Exception as e:
            raise Exception('Invalid training_data file! Unable to load classification parameters!')

        self._superpixel_params = superpixel_params
        self._classifier_params = classifier_params

        return True

    def _generic_batch_classify(self, X, model, prediction, nsamples_step):
        with parallel_backend('threading'):
            # with True:
            for i in range(0, X.shape[0], nsamples_step):
                last_i = min(X.shape[0], i + nsamples_step)

                pstart = time.time()
                pred_ = self._model.predict(X[i:last_i])
                if not isinstance(pred_, (np.ndarray, np.generic)):  # cuml svm returns a pandas series
                    pred_ = pred_.to_array()
                pend = time.time()
                logging.debug('--- Predicting labels for samples({}:{}): {}s'.format(i, last_i - 1, pend - pstart))
                prediction[i:last_i] = pred_

    def _model_classify(self, X):
        # Forcing the threading backend for joblib to be used since this module is run in a secondary Qt thread. Hence, joblib cannot invoke
        # multiple processes and an error is issued. Since scikit-learn implements prediction and training by releasing the GIL, we are able
        # to use threading as the backend.
        prediction = np.zeros(X.shape[0], dtype='uint16')

        logging.debug(f'Prediction output: {prediction.shape} -> {X.shape}')

        if isinstance(self._model, svm.LinearSVC):
            nsamples_step = 10_000_000
            # ngpus = 3
            if nsamples_step > X.shape[0]:
                ngpus = 1
            spin_class.svm_classify(self._model, X, prediction, nsamples_step)
        elif isinstance(self._model, RandomForestClassifier):
            spin_class.random_forest_classify(self._model, X, prediction)
        else:
            # with open('testing.pkl', 'wb') as f:
            # pickle.dump(dict(X=X), f)
            nsamples_step = 10_000_000  # number of samples to be evaluated at each iteration to avoid consuming too much shared memory between processes
            self._generic_batch_classify(X, self._model, prediction, nsamples_step)
        return prediction

    def _predict_labels(self, features):

        feat_scaling_start = time.time()
        X_scaled = self._scale_feats(features)
        feat_scaling_end = time.time()
        feat_scaling_time = feat_scaling_end - feat_scaling_start

        feat_selection_start = time.time()
        X = self._select_feats(X_scaled)
        feat_selection_end = time.time()
        feat_selection_time = feat_selection_end - feat_selection_start

        logging.debug('-- Applying trained model')
        predict_start = time.time()
        logging.debug('predict labels')
        prediction = self._model_classify(X)

        predict_end = time.time()
        predict_time = predict_end - predict_start

        logging.debug('--- Predict time for feature shape {}: {}s'.format(X.shape, predict_end - predict_start))

        return prediction, {
            'feat_scaling_time': feat_scaling_time,
            'feat_selection_time': feat_selection_time,
            'predict_time': predict_time
        }

    def reset_features(self, force_reset_loaded_data=False):
        self._training_features = []
        self._training_features_raw = []  # Raw training features before scaling, used for saving features if necessary
        self._training_labels = []
        self._training_labels_raw = []

        if len(self._loaded_training_superpixel_features) > 0 and force_reset_loaded_data:
            self._loaded_training_superpixel_features = []
            self._loaded_training_superpixel_labels = []

        self._features = None
        self._feat_scaler = self._default_feat_scaler
        self._superpixel_bboxes = None
        self._cached_superpixel_features_dict = None
        self._cached_superpixel_features_preview = None

    def get_label(self):
        return self._label

    def get_original_label(self):
        return self._label

    def get_previous_label(self):
        return self._label

    @property
    def image(self):
        return self._image

    @property
    def _flag_classifier_loaded(self):
        return self._flag_classifier_loaded_prop

    @_flag_classifier_loaded.setter
    def _flag_classifier_loaded(self, val):
        self._flag_classifier_loaded_prop = val

        if self._flag_classifier_loaded_prop:
            self._lock_params()
        else:
            # Unlocking parameters to allow user modifications, since we are producing a new classifier because annotations
            # were selected
            self._unlock_params()

    def update_annotations_with_auto_saved_data(self, annotations):
        _annotations, _classif_params = self.load_auto_saved_data()

        valid_data = self.verify_auto_saved_data()

        if valid_data != 0:
            if valid_data == 2:
                logging.debug('Updating annotations with auto-saved data since the image info matches')

                _annotations_aux = annotations.copy()
                _annotations_aux.update(_annotations)
                _annotations = _annotations_aux
            else:
                logging.debug('Error! Image information does not match for updating annotations with auto-saved data!')

                _annotations = None
        else:
            logging.debug('No auto-saved data detected, using only input data')

        return _annotations

    def create_auto_saved_data_folder(self):
        if self._auto_save:
            if not os.path.exists(self._workspace):
                os.makedirs(self._workspace)
                if os.path.exists(self._workspace):
                    logging.debug('Auto-save workspace directory %s created successfully!' % self._workspace)
                else:
                    logging.debug('Error! Unable to create workspace directory %s!!' % self._workspace)

    def save_training_data(self, path):
        if not (
                (len(self._loaded_training_superpixel_labels) != 0 and len(
                    self._loaded_training_superpixel_labels) != 0) or
                (len(self._training_labels_raw) != 0 and len(self._training_features_raw) != 0)):
            raise Exception('Please train the classifier before trying to save training data')
        # Updating training data with loaded data for saving
        labels = np.array([*self._training_labels_raw, *self._loaded_training_superpixel_labels])

        stacked_feats = []

        if len(self._training_features_raw) > 0:
            stacked_feats.append(self._training_features_raw)
        if len(self._loaded_training_superpixel_features) > 0:
            stacked_feats.append(self._loaded_training_superpixel_features)

        feats = np.vstack(stacked_feats)

        # Training data version 1.0
        training_data = {
            'version': self._training_data_version,
            'feature_extraction_params': self._feature_extraction_params,
            'superpixel_labels': labels,
            'superpixel_features': feats
        }

        # Saving data for other versions
        # Version 1.1:
        if self._training_data_version == self._training_data_version_list['1.1']:
            training_data['superpixel_params'] = self._superpixel_params
            training_data['classifier_params'] = self._classifier_params

        try:
            # IMPORTANT NOTE: since Annotat3D version 0.3.7, classifier loading was modified to use pickle instead of joblib because the
            # latter does not seem to be well supported by RAPIDS. To allow backwards compatibility, we are keepking joblib for training
            # data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
            # besides being far more critical than classifier loading/saving.
            joblib.dump(training_data, path)
        except:
            return False
        else:
            logging.debug('Training feature data saved successfully')

        return True

    @property
    def _pixel_mode(self):
        return self._superpixel_params['pixel_segmentation']

    def load_training_data(self, path):

        try:
            # IMPORTANT NOTE: since Annotat3D version 0.3.7, classifier loading was modified to use pickle instead of joblib because the
            # latter does not seem to be well supported by RAPIDS. To allow backwards compatibility, we are keepking joblib for training
            # data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
            # besides being far more critical than classifier loading/saving.
            training_data = joblib.load(path)
        except Exception as e:
            raise Exception('Invalid training_data file! Unable to load training data! Error: %s' % str(e))

        try:
            training_data_version = training_data['version']
        except Exception as e:
            raise Exception('Invalid training_data file! Unable to load training data! Error: %s' % str(e))

        try:
            feature_extraction_params = training_data['feature_extraction_params']
        except Exception as e:
            raise Exception('Invalid training data file! Unable to load feature extraction parameters! (Error: %s)' %
                            str(e))
        try:
            loaded_training_superpixel_labels = training_data['superpixel_labels']
        except Exception as e:
            raise Exception('Invalid training data file! Unable to load training superpixel labels! (Error: %s)' %
                            str(e))

        try:
            loaded_training_superpixel_features = training_data['superpixel_features']
        except Exception as e:
            raise Exception('Invalid training data file! Unable to load training superpixel features! (Error: %s)' %
                            str(e))

        nsamples = len(loaded_training_superpixel_features)
        nlabels = len(loaded_training_superpixel_labels)
        nfeats = loaded_training_superpixel_features.shape[1] if type(
            loaded_training_superpixel_features) == np.ndarray else len(loaded_training_superpixel_features[0])

        if nsamples != nlabels:
            raise Exception(
                'Invalid training data file! Training samples and training labels differ in size (%d vs. %d))' %
                (nsamples, nlabels))

        if not self._load_training_data_v1_1(training_data):
            logging.debug(
                '-- Version %s detected. Impossible to load full training data parameters expected for version %s' %
                (training_data_version, self._training_data_version_list['1.1']))

        # Commiting loaded data
        self._feature_extraction_params = feature_extraction_params
        self._loaded_training_superpixel_labels = loaded_training_superpixel_labels
        self._loaded_training_superpixel_features = loaded_training_superpixel_features

        # Updating labels
        labels = np.unique(self._loaded_training_superpixel_labels)
        if self._parent is not None:
            self._parent.include_labels(labels)

        self._flag_classifier_loaded = False
        self.reset_classifier()

        functions.log_usage(op_type='load_training_data',
                            training_data_version=str(training_data_version),
                            feature_extraction_params=str(self._feature_extraction_params),
                            classifier_params=str(self._classifier_params),
                            superpixel_params=str(self._superpixel_params),
                            nsamples=nsamples,
                            nfeats=nfeats)

        return True

    def reset_classifier(self):
        # Avoiding to reset classifier after it is loaded and not used
        logging.debug('Recreating/resetting classifier')

        # Creating feature selector
        feat_selection_method_params = self._extract_parameters_from_dict(self._feature_extraction_params,
                                                                          'feat_selection_method')
        feat_selection_clf_params = self._extract_parameters_from_dict(self._feature_extraction_params,
                                                                       'feat_selection_clf')
        self._default_feat_selector = SelectFromModel(ExtraTreesClassifier(**feat_selection_clf_params),
                                                      **feat_selection_method_params)

        self._feat_selector = self._default_feat_selector

        # Creating classifiers with selected parameters
        for c in self._available_classifiers:
            params = self._extract_parameters_from_dict(self._classifier_params, c)

            logging.debug('Parameters for %s: %s' % (c, str(params)))

            clf = create_classifier(c, **params)
            # self._available_classifiers[c] = Pipeline([('feature_selection', feat_selection), ('classification', clf)])
            self._available_classifiers[
                c] = clf  # Pipeline([('feature_selection', feat_selection), ('classification', clf)])

        self._model = self._available_classifiers[self._classifier_params['classifier_type']]

        logging.debug('\n\n***Classifier type after resetting {}'.format(type(self._model)))

    def __del__(self):
        self.remove_auto_saved_data()

    def set_feature_extraction_parameters(self, **kwargs):
        for param, value in kwargs.items():
            if param in self._feature_extraction_params:
                logging.debug('Setting {} {}'.format(param, value))
                self._feature_extraction_params[param] = value

    # todo: rename it to preprocessing parameters, or something like this
    def set_superpixel_parameters(self, **kwargs):
        for param, value in kwargs.items():
            if param in self._superpixel_params:
                logging.debug('Setting {} {}'.format(param, value))
                self._superpixel_params[param] = value

    def set_classifier_parameters(self, **kwargs):
        for param, value in kwargs.items():
            if param in self._classifier_params:
                logging.debug('Setting {} {}'.format(param, value))
                self._classifier_params[param] = value

    def get_classifier_parameters(self):
        params = {}

        params.update(self._superpixel_params)
        params.update(self._classifier_params)
        params.update(self._feature_extraction_params)
        params.update(
            (('available_features', self.get_available_features()), ('available_supervoxel_feat_pooling',
                                                                     self.get_available_supervoxel_pooling_methods())))
        params['locked_params'] = set(self._locked_params)

        return params

    # def get_classifier_parameters_widget(self, window):
    # return SuperpixelSegmentationParamWidget(window)

    def get_classifier(self):
        return self._classifier_params['classifier_type']

    def _is_supervoxel(self):
        superpixel_type = self._superpixel_params['superpixel_type']

        return superpixel_type not in ['waterpixels', 'slic']

    def _feat_extraction_context_margin(self):
        # Adding context margin for feature extraction
        return int(max(self._feature_extraction_params['sigmas']))

    def _bounding_box_for_feat_extraction(self, bbox, min_coord, max_coord):
        # Adding context margin for feature extraction
        feat_extraction_context_margin = self._feat_extraction_context_margin()

        ndim = self._image.ndim
        min_coord = np.zeros(ndim, dtype='int32') if min_coord is None else min_coord
        max_coord = np.array(self._image.shape, dtype='int32') - 1 if max_coord is None else max_coord

        bbox = bbox.copy()
        # If the currently selected superpixel estimation method does not generate supervoxel, then we
        # consider only a 2D feature extraction context margin. Otherwise, we apply it in 2D
        if self._is_supervoxel():
            bbox[:ndim] = np.maximum(min_coord, bbox[:ndim] - feat_extraction_context_margin)
            bbox[ndim:] = np.minimum(max_coord, bbox[ndim:] + feat_extraction_context_margin)
        else:
            bbox[1:ndim] = np.maximum(min_coord[1:], bbox[1:ndim] - feat_extraction_context_margin)
            bbox[ndim + 1:] = np.minimum(max_coord[1:], bbox[ndim + 1:] + feat_extraction_context_margin)

        if min_coord is None or max_coord is None:
            return bbox, min_coord, max_coord
        else:
            return bbox

    def get_available_features(self):
        return spin_feat_extraction.SPINFilters.available_filters()

    def get_available_supervoxel_pooling_methods(self):
        return spin_feat_extraction.SPINSupervoxelPooling.available_pooling_methods()

    def auto_save_data(self, annotations):
        """
        Function that automatically save the annotations image information

        Args:
            annotations (array): array that contain information about the image annotations

        Returns:
            None

        """
        # Erasing previously saved data
        self.remove_auto_saved_data()
        # Saving new data if required
        if self._auto_save:
            if len(annotations) > 0:
                # (Re)creating folder to save the data
                self.create_auto_saved_data_folder()
                try:
                    """IMPORTANT NOTE: since version 0.3.7, classifier loading was modified to use pickle instead of joblib because the later does
                    not seem to be well supported by RAPIDS. To prevent allow backwards compatibility, we are keepking joblib for training
                    data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
                    besides being far more critical than classifier loading/saving."""
                    with open(os.path.join(self._workspace, 'annotations_latest.pkl'), 'wb') as f:
                        pickle.dump(annotations, f)
                except Exception as e:
                    f.close()
                    logging.debug('-- Error!! Unable to auto-save annotations. Error: %s' % str(e))

                else:

                    classif_params = {'image_info': {'shape': self._image.shape, 'dtype': self._image.dtype}}

                    try:
                        with open(os.path.join(self._workspace, 'classifier_params_latest.pkl'), 'wb') as f:
                            pickle.dump(classif_params, f)
                    except Exception as e:
                        f.close()
                        logging.debug('-- Error!! Unable to auto-save classifier parameters. Error: %s.' % str(e))
                    else:
                        # After the first auto save, then we may assume that there is no need of auto saving the annotations
                        self._auto_saved_data_loaded = True

    def load_auto_saved_data(self):
        annotations = None
        classif_params = None
        if self._auto_save:
            annotations_file = os.path.join(self._workspace, 'annotations_latest.pkl')
            classifier_params = os.path.join(self._workspace, 'classifier_params_latest.pkl')
            if os.path.exists(annotations_file) and os.path.exists(classifier_params):
                try:
                    # IMPORTANT NOTE: since version 0.3.7, classifier loading was modified to use pickle instead of joblib because the later does
                    # not seem to be well supported by RAPIDS. To prevent allow backwards compatibility, we are keepking joblib for training
                    # data loading/saving instead, given that it has been extensively used already (probably much more than classifier saving),
                    # besides being far more critical than classifier loading/saving.
                    with open(annotations_file, 'rb') as f:
                        annotations = pickle.load(f)
                except Exception as e:
                    f.close()
                    logging.debug(
                        'Error loading auto-saved annotation file: %s\nPlease erase auto-save data manually from %s.' %
                        (str(e), self._workspace))
                    raise e

                try:
                    with open(classifier_params, 'rb') as f:
                        classif_params = pickle.load(f)
                except Exception as e:
                    f.close()
                    logging.debug(
                        'Error loading auto-saved annotation file: %s\nPlease erase auto-save data manually from %s.' %
                        (str(e), self._workspace))
                    raise e

        return annotations, classif_params

    def auto_saved_data_loaded(self):
        return self._auto_saved_data_loaded

    def verify_auto_saved_data(self):
        valid_data = 0
        _annotations, _classif_params = self.load_auto_saved_data()

        if _annotations is not None and _classif_params is not None:
            if _classif_params['image_info']['shape'] == self._image.shape and _classif_params['image_info'][
                'dtype'] == self._image.dtype:
                valid_data = 2
            else:
                valid_data = 1

        return valid_data

    def remove_auto_saved_data(self):
        from os import path
        if path.exists(self._workspace):
            shutil.rmtree(self._workspace)

    def undo(self, checkpoint):
        return True

    def _verify_loaded_classifier_update(self, annotations):
        msg = ''
        title = ''
        msg_type = ''

        if len(annotations) > 0 or len(self._loaded_training_superpixel_features) > 0:
            if self._flag_classifier_loaded:
                msg += (
                    'A pre-loaded classifier has been detected. Since new training data were added, there is currently no way '
                    'to update the classifier and it will be recomputed *only with the new training data*. '
                    'If your intention is to update a previously trained classifier, please load the *training data* '
                    'used to generate the classifier instead.')

                title = 'Pre-loaded classifier detected.'

                logging.warn('-- WARNING: {}'.format(msg))

                msg_type = 'information'

            if self._parent is not None:
                self._parent.seng_gui_message(title, msg, msg_type)

    def _scale_feats(self, feats):
        if self._feat_scaler is not None:
            logging.debug('-- Scaling features for prediction from training')
            logging.debug('--- Copying features {} {}'.format(feats.shape, feats.dtype))
            X_scaled = np.empty(feats.shape, feats.dtype)
            spin_feat_extraction.spin_standardize_feature_vectors(feats, X_scaled, self._feat_scaler.mean_,
                                                                  self._feat_scaler.scale_)

            # logging.debug('feats: ', X_scaled[0,...], X_scaled[1,...])
        else:
            logging.debug('-- WARNING: Using features without scaling since no feature scaler was available')
            X_scaled = feats

        return X_scaled

    def _select_feats(self, feats):
        if self._feat_selector is not None and self._feature_extraction_params['feat_selection_enabled']:
            logging.debug('-- Transforming features using feature selection')
            logging.debug('{} {}'.format(feats.shape, feats.dtype))

            # X = self._feat_selector.transform(X_scaled)
            X_selected = spin_feat_extraction.spin_transform_selected_features(
                feats, self._feat_selector.get_support(indices=True))
            old_shape = feats.shape if type(feats) == np.ndarray else (len(feats), len(feats[0]))
            new_shape = X_selected.shape if type(X_selected) == np.ndarray else (len(X_selected), len(X_selected[0]))
            logging.debug('---- Old prediction superpixel features shape: {} Selected features shape:'.format(
                old_shape, new_shape))
        else:
            logging.debug('-- Using features without feature selection')
            X_selected = feats
        return X_selected

    def _selected_slices_idx(self, selected_slices, selected_axis):
        # creates a numpy index for the selected slices
        # selected_slices_idx = [selected_slices,:,:] or [:, selected_slices, :] or [:, :, selected_slices],
        # depending on selected_axis 0, 1 or 2
        if type(selected_slices) is set:
            selected_slices = sorted(selected_slices)
        selected_slices_idx = [slice(None), slice(None), slice(None)]
        selected_slices_idx[selected_axis] = selected_slices

        return selected_slices_idx

    def _estimate_feature_extraction_memory_usage(self, **kwargs):
        feature_extraction_params = self._feature_extraction_params.copy()
        feature_extraction_params.update(kwargs)

        selected_features = feature_extraction_params['selected_features']
        supervoxel_pooling = feature_extraction_params['selected_supervoxel_feat_pooling']
        sigmas = feature_extraction_params['sigmas']

        nsuperpixels = self.max_superpixel_label

        num_features = spin_feat_extraction.spin_filter_get_total_features(selected_features=selected_features,
                                                                           sigmas=sigmas) * len(supervoxel_pooling)
        sizeof_float = np.dtype('float32').itemsize
        # Multiplying by 2 due to the
        memory = 2 * nsuperpixels * num_features * sizeof_float

        return memory

    def _get_available_memory(self):
        return min(psutil.virtual_memory().available * __max_available_mem_usage_percentage__, __max_mem_usage__)

    def _validate_feature_extraction_memory_usage(self, **kwargs):
        estimated_memory = self._estimate_feature_extraction_memory_usage(**kwargs)
        available_memory = self._get_available_memory()

        has_enough_memory = estimated_memory <= available_memory

        memory_splitting_factor = min(self._image.shape[0], int(math.ceil(estimated_memory / available_memory)))

        if not has_enough_memory:
            logging.debug('** WARNING: Estimated amount of memory (%lu bytes) exceeds the threshold of %lu bytes' %
                          (estimated_memory, available_memory))
        else:
            logging.debug('** Estimated amount of memory (%lu bytes) within threshold of %lu bytes' %
                          (estimated_memory, available_memory))

        return has_enough_memory, memory_splitting_factor


def my_scorer(y_true, y_predicted):
    if not isinstance(y_predicted, (np.ndarray, np.generic)):  # cuml svm returns a pandas series
        y_predicted = y_predicted.to_array()
    acc = metrics.accuracy_score(y_true, y_predicted)
    return acc


gridsearch_scorer = metrics.make_scorer(my_scorer, greater_is_better=True)
