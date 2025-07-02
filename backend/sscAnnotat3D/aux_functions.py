#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# -----------------------------------------------------------------------------
# Copyright (c) Vispy Development Team. All Rights Reserved.
# Distributed under the (new) BSD License. See LICENSE.txt for more info.
# -----------------------------------------------------------------------------
# vispy: gallery 2

from __future__ import division

import copy
import datetime
import itertools
import json
import logging
import os
import re
import time
import traceback
from enum import Enum
from operator import itemgetter
from pathlib import Path

import cv2
import h5py
import numpy as np
import skimage.filters.rank as rank
import skimage.io
import skimage.measure as sk_measure
import sscPySpin.feature_extraction as spin_feat_extraction
import sscPySpin.image as spin_img
import sscPySpin.segmentation as spin_seg
from harpia.featureExtraction.pixelfeatureExtraction import pixel_feature_extract
from sscAnnotat3D.cython.superpixel_feature_pooling import pooling_per_superpixel

from matplotlib import pyplot as plt
from skimage import exposure, filters, img_as_uint
from skimage.feature import greycomatrix, greycoprops, local_binary_pattern
from skimage.future.graph import rag
from skimage.morphology import disk, square
from skimage.segmentation import (
    felzenszwalb,
    mark_boundaries,
    quickshift,
    slic,
    watershed,
)
from sklearn import linear_model, preprocessing, svm
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import GridSearchCV, train_test_split
from sscIO import io, io_info

from . import binary, utils

# from sscAnnotat3D.widgets_image import hdf5_widget, raw_widget

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)


def app_name():
    """
    Function that returns the name of the application. More precisely, always return Annotat3D

    Returns:
        string:returns the string Annotat3D

    """

    return "Annotat3D"


def log_error(exception):
    """
    Function that writes the log errors

    Args:
        exception (string): An exception variable

    Returns:
        None

    """
    with open(os.path.join(Path.home().absolute().as_posix(), "%s_error_log.txt" % app_name()), "a+") as f:
        f.write("**** Error on:" + str(datetime.datetime.now()) + "****\n")
        traceback.print_tb(exception.__traceback__, file=f)
        f.write("Exception:" + str(exception))
        f.write("\n\n")


def log_usage(op_type, **kwargs):
    """
    This function creates the usage log for Annotat3D

    Args:
        op_type (string): it's the operation type string
        **kwargs (dict): it's a dict that contains the data information

    Returns:
        None

    """

    with open(os.path.join(Path.home().absolute().as_posix(), "%s_usage_log.txt" % app_name()), "a+") as f:
        data = kwargs
        op_time = str(datetime.datetime.now())
        sys_info = os.uname()
        op_sys = {
            "sysname": str(sys_info[0]),
            "nodename": str(sys_info[1]),
            "release": str(sys_info[2]),
            "version": str(sys_info[3]),
            "machine": str(sys_info[4]),
        }
        data["op_type"] = op_type
        data["op_time"] = op_time
        data["op_system_info"] = op_sys
        data_json = json.dumps(data)
        f.write("**** Usage on:" + op_time + "****\n")
        f.write(data_json + "\n\n")


def save_3d_image_to_shared_memory(image, xsize, ysize, zsize, dtype):
    """
    Function that save a 3D image into the shared memory

    Args:
        image (array): it's a numpy.array that represents the image
        xsize (int): the image x size
        ysize (int): the image y size.
        zsize (int): the image z size.
        dtype (string): it's the image dtype string

    Returns:
        None

    """
    image = spin_img.spin_save_image_to_shared_memory(image, xsize, ysize, zsize, dtype)


# TODO this can be slow in big data
# but should be removed with float support on sscPySpin
def _min_max(data):
    return np.min(data), np.max(data)


def test_model(model, test_indices1, test_indices2):
    """
    Function that test the model

    Args:
        model (object): it's the model that will be tested
        test_indices1 (array): it's a numpy.array that contains data to test the model
        test_indices2 (array): it's another numpy.array that contains data to test the model. In this actual point, this variable does nothing in thins function

    Returns:
        dict: returns a dict that contains the results of the model

    """

    scaler = preprocessing.MinMaxScaler()
    validation = []
    mean = []
    return_result = []

    # for i in range(len(test_indices1)):
    #    array_aux[i]=test_indices1[i]

    result = model.predict(test_indices1)
    # for img_test_mean_list in array_aux:#,ground_truth_test): ground_truth_test_slice

    # model_segmentation_labels = model.predict(scaler.fit_transform(img_test_mean_list))

    # return_result.append(model_segmentation_labels)
    return result  # return_result


