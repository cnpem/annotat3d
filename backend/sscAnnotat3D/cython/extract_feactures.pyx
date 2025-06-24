# cython: boundscheck=False, wraparound=False
import numpy as np
cimport numpy as np
from scipy.ndimage import gaussian_filter
from harpia.filters.filtersChunked import prewittFilter
from skimage.feature import local_binary_pattern
cimport cython


@cython.boundscheck(False)
@cython.wraparound(False)
def pixel_feature_extract(np.ndarray[np.float32_t, ndim=3] img,
                     list sigmas,
                     bint use_3d,
                     bint Intensity=True,
                     bint Edges=True,
                     bint Texture=False):
    cdef int zsize = img.shape[0]
    cdef int ysize = img.shape[1]
    cdef int xsize = img.shape[2]
    cdef int i, z, feature_index

    cdef int feats_per_sigma = Intensity + Edges + Texture
    print("Sigmas len", len(sigmas))
    cdef int total_features = len(sigmas) * feats_per_sigma
    print("Total features:", total_features)

    cdef np.ndarray[np.float32_t, ndim=4] results
    results = np.zeros((total_features, zsize, ysize, xsize), dtype=np.float32)

    cdef np.ndarray[np.float32_t, ndim=3] edge
    cdef np.ndarray[np.float32_t, ndim=3] texture
    cdef np.ndarray[np.float32_t, ndim=3] blurred_3d
    cdef np.ndarray[np.float32_t, ndim=2] blurred_2d

    feature_index = 0

    if use_3d:
        for i, sigma in enumerate(sigmas):
            blurred_3d = img.copy() if sigma == 0 else gaussian_filter(img, sigma=sigma)

            if Intensity:
                results[feature_index] = blurred_3d
                feature_index += 1

            if Edges:
                results[feature_index] = prewittFilter(blurred_3d, type3d=1,verbose=1,gpuMemory=0.1,ngpus=1)
                feature_index += 1

            if Texture:
                # 3D LBP is not directly implemented.
                results[feature_index] = blurred_3d
                feature_index += 1

    else:
        for z in range(zsize):
            feature_index = 0 
            for i, sigma in enumerate(sigmas):
                slice_img = img[z]
                blurred_2d = slice_img.copy() if sigma == 0 else gaussian_filter(slice_img, sigma=sigma)
                
                if Intensity:
                    results[feature_index, z] = blurred_2d
                    feature_index += 1

                if Edges:
                    tmp_edge = np.zeros((1, ysize, xsize), dtype=np.float32)
                    tmp_edge = prewittFilter(np.expand_dims(blurred_2d, axis=0),type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)
                    results[feature_index, z] = tmp_edge[0]
                    feature_index += 1

                if Texture:
                    lbp = local_binary_pattern(blurred_2d, P=8, R=1, method='uniform')
                    results[feature_index, z] = lbp.astype(np.float32)
                    feature_index += 1

    return results