import numpy as np
from sscPySpin import image as spin_img

def label_slice_contour(slice_label):
    border = spin_img.spin_find_boundaries(slice_label,
                                         dtype='uint8') > 0
    contour = np.zeros_like(slice_label)
    contour[border] = slice_label[border]
    return contour