def print_superpixels(ground_truth, segments):
    """
    Function that print the image superpixels

    Args:
        ground_truth (array): a numpy array that represents the gt of an image
        segments (array): a numpy array that represents the image segments of an image

    Returns:
        None

    """
    rescaled_ground_truth = exposure.rescale_intensity(copy.deepcopy(ground_truth))
    plt.figure(figsize=(10, 10))
    plt.imshow(mark_boundaries(rescaled_ground_truth, segments, color=(0, 1, 0)))
    plt.show()


def mask_from_superpixel(superpixel_masks_binary, superpixel_labels):
    """
    Function that applies the superpixel ground truth (gt) on each superpixel label


    Args:
        superpixel_masks_binary (array): a numpy array that represents the image maks
        superpixel_labels (array): a numpy array that represents each superpixel label

    Returns:
        array: a numpy array that is the result of the apllication of each mask in each superpixel label

    """
    superpixel_binary = np.zeros_like(superpixel_masks_binary[0])
    for i in range(len(superpixel_masks_binary)):
        superpixel_masks_binary[i][superpixel_masks_binary[i] == 1] = superpixel_labels[i]
        superpixel_binary += superpixel_masks_binary[i]
    return superpixel_binary


def validation_metrics(model, scaler, test_indices1, test_indices2, ground_truth_test):
    """
    Function that creates that validate the model

    Args:
        model (object): it's tensorflow/keras model
        scaler (object): it's the sklearn.preprocessing.StandardScaler
        test_indices1 (list[int]): it's a list that contains the first part of the test data indices
        test_indices2(list[int]): it's a list that contains the second part of the test data indices
        ground_truth_test (list[int]): it's a list that contains the ground truth

    Returns:
        (float, float): the mean accuracy of this model, the mean accuracy of the superpixel

    """
    validation = []
    superpixel_validation = []
    for test_indices1_slice, test_indices2_slice, ground_truth_test_slice in zip(
        test_indices1, test_indices2, ground_truth_test
    ):
        # Model validation
        features = scaler.transform(test_indices1_slice)
        model_segmentation_labels = model.predict(features)
        model_segmentation = mask_from_label(
            copy.deepcopy(ground_truth_test_slice),
            copy.deepcopy(model_segmentation_labels),
            copy.deepcopy(test_indices2_slice),
        )

        # Superpixels validation
        ground_truth_labels = labels_from_ground_truth(
            copy.deepcopy(test_indices2_slice), copy.deepcopy(ground_truth_test_slice)
        )

        best_segmentation = mask_from_superpixel(copy.deepcopy(test_indices2_slice), copy.deepcopy(ground_truth_labels))

        # plt.figure(figsize=(20, 10))
        # plt.subplot(131)
        # plt.imshow(model_segmentation)

        # plt.subplot(132)
        # plt.imshow(best_segmentation)

        # plt.subplot(133)
        # plt.imshow(ground_truth_test_slice)
        # plt.show()

        if len(np.unique(best_segmentation)) == 1:
            superpixel_validation.append((0, 0, 0, 0, 0, 0))
        else:
            superpixel_validation.append(validation_indices(best_segmentation, ground_truth_test_slice))

        if len(np.unique(model_segmentation)) == 1:
            validation.append((0, 0, 0, 0, 0, 0))
        else:
            validation.append(validation_indices(model_segmentation, ground_truth_test_slice))

        mean = np.mean(validation, axis=0)
        superpixel_mean = np.mean(superpixel_validation, axis=0)
    return mean, superpixel_mean


def mask_from_label(img, labels, mask_list):
    """
    This function creates the binary mask from the label

    Args:
        img (array): it's a numpy array that represents the image
        labels (list[int]): it's a list that contains the labels
        mask_list (list[int][int]): a 2-D list (matrix) that represents the mask of each label

    Returns:
        array: this function returns a numpy.array that represents the binary mask of this image

    """
    for i in range(len(labels)):
        mask_list[i][mask_list[i] != 0] = labels[i]
    mask = np.uint16(np.zeros_like(img))
    for i in mask_list:
        mask = mask + i
    return mask


def enforce_extension(filepath, ext):
    """
    Function that take as parameters a file path and his extension and creates a full path
    string that contains the filepath and the extension.

    Args:
        filepath (string): it's the path string
        ext (string): it's the file extension string

    Returns:
        string: returns the full path with the file extension

    Notes:
        This function is used just to verify the path string integrity and make the corrections if necessary

    """
    ext = ["." + s for s in ext.split(".") if s]
    fileext = Path(filepath).suffixes
    if ext == fileext:
        return filepath

    basename = filepath
    for s in fileext:
        basename = basename.replace(s, "")

    fullname = "".join([basename, *ext])
    return fullname


