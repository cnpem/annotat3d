import numpy as np
from harpia.watershed.watershed import boundaries


def label_slice_contour(slice_label):
    border = boundaries(slice_label.astype(np.int32)) > 0 #spin_img.spin_find_boundaries(slice_label) > 0
    contour = np.zeros_like(slice_label)
    contour[border] = slice_label[border]
    return contour
