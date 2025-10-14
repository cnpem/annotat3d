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

    def extract_pixel_features_in_blocks(
        self,
        annotation_slice_dict: dict[int, list[int]],
        annotation_image: np.ndarray,
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Extract pixel-level features in consecutive slice blocks across axes.

        Parameters
        ----------
        img : np.ndarray
            Input image (3D).
        annotation_slice_dict : dict[int, list[int]]
            Dict mapping axis -> list of annotated slice indices.
        annotation_image : np.ndarray
            Label image (same shape as img).

        Returns
        -------
        X_all : np.ndarray
            Feature matrix, shape (N_pixels, num_features).
        Y_all : np.ndarray
            Corresponding labels, shape (N_pixels,).
        """

        # --- helper: split consecutive indices into blocks
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



        # --- prepare blocks per axis
        axis_indices = {axis: sorted(indices) for axis, indices in annotation_slice_dict.items()}
        axis_blocks = {axis: consecutive_blocks(idxs) for axis, idxs in axis_indices.items()}

        # --- round-robin interleave of blocks
        from itertools import zip_longest
        interleaved_blocks = []
        for group in zip_longest(*[axis_blocks[a] for a in sorted(axis_blocks)], fillvalue=None):
            for axis, block in enumerate(group):
                if block is not None:
                    interleaved_blocks.append((axis, block))

        print(interleaved_blocks)
        print(annotation_slice_dict)
        # --- feature + label accumulation
        X_all, Y_all = [], []

        for axis, block in interleaved_blocks:
            # build a block (can be >1 slices if consecutive)
            if axis == 0:
                image_block = self.image[block, :, :]
                label = annotation_image[block, :, :]
            elif axis == 1:
                image_block = self.image[:, block, :]
                label = annotation_image[:, block, :]
            elif axis == 2:
                image_block = self.image[:, :, block]
                label = annotation_image[:, :, block]
            else:
                raise ValueError(f"Invalid axis {axis}")

            # reshape into (1, Y, X) style
            if image_block.ndim == 2:
                image_block = image_block.reshape(1, *image_block.shape)

            # feature extraction
            features = functions.pixel_feature_extraction(image_block, **self._feature_extraction_params)

            # flatten block features + labels
            X_all.append(features.reshape(features.shape[0], -1).T)  # (N_pixels_block, num_features)
            Y_all.append(label.ravel())                              # (N_pixels_block,)

        # --- concatenate everything
        X_all = np.vstack(X_all)
        Y_all = np.hstack(Y_all)

        # --- mask unlabeled pixels
        valid_mask = Y_all >= 0
        X_all = X_all[valid_mask]
        Y_all = Y_all[valid_mask]

        self._training_features = X_all
        self._training_features_raw = X_all
        self._training_labels_raw = Y_all
        
        return X_all, Y_all

    def train(self, annotation_slice_dict, annotation_image, finetune: bool = False):
        """
        Train the pixel classifier on the provided annotations.
        Stores the trained classifier and feature set in this object.

        Args:
            annotation_slice_dict (dict): annotation slices
            annotation_image (ndarray): full annotation image
            finetune (bool): whether to fine-tune an already trained classifier
            **kwargs: extra params for feature extraction
        """
        with sentry_sdk.start_transaction(name="Pixel Segmentation Train", op="pixel classification") as t:
            if len(annotation_slice_dict) <= 0:
                return None, []

            _,_ = self.extract_pixel_features_in_blocks(annotation_slice_dict, annotation_image)

            # train classifier
            with sentry_sdk.start_span(op="Training classifier"):
                classifier_trained, training_time, selected_features_names = self._train_classifier(finetune=finetune
                )

            # === NEW: keep track of full state for saving ===
            self._classifier_trained = classifier_trained
            self._selected_features_names = selected_features_names
            self._training_labels = annotation_image.ravel()   # or better: the labels actually passed to _train_classifiermes

            return classifier_trained, selected_features_names


    def preview(self, selected_slices, selected_axis, **kwargs):
        """
        Generate a preview segmentation for the given slice/axis using the trained classifier.

        Args:
            selected_slices (list[int]): slice indices chosen by the user
            selected_axis (int): axis index (0,1,2)
            **kwargs: extra params for feature extraction

        Returns:
            pred (ndarray): preview segmentation (int32, -1 = unlabeled)
            selected_features_names (list): names of features used in training
        """
        if not getattr(self, "_classifier_trained", False):
            raise Exception("No trained classifier available. Please call train() first.")

        with sentry_sdk.start_transaction(name="Pixel Segmentation Preview", op="pixel classification") as t:
            image = self._image.astype("float32") if self._image.dtype != "float32" else self._image
            selected_slices_idx = self._selected_slices_idx(selected_slices, selected_axis)

            # extract features just for preview slice if global features not used
            if self._features is None:
                with sentry_sdk.start_span(op="Feature extraction for preview"):
                    preview_image = image[selected_slices_idx]
                    logging.debug(f"Extracting features for preview image with shape {preview_image.shape}")
                    preview_features =  functions.pixel_feature_extraction(preview_image, **self._feature_extraction_params)
            else:
                preview_features = self._features[[slice(None), *selected_slices_idx]]

            pred = np.zeros(self._image.shape, dtype="int32") - 1
            with sentry_sdk.start_span(op="Classify pixels for preview"):
                pred[selected_slices_idx], assignment_time, test_time, predict_times = self._classify_pixels(
                    preview_features
                )

            # optional logging
            try:
                functions.log_usage(
                    op_type="preview_" + self._module_name,
                    image_path=self._image_path,
                    image_shape=tuple(self._image.shape),
                    image_dtype=str(self._image.dtype),
                    num_preview_slices=len(selected_slices),
                    preview_axis=selected_axis,
                    superpixel_features_shape=tuple(preview_features.shape),
                    feature_extraction_params=str(self._feature_extraction_params),
                    classifier_params=str(self._classifier_params),
                    classifier_trained=self._classifier_trained,
                    selected_features=self._selected_features_names,
                )
            except Exception as e:
                functions.log_error(e)

            return pred, self._selected_features_names

    def execute(self, annotation_slice_dict, annotation_image, force_feature_extraction=False, finetune = False, **kwargs):
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
            if len(annotation_slice_dict) <= 0:
                return

            mainbar = progressbar.get("main")

            mainbar.set_max(4)
            mainbar.inc()
            total_time_start = time.time()

            image = self._image.astype("int32") if self._image.dtype != "int32" else self._image
            memory_splitting_factor = 2

            feature_extraction_time = 0.0
            with sentry_sdk.start_span(op="Feature extraction"):
                if self._features is None or force_feature_extraction:
                    #valid, memory_splitting_factor = self._validate_feature_extraction_memory_usage(superpixel=False, **kwargs)
                    valid = True
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
            if finetune == False:
                with sentry_sdk.start_span(op="Training classifier"):
                    classifier_trained, training_time, selected_features_names = self._train_classifier(
                        annotation_slice_dict, annotation_image, features
                    )
            else:
                classifier_trained = True
                training_time = 0.0
                selected_features_names = None

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
                            # I don't know why this was previously done like this, but it was bugged.
                            #features_shape += np.array(features_block.shape, dtype="int") * cur_block_size
                            if len(total_predict_times) == 0:
                                total_predict_times = predict_times
                            else:
                                for k in total_predict_times:
                                    total_predict_times[k] += predict_times[k]

                            # Feature shape is a weighted average combination of all feature shapes of each block
                            nblocks += cur_block_size
                        # Computing average amount of superpixel feature vectors computed per block
                        #features_shape = (features_shape / max(1, nblocks)).astype("int32")
                        #get number of features and size of image for features shape
                        features_shape = (features_block.shape[0], *image.shape)
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
        self._classifier_trained = True
        resp, msg, model_complete = super().load_classifier(path)
        model_complete
        self._selected_features_names = model_complete["feature_extraction_params_front"]

        return resp, msg, model_complete