def pixel_feature_extraction(img, **kwargs):
    """
    Function that extracts feature from pixels

    Args:
        img (array): it's a numpy array that represents the numpy array image
        **kwargs (int, int, int): three int variable that represents the number of gpus, image min and image max pixel

    Returns:
        array: a numpy array that contains the features of an image

    """
    #ngpus = -1 if "ngpus" not in kwargs else kwargs["ngpus"]
    #image_min = -1 if "image_min" not in kwargs else int(kwargs["image_min"])
    #image_max = -1 if "image_max" not in kwargs else int(kwargs["image_max"])

    #block_size_feats = 64

    start = time.time()

    sigmas = list(map(float, kwargs["sigmas"]))

    selected_features = kwargs["selected_features"]

    features_args = {
        'Intensity': 'intensity' in selected_features,
        'Edges': 'edges' in selected_features,
        'Hessian': 'texture' in selected_features,
        'ShapeIndex': 'shapeindex' in selected_features,
        'LocalBinaryPattern': 'localbinarypattern' in selected_features
    }


    print("................\n")
    print("Multi Scale Window Sigmas:", sigmas)
    print("Selected features:", [k for k, v in features_args.items() if v])
    img_float = img.astype('float32')
    if img_float.ndim == 2:
        img_float = np.expand_dims(img_float, axis = 0)
    elif img_float.shape[0]==0:
        import traceback
        raise ValueError(
            f"Input image has zero size along the first dimension. "
        )
    print(img_float.shape)
    print("................\n")
    pixel_features = pixel_feature_extract(img_float, sigmas, False, features_args)
    print("................\n")

    end = time.time()
    logger.debug(f"-- Feature extraction run time: {end - start}s")

    return pixel_features


def superpixel_feature_extraction(
    img,
    img_superpixels,
    selected_features,
    sigmas,
    selected_supervoxel_feat_pooling,
    min_label,
    max_label,
    superpixel_type,
    **kwargs,
):
    """
    Function that extracts features in superpixel images

    Args:
        img (array): a numpy array that represents the image
        img_superpixels (array): a numpy array that represents the superpixel image
        selected_features (array): a numpy array that contains the selected features from the image
        sigmas (list[float]): a float list that contains values of sigma
        selected_supervoxel_feat_pooling (array): a numpy array that contains the selected supervoxels with pooling
        min_label (int): represents the minimum quantity of labels in a image
        max_label (int): represents the maximum quantity of labels in a image
        superpixel_type (string): it's a string that represents the superpixel type
        **kwargs (int, int, int): three int variable that represents the number of gpus, image min and image max pixel

    Returns:
        array: this function returns a numpy array that represents the superpixel features

    """

    num_superpixels = max_label - min_label + 1

    start = time.time()
    print(sigmas)
    intensity = 'intensity' in selected_features
    edges = 'edges' in selected_features
    texture = 'texture' in selected_features
    
    img_float = img.astype('float32')

    features_args = {
        'Intensity': 'intensity' in selected_features,
        'Edges': 'edges' in selected_features,
        'Hessian': 'texture' in selected_features,
        'ShapeIndex': 'shapeindex' in selected_features,
        'LocalBinaryPattern': 'localbinarypattern' in selected_features
    }
    print("................\n")
    pixel_features = pixel_feature_extract(img_float, sigmas, False, features_args)
    print("................\n")


    end = time.time()

    logger.debug(f"-- Feature extraction memory allocation run time: {end - start}s")

    start = time.time()

    superpixel_features = pooling_per_superpixel(pixel_features, img_superpixels, num_superpixels, selected_supervoxel_feat_pooling)
    
    end = time.time()
    logger.debug(f"-- Feature extraction run time: {end - start}s")

    return superpixel_features


def contextual_superpixel_features(superpixels, features, max_level, connectivity=1):
    """
    Function that takes extract contextual features from superpixels

    Args:
        superpixels (array): a numpy array that represents the superpixel
        features (array): a numpy array that contains the superpixel features
        max_level (int): an int value that caps the max level to go on the graph
        connectivity (int): an int value that makes the connection between neighborhood pixels

    Returns:
        array: returns a numpy array that contains the extracted contextual features from superpixels

    """
    start = time.time()
    nfeats = features.shape[1]
    contextual_features = np.zeros((features.shape[0], nfeats * (max_level + 1)), dtype="float32")

    G = rag.RAG(superpixels, connectivity=connectivity)

    logger.debug(f"RAG computation time: {time.time() - start}s")

    for n in G.nodes():
        nneighbors = np.zeros(max_level + 1, dtype="int32")
        visited = set([n])
        level = 0
        Q = [(n, level)]
        while len(Q) > 0:
            s, level = Q.pop(0)

            # Summing the values of the features of the 'adjacent' node 's' in the current level to the node 'n' being assessed
            for f in range(nfeats):
                contextual_features[n - 1, f + level * nfeats] = (
                    contextual_features[n - 1, f + level * nfeats] + features[s - 1, f]
                )

            # Compuring the number of adjacent nodes for each level
            nneighbors[level] = nneighbors[level] + 1

            if level + 1 <= max_level:
                for a in G.adj[s]:
                    if a not in visited:
                        Q.append((a, level + 1))
                        visited.add(a)

            # Computing the average contextual feature values for each level
        for level in range(max_level):
            for f in range(nfeats):
                contextual_features[n - 1, f + level * nfeats] /= max(1, nneighbors[level])
    end = time.time()

    logger.debug(f"Contextual feature extraction run time: {end - start}s")

    return contextual_features


