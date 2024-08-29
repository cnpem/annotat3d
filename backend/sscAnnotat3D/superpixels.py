import logging
import time

import numpy as np
from sscPySpin import image as spin_img
from sscPySpin import segmentation as spin_seg

logger = logging.getLogger(__name__)


def superpixel_extraction(img, superpixel_type, seed_spacing, compactness, **kwargs):
    """
    This function makes the superpixel extraction

    Args:
        img (array): input image
        superpixel_type (string): that represents the superpixel type {'slic', 'waterpixels', 'waterpixels3d'}.
        seed_spacing (int): seed spacing between superpixels (superpixel size).
        compactness (float): compactness of superpixels, low values represents more aderence to the borders, high values indicates more regularity (squary superpixels)

    Notes:
        #TODO: fix workaround due to superpixels/waterpixels being generated with 0 values for Nvidia Tesla K80\n
        #TODO: Ideally, we should relabel connected components with value 0 when superpixel estimation fails

    Returns:
        (array, int): returns the superpixel image, the number of total superpixels

    """
    ngpus = -1 if "ngpus" not in kwargs else kwargs["ngpus"]
    if "superpixel_iterations" in kwargs:
        if kwargs["superpixel_iterations"] <= 0 and superpixel_type == "slic":
            superpixel_iterations = 1
        else:
            superpixel_iterations = kwargs["superpixel_iterations"]
    else:
        if superpixel_type == "slic":
            superpixel_iterations = 1
        else:
            superpixel_iterations = -1

    superpixel_type_id = spin_seg.SPINSuperpixelType.superpixel_id(superpixel_type)

    logger.debug("Calling Spin library to generate superpixels")
    logger.debug(f"{superpixel_type} {superpixel_type_id}")
    start = time.time()
    img_superpixels = np.zeros(img.shape, dtype=np.int32)

    max_block_size = 64 if "max_block_size" not in kwargs else int(kwargs["max_block_size"])
    min_block_size = 1 if "min_block_size" not in kwargs else int(kwargs["min_block_size"])

    end = time.time()
    logger.debug(f"Superpixel image allocation and image conversion run time: {end - start}s")

    start = time.time()
    num_superpixels = spin_seg.spin_superpixels_2D(
        img,
        img_superpixels,
        None,
        int(superpixel_type_id),
        int(seed_spacing),
        superpixel_iterations,
        1.0,
        float(compactness),
        ngpus,
        max_block_size,
        min_block_size=min_block_size,
    )

    end = time.time()
    logger.debug(f"Superpixel estimation run time: {end - start}s")

    values = spin_img.min_max_value(img_superpixels, True)
    min_label = values["min"]
    max_label = values["max"]

    if min_label <= 0:
        raise Exception("Zero-valued superpixel detected! Please contact developer")

    return img_superpixels, num_superpixels


def superpixel_slice_borders(slice_superpixels):
    return spin_img.spin_find_boundaries_subpixel(slice_superpixels, dtype="uint8")
