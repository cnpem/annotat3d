import gc
import math
import os.path
import pickle
import shutil
import time
import logging
from operator import itemgetter
from pathlib import Path
import sentry_sdk

import numpy as np
import scipy as sp
import sscPySpin.classification as spin_class
import sscPySpin.feature_extraction as spin_feat_extraction
import sscPySpin.image as spin_img
import sscPySpin.segmentation as spin_seg
from sklearn import ensemble, model_selection, neighbors, neural_network, svm
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils import assert_all_finite, parallel_backend
from .. import aux_functions as functions
from .. import progressbar, utils
from sscAnnotat3D import cython
from .classifier_segmentation_module import ClassifierSegmentationModule


# @decorate_all_methods(timecall(immediate=False))
class SuperpixelSegmentationModule(ClassifierSegmentationModule):
    _module_name = "SuperpixelSegmentationModule"

    def __init__(self,
                 image,
                 superpixels,
                 auto_save=False,
                 workspace=os.path.join(Path.home().absolute().as_posix(), 'workspace_Annotat3D'),
                 parent=None,
                 **kwargs):

        super().__init__(image, auto_save, workspace, parent)

        self._cached_superpixel_features_ids = None
        self._training_superpixel_ids = {}
        self._superpixels = superpixels

        functions.log_usage(op_type='load_module_' + self._module_name,
                            feature_extraction_params=str(self._feature_extraction_params),
                            classifier_params=str(self._classifier_params),
                            superpixel_params=str(self._superpixel_params))

    def has_preprocess(self):
        return True

    def has_preview(self):
        return True

    def preprocess(self, slices=None):
        with sentry_sdk.start_transaction(name='Superpixel Segmentation Preprocess',
                                          op='superpixel classification') as t:
            image_params = {'shape': self._image.shape, 'dtype': self._image.dtype, 'params': self._superpixel_params}
            sentry_sdk.set_context('Image Params', image_params)
            mainbar = progressbar.get('main')

            mainbar.set_max(2)

            self.superpixels(slices)

            mainbar.inc()

            logging.debug('superpixels computed ...')
            self._update_min_max_superpixels()
            self._features = self._extract_features(self._image,
                                                    superpixels=self._superpixels,
                                                    min_superpixel_label=self._min_superpixel_label,
                                                    max_superpixel_label=self._max_superpixel_label)
            logging.debug('features computed ...')

            mainbar.inc()

            mainbar.reset()

    def reset_features(self, force_reset_loaded_data=False):
        super().reset_features(force_reset_loaded_data)
        self._cached_superpixel_features_ids = None
        self._training_superpixel_ids = {}

    def superpixels(self, selected_slices=None, **kwargs):

        total_start = time.time()
        # if self._flag_load is False:
        self.set_superpixel_parameters(**kwargs)

        params = {}

        if self._superpixels is None or selected_slices is not None:
            superpixel_type = self._superpixel_params['superpixel_type']

            if superpixel_type == 'waterpixels3d':
                params = self._extract_parameters_from_dict(self._superpixel_params,
                                                            'waterpixels')  # 3D waterpixels uses the same params
            else:
                params = self._extract_parameters_from_dict(self._superpixel_params, superpixel_type)

            logging.debug('Superpixel type: {} Parameters: {}'.format(superpixel_type, params))

            if selected_slices is not None:
                min_slice = min(selected_slices)
                max_slice = max(selected_slices)

                image = self._image[min_slice:max_slice + 1]
                superpixels, self.max_superpixel_label = functions.superpixel_extraction(
                    image, superpixel_type=superpixel_type, **params)

                self._superpixels = np.zeros(self._image.shape, dtype='int32')
                self._superpixels[min_slice:max_slice + 1] = superpixels
            else:
                image = self._image
                self._superpixels, self.max_superpixel_label = functions.superpixel_extraction(
                    image, superpixel_type=superpixel_type, **params)

            self.reset_features()

        total_end = time.time()
        total_user_time = total_end - total_start
        logging.debug("Superpixels %f s" % (total_user_time))

        try:
            functions.log_usage(op_type='superpixel_estimation_' + self._module_name,
                                image_path=self._image_path,
                                image_shape=tuple(self._image.shape),
                                image_dtype=str(self._image.dtype),
                                superpixel_params=str(params),
                                total_user_time=total_user_time)
        except Exception as e:
            functions.log_error(e)

        return self._superpixels

    def _extract_features(self, image, **kwargs):
        features = self._extract_features_superpixel(image, **kwargs)
        return features

    def _extract_features_for_training(self, annotations, features, **kwargs):
        self._extract_supervoxel_features_for_training(annotations, features, **kwargs)

    def _selected_superpixels(self, annotations, selected_slices, selected_axis):
        selected_slices_idx = self._selected_slices_idx(selected_slices, selected_axis)
        superpixels_slice = self._superpixels[selected_slices_idx]
        superpixel_ids = np.unique(superpixels_slice)
        selected_superpixels = [s for s in superpixel_ids if s > 0]
        return selected_superpixels

    def _preview_bounding_box(self, annotations, selected_slices, selected_axis):
        min_slice = min(selected_slices)
        max_slice = max(selected_slices)

        superpixel_coords = []

        for cur_slice in (min_slice, max_slice):
            selected_slices_idx = self._selected_slices_idx([cur_slice], selected_axis)

            # just selects the superpixels indexes from the selected slices
            superpixels_slice = self._superpixels[selected_slices_idx]
            superpixel_ids, indices = np.unique(superpixels_slice, return_index=True)
            superpixels_shape = superpixels_slice.shape

            for i, s in enumerate(superpixel_ids):
                p = indices[i]
                coord = list(spin_img.spin_get_voxel_coords_raw(superpixels_shape, p))
                coord[selected_axis] = cur_slice
                superpixel_coords.append(coord)
        superpixel_coords = np.array(superpixel_coords, dtype='int32')

        preview_bounding_box = spin_img.spin_selected_labels_bounding_box(self._superpixels,
                                                                          superpixel_coords,
                                                                          radius=1.0)

        return preview_bounding_box

    # bbox is a 6 valued tuple with z0, y0, x0, z1, y1, x1
    def boundingbox_idx(self, bbox):
        z0, y0, x0, z1, y1, x1 = bbox
        return [slice(z0, z1 + 1), slice(y0, y1 + 1), slice(x0, x1 + 1)]

    def _update_min_max_superpixels(self):
        superpixel_limits = spin_img.spin_min_max_region_id(self._superpixels, True)
        self._min_superpixel_label = superpixel_limits['min']
        self._max_superpixel_label = superpixel_limits['max']

    def preview(self, annotations, selected_slices, selected_axis, **kwargs):
        with sentry_sdk.start_transaction(name='Superpixel Segmentation Preview', op='superpixel classification') as t:
            image_params = {'shape': self._image.shape, 'dtype': self._image.dtype, 'params': self._superpixel_params}
            self.auto_save_data(annotations)

            # TODO: Estimate superpixels by blocks of slices because previews done across the Z-axis may present a high number
            # of superpixel ids, which will generate a large matrix
            if selected_axis != 0:
                valid, _ = self._validate_feature_extraction_memory_usage()

                if not valid:
                    raise Exception(
                        'Unable to compute preview for axis %s because too much memory may be consumed (beyond the accepted limit of %d GB). Please preview only on XY axis for now.'
                        % ('XZ' if selected_axis == 1 else 'YZ', self._estimate_feature_extraction_memory_usage() /
                           (1024.0 ** 3)))

            mainbar = progressbar.get('main')

            mainbar.set_max(4)

            mainbar.inc()
            total_time_start = time.time()

            image = self._image.astype('int32') if self._image.dtype != 'int32' else self._image

            mainbar.inc()
            start = time.time()
            # features = None
            # features = None

            ndim = self._superpixels.ndim
            # Initializing the bounding boxes for each marker
            with sentry_sdk.start_span(op='Initializing bounding boxes'):
                min_coord = np.zeros(ndim, dtype='int32')
                max_coord = np.array(self._superpixels.shape, dtype='int32') - 1

                preview_bounding_box = self._preview_bounding_box(annotations, selected_slices, selected_axis)

                end = time.time()

                logging.debug('Time to compute superpixel bounding boxes: %fs' % (end - start))

                preview_bounding_box = self._bounding_box_for_feat_extraction(preview_bounding_box, min_coord,
                                                                              max_coord)

                image_params['preview_bounding_box'] = preview_bounding_box
                sentry_sdk.set_context('Image Params', image_params)

                logging.debug('Feat extraction bounding box for preview'.format(preview_bounding_box))

                z0, y0, x0, z1, y1, x1 = preview_bounding_box
                preview_image = image[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1]
                preview_superpixels = self._superpixels[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1]

                training_time = test_time = assignment_time = 0.0

            mainbar.inc()

            logging.debug('preview_superpixels: {}'.format(preview_superpixels))

            logging.debug('Estimating superpixel features for preview area only (Cropped image shape: %s)' %
                          (str(preview_image.shape)))

            with sentry_sdk.start_span(op='Training classifier for preview'):
                classifier_trained, training_time = self._train_classifier(annotations,
                                                                           self._features,
                                                                           min_superpixel_id=self._min_superpixel_label)

            pred = None

            mainbar.inc()
            with sentry_sdk.start_span(op='Classify superpixels for preview'):
                if classifier_trained:
                    pred = np.zeros(self._image.shape, dtype='uint16')
                    preview_superpixel_limits = spin_img.spin_min_max_region_id(preview_superpixels, True)
                    min_superpixel_label = preview_superpixel_limits['min']
                    max_superpixel_label = preview_superpixel_limits['max']
                    selected_superpixels = self._selected_superpixels(annotations, selected_slices, selected_axis)
                    assignment_time, test_time, predict_times = self._classify_superpixels(
                        self._features, pred[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1], preview_superpixels,
                        selected_superpixels)
                    # min_superpixel_id=min_superpixel_label,
                    # max_superpixel_id=max_superpixel_label)

                    total_time = training_time + test_time + assignment_time

                    logging.info(
                        "Preview: Training time = %f s, Testing time = %f s, Label assignment time = %f s, Total time= %f s "
                        % (training_time, test_time, assignment_time, total_time))
                    logging.info('Preview: Finished')

            total_time_end = time.time()

            total_user_time = (total_time_end - total_time_start)
            logging.debug('Total user time = %f s' % (total_time_end - total_time_start))

            try:
                functions.log_usage(op_type='preview_' + self._module_name,
                                    image_path=self._image_path,
                                    image_shape=tuple(self._image.shape),
                                    image_dtype=str(self._image.dtype),
                                    num_preview_slices=len(selected_slices),
                                    preview_axis=selected_axis,
                                    num_selected_superpixels=len(selected_superpixels),
                                    superpixel_features_shape=tuple(self._features.shape),
                                    preview_bounding_box=str(preview_bounding_box),
                                    num_annotated_voxels=len(annotations),
                                    num_selected_markers=len(np.unique(list(map(itemgetter(1), annotations.values())))),
                                    feature_extraction_params=str(self._feature_extraction_params),
                                    classifier_params=str(self._classifier_params),
                                    classifier_trained=classifier_trained,
                                    training_time=training_time,
                                    test_time=test_time,
                                    predict_times=predict_times,
                                    assignment_time=assignment_time,
                                    total_user_time=total_user_time)

            except Exception as e:
                functions.log_error(e)

            mainbar.reset()

            return pred

    def has_superpixel_features_cached(self):
        cached_features = True
        if self._cached_superpixel_features_preview is not None:
            logging.debug(
                'min_superpixel_label, self._cached_superpixel_features_ids[0], max_superpixel_label, self._cached_superpixel_features_ids[1]: {} {} {} {}'
                .format(self._min_superpixel_label, self._cached_superpixel_features_ids[0], self._max_superpixel_label,
                        self._cached_superpixel_features_ids[1]))

            if self._min_superpixel_label < self._cached_superpixel_features_ids[0] or \
                    self._max_superpixel_label > self._cached_superpixel_features_ids[1]:
                cached_features = False
        else:
            cached_features = False
        return cached_features

    def execute(self, annotations, force_feature_extraction=False, **kwargs):
        with sentry_sdk.start_transaction(name='Superpixel Segmentation Apply', op='superpixel classification') as t:
            image_params = {'shape': self._image.shape, 'dtype': self._image.dtype, 'params': self._superpixel_params}
            sentry_sdk.set_context('Image Params', image_params)
            self.auto_save_data(annotations)

            mainbar = progressbar.get('main')

            mainbar.set_max(4)
            mainbar.inc()
            total_time_start = time.time()

            selected_superpixels = None
            preview_bounding_box = None
            image = self._image.astype('int32') if self._image.dtype != 'int32' else self._image

            superpixels = self._superpixels

            if 'selected_superpixels' in kwargs:
                selected_superpixels = kwargs['selected_superpixels']

            min_superpixel_label = 1
            max_superpixel_label = self.max_superpixel_label

            memory_splitting_factor = 2

            feature_extraction_time = 0.0

            with sentry_sdk.start_span(op='Feature extraction'):
                if self._features is None or force_feature_extraction:
                    valid, memory_splitting_factor = self._validate_feature_extraction_memory_usage(**kwargs)
                    if valid:
                        logging.debug('\n\n**** Extracting features for the entire image AT ONCE ****')
                        start_feature_extraction_time = time.time()

                        self._features = self._extract_features(image,
                                                                superpixels=superpixels,
                                                                min_superpixel_label=min_superpixel_label,
                                                                max_superpixel_label=max_superpixel_label,
                                                                **kwargs)

                        end_feature_extraction_time = time.time()

                        feature_extraction_time += end_feature_extraction_time - start_feature_extraction_time
                    else:
                        # Ensuring that superpixel features are disregarded. It might be the case that the user previously computed
                        # features that fit in memory, but now s/he is requesting features that do not fit in memory. Hence,
                        # we set it to None to ensure that they be recalculated
                        self._features = None

            features = self._features

            mainbar.inc()
            with sentry_sdk.start_span(op='Training classifier'):
                classifier_trained, training_time = self._train_classifier(annotations,
                                                                           features,
                                                                           min_superpixel_id=min_superpixel_label)

            pred = None
            test_time = assignment_time = 0.0

            mainbar.inc()

            with sentry_sdk.start_span(op='Classify superpixels'):
                if classifier_trained:

                    logging.debug('\n\n**** Predicting classification for the entire image ****')

                    pred = np.zeros(superpixels.shape, dtype='uint16')

                    test_time = assignment_time = 0.0
                    total_predict_times = {}

                    if features is None:
                        logging.debug('\n\n**** Extracting features for the entire image IN BLOCKS ****')

                        block_size = max(1, math.ceil(image.shape[0] // memory_splitting_factor))
                        logging.debug('**** Splitting image into blocks of %d slices' % block_size)

                        features_shape = np.zeros(2, dtype='int')
                        nblocks = 0

                        for z in range(0, image.shape[0], block_size):
                            z1 = min(image.shape[0], z + block_size)
                            logging.debug('**** Processing block (%d:%d)' % (z, z1 - 1))

                            image_block = image[z:z1]
                            superpixels_block = superpixels[z:z1]
                            pred_block = pred[z:z1]

                            start_feature_extraction_time = time.time()
                            superpixel_limits = spin_img.spin_min_max_region_id(superpixels_block, True)

                            min_superpixel_label = superpixel_limits['min']
                            max_superpixel_label = superpixel_limits['max']

                            features_block = self._extract_features(image_block,
                                                                    superpixels=superpixels_block,
                                                                    min_superpixel_label=min_superpixel_label,
                                                                    max_superpixel_label=max_superpixel_label,
                                                                    **kwargs)

                            end_feature_extraction_time = time.time()

                            assignment, test, predict_times = self._classify_superpixels(
                                features_block, pred_block, superpixels_block, None)
                            # min_superpixel_id=min_superpixel_label,
                            # max_superpixel_id=max_superpixel_label)

                            feature_extraction_time += end_feature_extraction_time - start_feature_extraction_time
                            test_time += test
                            assignment_time += assignment

                            cur_block_size = image_block.shape[0]
                            # Considering only the number of feature channels when computing superpixel features blockwise
                            features_shape += np.array(features_block.shape, dtype='int') * cur_block_size

                            if len(total_predict_times) == 0:
                                total_predict_times = predict_times
                            else:
                                for k in total_predict_times:
                                    total_predict_times[k] += predict_times[k]

                            # Feature shape is a weighted average combination of all feature shapes of each block
                            nblocks += cur_block_size
                        # Computing average amount of superpixel feature vectors computed per block
                        features_shape = (features_shape / max(1, nblocks)).astype('int32')

                    else:
                        features_shape = features.shape
                        assignment_time, test_time, total_predict_times = self._classify_superpixels(
                            features, pred, superpixels, selected_superpixels)
                        # min_superpixel_id=min_superpixel_label,
                        # max_superpixel_id=max_superpixel_label)

                    total_time = training_time + test_time + assignment_time

                    logging.info(
                        "Apply: Training time = %f s, Testing time = %f s, Label assignment time = %f s, Total time= %f s "
                        % (training_time, test_time, assignment_time, total_time))
                    logging.info('Apply: Finished')

            total_time_end = time.time()

            mainbar.inc()

            total_user_time = (total_time_end - total_time_start)
            logging.debug('Total user time = %f s' % (total_time_end - total_time_start))

            try:
                functions.log_usage(op_type='execute_' + self._module_name,
                                    image_path=self._image_path,
                                    image_shape=tuple(self._image.shape),
                                    image_dtype=str(self._image.dtype),
                                    superpixel_features_shape=tuple(map(int, features_shape)),
                                    num_annotated_voxels=len(annotations),
                                    num_selected_markers=len(np.unique(list(map(itemgetter(1), annotations.values())))),
                                    feature_extraction_params=str(self._feature_extraction_params),
                                    classifier_params=str(self._classifier_params),
                                    classifier_trained=classifier_trained,
                                    feature_extraction_time=feature_extraction_time,
                                    training_time=training_time,
                                    test_time=test_time,
                                    predict_times=total_predict_times,
                                    assignment_time=assignment_time,
                                    total_user_time=total_user_time)
            except Exception as e:
                functions.log_error(e)

            mainbar.reset()

            return pred

    def _classify_superpixels(self, superpixel_features_global, pred, superpixels, selected_superpixels=None):
        logging.debug("Predicting...")
        start = time.time()

        # we pass global features, so min_superpixel_id is always 1
        min_superpixel_id, max_superpixel_id = self._min_superpixel_label, self._max_superpixel_label
        superpixel_features = superpixel_features_global

        if selected_superpixels is not None:
            logging.info('selected superpixels: {}, {}'.format(np.min(selected_superpixels),
                                                               np.max(selected_superpixels)))
        logging.info('superpixels: {} {}'.format(superpixels.min(), superpixels.max()))
        logging.info('{}'.format(min_superpixel_id))

        if selected_superpixels is not None:
            superpixel_features = np.zeros((len(selected_superpixels), superpixel_features_global.shape[1]),
                                           dtype=superpixel_features_global.dtype)
            for i, s in enumerate(selected_superpixels):
                # logging.info('>>> {} {} {}'.format(s, i, min_superpixel_id))
                superpixel_features[i] = superpixel_features_global[s - min_superpixel_id]

        logging.info('superpixel_features: {} {} {} {}'.format(superpixel_features.mean(), superpixel_features.min(),
                                                               superpixel_features.max(), superpixel_features.shape))

        prediction, predict_times = self._predict_labels(superpixel_features)
        logging.info('-- Converting result to array')

        # prediction = np.array(prediction, dtype='uint16')
        # Copying prediction only for selected superpixels
        if selected_superpixels is not None:

            prediction_tmp = np.zeros(max_superpixel_id - min_superpixel_id + 1, dtype='uint16')
            for i, s in enumerate(selected_superpixels):
                prediction_tmp[s - min_superpixel_id] = prediction[i]
            prediction = prediction_tmp

        end = time.time()
        test_time = end - start

        logging.info("--> Completed")

        logging.info('Assigning superpixel labels to voxels')
        start = time.time()
        spin_seg.spin_label_from_classification(superpixels, pred, prediction, min_superpixel_id=min_superpixel_id)
        # pred[...] = np.take(prediction, superpixels-min_superpixel_id)
        end = time.time()
        logging.info('After assignment')

        assignment_time = end - start

        logging.info('-- Calling gc')

        return assignment_time, test_time, predict_times

    def _extract_features_superpixel(self, image, superpixels, min_superpixel_label, max_superpixel_label, **kwargs):

        feature_extraction_params = {**self._feature_extraction_params, **kwargs}
        superpixel_type = self._superpixel_params['superpixel_type']

        superpixel_features = functions.superpixel_feature_extraction(image,
                                                                      superpixels,
                                                                      min_label=min_superpixel_label,
                                                                      max_label=max_superpixel_label,
                                                                      superpixel_type=superpixel_type,
                                                                      **feature_extraction_params)
        # assert_all_finite(superpixel_features)

        try:
            max_level = feature_extraction_params['contextual_superpixel_feature_max_level']
        except Exception as e:
            logging.debug('Error {}'.format(e))
        else:
            if max_level > 0:
                logging.debug('Computing contextual superpixel features for %d levels' % (max_level))

                superpixel_features = functions.contextual_superpixel_features(superpixels,
                                                                               superpixel_features,
                                                                               max_level,
                                                                               connectivity=1)
        logging.debug('-- Estimated superpixel feature vectors shape {}'.format(superpixel_features.shape))

        return superpixel_features

    def set_superpixel(self, superpixels):
        self._superpixels = superpixels

        if superpixels is not None:
            self.max_superpixel_label = superpixels.max()
        else:
            self.max_superpixel_label = 0

    def get_superpixel(self):
        return self._superpixels

    # get labels for each trainining superpixel, using the majority voting of annotated pixel labels inside it
    # @timecall(immediate=False)
    def annotate_training_superpixels(self, annotation):
        logging.debug('Annotating training superpixels')
        self._training_features = []
        self._training_features_raw = []

        if len(annotation) > 0:
            mstart = time.time()
            superpixel_marker_labels = cython.annotation.superpixel_majority_voting(annotation, self._superpixels)
            mend = time.time()

            logging.debug('Majority voting ... {}'.format(mend - mstart))

            gstart = time.time()
            n = len(superpixel_marker_labels)
            self._training_labels = np.empty(n, dtype='int32')
            self._training_labels_raw = np.empty(n, dtype='int32')
            sorted_superpixel_marker_labels = sorted(superpixel_marker_labels)
            self._training_labels_raw[...] = self._training_labels[...] = list(
                itemgetter(*sorted_superpixel_marker_labels)(superpixel_marker_labels))
            self._training_superpixel_ids = superpixel_marker_labels

            gend = time.time()
            logging.debug('gather samples {}s'.format(gend - gstart))

    # @timecall(immediate=False)
    def _select_training_superpixel_features(self, superpixel_features, min_superpixel_id=1):
        nsamples = len(self._training_superpixel_ids)
        if isinstance(superpixel_features, dict):
            nfeats = len(next(iter(
                superpixel_features.values())))  # look how many chainned functions, this feel lispy as hell
        else:
            nfeats = superpixel_features.shape[1]

        self._training_features = np.empty((nsamples, nfeats), dtype='float32')
        self._training_features_raw = np.empty((nsamples, nfeats), dtype='float32')

        for i, superpixel_id in enumerate(sorted(self._training_superpixel_ids)):
            superpixel_id -= min_superpixel_id

            if isinstance(superpixel_features, dict):
                if superpixel_id not in superpixel_features:
                    raise Exception('Superpixel features not computed for superpixel %d (number of samples %d)' %
                                    (superpixel_id + min_superpixel_id, len(superpixel_features)))
            elif isinstance(superpixel_features, list) or isinstance(superpixel_features, np.ndarray):
                if not (0 <= superpixel_id < len(superpixel_features)):
                    raise Exception('Superpixel features not computed for superpixel %d (number of samples %d)' %
                                    (superpixel_id + min_superpixel_id, len(superpixel_features)))

            self._training_features_raw[i, ...] = superpixel_features[superpixel_id]
            # Saving training superpixel features *BEFORE SCALING* for posterior saving if necessary
            # self._training_features_raw[i, ...] = self._training_features[i, ...]

        #
        # if len(self._loaded_training_superpixel_features) > 0:
        #     logging.debug('--- (Training features loaded): Incorporating loaded training features')
        #     for f in self._loaded_training_superpixel_features:
        #         self._training_features_raw.append(f)

    def _extract_supervoxel_features_for_training(self, annotations, superpixel_features, **kwargs):
        min_superpixel_id = kwargs['min_superpixel_id']
        logging.debug('__extract_supervoxel_features_for_training -> kwargs {}'.format(kwargs))

        logging.debug('Features pre-extracted for the entire image. Annotating superpixels and selecting features')
        start = time.time()
        self.annotate_training_superpixels(annotations)
        end = time.time()
        logging.debug('Superpixel annotation time: {}s'.format(end - start))
        start = time.time()
        self._select_training_superpixel_features(superpixel_features, min_superpixel_id=min_superpixel_id)
        end = time.time()
        logging.debug('Training superpixel selection run time: {}s'.format(end - start))

    def _extract_supervoxel_features_for_training_by_annotations(self, annotations, **kwargs):
        logging.debug('[REMOVETHISCOMMENT FIXME]__extract_supervoxel_features_for_training_by_annotations')

        image = self._image.astype('int32') if self._image.dtype != 'int32' else self._image

        if self._superpixel_bboxes is None:
            self._superpixel_bboxes = {}
            start = time.time()
            values = spin_img.min_max_value(image, True)
            end = time.time()
            logging.debug(
                'Pre-computing image range for common usage in superpixel feature extraction for each scribble run time',
                end - start)
            self._image_range = (values['min'], values['max'])

        # list of all slices crossed by each marker
        marker_slices = self._slices_per_marker(annotations)
        # annotations contained within each slice
        single_slice_markers = self._single_slice_markers(marker_slices)
        # slices that contain annotation along axis Z (XZ or YZ)
        multi_slice_markers = self._multiple_slice_markers(marker_slices)

        logging.debug('training per slice ...')

        self._update_superpixel_bounding_boxes(annotations)

        # FIRST, we compute superpixel features for scribbles that were drawn on single slices, by extracting the feature maps
        # for each marked slice and then copying the superpixel feature vectors for the superpixels that were marked on a same slice
        slice_superpixel_features_dict = self._extract_supervoxel_features_for_training_per_slice(
            image, annotations, [list(marker_slices[mk_id])[0] for mk_id in single_slice_markers])

        logging.debug('training others ...')

        self._update_superpixel_bounding_boxes(annotations)

        # THEN, we compute training features on a per marker basis for markers that extend multiple slices (i.e., drawn on Z axis)
        superpixel_features_dict_multi_slice = self._extract_supervoxel_features_for_training_per_marker(
            image, annotations, multi_slice_markers)

        superpixel_features_dict = {**slice_superpixel_features_dict, **superpixel_features_dict_multi_slice}

        start = time.time()

        # HACK: setting min_superpixel_id to 0, since we are using duck typing to force __select_training_superpixel_features
        # to interpret the superpixel_features_dict dictionary as an array.
        self._select_training_superpixel_features(superpixel_features_dict, min_superpixel_id=0)

        end = time.time()

        logging.info('**** Superpixel training feature selection run time: {}s'.format(end - start))

    def _extract_supervoxel_features_for_training_per_marker(self, image, annotations, multi_slice_markers, **kwargs):
        superpixel_features_dict = {}

        if len(annotations) > 0 and len(multi_slice_markers) > 0:
            # Determining all marker ids
            marker_ids = multi_slice_markers

            ndim = image.ndim

            # Initializing the bounding boxes for each marker
            min_coord = np.zeros(ndim, dtype='int32')
            max_coord = np.array(image.shape, dtype='int32') - 1
            init_bbox = np.concatenate((max_coord, min_coord))
            bbox_markers = {mk_id: np.copy(init_bbox) for mk_id in multi_slice_markers}

            # ignore the single slice markers, included before
            multi_slice_annotations = {
                coord: (label, mk_id)
                for coord, (label, mk_id) in annotations.items() if mk_id in multi_slice_markers
            }

            start = time.time()
            superpixels_per_mk_id = {}
            # Computing the bounding boxes for each marker
            for coord, v in multi_slice_annotations.items():
                mk_id = v[1]
                superpixel_id = self._superpixels[coord]
                # Ensuring that 0-valued superpixels are disconsidered due to old bug that was fixed Nvidia Tesla K80. That bug was fixed.
                if superpixel_id > 0:

                    try:
                        bbox_markers[mk_id][:ndim] = np.minimum(bbox_markers[mk_id][:ndim],
                                                                self._superpixel_bboxes[superpixel_id][:ndim])
                        bbox_markers[mk_id][ndim:] = np.maximum(bbox_markers[mk_id][ndim:],
                                                                self._superpixel_bboxes[superpixel_id][ndim:])

                        if mk_id not in superpixels_per_mk_id:
                            superpixels_per_mk_id[mk_id] = set()

                        superpixels_per_mk_id[mk_id].add(superpixel_id)
                    except Exception as e:
                        logging.debug('mk_id: {}'.format(mk_id))
                        logging.debug('superpixel_id: {}'.format(superpixel_id))
                        import sys
                        sys.exit(1)

            end = time.time()

            logging.debug('****Superpixel box estimation run time: {}s'.format(end - start))

            # feat_extraction_context_margin = self._feat_extraction_context_margin()

            for mk_id in marker_ids:
                bbox = bbox_markers[mk_id]

                # bbox_min = np.maximum(min_coord, bbox[:ndim] - feat_extraction_context_margin)
                # bbox_max = np.minimum(max_coord, bbox[ndim:] + feat_extraction_context_margin)

                bbox = self._bounding_box_for_feat_extraction(bbox, min_coord, max_coord)

                bbox_min = bbox[:ndim]
                bbox_max = bbox[ndim:]

                start = time.time()
                image_crop = image[bbox_min[0]:bbox_max[0] + 1, bbox_min[1]:bbox_max[1] + 1,
                             bbox_min[2]:bbox_max[2] + 1]
                superpixels_crop = self._superpixels[bbox_min[0]:bbox_max[0] + 1, bbox_min[1]:bbox_max[1] + 1,
                                   bbox_min[2]:bbox_max[2] + 1]
                end = time.time()

                logging.info('**** Image cropping time: {}s'.format(end - start))

                start = time.time()
                values = spin_img.spin_min_max_region_id(superpixels_crop)
                min_superpixel_id, max_superpixel_id = values['min'], values['max']
                end = time.time()

                logging.info(
                    '**** Minimum/maximum superpixel value estimation in crop region run time {}s'.format(end - start))

                start = time.time()
                image_min = self._image_range[0]
                image_max = self._image_range[1]
                superpixel_features = self._extract_features_superpixel(image_crop,
                                                                        superpixels_crop,
                                                                        min_superpixel_id,
                                                                        max_superpixel_id,
                                                                        image_min=image_min,
                                                                        image_max=image_max)
                end = time.time()

                logging.info('**** Cropped image feature extraction run time {}s'.format(end - start))

                start = time.time()
                for s in superpixels_per_mk_id[mk_id]:
                    superpixel_features_dict[s] = np.copy(superpixel_features[s - min_superpixel_id])

                end = time.time()
                logging.info('**** Superpixel feature dict creation run time: {}'.format(end - start))

        return superpixel_features_dict

        # counts number of slices trespassed by a marker
        # helps to find single slice annotations and multiple slices annotations

    def _slices_per_marker(self, annotations):
        marker_slices = {}  # stores all slices that are reached by each marker
        for coord, (label, mk_id) in annotations.items():
            z = coord[0]
            if mk_id not in marker_slices:
                marker_slices[mk_id] = {z}
            else:
                marker_slices[mk_id].add(z)
        return marker_slices

    def _annotations_coords_per_slices(self, annotations):
        slice_coords = {}
        for coord, (label, mk_id) in annotations.items():
            z = coord[0]
            if z not in slice_coords:
                slice_coords[z] = {coord}
            else:
                slice_coords[z].add(coord)
        return slice_coords

    def _single_slice_markers(self, marker_slices):
        return [mk_id for mk_id in marker_slices if len(marker_slices[mk_id]) == 1]

    def _multiple_slice_markers(self, marker_slices):
        return [mk_id for mk_id in marker_slices if len(marker_slices[mk_id]) > 1]

    def _update_superpixel_bounding_boxes(self, annotations):
        # Computing the bounding boxes for each superpixel
        for coord, (label, mk_id) in annotations.items():
            superpixel_id = self._superpixels[coord]
            # Ensuring that 0-valued superpixels are disconsidered due to old bug that was fixed Nvidia Tesla K80. That bug was fixed.
            if superpixel_id > 0:
                if superpixel_id not in self._superpixel_bboxes:
                    self._superpixel_bboxes[superpixel_id] = spin_img.spin_selected_label_bounding_box(
                        self._superpixels, coord, radius=1.0)

    def _extract_supervoxel_features_for_training_per_slice(self, image, annotations, slices, **kwargs):
        logging.debug('[REMOVETHISCOMMENT FIXME]__extract_supervoxel_features_for_training_per_slice')

        superpixel_features_dict = {}

        if len(slices) > 0:
            ndim = image.ndim
            min_coord = np.zeros(ndim, dtype='int32')
            max_coord = np.array(self._superpixels.shape, dtype='int32') - 1

            # feat_extraction_context_margin = int(max(self._feature_extraction_params['sigmas']))

            coords_per_slices = self._annotations_coords_per_slices(annotations)

            for z in sorted(slices):
                logging.debug('\n\n**** Computing training features for slice %03d****\n' % z)

                # get all annotations on the slice z
                slice_annotations = {coord: annotations[coord] for coord in coords_per_slices[z]}

                bbox_slice = np.zeros(6, dtype='int32')
                bbox_slice[:ndim] = min_coord
                bbox_slice[ndim:] = max_coord
                bbox_slice[0] = bbox_slice[3] = z

                start = time.time()
                marked_superpixels = {self._superpixels[coord] for coord in coords_per_slices[z]}

                # Computing the bounding boxes for each superpixel
                for coord in slice_annotations.keys():
                    superpixel_id = self._superpixels[coord]
                    # Ensuring that 0-valued superpixels are disconsidered due to old bug that was fixed Nvidia Tesla K80. That bug was fixed.
                    if superpixel_id > 0:
                        bbox_slice[0] = np.minimum(bbox_slice[0], self._superpixel_bboxes[superpixel_id][0])
                        bbox_slice[3] = np.maximum(bbox_slice[3], self._superpixel_bboxes[superpixel_id][3])

                end = time.time()

                logging.info('**** Superpixel box estimation run time {}'.format(end - start))

                # bbox_slice[:ndim] = np.maximum(min_coord, bbox_slice[:ndim] - feat_extraction_context_margin)
                # bbox_slice[ndim:] = np.minimum(max_coord, bbox_slice[ndim:] + feat_extraction_context_margin

                bbox_slice = self._bounding_box_for_feat_extraction(bbox_slice, min_coord, max_coord)

                bbox_min = bbox_slice[:ndim]
                bbox_max = bbox_slice[ndim:]

                start = time.time()
                image_crop = image[bbox_min[0]:bbox_max[0] + 1, bbox_min[1]:bbox_max[1] + 1,
                             bbox_min[2]:bbox_max[2] + 1]
                superpixels_crop = self._superpixels[bbox_min[0]:bbox_max[0] + 1, bbox_min[1]:bbox_max[1] + 1,
                                   bbox_min[2]:bbox_max[2] + 1]
                end = time.time()

                logging.debug('\n\n**** Image cropping time {}s'.format(end - start))

                start = time.time()
                values = spin_img.spin_min_max_region_id(superpixels_crop)
                min_superpixel_id, max_superpixel_id = values['min'], values['max']
                end = time.time()

                logging.info(
                    '**** Minimum/maximum superpixel value estimation in crop region run time {}s'.format(end - start))

                start = time.time()
                image_min = self._image_range[0]
                image_max = self._image_range[1]

                extract_feats = False
                if self._cached_superpixel_features_dict is not None:
                    A = set(marked_superpixels)
                    B = set(self._cached_superpixel_features_dict.keys())
                    if A != B:  # if new superpixels features not cached
                        extract_feats = True
                else:
                    extract_feats = True

                if extract_feats:
                    use_cached_preview_slice_features = False
                    # If features have been computed for the preview slice and the superpixels are contained within them, then
                    # we try to create a training superpixel feature dictionary using them. NOTE THAT the minimum and maximum superpixel
                    # ids must match, since we just do not want to recompute the features for the current preview region (this should prevent
                    # issue with supervoxels -- i.e, 3D superpixels)

                    if self._cached_superpixel_features_preview is not None:
                        if min_superpixel_id == self._cached_superpixel_features_ids[0] and max_superpixel_id == \
                                self._cached_superpixel_features_ids[1]:
                            superpixel_features = self._cached_superpixel_features_preview
                            use_cached_preview_slice_features = True

                    # Otherwise, we extract features for the given slices
                    if not use_cached_preview_slice_features:
                        superpixel_features = self._extract_features_superpixel(image_crop,
                                                                                superpixels_crop,
                                                                                min_superpixel_id,
                                                                                max_superpixel_id,
                                                                                image_min=image_min,
                                                                                image_max=image_max)
                end = time.time()

                logging.debug('**** Cropped image feature extraction run time {}s'.format(end - start))

                start = time.time()
                if extract_feats:
                    logging.debug('**** Caching training superpixel features')
                    for s in marked_superpixels:
                        superpixel_features_dict[s] = np.copy(superpixel_features[s - min_superpixel_id])

                    self._cached_superpixel_features_dict = superpixel_features_dict
                else:
                    logging.debug('**** Using cached features for training')
                    superpixel_features_dict = self._cached_superpixel_features_dict

                end = time.time()
                logging.debug('**** Superpixel feature dict creation run time {}s'.format(end - start))

        return superpixel_features_dict

    # TODO : don't forget to document this function
    def load_classifier(self, path: str = ""):
        """
        Function that load the classifier as .model extension

        Args:
            path (str): string to load the classifier

        Returns:
            (bool, str, dict): returns a tuple that contains in this order : a boolean with the response, a str with the error msg if the boolean is False and a dict that contains the information to update the front-end component

        """
        resp, msg, model_complete = ClassifierSegmentationModule.load_classifier(self, path)
        return resp, msg, model_complete

    def save_classifier(self, path: str = "", superpixel_state: dict = None, feature_extraction_params: dict = None):
        """
        Function that save the classifier as .model extension

        Args:
            path (str): string to save the classifier
            superpixel_state (dict): dict that contains information about the superpixel
            feature_extraction_params (dict): dict that contains the feature_extraction_params chosen by the user

        Returns:
            (bool, str, dict): returns a tuple that contains in this order : a boolean with the response, a str with the error msg if the boolean is False and a dict that contains the information to update the front-end component

        """
        resp, msg, model_complete = ClassifierSegmentationModule.save_classifier(self, path, superpixel_state,
                                                                                 feature_extraction_params)
        return resp, msg, model_complete
