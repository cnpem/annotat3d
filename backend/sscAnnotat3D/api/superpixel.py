import io
import zlib
from werkzeug.exceptions import BadRequest
from flask import Blueprint, jsonify, request, send_file
from flask_cors import cross_origin
from sscAnnotat3D import superpixels, utils
from sscAnnotat3D.repository import data_repo
from harpia.watershed.watershed import boundaries,hierarchicalWatershedChunked_GPU
from harpia.filters.filtersChunked import sobel
from skimage.segmentation import find_boundaries
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D.modules import annotation_module
import numpy as np
app = Blueprint("superpixel", __name__)


def _debugger_print(msg: str, payload: any):
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


def rescale_to_int32(image: np.ndarray) -> np.ndarray:
    img_min, img_max = image.min(), image.max()
    # Avoid divide-by-zero if constant image
    if img_min == img_max:
        return np.zeros_like(image, dtype=np.int32)
    scaled = (image - img_min) / (img_max - img_min)  # scale to [0, 1]
    scaled = scaled * (np.iinfo(np.int32).max - np.iinfo(np.int32).min) + np.iinfo(np.int32).min
    return scaled.astype(np.int32)


@app.route("/superpixel", methods=["POST", "GET"])
@cross_origin()
def superpixel():
    """
    Function that creates the superpixel using GPU hierarchical watershed
    and sends the generated labels to the frontend, compatible with LabelTable.tsx.
    """
    img = data_repo.get_image(key="image")

    annot_module = module_repo.get_module("annotation")
    mk_id = annot_module.current_mk_id

    # Parse parameters safely
    req_data = request.get_json(force=True)
    levels = int(req_data.get("levels", 6))
    neighborhood = int(req_data.get("neighborhood", 27))
    use_labels = req_data.get("labels",False)

    # Compute gradient on GPU
    grad = sobel(img.astype(np.float32), type3d=1, verbose=1, gpuMemory=0.4)
    grad = rescale_to_int32(grad)

    # Run hierarchical watershed (GPU)
    img_superpixel = hierarchicalWatershedChunked_GPU(
        grad,
        levels=levels,
        neighborhood=neighborhood,
        gpuMemory=0.4,
        verbose=1
    )

    data_repo.set_image(key="superpixel", data=img_superpixel)

    if use_labels:

        set_unique_labels = np.unique(img_superpixel)
        set_unique_labels = set_unique_labels[set_unique_labels >= 0]

        label_names = []
        label_set = set()

        for label_value in set_unique_labels:
            label_value = int(label_value)
            if label_value not in label_set:
                label_set.add(label_value)
                label_names.append({
                    "labelName": f"Label {label_value}" if label_value > 0 else "Background",
                    "id": int(label_value),
                    "color": [],
                    "alpha": 1.0
                })

        # Store + return
        data_repo.set_image(key="annotation", data=img_superpixel)
        annot_module.multilabel_updated(img_superpixel, mk_id)
        module_repo.set_module("annotation", module=annot_module)

        return jsonify(label_names)
    

    return jsonify("success")        



@app.route("/get_superpixel_slice", methods=["POST", "GET"])
@cross_origin()
def get_superpixel_slice():
    """
    This function gets the superpixel slice value

    Returns:
        (flask.send_file): returns the superpixel value to canvas

    """
    img_superpixels = data_repo.get_image("superpixel")

    if img_superpixels is None:
        return "failure", 400

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    slice_superpixels = img_superpixels[slice_range]
    print("superpixel shape:",slice_superpixels.shape )

    slice_superpixels = boundaries(slice_superpixels.astype(np.int32)).astype(np.uint8)#superpixels.superpixel_slice_borders(slice_superpixels)
    print("superpixel shape:",slice_superpixels.shape )

    compressed_slice_superpixels = zlib.compress(utils.toNpyBytes(slice_superpixels))

    return send_file(io.BytesIO(compressed_slice_superpixels), "application/gzip")