def GLCM(img_internal):
    """
    Function that does the gray-level co-occurrence matrix (GLCM) in an image

    Args:
        img_internal (array): this parameter is the image

    Returns:
        list: Return a list with all the extracted features

    See Also:
        `sscIO.io.read_volume()`

    """
    levels = 8
    angles = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]

    GLCM_features = []
    for sp_img_internal in img_internal:
        GLCM_superpixel_features = []
        img_internal_rescaled = exposure.rescale_intensity(sp_img_internal, in_range="image", out_range=(0, levels - 1))
        coo_result = greycomatrix(img_internal_rescaled, [1], angles, levels=levels, normed=False, symmetric=True)
        GLCM_contrast = greycoprops(coo_result, prop="contrast").ravel()
        GLCM_superpixel_features.extend(GLCM_contrast)
        GLCM_dissimilarity = greycoprops(coo_result, prop="dissimilarity").ravel()
        GLCM_superpixel_features.extend(GLCM_dissimilarity)
        GLCM_ASM = greycoprops(coo_result, prop="ASM").ravel()
        GLCM_superpixel_features.extend(GLCM_ASM)
        GLCM_energy = greycoprops(coo_result, prop="energy").ravel()
        GLCM_superpixel_features.extend(GLCM_energy)
        GLCM_correlation = greycoprops(coo_result, prop="correlation").ravel()
        GLCM_superpixel_features.extend(GLCM_correlation)
        GLCM_features.append(GLCM_superpixel_features)
    return GLCM_features


def lbp(img_internal):
    """
    Function that creates a local binary pattern (lbp) of an image

    Args:
        img_internal (array): 2-D dimensional numpy array (N, M) that represents the image

    Returns:
        (list[int]): a list that contain the LBP features

    """
    radius = 1
    n_points = 8 * radius
    n_bins = 64

    LBP_features = []
    for sp_img_internal in img_internal:
        local_bin_pattern = local_binary_pattern(
            sp_img_internal, n_points, radius, method="uniform"
        )  # {default,ror,uniform,var}
        hist = np.histogram(local_bin_pattern.ravel(), bins=n_bins, density=False)
        hist_norm = hist[0] / hist[0].sum()
        LBP_features.append(hist_norm)
    return LBP_features


def media_segmento(masked_maps, mask_list):
    media_list = []
    # print("mask")
    # print(np.shape(mask_list))
    for i in range(len(mask_list)):
        # print("media")
        # print(np.shape(mask_list[i]))
        media_list.append([])
        nonzero = np.count_nonzero(mask_list[i])
        for one_map in masked_maps[i]:
            pixel_sum = np.sum(one_map)
            media = pixel_sum / nonzero
            media_list[i].append(media)
    return media_list


def superpixel_avg_features(masked_maps, mask_list, global_feats, next_superpixel_idx):
    for i in range(len(mask_list)):
        nonzero = np.count_nonzero(mask_list[i])
        for f, one_map in enumerate(masked_maps[i]):
            pixel_sum = np.sum(one_map)
            avg = pixel_sum / (nonzero + 0.0001)

            global_feats[next_superpixel_idx + i, f] = avg


def batch_data(indices1, indices2, ground_truth):
    ground_truth_labels_batch = []
    indices1_batch = np.empty(shape=[0, len(indices1[0][0])])
    for ground_truth_slice, indices1_slice, segments_masks in zip(ground_truth, indices1, indices2):
        # segments_masks_bkp = copy.deepcopy(segments_masks)
        ground_truth_labels = labels_from_ground_truth(segments_masks, ground_truth_slice)
        indices1_batch = np.concatenate((indices1_slice, indices1_batch), axis=0)
        ground_truth_labels_batch = np.concatenate((ground_truth_labels, ground_truth_labels_batch))
    return indices1_batch, ground_truth_labels_batch


def batch_fit(mode, model, features, ground_truth_train_labels_list_batch):
    model.fit(features, ground_truth_train_labels_list_batch, sample_weight=None)
    if mode == 1:
        logger.debug(f"{model.best_params_}")
    return


