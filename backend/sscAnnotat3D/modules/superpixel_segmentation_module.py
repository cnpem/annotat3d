import gc
import logging
import math
import os.path
import pickle
import shutil
import time
from operator import itemgetter
from pathlib import Path

import numpy as np
import scipy as sp
from collections import defaultdict
import sentry_sdk
import sscPySpin.image as spin_img
import sscPySpin.segmentation as spin_seg
from sklearn import ensemble, model_selection, neighbors, neural_network, svm
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils import assert_all_finite, parallel_backend
from sscAnnotat3D import cython
from harpia.featureExtraction import superpixel_pooling_feature

from .. import aux_functions as functions
from .. import progressbar, utils
from .classifier_segmentation_module import ClassifierSegmentationModule


# @decorate_all_methods(timecall(immediate=False))
class SuperpixelSegmentationModule(ClassifierSegmentationModule):
    _module_name = "SuperpixelSegmentationModule"

    def __init__(
        self,
        image,
        superpixels,
        auto_save=False,
        workspace=os.path.join(Path.home().absolute().as_posix(), "workspace_Annotat3D"),
        parent=None,
        **kwargs
    ):

        super().__init__(image, auto_save, workspace, parent)

        self._cached_superpixel_features_ids = None
        self._training_superpixel_ids = {}
        self._superpixels = superpixels

        functions.log_usage(
            op_type="load_module_" + self._module_name,
            feature_extraction_params=str(self._feature_extraction_params),
            classifier_params=str(self._classifier_params),
            superpixel_params=str(self._superpixel_params),
        )

    def has_preprocess(self):
        return True

    def has_preview(self):
        return True

    def preprocess(self, slices=None):
        with sentry_sdk.start_transaction(
            name="Superpixel Segmentation Preprocess", op="superpixel classification"
        ) as t:
            image_params = {"shape": self._image.shape, "dtype": self._image.dtype, "params": self._superpixel_params}
            sentry_sdk.set_context("Image Params", image_params)
            mainbar = progressbar.get("main")

            mainbar.set_max(2)

            self.superpixels(slices)

            mainbar.inc()

            logging.debug("superpixels computed ...")
            self._update_min_max_superpixels()
            self._features = self._extract_features(
                self._image,
                superpixels=self._superpixels,
                min_superpixel_label=self._min_superpixel_label,
                max_superpixel_label=self._max_superpixel_label,
            )
            logging.debug("features computed ...")

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
            superpixel_type = self._superpixel_params["superpixel_type"]

            if superpixel_type == "waterpixels3d":
                params = self._extract_parameters_from_dict(
                    self._superpixel_params, "waterpixels"
                )  # 3D waterpixels uses the same params
            else:
                params = self._extract_parameters_from_dict(self._superpixel_params, superpixel_type)

            logging.debug("Superpixel type: {} Parameters: {}".format(superpixel_type, params))

            if selected_slices is not None:
                min_slice = min(selected_slices)
                max_slice = max(selected_slices)

                image = self._image[min_slice : max_slice + 1]
                superpixels, self.max_superpixel_label = functions.superpixel_extraction(
                    image, superpixel_type=superpixel_type, **params
                )

                self._superpixels = np.zeros(self._image.shape, dtype="int32")
                self._superpixels[min_slice : max_slice + 1] = superpixels
            else:
                image = self._image
                self._superpixels, self.max_superpixel_label = functions.superpixel_extraction(
                    image, superpixel_type=superpixel_type, **params
                )

            self.reset_features()

        total_end = time.time()
        total_user_time = total_end - total_start
        logging.debug("Superpixels %f s" % (total_user_time))

        try:
            functions.log_usage(
                op_type="superpixel_estimation_" + self._module_name,
                image_path=self._image_path,
                image_shape=tuple(self._image.shape),
                image_dtype=str(self._image.dtype),
                superpixel_params=str(params),
                total_user_time=total_user_time,
            )
        except Exception as e:
            functions.log_error(e)

        return self._superpixels

    def _extract_features(self, image, **kwargs):
        features = self._extract_features_superpixel(image, **kwargs)
        return features

    def _selected_superpixels(self, selected_slices, selected_axis):
        selected_slices_idx = self._selected_slices_idx(selected_slices, selected_axis)
        superpixels_slice = self._superpixels[selected_slices_idx]
        superpixel_ids = np.unique(superpixels_slice)
        selected_superpixels = [s for s in superpixel_ids if s > 0]
        return selected_superpixels

    def _preview_bounding_box(self, selected_slices, selected_axis):
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
        superpixel_coords = np.array(superpixel_coords, dtype="int32")

        preview_bounding_box = spin_img.spin_selected_labels_bounding_box(
            self._superpixels, superpixel_coords, radius=1.0
        )

        return preview_bounding_box

    # bbox is a 6 valued tuple with z0, y0, x0, z1, y1, x1
    def boundingbox_idx(self, bbox):
        z0, y0, x0, z1, y1, x1 = bbox
        return [slice(z0, z1 + 1), slice(y0, y1 + 1), slice(x0, x1 + 1)]

    def _update_min_max_superpixels(self):
        superpixel_limits = spin_img.spin_min_max_region_id(self._superpixels, True)
        self._min_superpixel_label = superpixel_limits["min"]
        self._max_superpixel_label = superpixel_limits["max"]

    def train(self, annotation_slice_dict, annotation_image, finetune: bool = False, **kwargs):
        """
        Train the superpixel classifier on the provided annotations.
        Stores the trained classifier and features in this object.

        Args:
            annotation_slice_dict (dict): annotation slices
            annotation_image (ndarray): full annotation image
            finetune (bool): whether to fine-tune an already trained classifier
            **kwargs: extra params for feature extraction
        """
        with sentry_sdk.start_transaction(name="Superpixel Segmentation Train", op="superpixel classification") as t:
            if len(annotation_slice_dict) <= 0:
                return None, []

            _,_ = self._select_training_superpixel_features(annotation_image, annotation_slice_dict, **kwargs)
            # Extract features for full image if not already done
            if self._features is None:
                with sentry_sdk.start_span(op="Feature extraction for training"):
                    logging.debug(f"Extracting features for full image with shape {self._image.shape}")
                    self._features = self._extract_features_superpixel(self._image, self._superpixels)

            # Train classifier
            with sentry_sdk.start_span(op="Training classifier"):
                classifier_trained, training_time, selected_features_names = self._train_classifier(
                    finetune=finetune,
                )

            self._classifier_trained = classifier_trained
            self._selected_features_names = selected_features_names

            return classifier_trained, selected_features_names


    def preview(self, selected_slices, selected_axis, **kwargs):
        """
        Generate a preview segmentation for the given slice/axis using the trained classifier.

        Args:
            selected_slices (list[int]): slice indices chosen by the user
            selected_axis (int): axis index (0,1,2)
            **kwargs: extra params for feature extraction

        Returns:
            pred_output (ndarray): preview segmentation (-1 for pixels outside the slice)
            selected_features_names (list): names of features used in training
        """
        if not getattr(self, "_classifier_trained", False):
            raise Exception("No trained classifier available. Please call train() first.")

        with sentry_sdk.start_transaction(name="Superpixel Segmentation Preview", op="superpixel classification") as t:
            image_params = {"shape": self._image.shape, "dtype": self._image.dtype, "params": self._superpixel_params}

            # Bounding box around selected slice(s)
            with sentry_sdk.start_span(op="Initializing bounding boxes"):
                min_coord = np.zeros(self._superpixels.ndim, dtype="int32")
                max_coord = np.array(self._superpixels.shape, dtype="int32") - 1

                preview_bounding_box = self._preview_bounding_box(selected_slices, selected_axis)
                preview_bounding_box = self._bounding_box_for_feat_extraction(preview_bounding_box, min_coord, max_coord)

                z0, y0, x0, z1, y1, x1 = preview_bounding_box
                preview_image = self._image[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1]
                preview_superpixels = self._superpixels[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1]

            logging.debug(f"Estimating superpixel features for preview (cropped shape: {preview_image.shape})")

            pred_output = None
            with sentry_sdk.start_span(op="Classify superpixels for preview"):
                # Create output maps
                pred_output = np.zeros(self._image.shape, dtype="int32") - 1
                pred = np.zeros(self._image.shape, dtype="uint16")

                # Classify selected superpixels only
                selected_superpixels = self._selected_superpixels(selected_slices, selected_axis)
                assignment_time, test_time, predict_times = self._classify_superpixels(
                    self._features,
                    pred[z0:z1 + 1, y0:y1 + 1, x0:x1 + 1],
                    preview_superpixels,
                    selected_superpixels,
                )

                # Assign predictions into output for frontend
                index = [slice(None)] * pred.ndim
                index[selected_axis] = selected_slices[0]
                pred_output[tuple(index)] = pred[tuple(index)]

            try:
                functions.log_usage(
                    op_type="preview_" + self._module_name,
                    image_path=self._image_path,
                    image_shape=tuple(self._image.shape),
                    image_dtype=str(self._image.dtype),
                    num_preview_slices=len(selected_slices),
                    preview_axis=selected_axis,
                    num_selected_superpixels=len(selected_superpixels),
                    superpixel_features_shape=tuple(self._features.shape),
                    preview_bounding_box=str(preview_bounding_box),
                    feature_extraction_params=str(self._feature_extraction_params),
                    classifier_params=str(self._classifier_params),
                    classifier_trained=self._classifier_trained,
                    selected_features=self._selected_features_names,
                )
            except Exception as e:
                functions.log_error(e)

            return pred_output, self._selected_features_names

    def has_superpixel_features_cached(self):
        cached_features = True
        if self._cached_superpixel_features_preview is not None:
            logging.debug(
                "min_superpixel_label, self._cached_superpixel_features_ids[0], max_superpixel_label, self._cached_superpixel_features_ids[1]: {} {} {} {}".format(
                    self._min_superpixel_label,
                    self._cached_superpixel_features_ids[0],
                    self._max_superpixel_label,
                    self._cached_superpixel_features_ids[1],
                )
            )

            if (
                self._min_superpixel_label < self._cached_superpixel_features_ids[0]
                or self._max_superpixel_label > self._cached_superpixel_features_ids[1]
            ):
                cached_features = False
        else:
            cached_features = False
        return cached_features

    def execute(self, annotation_slice_dict, annotation_image, force_feature_extraction=False, **kwargs):
        with sentry_sdk.start_transaction(name="Superpixel Segmentation Apply", op="superpixel classification") as t:
            image_params = {"shape": self._image.shape, "dtype": self._image.dtype, "params": self._superpixel_params}
            sentry_sdk.set_context("Image Params", image_params)

            mainbar = progressbar.get("main")

            mainbar.set_max(4)
            mainbar.inc()
            total_time_start = time.time()

            selected_superpixels = None
            preview_bounding_box = None
            image = self._image.astype("int32") if self._image.dtype != "int32" else self._image

            superpixels = self._superpixels

            if "selected_superpixels" in kwargs:
                selected_superpixels = kwargs["selected_superpixels"]

            min_superpixel_label = 1
            max_superpixel_label = self.max_superpixel_label

            memory_splitting_factor = 2

            feature_extraction_time = 0.0

            with sentry_sdk.start_span(op="Feature extraction"):
                if self._features is None or force_feature_extraction:
                    #valid, memory_splitting_factor = self._validate_feature_extraction_memory_usage(**kwargs)
                    valid = True
                    if valid:
                        logging.debug("\n\n**** Extracting features for the entire image AT ONCE ****")
                        start_feature_extraction_time = time.time()

                        self._features = self._extract_features(
                            image,
                            superpixels=superpixels,
                            min_superpixel_label=min_superpixel_label,
                            max_superpixel_label=max_superpixel_label,
                            **kwargs
                        )

                        end_feature_extraction_time = time.time()

                        feature_extraction_time += end_feature_extraction_time - start_feature_extraction_time
                    else:
                        # Ensuring that superpixel features are disregarded. It might be the case that the user previously computed
                        # features that fit in memory, but now s/he is requesting features that do not fit in memory. Hence,
                        # we set it to None to ensure that they be recalculated
                        self._features = None

            features = self._features

            mainbar.inc()
            with sentry_sdk.start_span(op="Training classifier"):
                classifier_trained, training_time, selected_features_names = self._train_classifier(
                    annotation_slice_dict, annotation_image, features
                )

            pred = None
            test_time = assignment_time = 0.0

            mainbar.inc()

            with sentry_sdk.start_span(op="Classify superpixels"):
                if classifier_trained:

                    logging.debug("\n\n**** Predicting classification for the entire image ****")

                    pred = np.zeros(superpixels.shape, dtype="uint16")

                    test_time = assignment_time = 0.0
                    total_predict_times = {}

                    if features is None:
                        logging.debug("\n\n**** Extracting features for the entire image IN BLOCKS ****")

                        block_size = max(1, math.ceil(image.shape[0] // memory_splitting_factor))
                        logging.debug("**** Splitting image into blocks of %d slices" % block_size)

                        features_shape = np.zeros(2, dtype="int")
                        nblocks = 0

                        for z in range(0, image.shape[0], block_size):
                            z1 = min(image.shape[0], z + block_size)
                            logging.debug("**** Processing block (%d:%d)" % (z, z1 - 1))

                            image_block = image[z:z1]
                            superpixels_block = superpixels[z:z1]
                            pred_block = pred[z:z1]

                            start_feature_extraction_time = time.time()
                            superpixel_limits = spin_img.spin_min_max_region_id(superpixels_block, True)

                            min_superpixel_label = superpixel_limits["min"]
                            max_superpixel_label = superpixel_limits["max"]

                            features_block = self._extract_features(
                                image_block,
                                superpixels=superpixels_block,
                                min_superpixel_label=min_superpixel_label,
                                max_superpixel_label=max_superpixel_label,
                                **kwargs
                            )

                            end_feature_extraction_time = time.time()

                            assignment, test, predict_times = self._classify_superpixels(
                                features_block, pred_block, superpixels_block, None
                            )
                            # min_superpixel_id=min_superpixel_label,
                            # max_superpixel_id=max_superpixel_label)

                            feature_extraction_time += end_feature_extraction_time - start_feature_extraction_time
                            test_time += test
                            assignment_time += assignment

                            cur_block_size = image_block.shape[0]
                            # Considering only the number of feature channels when computing superpixel features blockwise
                            features_shape += np.array(features_block.shape, dtype="int") * cur_block_size

                            if len(total_predict_times) == 0:
                                total_predict_times = predict_times
                            else:
                                for k in total_predict_times:
                                    total_predict_times[k] += predict_times[k]

                            # Feature shape is a weighted average combination of all feature shapes of each block
                            nblocks += cur_block_size
                        # Computing average amount of superpixel feature vectors computed per block
                        features_shape = (features_shape / max(1, nblocks)).astype("int32")

                    else:
                        features_shape = features.shape
                        assignment_time, test_time, total_predict_times = self._classify_superpixels(
                            features, pred, superpixels, selected_superpixels
                        )
                        # min_superpixel_id=min_superpixel_label,
                        # max_superpixel_id=max_superpixel_label)

                    total_time = training_time + test_time + assignment_time

                    logging.info(
                        "Apply: Training time = %f s, Testing time = %f s, Label assignment time = %f s, Total time= %f s "
                        % (training_time, test_time, assignment_time, total_time)
                    )
                    logging.info("Apply: Finished")

            total_time_end = time.time()

            mainbar.inc()

            total_user_time = total_time_end - total_time_start
            logging.debug("Total user time = %f s" % (total_time_end - total_time_start))

            try:
                functions.log_usage(
                    op_type="execute_" + self._module_name,
                    image_path=self._image_path,
                    image_shape=tuple(self._image.shape),
                    image_dtype=str(self._image.dtype),
                    superpixel_features_shape=tuple(map(int, features_shape)),
                    feature_extraction_params=str(self._feature_extraction_params),
                    classifier_params=str(self._classifier_params),
                    classifier_trained=classifier_trained,
                    feature_extraction_time=feature_extraction_time,
                    training_time=training_time,
                    test_time=test_time,
                    predict_times=total_predict_times,
                    assignment_time=assignment_time,
                    total_user_time=total_user_time,
                )
            except Exception as e:
                functions.log_error(e)

            mainbar.reset()

            return pred, selected_features_names

    def _classify_superpixels(self, superpixel_features_global, pred, superpixels, selected_superpixels=None):
        logging.debug("Predicting...")
        start = time.time()

        # we pass global features, so min_superpixel_id is always 1
        min_superpixel_id, max_superpixel_id = self._min_superpixel_label, self._max_superpixel_label
        superpixel_features = superpixel_features_global

        if selected_superpixels is not None:
            logging.info(
                "selected superpixels: {}, {}".format(np.min(selected_superpixels), np.max(selected_superpixels))
            )
        logging.info("superpixels: {} {}".format(superpixels.min(), superpixels.max()))
        logging.info("{}".format(min_superpixel_id))

        if selected_superpixels is not None:
            superpixel_features = np.zeros(
                (len(selected_superpixels), superpixel_features_global.shape[1]), dtype=superpixel_features_global.dtype
            )
            for i, s in enumerate(selected_superpixels):
                # logging.info('>>> {} {} {}'.format(s, i, min_superpixel_id))
                superpixel_features[i] = superpixel_features_global[s - min_superpixel_id]

        logging.info(
            "superpixel_features: {} {} {} {}".format(
                superpixel_features.mean(),
                superpixel_features.min(),
                superpixel_features.max(),
                superpixel_features.shape,
            )
        )

        prediction, predict_times = self._predict_labels(superpixel_features)
        logging.info("-- Converting result to array")

        # prediction = np.array(prediction, dtype='uint16')
        # Copying prediction only for selected superpixels
        if selected_superpixels is not None:

            prediction_tmp = np.zeros(max_superpixel_id - min_superpixel_id + 1, dtype="uint16")
            for i, s in enumerate(selected_superpixels):
                prediction_tmp[s - min_superpixel_id] = prediction[i]
            prediction = prediction_tmp

        end = time.time()
        test_time = end - start

        logging.info("--> Completed")

        logging.info("Assigning superpixel labels to voxels")
        start = time.time()
        spin_seg.spin_label_from_classification(superpixels, pred, prediction, min_superpixel_id=min_superpixel_id)
        # pred[...] = np.take(prediction, superpixels-min_superpixel_id)
        end = time.time()
        logging.info("After assignment")

        assignment_time = end - start

        logging.info("-- Calling gc")

        return assignment_time, test_time, predict_times

    def set_superpixel(self, superpixels):
        self._superpixels = superpixels

        if superpixels is not None:
            self.max_superpixel_label = superpixels.max()
        else:
            self.max_superpixel_label = 0

    def get_superpixel(self):
        return self._superpixels


    def superpixel_majority_voting(self, annotation_slice_dict, annotation_image, superpixels):
        superpixel_slices_ids = []
        pixel_labels = []
        start = time.time()
        for axis, slice_nums in annotation_slice_dict.items():
            annot_slices = np.take(annotation_image, list(slice_nums), axis=axis)
            superpixel_slices = np.take(superpixels, list(slice_nums), axis=axis)

            bool_mask = annot_slices >= 0

            superpixel_slices_ids.append(superpixel_slices[bool_mask])
            pixel_labels.append(annot_slices[bool_mask])

        superpixel_slices_ids = np.concatenate(superpixel_slices_ids)
        pixel_labels = np.concatenate(pixel_labels)

        majority = cython.annotation.cython_majority_vote(superpixel_slices_ids, pixel_labels)

        return majority

    def _select_training_superpixel_features(
        self,
        annotation_image: np.ndarray,
        annotation_slice_dict: dict[int, list[int]],
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Extracts superpixel features in slice blocks and assigns labels via majority voting.

        Returns
        -------
        X_all : np.ndarray (nsuperpixels, nfeatures)
            Feature matrix
        Y_all : np.ndarray (nsuperpixels,)
            Labels (-1 if unlabeled)
        """
        print(self._feature_extraction_params)

        feature_args, sigmas, total_features = functions.build_feature_args(**self._feature_extraction_params)

        num_superpixels = int(self.superpixels.max()) + 1
        X_all = np.zeros((num_superpixels, total_features), dtype="float32") ##features
        Y_all = np.full(num_superpixels, -1, dtype="int16") ##labels

        # --- sort slice indices per axis
        axis_indices = {axis: sorted(indices) for axis, indices in annotation_slice_dict.items()}

        # --- group consecutive slices into blocks
        def consecutive_blocks(indices):
            blocks, block = [], []
            for i, idx in enumerate(indices):
                if i == 0 or idx == indices[i - 1] + 1:
                    block.append(idx)
                else:
                    blocks.append(block)
                    block = [idx]
            if block:
                blocks.append(block)
            return blocks

        axis_blocks = {axis: consecutive_blocks(idxs) for axis, idxs in axis_indices.items()}

        # --- iterate in round-robin, but with blocks instead of single slices
        interleaved_blocks = [
            (axis, block)
            for blocks in zip(*map(lambda a: axis_blocks[a], sorted(axis_blocks)))
            for axis, block in enumerate(blocks)
        ]

        for axis, block in interleaved_blocks:
            # stack slices along axis to build a block
            if axis == 0:
                superpixel_block = self.superpixels[block, :, :].copy()
                image_block = self.image[block, :, :].copy()
                label_block = annotation_image[block, :, :].copy()
            elif axis == 1:
                superpixel_block = self.superpixels[:, block, :].copy()
                image_block = self.image[:, block, :].copy()
                label_block = annotation_image[:, block, :].copy()

            elif axis == 2:
                superpixel_block = self.superpixels[:, :, block].copy()
                image_block = self.image[:, :, block].copy()
                label_block = annotation_image[:, :, block].copy()

            else:
                raise ValueError(f"Invalid axis {axis}")

            n_spid_min = superpixel_block.min()
            #n_superpixels_block = superpixel_block.max() - n_spid_min + 1

            # reshape to 3D (C, Y, X) style for pooling
            image_block = image_block.reshape(1, *image_block.shape)
            superpixel_block = superpixel_block.reshape(1, *superpixel_block.shape) - n_spid_min

            # --- feature extraction
            feat_tmp = superpixel_pooling_feature(image_block, superpixel_block, sigmas, features=feature_args)

            # --- assign to global IDs
            unique_ids = np.unique(superpixel_block)
            X_all[unique_ids + n_spid_min] = feat_tmp[unique_ids]

            # --- majority voting labels
            maj_labels_local = self.superpixel_majority_voting(superpixel_block, label_block)
            Y_all[unique_ids + n_spid_min] = maj_labels_local[unique_ids]

        # --- final filtering
        valid_mask = Y_all >= 0
        X_all = X_all[valid_mask]
        Y_all = Y_all[valid_mask]

        self._training_features = X_all
        self._training_features_raw = X_all  # Raw training features before scaling, used for saving features if necessary
        self._training_labels_raw = Y_all


        return X_all, Y_all

    def _extract_supervoxel_features_for_training(self, annotation_slice_dict, annotation_image, superpixel_features, **kwargs):
        #min_superpixel_id = kwargs["min_superpixel_id"]
        logging.debug("__extract_supervoxel_features_for_training -> kwargs {}".format(kwargs))

        #logging.debug("Features pre-extracted for the entire image. Annotating superpixels and selecting features")
        #start = time.time()
        #self.annotate_training_superpixels(annotation_slice_dict, annotation_image)
        #end = time.time()
        #logging.debug("Superpixel annotation time: {}s".format(end - start))
        start = time.time()

        self._select_training_superpixel_features(annotation_slice_dict, superpixel_features)
        end = time.time()
        logging.debug("Training superpixel selection run time: {}s".format(end - start))

    def save_classifier(
        self,
        path: str = "",
        superpixel_state: dict = None,
        feature_extraction_params: dict = None,
    ):
        # 1. Call parent
        resp, msg, model_complete = super().save_classifier(
            path, superpixel_state, feature_extraction_params
        )

        return resp, msg, model_complete

    
    def load_classifier(self, path=""):
        # runs the parent method on THIS instance (self)
        resp, msg, model_complete = super().load_classifier(path)

        return resp, msg, model_complete