import numpy as np
from flask import Blueprint, request
from flask_cors import cross_origin
from harpia.morphology.operations_binary import (
     erosion_binary,
     dilation_binary,
     closing_binary,
     opening_binary
)
from skimage.filters import gaussian as skimage_gaussian
from sscAnnotat3D.repository import module_repo
from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo
from sscPySpin.filters import filter_bm3d as spin_bm3d
from sscPySpin.filters import non_local_means as spin_nlm

app = Blueprint("morphology", __name__)

@app.route("/morphology/binary/erosion/", methods=["POST"])
@cross_origin()
def erosion_apply():

    kernel_shape = request.json["kernelShape"]
    kernel_size = request.json["kernelSize"]
    label = request.json["label"]
    slice_num = request.json["slice"]
    axis = request.json["axis"]

    # Create kernel
    kernel = np.array([[1, 1, 1], [1, 1, 1], [1, 1, 1]], dtype=np.int32)
    kernel_3d = np.stack([kernel, kernel, kernel])
    kernel_3d = np.ascontiguousarray(kernel_3d)

    #update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)
    annotation_slice = annot_module.annotation_image[slice_range]
    annotation_slice_3d = np.ascontiguousarray(annotation_slice.reshape((1, *annotation_slice.shape)))
    binary_mask_3d = (annotation_slice_3d == label).astype('int32')

    # Morphologycal operation
    output_mask_3d = erosion_binary(binary_mask_3d, kernel_3d, gpuMemory=0.41)

    # Create masks
    write_mask = (binary_mask_3d == 0) & (output_mask_3d == 1)  # 0 -> 1
    erase_mask = (binary_mask_3d == 1) & (output_mask_3d == 0)  # 1 -> 0

    # Ensure masks are 2D by removing singleton dimensions
    write_mask_2d = np.squeeze(write_mask)
    erase_mask_2d = np.squeeze(erase_mask)

    # Marker id is not necessary for the magic wand logic.
    mk_id = annot_module.current_mk_id
    erase_label = -1

    annot_module.labelmask_update(erase_mask_2d, erase_label, mk_id, True)
    annot_module.labelmask_update(write_mask_2d, label, mk_id, True)

    return "success", 200