def validation_indices(segmentation, ground_truth):
    return (
        pixel_accuracy(segmentation, ground_truth),
        mean_accuracy(segmentation, ground_truth),
        frequency_weighted_IU(segmentation, ground_truth),
        mean_IU(segmentation, ground_truth),
        binary.assd(segmentation - 1, ground_truth - 1),
        binary.dc(segmentation - 1, ground_truth - 1),
    )


def define_model(mode, model_name):
    if model_name == "svm":
        if mode == 1:
            # https://www.csie.ntu.edu.tw/~cjlin/papers/guide/guide.pdf
            Cs = [2**i for i in range(-5, 17, 2)]
            gammas = [2**i for i in range(-15, 5, 2)]
            param_grid = {"C": Cs, "gamma": gammas}
            model = GridSearchCV(svm.SVC(kernel="rbf"), param_grid)
        else:
            model = svm.SVC(kernel="rbf")
    elif model_name == "logreg":
        if mode == 1:
            n_estimators = [200, 500]
            max_features = ["auto", "sqrt", "log2"]
            criterion = ["gini", "entropy"]
            max_depth = [4, 5, 6, 7, 8]
            param_grid = {
                "n_estimators": n_estimators,
                "max_features": max_features,
                "max_depth": max_depth,
                "criterion": criterion,
            }
            model = GridSearchCV(linear_model.SGDClassifier(loss="log", max_iter=1000), param_grid)
        else:
            model = linear_model.SGDClassifier(loss="log", max_iter=1000)
    elif model_name == "randomforest":
        model = RandomForestClassifier(n_estimators=100)
    return model


def hist_match(source, template):
    oldshape = source.shape
    source = source.ravel()
    template = template.ravel()

    s_values, bin_idx, s_counts = np.unique(source, return_inverse=True, return_counts=True)
    t_values, t_counts = np.unique(template, return_counts=True)

    s_quantiles = np.cumsum(s_counts).astype(np.float64)
    s_quantiles /= s_quantiles[-1]
    t_quantiles = np.cumsum(t_counts).astype(np.float64)
    t_quantiles /= t_quantiles[-1]

    interp_t_values = np.interp(s_quantiles, t_quantiles, t_values)

    return interp_t_values[bin_idx].reshape(oldshape)


def open_raw_image(img_path, rows, cols, slices, bits):
    fd = open(img_path, "rb")
    if bits == 16:
        f = np.fromfile(fd, dtype=np.uint16, count=rows * cols * slices)
    elif bits == 8:
        f = np.fromfile(fd, dtype=np.uint8, count=rows * cols * slices)
    img = f.reshape((slices, rows, cols))
    fd.close()
    return img


def create_segments(
    img,
    superpixel,
    water_markers,
    water_compactness,
    felz_scale,
    felz_sigma,
    felz_min_size,
    slic_n_segments,
    slic_compactness,
    slic_sigma,
):
    # selem = disk(20)
    # img_eq = rank.equalize(img, selem)
    img_eq = img
    if superpixel == "waterpixels":
        gradient = filters.sobel(img_eq)
        segments = watershed(gradient, water_markers, water_compactness)
    if superpixel == "felzenszwalb":
        segments = felzenszwalb(img_eq, felz_scale, felz_sigma, felz_min_size)
    if superpixel == "slic":
        segments = slic(img_eq, n_segments=slic_n_segments, compactness=slic_compactness, sigma=slic_sigma)
    return segments


def create_maps(img, kernel_sizes, maps_names):
    maps = []

    for map_name, kernel_size in zip(maps_names, kernel_sizes):
        if map_name == "ori":
            maps.append(img)

        if map_name == "autolevel":
            selem = disk(kernel_size)
            maps.append(rank.autolevel(img, selem))

        if map_name == "entropy":
            selem = disk(kernel_size)
            maps.append(rank.entropy(img, selem))

        if map_name == "bottomhat":
            selem = disk(kernel_size)
            maps.append(rank.bottomhat(img, selem))

        if map_name == "percentile":
            selem = disk(kernel_size)
            maps.append(rank.percentile(img, selem))

        if map_name == "equalize":
            selem = disk(kernel_size)
            maps.append(rank.equalize(img, selem))

        if map_name == "mean":
            selem = disk(kernel_size)
            maps.append(rank.mean(img, selem))

        if map_name == "gradient":
            idx = maps_names.index("gradient")
            selem = disk(kernel_size)
            maps.append(rank.gradient(img, selem))

        if map_name == "maximum":
            selem = disk(kernel_size)
            maps.append(rank.maximum(img, selem))

        if map_name == "geometric_mean":
            selem = disk(kernel_size)
            maps.append(rank.maximum(img, selem))

        if map_name == "subtract_mean":
            selem = disk(kernel_size)
            maps.append(rank.subtract_mean(img, selem))

        if map_name == "median":
            selem = disk(kernel_size)
            maps.append(rank.median(img, selem))

        if map_name == "modal":
            selem = disk(kernel_size)
            maps.append(rank.modal(img, selem))

        if map_name == "enhance_contrast":
            selem = disk(kernel_size)
            maps.append(rank.enhance_contrast(img, selem))

        if map_name == "pop_bilateral":
            selem = disk(kernel_size)
            maps.append(rank.pop_bilateral(img, selem))

        if map_name == "sum":
            selem = disk(kernel_size)
            maps.append(rank.sum(img, selem))

        if map_name == "sum_bilateral":
            selem = disk(kernel_size)
            maps.append(rank.sum_bilateral(img, selem))

        if map_name == "threshold":
            selem = disk(kernel_size)
            maps.append(rank.threshold(img, selem))

        if map_name == "tophat":
            selem = disk(kernel_size)
            maps.append(rank.tophat(img, selem))

        if map_name == "otsu":
            selem = disk(kernel_size)
            maps.append(rank.otsu(img, selem))
    return maps


