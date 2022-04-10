from sscPySpin import image as spin_img

def label_slice_contour(slice_label):
    return spin_img.spin_find_boundaries(slice_label,
                                         dtype='uint8')
