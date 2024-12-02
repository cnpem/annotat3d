import numpy as np
from flask import Blueprint, request
from flask_cors import cross_origin
from harpia.morphology.operations_binary import (
     erosion_binary,
     dilation_binary,
     closing_binary,
     opening_binary,
     smooth_binary,
     fill_holes,
)
from skimage.morphology import square, disk
import numpy as np
from sscAnnotat3D.repository import module_repo
from sscAnnotat3D import utils

app = Blueprint("morphology", __name__)

@app.route("/morphology/binary/morphology/", methods=["POST"])
@cross_origin()
def morphology_apply():
    operation = request.json["operation"]
    label = request.json["label"]
    slice_num = request.json["slice"]
    axis = request.json["axis"]

   
    #update backend slice numbery
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)
    annotation_slice = annot_module.annotation_image[slice_range]
    annotation_slice_3d = np.ascontiguousarray(annotation_slice.reshape((1, *annotation_slice.shape)))
    binary_mask_3d = (annotation_slice_3d == label).astype('int32')

    # Dictionary of operations
    operations = {
        "erosion": erosion_binary,
        "dilation": dilation_binary,
        "closing": closing_binary,
        "opening": opening_binary,
        "smooth": smooth_binary,
        "fillholes": fill_holes,
    }
    if operation not in operations:
        return {"error": f"Invalid operation: {operation}"}, 400

    # Perform the selected morphological operation
    if operation == "fillholes":
        original_dtype = binary_mask_3d.dtype
        binary_mask_3d_int8 = binary_mask_3d.astype(np.int8)
        output_mask_3d_int8 = operations[operation](binary_mask_3d_int8)
        output_mask_3d = output_mask_3d_int8.astype(original_dtype)
    else:
         # Create kernel
        kernel_shape = request.json["kernelShape"]
        kernel_size = request.json["kernelSize"]
        kernel_2D = custom_kernel2D(kernel_size, shape=kernel_shape)
        kernel_3D = kernel_2D.reshape((1, *kernel_2D.shape))

        output_mask_3d = operations[operation](binary_mask_3d, kernel_3D, gpuMemory=0.41)

    # Create masks
    write_mask = (binary_mask_3d == 0) & (output_mask_3d == 1)  # 0 -> 1
    erase_mask = (binary_mask_3d == 1) & (output_mask_3d == 0)  # 1 -> 0

    # Ensure masks are 2D by removing singleton dimensions
    write_mask_2D = np.squeeze(write_mask)
    erase_mask_2D = np.squeeze(erase_mask)

    # Marker id is not necessary for the magic wand logic.
    erase_label = -1
    mk_id = annot_module.current_mk_id
    annot_module.labelmask_multiupdate([erase_mask_2D, write_mask_2D], [erase_label, label], mk_id, True)

    return "success", 200

def custom_kernel2D(radius, shape="square"):
    """
    Create a 2D kernel with a specified shape using skimage's structuring elements.
    The kernel will contain values of 1 for the structuring element and -1 for the background.
    
    Parameters:
        radius (int): The number of pixels the kernel would affect in one direction
                      during erosion or dilation (radius of the structuring element).
        shape (str): The shape of the kernel. Options are "square", "circle", 
                     "vertical_line", "horizontal_line", or "cross".
    
    Returns:
        np.ndarray: A 2D kernel with int32 dtype and contiguous memory.
    """
    if radius < 0:
        raise ValueError("Radius must be a non-negative integer.")
    if shape not in {"square", "circle", "vertical_line", "horizontal_line", "cross"}:
        raise ValueError("Shape must be one of 'square', 'circle', 'vertical_line', 'horizontal_line', or 'cross'.")
    
    # Calculate size as 2 * radius + 1 to ensure odd dimensions
    size = 2 * radius + 1
    
    # Create a background filled with -1
    kernel_2D = -np.ones((size, size), dtype=np.int32)
    
    if shape == "square":
        kernel_2D = np.ones((size, size), dtype=np.int32)  # All 1's for square
    elif shape == "circle":
        disk_mask = disk(radius)
        kernel_2D[disk_mask > 0] = 1
    elif shape == "vertical_line":
        kernel_2D[:, size // 2] = 1  # Vertical line through the center
    elif shape == "horizontal_line":
        kernel_2D[size // 2, :] = 1  # Horizontal line through the center
    elif shape == "cross":
        kernel_2D[:, size // 2] = 1  # Vertical line
        kernel_2D[size // 2, :] = 1  # Horizontal line
    
    # Ensure memory contiguity
    kernel_2D = np.ascontiguousarray(kernel_2D)
    return kernel_2D