def masked_filters(filters_list, mask_list, img):
    masked_maps = []
    for i in range(len(mask_list)):
        masked_maps.append([])
        for one_filter in filters_list:
            clip = np.zeros_like(one_filter)
            idx = mask_list[i] == 1
            clip[idx] = one_filter[idx]
            masked_maps[i].append(clip)
    return masked_maps


def pixel_accuracy(eval_segm, gt_segm):
    """
    function that evaluate the pixel accuracy. The accuracy is
    estimated as follows

    .. math::
        \\frac{\\sum_i n_{ii}}{\\sum_i t_i}

    Args:
        eval_segm (array): an array that is the image segmented
        gt_segm (array): an array that's the ground truth of the image

    Returns:
            flaot: float variable that says the percent of the segmentation accuracy
    """

    check_size(eval_segm, gt_segm)

    cl, n_cl = extract_classes(gt_segm)
    eval_mask, gt_mask = extract_both_masks(eval_segm, gt_segm, cl, n_cl)

    sum_n_ii = 0
    sum_t_i = 0

    for i, c in enumerate(cl):
        curr_eval_mask = eval_mask[i, :, :]
        curr_gt_mask = gt_mask[i, :, :]

        sum_n_ii += np.sum(np.logical_and(curr_eval_mask, curr_gt_mask))
        sum_t_i += np.sum(curr_gt_mask)

    if sum_t_i == 0:
        pixel_accuracy_ = 0
    else:
        pixel_accuracy_ = sum_n_ii / sum_t_i

    return pixel_accuracy_


def mean_accuracy(eval_segm, gt_segm):
    """
    function that evaluate the mean pixel accuracy. The accuracy is
    estimated as follows

    .. math::
        \\frac{1}{n_{cl}}*\\sum_i \\frac{n_{ii}}{t_i}

    Args:
        eval_segm (array): an array that is the image segmented
        gt_segm (array): an array that's the ground truth of the image

    Returns:
        flaot: float variable that says the percent of the segmentation accuracy

    """

    check_size(eval_segm, gt_segm)

    cl, n_cl = extract_classes(gt_segm)
    eval_mask, gt_mask = extract_both_masks(eval_segm, gt_segm, cl, n_cl)

    accuracy = list([0]) * n_cl

    for i, c in enumerate(cl):
        curr_eval_mask = eval_mask[i, :, :]
        curr_gt_mask = gt_mask[i, :, :]

        n_ii = np.sum(np.logical_and(curr_eval_mask, curr_gt_mask))
        t_i = np.sum(curr_gt_mask)

        if t_i != 0:
            accuracy[i] = n_ii / t_i

    mean_accuracy_ = np.mean(accuracy)
    return mean_accuracy_


def mean_IU(eval_segm, gt_segm):
    """
    function that evaluate the Intersection over Union (IU). The accuracy is
    estimated as follows

    .. math::
        \\frac{1}{n_{cl}}*\\sum_i\\frac{n_{ii}}{(t_i + \\sum_j n_{ji} - n_{ii})}

    Args:
        eval_segm (array): an array that is the image segmented
        gt_segm (array): an array that's the ground truth of the image

    Returns:
        flaot: float variable that says the percent of the segmentation accuracy

    """

    check_size(eval_segm, gt_segm)

    cl, n_cl = union_classes(eval_segm, gt_segm)
    _, n_cl_gt = extract_classes(gt_segm)
    eval_mask, gt_mask = extract_both_masks(eval_segm, gt_segm, cl, n_cl)

    IU = list([0]) * n_cl

    for i, c in enumerate(cl):
        curr_eval_mask = eval_mask[i, :, :]
        curr_gt_mask = gt_mask[i, :, :]

        if (np.sum(curr_eval_mask) == 0) or (np.sum(curr_gt_mask) == 0):
            continue

        n_ii = np.sum(np.logical_and(curr_eval_mask, curr_gt_mask))
        t_i = np.sum(curr_gt_mask)
        n_ij = np.sum(curr_eval_mask)

        IU[i] = n_ii / (t_i + n_ij - n_ii)

    mean_IU_ = np.sum(IU) / n_cl_gt
    return mean_IU_


