cdef extern from "<algorithm>" namespace "std":
    Iter max_element[Iter](Iter first, Iter last)

from collections import defaultdict
from libcpp.map cimport map as cmap, pair as cpair
from libcpp.unordered_map cimport unordered_map as cunmap
from libcpp.vector cimport vector
cimport cython
import time
from cython.operator import preincrement, dereference
from cython.parallel cimport prange

@cython.boundscheck(False)
@cython.wraparound(False)
cpdef superpixel_majority_voting(dict annotation_dict, int[:,:,:] superpixels):

    cdef int coord_x, coord_y, coord_z
    cdef int label, marker
    cdef int superpixel_id

    cdef cunmap[int, cunmap[int, int]] superpixel_marker_labels

    # for i in prange(n, nogil=True):
    # st = time.time()
    for (coord_x, coord_y, coord_z), (label, mk_id) in annotation_dict.items():
        superpixel_id = superpixels[coord_x, coord_y, coord_z]
        # # Ensuring that 0-valued superpixels are disconsidered due to old bug that was fixed Nvidia Tesla K80. That bug was fixed.
        if superpixel_id > 0:
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
