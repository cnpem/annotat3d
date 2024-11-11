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
from sscAnnotat3D import aux_functions as functions
from sscAnnotat3D import progressbar, utils

from .classifier_segmentation_module import ClassifierSegmentationModule


class PixelSegmentationModule(ClassifierSegmentationModule):
    _module_name = "PixelSegmentationModule"

    def __init__(
        self,
        image,
        auto_save=False,
        workspace=os.path.join(Path.home().absolute().as_posix(), "workspace_Annotat3D"),
        parent=None,
        **kwargs
    ):

        super().__init__(image, auto_save, workspace, parent)

        self._superpixel_params["pixel_segmentation"] = True

        functions.log_usage(
            op_type="load_module_" + self._module_name,
            feature_extraction_params=str(self._feature_extraction_params),
            classifier_params=str(self._classifier_params),
            superpixel_params=str(self._superpixel_params),
        )

        if not utils.headless_mode():
            utils.add_variable_console({"segmentation": self})

    def _get_annotations_bounding_box(self, annotations):
        if len(annotations) > 0:
            coords = np.array([coord for coord in annotations.keys()])
            bbox_min = coords.min(axis=0)
            bbox_max = coords.max(axis=0) + 1
            return bbox_min, bbox_max

    def _extract_voxel_features_for_training_by_annotations(self, annotations, **kwargs):
        image = self._image.astype("int32") if self._image.dtype != "int32" else self._image

        # find bounding box for feature extraction
        bbox_min, bbox_max = self._get_annotations_bounding_box(annotations)

        image_crop = image[bbox_min[0] : bbox_max[0] + 1, bbox_min[1] : bbox_max[1] + 1, bbox_min[2] : bbox_max[2] + 1]

        pixel_map = functions.pixel_feature_extraction(image_crop, **kwargs)
        # nfeats, z, y, x = pixel_map.shape

        n_annotations = len(annotations)
        n_feats = pixel_map.shape[0]
        self._training_features_raw = np.empty((n_annotations, n_feats), dtype="float32")
        self._training_labels_raw = np.empty(n_annotations, dtype="float32")

        for idx, (coord, (label, mk_id)) in enumerate(list(annotations.items())):
            self._training_features_raw[idx] = pixel_map[
                (slice(None), *(coord - bbox_min))
            ]  # get all features from coordinate
            self._training_labels_raw[idx] = label

    def _extract_features_for_training(self, annotations, features, **kwargs):

        self._extract_voxel_features_for_training(annotations, features, **kwargs)

    def _extract_features(self, image, **kwargs):
        features = self._extract_features_pixel(image, **kwargs)
        return features

    def _preview_bounding_box(self, annotations, selected_slices, selected_axis):
        bbox_min, bbox_max = self._get_annotations_bounding_box(annotations)
        preview_bounding_box = np.array((*bbox_min, *bbox_max))
        return preview_bounding_box

    def _extract_features_pixel(self, image, **kwargs):
        pixel_feat_map = functions.pixel_feature_extraction(image, **{**self._feature_extraction_params, **kwargs})

        return pixel_feat_map

    def _classify_pixels(self, pixel_map):
        start = time.time()
        nfeats, z, y, x = pixel_map.shape
        pixel_features = pixel_map.reshape((nfeats, z * y * x)).T
        prediction, prediction_times = self._predict_labels(pixel_features)
        end = time.time()
        test_time = end - start
        start_assignment = time.time()
        pred_map = prediction.reshape((z, y, x))
        end_assignment = time.time()
        assignment_time = end_assignment - start_assignment
        logging.debug("-- Calling gc")
        return pred_map, assignment_time, test_time, prediction_times

    def _select_training_pixel_features(self, annotations, pixel_features):

        coords = [coord for coord in annotations.keys()]

        # bbox_min, bbox_max = self._get_annotations_bounding_box(annotations)#TODO: avoid compute twice

        n_annotations = len(annotations)
        n_feats = pixel_features.shape[0]
        # self._training_features = [None] * n_annotations
        self._training_features_raw = np.empty((n_annotations, n_feats), dtype="float32")
        # self._training_labels = [None] * n_annotations
        self._training_labels_raw = np.empty(n_annotations, dtype="float32")

        pixel_map = pixel_features

        idx = 0
        for coord, (label, mk_id) in annotations.items():
            self._training_features_raw[idx] = pixel_map[(slice(None), *(coord))]
            self._training_labels_raw[idx] = label
            idx += 1

    def _extract_voxel_features_for_training(self, annotations, pixel_features, **kwargs):
        if pixel_features is None:
            self._extract_voxel_features_for_training_by_annotations(
                annotations, **{**kwargs, **self._feature_extraction_params}
            )
        else:
            self._select_training_pixel_features(annotations, pixel_features)

        self._training_labels = np.array(self._training_labels_raw)
        self._training_features = np.array(self._training_features_raw)

    def preview(self, annotations, selected_slices, selected_axis, **kwargs):
        """
        This function is responsible to make all operations when the user click in the "preview" option bar

        Args:
            annotations (array): array that contain information about the image annotations
            selected_slices (array): it's the slice choose by the user
            selected_axis (int): it's the axis slice choose by the user
            **kwargs (dict): a dict that contains information about the image

        Returns:
                array: this function returns a numpy array that's the image preview

        Notes:
            The variables selected_slices and selected_axis aren't being used in this function

        """

        with sentry_sdk.start_transaction(name="Pixel Segmentation Preview", op="pixel classification") as t:
            image_params = {"shape": self._image.shape, "dtype": self._image.dtype}
            if len(annotations) <= 0:
                return

            self.auto_save_data(annotations)

            if selected_axis != 0:
                valid, _ = self._validate_feature_extraction_memory_usage()

                if not valid:
                    raise Exception(
                        "Unable to compute preview for axis %s because too much memory may be consumed (beyond the accepted limit of %d GB). Please preview only on XY axis for now."
                        % ("XZ" if selected_axis == 1 else "YZ", self._maxself._annotations_mem_usage / (1024.0**3))
                    )

            mainbar = progressbar.get("main")

            mainbar.set_max(4)

            mainbar.inc()
            total_time_start = time.time()

            image = self._image.astype("int32") if self._image.dtype != "int32" else self._image

            mainbar.inc()
            start = time.time()

            ndim = self._image.ndim
            # Initializing the bounding boxes for each marker
            with sentry_sdk.start_span(op="Initializing bounding boxes"):
                min_coord = np.zeros(ndim, dtype="int32")
                max_coord = np.array(self._image.shape, dtype="int32") - 1

                preview_bounding_box = self._preview_bounding_box(annotations, selected_slices, selected_axis)
                image_params["preview_bounding_box"] = preview_bounding_box
                sentry_sdk.set_context("Image Params", image_params)

                end = time.time()

                logging.debug("Time to compute superpixel bounding boxes: %fs" % (end - start))
                logging.debug("Selected preview bounding box for preview {}".format(preview_bounding_box))

                preview_bounding_box = self._bounding_box_for_feat_extraction(
                    preview_bounding_box, min_coord, max_coord
                )

                logging.debug("Feat extraction bounding box for preview {}".format(preview_bounding_box))

                z0, y0, x0, z1, y1, x1 = preview_bounding_box

                selected_slices_idx = self._selected_slices_idx(selected_slices, selected_axis)
                training_time = test_time = assignment_time = 0.0

            mainbar.inc()
            # Computing superpixel features only for the portion of the image that is necessary, if superpixel features have not
            # been previously computed
            if self._features is None:

                with sentry_sdk.start_span(op="Feature extraction for preview"):
                    preview_image = image[selected_slices_idx]
                    preview_features = self._extract_features_pixel(preview_image, **kwargs)

                logging.debug("Training classifier for preview")
                # IMPORTANT: the computed superpixel features cannot be used for training, since they correspond to the features computed only for
                # the preview region. Hence, annotations may have been done for other slices so we force the training to recompute only what is
                # necessary, since it caches superpixel features as well
                with sentry_sdk.start_span(op="Training classifier for preview"):
                    classifier_trained, training_time, selected_features_names = self._train_classifier(
                        annotations, None
                    )
            else:
                preview_features = self._features[[slice(None), *selected_slices_idx]]
                logging.debug("Training classifier for preview from features estimated for the entire image")
                with sentry_sdk.start_span(op="Training classifier for preview"):
                    classifier_trained, training_time, selected_features_names = self._train_classifier(
                        annotations, self._features
                    )

            pred = None

            mainbar.inc()
            with sentry_sdk.start_span(op="Classify pixels for preview"):
                if classifier_trained:
                    # FOR PREVIEW THE IMAGE IS OF INT32 TO ALLOW NEGATIVE VALUES THAT WONT RENDER IN THE FRONTEND
                    pred = np.zeros(self._image.shape, dtype="int32") - 1
                    pred[selected_slices_idx], assignment_time, test_time, predict_times = self._classify_pixels(
                        preview_features
                    )

                    logging.debug("bounding box: {} {} {}".format((z0, z1), (y0, y1), (x0, x1)))
                    total_time = training_time + test_time + assignment_time

                    logging.debug(
                        "(Preview) Training time = %f s, Testing time = %f s, Label assignment time = %f s, Total time= %f s "
                        % (training_time, test_time, assignment_time, total_time)
                    )
                    logging.debug("(Preview) Finished")

            total_time_end = time.time()

            total_user_time = total_time_end - total_time_start
            logging.debug("Total user time = %f s" % (total_time_end - total_time_start))

            try:
                functions.log_usage(
                    op_type="preview_" + self._module_name,
                    image_path=self._image_path,
                    image_shape=tuple(self._image.shape),
                    image_dtype=str(self._image.dtype),
                    num_preview_slices=len(selected_slices),
                    preview_axis=selected_axis,
                    superpixel_features_shape=tuple(preview_features.shape),
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
                    total_user_time=total_user_time,
                )

            except Exception as e:
                functions.log_error(e)

            mainbar.reset()

            return pred, selected_features_names

    def execute(self, annotations, force_feature_extraction=False, **kwargs):
        """
        This function is responsible to make all operations when the user click in the "execute" option bar

        Args:
            annotations (array): array that contain information about the image annotations
            force_feature_extraction (bool): it's a flag that activate extract all features in the entire image
            **kwargs (dict): a dict that contains information about the image

        Returns:
            array: this function returns the final numpy array

        """

        with sentry_sdk.start_transaction(name="Pixel Segmentation Apply", op="pixel classification") as t:
            image_params = {"shape": self._image.shape, "dtype": self._image.dtype}
            sentry_sdk.set_context("Image Params", image_params)
            if len(annotations) <= 0:
                return

            self.auto_save_data(annotations)

            mainbar = progressbar.get("main")

            mainbar.set_max(4)
            mainbar.inc()
            total_time_start = time.time()

            image = self._image.astype("int32") if self._image.dtype != "int32" else self._image
            memory_splitting_factor = 2

            feature_extraction_time = 0.0
            with sentry_sdk.start_span(op="Feature extraction"):
                if self._features is None or force_feature_extraction:
                    valid, memory_splitting_factor = self._validate_feature_extraction_memory_usage(**kwargs)
                    if valid:
                        logging.debug("**** Extracting features for the entire image AT ONCE ****")
                        start_feature_extraction_time = time.time()

                        self._features = self._extract_features(image, **kwargs)

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
                    annotations, features
                )

            pred = None
            test_time = assignment_time = 0.0

            mainbar.inc()

            with sentry_sdk.start_span(op="Classify pixels"):
                if classifier_trained:

                    logging.debug("\n\n**** Predicting classification for the entire image ****")

                    pred = np.zeros(self._image.shape, dtype="int32")

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
                            start_feature_extraction_time = time.time()

                            features_block = self._extract_features(image_block, **kwargs)

                            end_feature_extraction_time = time.time()

                            pred[z:z1], assignment, test, predict_times = self._classify_pixels(features_block)

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
                        pred[...], assignment_time, test_time, total_predict_times = self._classify_pixels(features)

                    total_time = training_time + test_time + assignment_time

                    logging.debug(
                        "Training time = %f s, Testing time = %f s, Label assignment time = %f s, Total time= %f s "
                        % (training_time, test_time, assignment_time, total_time)
                    )
                    logging.debug("Finished")

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
                    total_user_time=total_user_time,
                )
            except Exception as e:
                functions.log_error(e)

            mainbar.reset()
            return pred, selected_features_names

    def has_preview(self):
        """
        This function always return True and represents that an image have a preview

        Returns:
            True

        Notes:
            maybe this function is not being used anywhere

        """
        return True

    def has_preprocess(self):
        """
        This function always return False and represents that a pre-processing was applied in the image

        Returns:
            False

        Notes:
            maybe this function is not being used anywhere

        """
        return False

    def preprocess(self, slices=None):
        """
        Function that just pass if in slice image that had a pre-process

        Args:
            slices (tuple[int, int]): tuple that represent the slice that had a pre-process

        Returns:
            None

        Notes:
            maybe this function is not being used anywhere

        """
        pass

    def get_superpixel(self):
        """
        Function that get the image superpixel

        Returns:
            None

        Notes:
            This function is deprecated and need to be removed as soon as possible

        """
        return None

    def set_superpixel(self, superpixel):
        """
        Function that set the image superpixel

        Args:
            superpixel (array): a numpy array that's represent the image superpixel

        Returns:
            None

        Notes:
            This function is deprecated and need to be removed as soon as possible

        """

        pass

        # TODO : don't forget to document this function
        def load_classifier(self, path: str = ""):
            resp, msg, model_complete = ClassifierSegmentationModule.load_classifier(self, path)
            return resp, msg, model_complete

        def save_classifier(
            self, path: str = "", superpixel_state: dict = None, feature_extraction_params: dict = None
        ):
            resp, msg, model_complete = ClassifierSegmentationModule.save_classifier(
                self, path, superpixel_state, feature_extraction_params
            )
            return resp, msg, model_complete