def frequency_weighted_IU(eval_segm, gt_segm):
    """
    function that evaluate the frequency weighted Intersection over Union (IU). The accuracy is
    estimated as follows

    .. math::
        \\sum_k(t_k)^{-1} * \\sum_i \\frac{t_i * n_{ii}}{t_i + \\sum_j n_{ji} - n_{ii}}

    Args:
        eval_segm (array): an array that is the image segmented
        gt_segm (array): an array that's the ground truth of the image

    Returns:
        flaot: float variable that says the percent of the segmentation accuracy

    """

    check_size(eval_segm, gt_segm)

    cl, n_cl = union_classes(eval_segm, gt_segm)
    eval_mask, gt_mask = extract_both_masks(eval_segm, gt_segm, cl, n_cl)

    frequency_weighted_IU_ = list([0]) * n_cl

    for i, c in enumerate(cl):
        curr_eval_mask = eval_mask[i, :, :]
        curr_gt_mask = gt_mask[i, :, :]

        if (np.sum(curr_eval_mask) == 0) or (np.sum(curr_gt_mask) == 0):
            continue

        n_ii = np.sum(np.logical_and(curr_eval_mask, curr_gt_mask))
        t_i = np.sum(curr_gt_mask)
        n_ij = np.sum(curr_eval_mask)

        frequency_weighted_IU_[i] = (t_i * n_ii) / (t_i + n_ij - n_ii)

    sum_k_t_k = get_pixel_area(eval_segm)

    frequency_weighted_IU_ = np.sum(frequency_weighted_IU_) / sum_k_t_k
    return frequency_weighted_IU_


"""
Auxiliary functions used during evaluation.
"""


def get_pixel_area(segm):
    return segm.shape[0] * segm.shape[1]


def extract_both_masks(eval_segm, gt_segm, cl, n_cl):
    eval_mask = extract_masks(eval_segm, cl, n_cl)
    gt_mask = extract_masks(gt_segm, cl, n_cl)

    return eval_mask, gt_mask


def extract_classes(segm):
    cl = np.unique(segm)
    n_cl = len(cl)

    return cl, n_cl


def union_classes(eval_segm, gt_segm):
    eval_cl, _ = extract_classes(eval_segm)
    gt_cl, _ = extract_classes(gt_segm)

    cl = np.union1d(eval_cl, gt_cl)
    n_cl = len(cl)

    return cl, n_cl


def extract_masks(segm, cl, n_cl):
    h, w = segm_size(segm)
    masks = np.zeros((n_cl, h, w))

    for i, c in enumerate(cl):
        masks[i, :, :] = segm == c

    return masks


def segm_size(segm):
    try:
        height = segm.shape[0]
        width = segm.shape[1]
    except IndexError:
        logger.error(IndexError)

    return height, width


def check_size(eval_segm, gt_segm):
    h_e, w_e = segm_size(eval_segm)
    h_g, w_g = segm_size(gt_segm)

    if (h_e != h_g) or (w_e != w_g):
        logger.exception("DiffDim: Different dimensions of matrices!")


def retangle_mask_external(img):
    rows = np.any(img, axis=1)
    cols = np.any(img, axis=0)
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    return img[ymin : ymax + 1, xmin : xmax + 1]


def retangle_full_mask_external(img):
    rows = np.any(img, axis=1)
    cols = np.any(img, axis=0)
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    img_mod = np.zeros_like(img)
    img_mod[ymin : ymax + 1, xmin : xmax + 1] = 255
    return img_mod


def retangle_mask_internal(img):
    skip = 0
    area_max = 0

    nrows = np.shape(img)[0]
    ncols = np.shape(img)[1]

    w = np.zeros(dtype=int, shape=img.shape)
    h = np.zeros(dtype=int, shape=img.shape)
    for r in range(nrows):
        for c in range(ncols):
            if img[r][c] == skip:
                continue
            if r == 0:
                h[r][c] = 1
            else:
                h[r][c] = h[r - 1][c] + 1
            if c == 0:
                w[r][c] = 1
            else:
                w[r][c] = w[r][c - 1] + 1
            minw = w[r][c]
            for dh in range(h[r][c]):
                minw = min(minw, w[r - dh][c])
                area = (dh + 1) * minw
                if area > area_max:
                    area_max = area
                    x0 = r - dh
                    x1 = r
                    y0 = c - minw + 1
                    y1 = c
    new_img = img[x0:x1, y0:y1]
    if len(np.unique(new_img)) == 0:
        return img
    else:
        return new_img


