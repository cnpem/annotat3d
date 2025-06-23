# distutils: language = c++
# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
# cython: cdivision=True
# cython: initializedcheck=False

import numpy as np
cimport numpy as np

from libc.float cimport FLT_MAX, FLT_MIN
from cython.parallel import prange
from cython cimport nogil, parallel


def pooling_per_superpixel(
    np.ndarray[np.float32_t, ndim=4] features,
    np.ndarray[np.int32_t, ndim=3] superpixel_labels,
    int num_labels,
    list selected_supervoxel_feat_pooling  # e.g., ["min", "max", "mean"]
):
    """
    Compute min, max, mean pooling per label.

    Parameters:
    superpixel_labels: (zsize, ysize, xsize) int32 labels starting from 1
    features: (total_features, zsize, ysize, xsize) float32
    num_labels: total number of labels
    selected_supervoxel_feat_pooling: list of strings in {"min", "max", "mean"}

    Returns:
    Dict with requested keys.
    """
    cdef int total_features = features.shape[0]
    cdef int zsize = features.shape[1]
    cdef int ysize = features.shape[2]
    cdef int xsize = features.shape[3]

    cdef np.ndarray[np.float32_t, ndim=2] min_result = np.full((num_labels, total_features), FLT_MAX, dtype=np.float32)
    cdef np.ndarray[np.float32_t, ndim=2] max_result = np.full((num_labels, total_features), FLT_MIN, dtype=np.float32)
    cdef np.ndarray[np.float32_t, ndim=2] mean_result = np.zeros((num_labels, total_features), dtype=np.float32)
    cdef np.ndarray[np.int32_t, ndim=1] counts = np.zeros(num_labels, dtype=np.int32)

    cdef int z, y, x, f, label_idx
    cdef float val

    with nogil, parallel.parallel():
        for z in prange(zsize, schedule='static'):
            for y in range(ysize):
                for x in range(xsize):
                    label_idx = superpixel_labels[z, y, x] - 1  # Labels start at 1
                    if label_idx < 0 or label_idx >= num_labels:
                        continue

                    for f in range(total_features):
                        val = features[f, z, y, x]

                        if val < min_result[label_idx, f]:
                            min_result[label_idx, f] = val

                        if val > max_result[label_idx, f]:
                            max_result[label_idx, f] = val

                        mean_result[label_idx, f] += val

                    counts[label_idx] += 1

    # Finalize mean
    if 'mean' in selected_supervoxel_feat_pooling:
        for label_idx in range(num_labels):
            if counts[label_idx] > 0:
                for f in range(total_features):
                    mean_result[label_idx, f] /= counts[label_idx]
            else:
                for f in range(total_features):
                    mean_result[label_idx, f] = 0.0

    # Build output
    result = []
    if 'min' in selected_supervoxel_feat_pooling:
        result.append(min_result)
    if 'max' in selected_supervoxel_feat_pooling:
        result.append(max_result)
    if 'mean' in selected_supervoxel_feat_pooling:
        result.append(mean_result)

    return np.concatenate(result, axis=1)  # Shape: (num_labels, num_modes * total_features)