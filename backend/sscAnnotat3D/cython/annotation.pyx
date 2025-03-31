cdef extern from "<algorithm>" namespace "std":
    Iter max_element[Iter](Iter first, Iter last)

from collections import defaultdict

cimport cython
from libcpp.map cimport map as cmap
from libcpp.map cimport pair as cpair
from libcpp.unordered_map cimport unordered_map as cunmap
from libcpp.vector cimport vector

import time

from cython.operator import dereference, preincrement

from cython.parallel cimport prange


@cython.boundscheck(False)
@cython.wraparound(False)
cpdef superpixel_majority_voting(set annotation_set, int[:,:,:] annotation_image, int[:,:,:] superpixels):

    cdef int coord_x, coord_y, coord_z
    cdef int label, marker
    cdef int superpixel_id

    cdef cunmap[int, cunmap[int, int]] superpixel_marker_labels

    # for i in prange(n, nogil=True):
    # st = time.time()
    for (coord_x, coord_y, coord_z) in annotation_set:
        superpixel_id = superpixels[coord_x, coord_y, coord_z]
        # # Ensuring that 0-valued superpixels are disconsidered due to old bug that was fixed Nvidia Tesla K80. That bug was fixed.
        if superpixel_id > 0:
            label = annotation_image[(coord_x, coord_y, coord_z)]
            preincrement(superpixel_marker_labels[superpixel_id][label])
    # en = time.time()
    # print('dict iteration time: ', en-st)

    cdef cunmap[int, cunmap[int, int]].iterator end = superpixel_marker_labels.end()
    cdef cunmap[int, cunmap[int, int]].iterator it = superpixel_marker_labels.begin()

    superpixel_marker_labels_dict = {}
    # st = time.time()
    while it != end:
        #superpixel_id = it->first
        superpixel_id = dereference(it).first
        # label = max_element(it->second.begin(), it->second.end())->first
        label = dereference( max_element(dereference(it).second.begin(), dereference(it).second.end()) ).first
        superpixel_marker_labels_dict[superpixel_id] = label
        preincrement(it)#++it

    # print('superpixel_marker_labels_dict: ', superpixel_marker_labels_dict)

    # en = time.time()
    # print('aggregate time: ', en-st)
    return superpixel_marker_labels_dict

import cython
from cython.operator cimport preincrement as inc, predecrement as dec, dereference
from libcpp.unordered_map cimport unordered_map

@cython.boundscheck(False)
@cython.wraparound(False)
cpdef dict cython_majority_vote(int[:] sp_ids_view, int[:] labels_view):
    """
    Given two 1D memoryviews:
      - sp_ids_view: superpixel IDs for each pixel.
      - labels_view: corresponding pixel labels.
      
    This function implements a Boyer–Moore–style majority vote per superpixel
    using C++ unordered_maps for speed. The vote counts are updated with the
    preincrement (inc) and predecrement (dec) operators.
    
    Returns a Python dict mapping each superpixel ID (int) to its candidate majority label (int).
    """
    cdef Py_ssize_t n = sp_ids_view.shape[0]
    cdef unordered_map[int, int] majority         # candidate label for each superpixel
    cdef unordered_map[int, int] majority_count     # vote count for that candidate
    cdef Py_ssize_t i
    cdef int sp_id, label

    for i in range(n):
        sp_id = sp_ids_view[i]
        label = labels_view[i]
        # Using operator[] on unordered_map auto-initializes missing entries to 0.
        if majority_count[sp_id] == 0:
            majority[sp_id] = label
        if label == majority[sp_id]:
            inc(majority_count[sp_id])
        else:
            dec(majority_count[sp_id])
    
    # Convert the C++ unordered_map to a Python dictionary.
    cdef dict result = {}
    cdef unordered_map[int, int].iterator it = majority.begin()
    cdef unordered_map[int, int].iterator end = majority.end()
    while it != end:
        result[dereference(it).first] = dereference(it).second
        inc(it)
    
    return result