def labels_from_ground_truth(segments_list, ground_truth):
    labels_ground_truth = []
    for segments in segments_list:
        unique, counts = np.unique(ground_truth[segments != 0], return_counts=True)
        labels_ground_truth.append(unique[counts.argmax()])
    return labels_ground_truth


def create_masks(shape, segments):
    mask_list = []

    # IMPORTANT: numpy.unique returns the SORTED unique elements. Hence, we ensure that superpixels are
    # ordered by their label
    for i, segVal in enumerate(np.unique(segments)):
        mask = np.zeros(shape[1:], dtype="uint8")
        mask[segments == segVal] = 1
        mask_list.append(mask)

    return mask_list


def compute_wld(orig_img_internal):
    T = 8  # [4, 6, 8]
    M = 4  # [4, 6]
    S = 4  # [4, 8]

    eps = 1e-5
    WLD_features = []

    for sp_img_internal in orig_img_internal:
        rows, cols = sp_img_internal.shape
        hist = np.zeros((M, T, S), "float32")

        for i in range(1, rows - 1):
            for j in range(1, cols - 1):
                roi = sp_img_internal[i - 1 : i + 2, j - 1 : j + 2].astype("int16")
                ic = roi[1][1]

                roi_diff = roi - ic
                total = roi_diff.sum()

                if ic != 0:
                    zeta = np.arctan(total / ic) * 180 / np.pi
                else:
                    if total > 0:
                        zeta = 90 - eps
                    else:
                        zeta = -90 + eps

                assert -90 <= zeta <= 90

                v11 = roi[1][0] - roi[1][2]
                v10 = roi[2][1] - roi[0][1]

                theta = cv2.fastAtan2(v11, v10) + 180

                if theta >= 360:
                    theta -= 360

                m = int(np.floor(0.5 + (zeta + 90) * M / 180.0)) % M
                # assert(m in range(0, M))

                t = int(np.floor(0.5 + (theta * T / 360.0))) % T
                # assert(t in range(0, T))

                # Lower and upper bounds of interval m
                lb = (2 * m - M) * 180.0 / (2 * M)
                ub = (2 * m - M + 2) * 180.0 / (2 * M)

                s = int(np.floor(0.5 + (zeta - lb) / ((ub - lb) / S))) % S
                # assert(s in range(0, S))

                hist[m][t][s] += 1

        # Normalizing and flattening histogram
        hist_sum = max(hist.sum(), 1)
        h = (hist / hist_sum).ravel()
        WLD_features.append(h)
    return WLD_features


def get_marker_ids(annotations):
    marker_ids = set(map(itemgetter(1), annotations.values()))

    return marker_ids


def get_label_ids(annotations):
    label_ids = set(map(itemgetter(0), annotations.values()))

    return label_ids


def format_output_path(path, selected_aux):
    ext = re.findall("\*+(.[a-z0-9A-Z*_]+)", selected_aux)[0].strip()
    output = path

    if ext[0] != ".":
        ext = "." + ext
    ext = ext.lower()

    path_ext = os.path.splitext(path)[1][1:]
    path_ext = path_ext.lower()

    if len(path_ext) > 0:
        if path_ext != ext:
            ext = path_ext

    if ext[0] != ".":
        ext = "." + ext
    ext = ext.lower()

    if ext == ".*":
        logger.exception("Invalid file extension")

    if not output.lower().endswith(ext.lower()):
        output = output + ext

    return output, ext[1:]


def _get_size_raw(filename):
    filename = os.path.basename(filename)
    size = re.search("\d+(x\d+)+", filename).group(0)
    dim_size = map(int, size.lower().split("x"))
    return list(dim_size)


_depth_map = {8: np.uint8, 16: np.uint16, 32: np.uint32}


def _get_depth_raw(filename):
    filename = os.path.basename(filename)
    depth = re.search("_(8|16|32)(bits|b)", filename).group(0)
    depth_i = int(depth.replace("bits", "").replace("b", "").replace("_", ""))
    return _depth_map[depth_i]


def get_raw_filename_info(filename):
    return _get_size_raw(filename), _get_depth_raw(filename)


def raw_filename(filename, shape, dtype):
    basefilename, ext = os.path.splitext(filename)
    bits = np.dtype(dtype).itemsize * 8
    return f"{basefilename}_{shape[2]}x{shape[1]}x{shape[0]}_{bits}bits{ext}"
