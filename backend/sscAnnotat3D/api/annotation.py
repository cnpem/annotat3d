import os
default_n_threads = 32
os.environ['OPENBLAS_NUM_THREADS'] = f"{default_n_threads}"
os.environ['MKL_NUM_THREADS'] = f"{default_n_threads}"
os.environ['OMP_NUM_THREADS'] = f"{default_n_threads}"
import io
import pickle
import zlib

import numpy as np
from flask import Blueprint, jsonify, request, send_file
from flask_cors import cross_origin
from sscAnnotat3D import utils
from sscAnnotat3D.label import label_slice_contour
from sscAnnotat3D.modules.magic_wand import MagicWandSelector
from sscAnnotat3D.modules.lasso import fill_lasso
from sscAnnotat3D.modules import annotation_module
from sscAnnotat3D.repository import data_repo, module_repo
from werkzeug.exceptions import BadRequest
#from harpia import morph_2D_chan_vese, morph_2D_geodesic_active_contour
from harpia.segmentation import morphological_chan_vese,morphological_geodesic_active_contour
from sscPySpin import image as spin_img
from skimage import img_as_float32
from skimage.segmentation import (
    inverse_gaussian_gradient,
    disk_level_set,
    checkerboard_level_set
)
app = Blueprint('annotation', __name__)


def _debugger_print(msg: str, payload: any):
    print("\n----------------------------------------------------------")
    print("{} : {}".format(msg, payload))
    print("-------------------------------------------------------------\n")


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    """
    Function that handle with bad exceptions and returns a json that contains the error and a 400 error

    Args:
        error_msg (str): a string that contains the error

    Returns:
        (tuple[str, int]): this function returns respectively the json that contains the error message and the 400 error (tuple[Response, int])

    """
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)


@app.route("/new_annot/<annot_id>", methods=["POST"])
@cross_origin()
def new_annot(annot_id: str):
    """
    function that creates a new annotation using an id as reference

    Args:
        annot_id (str): string used as id to get the annotation

    Examples:
        This is an example on how you can use this function to get the annotation using the id\n
        sfetch('POST', '/new_annot/annotation');\n
        Where in this case annot_id=annotation

    Returns:
        (tuple[str, int]): this function returns "success" and 200 if a new annotation is created.Otherwise, this tuple will return the error string and 400

    """
    img = data_repo.get_image('image')
    if img is None:
        return handle_exception('No image associated')

    annot_module = annotation_module.AnnotationModule(img.shape)
    module_repo.set_module(annot_id, module=annot_module)
    return "success", 200


@app.route("/is_available_annot/<annot_id>", methods=["POST"])
@cross_origin
def is_available_annot(annot_id: str):
    """
    Function that verify if an annotation is available

    Args:
        annot_id(string): string used as id to get the annotation
    Examples:
        This is an example on how you can use this function to get the annotation using the id\n
        sfetch('POST', '/is_available_annot/annotation');\n
        Where in this case annot_id=annotation

    Returns:
        (tuple[bool, int]): this function returns "True" and 200 if an annotation is available.Otherwise, this tuple will return "False" and error 400

    """
    annot = module_repo.get_module(annot_id)

    available = True
    if annot is None:
        available = False
    if not isinstance(annot, annotation_module.AnnotationModule):
        available = False

    return jsonify({'available': available})


@app.route("/open_annot", methods=["POST"])
@cross_origin()
def open_annot():
    """
    Function that opens an annotation

    Notes:
        This function is used on AnnotationLoadDialog.tsx

    Examples:
        This is an example on how you can use this function to open the annotation\n
        sfetch("POST", "/open_annot", JSON.stringify(params), "json")\n
        where params is a JSON that contains the file path

    Returns:
        list: This function the front-end a list that contains the all the loaded labels that'll be used in label table

    """
    img = data_repo.get_image('image')
    if img is None:
        return handle_exception('No image associated')

    try:
        annot_path = request.json["annot_path"]
    except:
        return handle_exception("Error while trying to get the annotation path")

    with open(annot_path, "rb") as f:
        annot_data = pickle.load(f)
    
    
    annot_module = annotation_module.AnnotationModule(img.shape)
    #compatibility with old annotated
    if type(annot_data) != list:
        print('Old annotation stye, reading dictionary')
        annot_module.set_annotation_from_dict(annot_data)
        label_names = []
        annotation = set()
        for label in annot_data.values():
            label = label[0]
            if (label not in annotation):
                annotation.add(label)
                label_names.append({
                    "labelName": "Label {}".format(label) if label > 0 else "Background",
                    "id": label,
                    "color": [],
                    "alpha": 1
                })

    else:
        label_names, annotation_coords, annotation_labels, annotation_slice_dict = annot_data
        annot_img = annot_module.set_annotation_from_coords(annotation_coords, annotation_labels)
        annot_module.set_annotation_slice_dict(annotation_slice_dict)

    module_repo.set_module('annotation', module=annot_module)

    return jsonify(label_names)


@app.route("/close_annot", methods=["POST"])
@cross_origin()
def close_annot():
    """
    Function that delete all annotations

    Notes:
        This function is used on InputLabel.tsx

    Examples:
        sfetch("POST", "/close_annot", "")

    Returns:
        (tuple[str, int]): This function returns a tuple that contains the string "All markers erased successfully"if all labels are deleted and 200

    """
    try:
        annot_module = module_repo.get_module('annotation')
        annot_module.erase_all()
    except:
        return handle_exception("Failed to erase all markers")

    try:
        label_img = data_repo.get_image(key="label")
    except Exception as e:
        return handle_exception(str(e))

    if (label_img is not None):
        label_img = label_img.astype('int32')
        #image is of type uint16, changing for int32 to be able to pass negative labels
        # negative labels won't be rendered in canvas, therefore its a quick fix 
        label_img[:] = -1
        data_repo.set_image(key="label", data=label_img)

    return "All markers erased successfully", 200


@app.route("/save_annot", methods=["POST"])
@cross_origin()
def save_annot():
    """
    Function that saves the annotation as .pickle

    Returns:
        (str): returns "success" if everything goes well and an error otherwise

    """

    annot_module = module_repo.get_module('annotation')

    annotation_coords, annotation_labels = annot_module.get_annotation_coords()
    annotation_slice_dict = annot_module.get_annotation_slice_dict()

    if len(annotation_coords) == 0:
        return handle_exception("Failed to fetch annotation")
    try:
        annot_path  = request.json["annot_path"]
        label_names = request.json["label_names"]
    except:
        return handle_exception("Failed to receive annotation path")

    annot_data = [label_names, annotation_coords, annotation_labels, annotation_slice_dict]

    with open(annot_path, "wb") as f:
        pickle.dump(annot_data, f)

    return "success", 200


@app.route("/draw", methods=["POST"])
@cross_origin()
def draw():
    slice_num = request.json["slice"]
    axis = request.json["axis"]
    size = request.json["size"] #size in diameter
    label = request.json["label"]
    mode = request.json["mode"]
    cursor_coords = request.json["coords"]

    axis_dim = utils.get_axis_num(axis)

    annot_module = module_repo.get_module('annotation')

    if annot_module is None:
        return handle_exception("Annotation module not found")

    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)
    annot_module.set_radius((size + 1)// 2) #we are counting half fills, so the size is increase by + 1 

    marker_id = annot_module.current_mk_id

    erase = (mode == 'erase_brush')
    
    annot_module.draw_marker_curve(cursor_coords, marker_id, label, erase)

    return "success", 200


@app.route("/get_annot_slice", methods=["POST"])
@cross_origin()
def get_annot_slice():
    """
    Function that gets the annotation of a specific image slice

    Returns:
        (tuple[np.ndarray, str]): returns the np.ndarray with the annotations and a str that represents the response type for sfetch

    """
    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    annot_module = module_repo.get_module('annotation')

    if (annot_module != None):
        img_slice = annot_module.annotation_image[slice_range]

        img_slice = zlib.compress(utils.toNpyBytes(img_slice))

        return send_file(io.BytesIO(img_slice), "application/gzip")

    return "test", "application/gzip"


@app.route("/undo_annot", methods=['POST'])
@cross_origin()
def undo_annot():
    """
    Function that undos an annotation

    Returns:
        (str): returns "success" if everything goes well and an error otherwise

    """
    annot_module = module_repo.get_module('annotation')
    #when the label is deleted in frontend we need to tell frontend to recover this label with the undo operation
    _, label_returned = annot_module.undo()

    return jsonify(label_returned)


@app.route("/delete_label_annot", methods=["POST"])
@cross_origin()
def delete_label_annot():
    """
    Function that deletes label and annotation

    Returns:
        (str): returns a string "success" if everything goes well and an Error otherwise

    """
    try:
        label_id = request.json["label_id"]
    except Exception as e:
        return handle_exception(str(e))

    annot_module = module_repo.get_module('annotation')
    marker_id = annot_module.current_mk_id
    annot_module.remove_label(label_id, marker_id)

    return "success", 200


@app.route("/get_annotation_history", methods=["POST"])
@cross_origin()
def get_annotation_history():
    """
    Function that retrieves the annotation image and prepares data
    for slice viewing in the frontend.

    Returns:
        dict: JSON object containing index, values, and length
        for each axis (XY, XZ, YZ).
    """
    annot_module = module_repo.get_module('annotation')

    annot_slice_dict = annot_module.get_annotation_slice_dict()
    if len(annot_slice_dict) == 0:
        raise ValueError("There must be at least one annotated slice")
    
    XY, XZ, YZ = annot_slice_dict[0], annot_slice_dict[1], annot_slice_dict[2]
    XY = sorted([int(c) for c in XY])
    XZ = sorted([int(c) for c in XZ])
    YZ = sorted([int(c) for c in YZ])

    hist = {
        "XY": {"index": list(range(len(XY))), "values": XY, "length": len(XY)},
        "XZ": {"index": list(range(len(XZ))), "values": XZ, "length": len(XZ)},
        "YZ": {"index": list(range(len(YZ))), "values": YZ, "length": len(YZ)},
    }
    print(hist)

    # Return the data as a JSON response
    return jsonify(hist)


@app.route("/is_annotation_empty", methods=["POST"])
@cross_origin()
def is_annotation_empty():
    """
    Function that verify if exist any previous annotation

    Notes:
        This function is only used in CanvasContainer.tsx just to verify if is needed to create a new annotation

    Returns:
        (bool): return True to create a new annotation and False otherwise

    """
    annot_module = module_repo.get_module('annotation')

    if (annot_module == None):
        return jsonify(True)

    return jsonify(False)

@app.route("/magic_wand/<input_id>", methods=["POST"])
@cross_origin()
def apply_magicwand(input_id: str):
    """
    Function to apply the magic wand from request of the frontend.

    Returns:
        (number): returns center pixel value if everything goes well

    """
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")

    try:
        slice_num = request.json["slice"]
        axis = request.json["axis"]
        x_coord = request.json["x_coord"]
        y_coord = request.json["y_coord"]
        upper_max = request.json["upper_max"]
        upper_min = request.json["upper_min"]
        blur_radius = request.json["blur_radius"]
        label = request.json["label"]
        new_click = request.json["new_click"]
        max_contrast = request.json["max_contrast"]
        min_contrast = request.json["min_contrast"]
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    #update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    img_slice = data_repo.get_image(input_id)[slice_range]
 
    if new_click:
        upper_tolerance = python_typer((8 * (max_contrast - min_contrast)) / 100)
        lower_tolerance = upper_tolerance
    else:
        upper_tolerance = python_typer(upper_max - img_slice[y_coord, x_coord])
        lower_tolerance = python_typer(img_slice[y_coord, x_coord] - upper_min)

    mw = MagicWandSelector(img_slice, blur_radius = blur_radius, upper_tolerance = upper_tolerance, lower_tolerance = lower_tolerance)

    mask_wand, stats = mw.apply_magic_wand(x_coord, y_coord)

    #Marker id is not necessary for the magic wand logic.
    mk_id = annot_module.current_mk_id

    annot_module.labelmask_update(mask_wand > 0, label, mk_id, new_click)

    return jsonify(python_typer(img_slice[y_coord, x_coord]))

@app.route("/threshold/<input_id>", methods=["POST"])
@cross_origin()
def threshold(input_id: str):
    """
    Function to apply the threhsold from request of the frontend.

    Returns:
        (str): returns "success" if everything goes well 

    """
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    try:
        upper_tresh = request.json["upper_tresh"]
        lower_tresh = request.json["lower_tresh"]
        slice_num = request.json["current_slice"]
        axis = request.json["current_axis"]
        label = request.json["label"]
        new_click = request.json["new_click"]

    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    #update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    img_slice = data_repo.get_image(input_id)[slice_range]
 
    mk_id = annot_module.current_mk_id

    label_mask = np.logical_and(img_slice >= lower_tresh, img_slice <= upper_tresh) 

    annot_module.labelmask_update(label_mask, label, mk_id, new_click)


    return jsonify(annot_module.current_mk_id)

@app.route("/threshold_apply3D/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def threshold_apply3D(input_id: str, output_id: str):
    """
    Function to apply the threshold from a request of the frontend.

    Returns:
        (str): returns "success" if everything goes well.
    """
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")

    try:
        # Parse request JSON safely
        data = request.get_json()
        if not data:
            raise KeyError("Missing JSON data in the request")

        upper_thresh = data["upper_thresh"]
        lower_thresh = data["lower_thresh"]
        label = data["label"]

    except KeyError as e:
        return handle_exception(f"Missing key in JSON: {str(e)}")
    except Exception as e:
        return handle_exception(f"Unexpected error: {str(e)}")

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    img = data_repo.get_image(input_id)

    if img is None:
        return handle_exception("Input image not found")

    mk_id = annot_module.current_mk_id
    label_mask = np.logical_and(img >= lower_thresh, img <= upper_thresh)

    if output_id == 'annotation':
        # Determine new click status
        new_click = True

        annot_module.labelmask_update(label_mask, label, mk_id, new_click)

    else:
        img_label = data_repo.get_image("label")

        # Create the image label if not already present
        if img_label is None or img.shape != img_label.shape:
            img_label = np.zeros(img.shape, dtype='int32')
            img_label[~label_mask] = -1

        img_label[label_mask] = label
        data_repo.set_image("label", img_label)

    return jsonify({"current_mk_id": annot_module.current_mk_id})

@app.route("/apply_lasso/<input_id>", methods=["POST"])
@cross_origin()
def apply_lasso(input_id: str):
    """
    Function to apply the threshold from request of the frontend.

    Returns:
        (str): returns "success" if everything goes well 
    """
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    try:
        lasso_points = request.json["lasso_points"]
        label = request.json["label"]
        slice_num = request.json["slice_num"]
        axis = request.json["axis"]
    except Exception as e:
        return handle_exception(str(e))

    #update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)
    img_slice = data_repo.get_image('image')[slice_range]
 
    mk_id = annot_module.current_mk_id

    points = [(int(round(point['x'])), int(round(point['y']))) for point in lasso_points]
    height = img_slice.shape[0]  
    width = img_slice.shape[1]
    
    label_mask = fill_lasso(width, height, points)

    annot_module.labelmask_update(label_mask, label, mk_id, new_click=True)

    return jsonify(annot_module.current_mk_id)

@app.route("/active_contour/<input_id>/<mode_id>", methods=["POST"])
@cross_origin()
def apply_active_contour(input_id: str, mode_id: str):
    """
    Apply active contours (Chan-Vese or Geodesic) in initialization, execution, or finalization modes.

    Args:
        input_id (str): Identifier for the input.
        mode_id (str): Mode of operation ('start', 'execution', 'finalize').

    Returns:
        JSON or str: Coordinates list for execution or "success" for finalization.
    """
    import time

    start_time = time.time()

    # Step 1: Parse Parameters
    try:
        params = {
            "seed_points": [(int(round(p["y"])), int(round(p["x"]))) for p in request.json["points"]],
            "label": request.json["label"],
            "slice_num": request.json["slice_num"],
            "axis": request.json["axis"],
            "iterations": int(request.json["iterations"]),
            "smoothing": int(request.json["smoothing"]),
            "weight": float(request.json["weight"]),
            "method": str(request.json["method"]),  # 'chan-vese' or 'geodesic'
            "threshold_percentage": float(request.json.get("threshold", 40)),
            "balloon_force": float(request.json.get("balloon_force", True)),
            "sigma": float(request.json.get("sigma", 1)),

        }
    except Exception as e:
        return handle_exception(str(e))

    annot_module = module_repo.get_module("annotation")

    # Step 2: Preprocessing (Setup for 'start' only)
    if mode_id == "start":
        # Set current slice and axis
        axis_dim = utils.get_axis_num(params["axis"])
        annot_module.set_current_axis(axis_dim)
        annot_module.set_current_slice(params["slice_num"])

        # Get image slice and convert to float
        slice_range = utils.get_3d_slice_range_from(params["axis"], params["slice_num"])
        img_slice = img_as_float32(data_repo.get_image("image")[slice_range])
        

        # Store the image slice for later use
        data_repo.set_image(key="ImageForContour", data=img_slice)

        # If the method is geodesic, compute and store the gradient image
        if params["method"] == "geodesic":
            gimage = inverse_gaussian_gradient(img_slice, sigma=params["sigma"])
            data_repo.set_image(key="ImageForContour", data=gimage)
            threshold = np.percentile(gimage, params["threshold_percentage"])
            data_repo.set_image(key="GeodesicTresh", data=threshold)

    init_ls = annot_module.draw_init_levelset(params["seed_points"])
    host_image = data_repo.get_image("ImageForContour")

    # Step 3: Execution Logic
    if params["method"] == "chan-vese":
        level_set = morphological_chan_vese(
            host_image, init_level_set = init_ls, num_iter = params["iterations"], lambda1=params["weight"], lambda2=1.0, smoothing=params["smoothing"]
        )
    elif params["method"] == "geodesic":
        threshold = data_repo.get_image("GeodesicTresh")
        level_set = morphological_geodesic_active_contour(
            host_image,
            init_level_set=init_ls,
            num_iter=params["iterations"],
            balloon=params["balloon_force"],
            threshold=threshold,
            smoothing=params["smoothing"]
        )
    else:
        print(params["method"])
        return handle_exception(f"Unknown method: {params['method']}")

    # Step 4: Finalization or Boundary Extraction
    if mode_id == "finalize":
        # Update annotation with the final level set
        mk_id = annot_module.current_mk_id
        annot_module.labelmask_update(level_set, params["label"], mk_id, new_click=True)

        # Clean up stored images
        data_repo.delete_image("ImageForContour")

        return jsonify(annot_module.current_mk_id)

    # Extract boundary coordinates for visualization
    border = spin_img.spin_find_boundaries(level_set, dtype="uint8") > 0
    yy, xx = np.nonzero(border)
    coords_list = [yy.astype("int").tolist(), xx.astype("int").tolist()]

    print(f"Execution completed in {time.time() - start_time:.2f} seconds")
    return jsonify(coords_list)

@app.route("/active_contour_checkboard/<input_id>", methods=["POST"])
@cross_origin()
def apply_active_contour_checkboard(input_id: str):
    """
    Apply active contours using the checkboard initialization method.

    Args:
        input_id (str): Identifier for the input.

    Returns:
        JSON or str: Coordinates list for execution or "success" for finalization.
    """
    import time

    start_time = time.time()

    # Step 1: Parse Parameters
    try:
        params = {
            "label": request.json["label"],
            "slice_num": request.json["slice_num"],
            "axis": request.json["axis"],
            "iterations": int(request.json["iterations"]),
            "smoothing": int(request.json["smoothing"]),
            "weight": float(request.json["weight"]),
            "checkboard_size": int(request.json.get("checkboard_size", 3)),
            "background": bool(request.json.get("background", True))
        }
    except Exception as e:
        return handle_exception(str(e))

    annot_module = module_repo.get_module("annotation")

    # Step 2: Preprocessing - Set Up Current Slice and Axis
    axis_dim = utils.get_axis_num(params["axis"])
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(params["slice_num"])

    # Get image slice and convert to float
    slice_range = utils.get_3d_slice_range_from(params["axis"], params["slice_num"])
    img_slice = img_as_float32(data_repo.get_image(input_id)[slice_range])
    
    # Step 3: Initialize Level Set using Checkerboard
    init_ls = np.zeros(img_slice.shape, dtype=bool)
    level_set = checkerboard_level_set(img_slice.shape, params["checkboard_size"]) > 0
    init_ls = level_set

    level_set = morphological_chan_vese(
        img_slice.astype(np.float32),
        params["iterations"],
        init_ls,
        smoothing=params["smoothing"],
        lambda1=params["weight"],
        lambda2=1.0
    )


    # Step 5: Adjust Level Set for Intensity
    if (params["background"]==True):
        if (img_slice[level_set].mean() > img_slice[~level_set].mean()):
            level_set = ~level_set
    elif ((img_slice[level_set].mean() < img_slice[~level_set].mean())):
        level_set = ~level_set
        
    # Step 6: Finalization Logic
    # Update annotation with the final level set
    mk_id = annot_module.current_mk_id
    annot_module.labelmask_update(level_set, params["label"], mk_id, new_click=True)

    print(f"Finalization of checkboard completed in {time.time() - start_time:.2f} seconds")
    return jsonify(annot_module.current_mk_id)


@app.route("/niblack_preview/<input_id>", methods=["POST"])
@cross_origin()
def niblack_preview(input_id: str):
    from harpia.threshold.thresholdChunked import threshold_niblack
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    try:
        N = request.json["Kernel"]
        W = request.json["Weight"]
        slice_num = request.json["current_slice"]
        axis = request.json["current_axis"]
        label = request.json["label"]
        curret_thresh_marker = request.json["curret_thresh_marker"]

    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    #update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    img_slice = data_repo.get_image(input_id)[slice_range]

    input_img_3d = np.ascontiguousarray(img_slice.reshape((1, *img_slice.shape)),dtype=np.float32)

    output_img = np.ascontiguousarray(np.zeros_like(input_img_3d,dtype=np.float32))

    z,x,y = output_img.shape
 
    mk_id = annot_module.current_mk_id

    print('Current markers\n',mk_id,curret_thresh_marker)
    #New annotation
    if mk_id != curret_thresh_marker:
        new_click = True
    #its not a new annotation (overwrite current annotation)
    else:
        new_click = False

    #label_mask = img_slice >= 34000
    #threshold_H.niblack(input_img_3d,output_img,W,x,y,z,N,N,1)
    output_img = threshold_niblack(input_img_3d,windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

    label_mask = output_img>0

    annot_module.labelmask_update(label_mask, label, mk_id, new_click)

    return jsonify(annot_module.current_mk_id)


@app.route("/niblack_apply/<input_id>", methods=["POST"])
@cross_origin()
def niblack_apply(input_id: str):
    from harpia.threshold.thresholdChunked import threshold_niblack
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        N = request.json["Kernel"]  # Kernel size
        W = request.json["Weight"]  # Weight
        convType = request.json["convolutionType"]  # Convolution type (2d or 3d)
        slice_num = request.json["current_slice"]  # Current slice number
        axis = request.json["current_axis"]  # Axis: XY, XZ, YZ
        label = request.json["label"]  # Label to associate with mask
        curret_thresh_marker = request.json["curret_thresh_marker"]  # Current marker
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    input_img = np.ascontiguousarray(data_repo.get_image(input_id), dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img), dtype=np.float32)

    z, x, y = input_img.shape
    mk_id = annot_module.current_mk_id

    print('Current markers\n', mk_id, curret_thresh_marker)
    # New annotation
    if mk_id != curret_thresh_marker:
        new_click = True
    # It's not a new annotation (overwrite current annotation)
    else:
        new_click = False

    if convType == "2d":
        # convolution in x, y applied for all slices in the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[axis]
        typeImg2d = input_img[0].dtype
        # Apply threshold based on axis direction
        if axisIndex == 0:  # XY plane
            img = input_img[slice_num]
            #threshold_H.niblack(img.reshape(1, x, y), output_img[slice_num].reshape(1, x, y), W, x, y, 1, N, N, 1)
            output_img[slice_num] = threshold_niblack(img.reshape(1, x, y),windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)


        elif axisIndex == 1:  # XZ plane
            input = np.ascontiguousarray(input_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.niblack(input, out, W, x, y, z, N, N, 1)
            output_img[:, slice_num, :] = threshold_niblack(input,windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        elif axisIndex == 2:  # YZ plane
            input = np.ascontiguousarray(input_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.niblack(input, out, W, x, y, z, N, N, 1)
            output_img[:, :, slice_num] = threshold_niblack(input,windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        annot_module.annotation_image[slice_range] = np.where(output_img[slice_range] > 0, label, -1)

    elif convType == "3d":
        # Apply convolution in all x, y, z directions
        #threshold_H.niblack(input_img, output_img, W, x, y, z, N, N, N)
        output_img= threshold_niblack(input_img,windowSize=N,weight=W,type3d=1,verbose=1,gpuMemory=0.1,ngpus=1)

        img_label = np.where(output_img > 0, label, -1)

        data_repo.set_image("label",img_label)

    #label_mask = output_img > 0
    #annot_module.labelmask_update(label_mask, label, mk_id, new_click)

    return jsonify(annot_module.current_mk_id)


@app.route("/sauvola_apply/<input_id>", methods=["POST"])
@cross_origin()
def sauvola_apply(input_id: str):
    from harpia.threshold.thresholdChunked import threshold_sauvola
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        N = request.json["Kernel"]  # Kernel size
        W = request.json["Weight"]  # Weight
        R = request.json['Range'] # range
        convType = request.json["convolutionType"]  # Convolution type (2d or 3d)
        slice_num = request.json["current_slice"]  # Current slice number
        axis = request.json["current_axis"]  # Axis: XY, XZ, YZ
        label = request.json["label"]  # Label to associate with mask
        curret_thresh_marker = request.json["curret_thresh_marker"]  # Current marker
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    input_img = np.ascontiguousarray(data_repo.get_image(input_id), dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img), dtype=np.float32)

    z, x, y = input_img.shape
    mk_id = annot_module.current_mk_id

    print('Current markers\n', mk_id, curret_thresh_marker)
    # New annotation
    if mk_id != curret_thresh_marker:
        new_click = True
    # It's not a new annotation (overwrite current annotation)
    else:
        new_click = False

    if convType == "2d":
        # convolution in x, y applied for all slices in the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[axis]
        typeImg2d = input_img[0].dtype
        # Apply threshold based on axis direction
        if axisIndex == 0:  # XY plane
            img = input_img[slice_num]
            #threshold_H.sauvola(img.reshape(1, x, y), output_img[slice_num].reshape(1, x, y), W, R, x, y, 1, N, N, 1)
            output_img[slice_num] = threshold_sauvola(img.reshape(1, x, y),windowSize=N,range = R,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        elif axisIndex == 1:  # XZ plane
            input = np.ascontiguousarray(input_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.sauvola(input, out, W, R, x, y, z, N, N, 1)
            output_img[:, slice_num, :] = threshold_sauvola(input,windowSize=N,range = R,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        elif axisIndex == 2:  # YZ plane
            input = np.ascontiguousarray(input_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.sauvola(input, out, W, R, x, y, z, N, N, 1)
            output_img[:, :, slice_num] = threshold_sauvola(input,windowSize=N,range = R,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        annot_module.annotation_image[slice_range] = np.where(output_img[slice_range] > 0, label, -1)


    elif convType == "3d":
        # Apply convolution in all x, y, z directions
        #threshold_H.sauvola(input_img, output_img, W, R, x, y, z, N, N, N)
        output_img = threshold_sauvola(input_img,windowSize=N,range = R,weight=W,type3d=1,verbose=1,gpuMemory=0.1,ngpus=1)

        img_label = np.where(output_img > 0, label, -1)

        data_repo.set_image("label",img_label)

    #label_mask = output_img > 0
    #annot_module.labelmask_update(label_mask, label, mk_id, new_click)

    return jsonify(annot_module.current_mk_id)

@app.route("/local_mean_apply/<input_id>", methods=["POST"])
@cross_origin()
def local_mean_apply(input_id: str):
    from harpia.threshold.thresholdChunked import threshold_mean
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        N = request.json["Kernel"]  # Kernel size
        W = request.json["Threshold"]  # Weight
        convType = request.json["convolutionType"]  # Convolution type (2d or 3d)
        slice_num = request.json["current_slice"]  # Current slice number
        axis = request.json["current_axis"]  # Axis: XY, XZ, YZ
        label = request.json["label"]  # Label to associate with mask
        curret_thresh_marker = request.json["curret_thresh_marker"]  # Current marker
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    input_img = np.ascontiguousarray(data_repo.get_image(input_id), dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img), dtype=np.float32)

    z, x, y = input_img.shape
    mk_id = annot_module.current_mk_id

    print('Current markers\n', mk_id, curret_thresh_marker)
    # New annotation
    if mk_id != curret_thresh_marker:
        new_click = True
    # It's not a new annotation (overwrite current annotation)
    else:
        new_click = False

    if convType == "2d":
        # convolution in x, y applied for all slices in the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[axis]
        typeImg2d = input_img[0].dtype
        # Apply threshold based on axis direction
        if axisIndex == 0:  # XY plane
            img = input_img[slice_num]
            #threshold_H.local_mean(img.reshape(1, x, y), output_img[slice_num].reshape(1, x, y), W, x, y, 1, N, N, 1)
            output_img[slice_num] = threshold_mean(img.reshape(1, x, y),windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)



        elif axisIndex == 1:  # XZ plane
            input = np.ascontiguousarray(input_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.local_mean(input, out, W, x, y, z, N, N, 1)
            output_img[:, slice_num, :] = threshold_mean(input,windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        elif axisIndex == 2:  # YZ plane
            input = np.ascontiguousarray(input_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.local_mean(input, out, W, x, y, z, N, N, 1)
            output_img[:, :, slice_num] = threshold_mean(input,windowSize=N,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        annot_module.annotation_image[slice_range] = np.where(output_img[slice_range] > 0, label, -1)

    elif convType == "3d":
        # Apply convolution in all x, y, z directions
        #threshold_H.local_mean(input_img, output_img, W, x, y, z, N, N, N)
        output_img= threshold_mean(input_img,windowSize=N,weight=W,type3d=1,verbose=1,gpuMemory=0.1,ngpus=1)

        img_label = np.where(output_img > 0, label, -1)

        data_repo.set_image("label",img_label)

    #label_mask = output_img > 0
    #annot_module.labelmask_update(label_mask, label, mk_id, new_click)

    return jsonify(annot_module.current_mk_id)


@app.route("/local_gaussian_apply/<input_id>", methods=["POST"])
@cross_origin()
def local_gaussian_apply(input_id: str):
    from harpia.threshold.thresholdChunked import threshold_gaussian
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        S = request.json["Sigma"]  # Kernel size
        W = request.json["Threshold"]  # Weight
        convType = request.json["convolutionType"]  # Convolution type (2d or 3d)
        slice_num = request.json["current_slice"]  # Current slice number
        axis = request.json["current_axis"]  # Axis: XY, XZ, YZ
        label = request.json["label"]  # Label to associate with mask
        curret_thresh_marker = request.json["curret_thresh_marker"]  # Current marker
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    input_img = np.ascontiguousarray(data_repo.get_image(input_id), dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img), dtype=np.float32)

    z, x, y = input_img.shape
    mk_id = annot_module.current_mk_id

    print('Current markers\n', mk_id, curret_thresh_marker)
    # New annotation
    if mk_id != curret_thresh_marker:
        new_click = True
    # It's not a new annotation (overwrite current annotation)
    else:
        new_click = False

    if convType == "2d":
        # convolution in x, y applied for all slices in the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[axis]
        typeImg2d = input_img[0].dtype
        # Apply threshold based on axis direction
        if axisIndex == 0:  # XY plane
            img = input_img[slice_num]
            #threshold_H.local_gaussian(img.reshape(1, x, y), output_img[slice_num].reshape(1, x, y), x, y, 1, S,W,0)
            output_img[slice_num] = threshold_gaussian(img.reshape(1, x, y),sigma=S,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        elif axisIndex == 1:  # XZ plane
            input = np.ascontiguousarray(input_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.local_gaussian(input, out, x, y, z, S,W,0)
            output_img[:, slice_num, :] = threshold_gaussian(input,sigma=S,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        elif axisIndex == 2:  # YZ plane
            input = np.ascontiguousarray(input_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(output_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #z, x, y = out.shape
            #threshold_H.local_gaussian(input, out, x, y, z, S, W,0)
            output_img[:, :, slice_num] = threshold_gaussian(input,sigma=S,weight=W,type3d=0,verbose=1,gpuMemory=0.1,ngpus=1)

        #annot_module.annotation_image[slice_range] = output_img[slice_range]
        annot_module.annotation_image[slice_range] = np.where(output_img[slice_range] > 0, label, -1)

    elif convType == "3d":
        # Apply convolution in all x, y, z directions
        #threshold_H.local_gaussian(input_img, output_img, x, y, z, S,W,1)
        output_img= threshold_gaussian(input_img,sigma=S,weight=W,type3d=1,verbose=1,gpuMemory=0.1,ngpus=1)

        img_label = np.where(output_img > 0, label, -1)

        data_repo.set_image("label",img_label)


    #label_mask = output_img > 0
    #annot_module.labelmask_update(label_mask, label, mk_id, new_click)

    return jsonify(annot_module.current_mk_id)

@app.route("/watershed_apply_2d/<input_id>", methods=["POST"])
@cross_origin()
def watershed_apply(input_id: str):
    from harpia.filters.filtersChunked import (sobel, prewitt)
    from harpia.watershed import watershed
    from harpia.quantification import quantification
    print(dir(quantification))

    print(request.json)
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        #parameters
        input_filter = request.json.get("inputFilter")
        algorithm = request.json.get("algorithm")
        dimension = request.json.get("dimension")
        slice_num = request.json.get("current_slice")
        axis = request.json.get("current_axis")
        label = request.json.get("label")
        current_thresh_marker = request.json.get("current_thresh_marker")
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    input_img = np.ascontiguousarray(data_repo.get_image(input_id), dtype=np.float32)
    relief_img = np.zeros_like(input_img, dtype=np.float32)

    z, x, y = input_img.shape
    mk_id = annot_module.current_mk_id

    print('Current markers\n', mk_id, current_thresh_marker)
    # New annotation
    if mk_id != current_thresh_marker:
        new_click = True
    else:
        new_click = False
    if dimension == '2d':
        # convolution in x, y applied for all slices in the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[axis]
        typeImg2d = input_img[0].dtype
        # Apply threshold based on axis direction
        print("getting relief")
        if axisIndex == 0:  # XY plane
            img = input_img[slice_num]

            if input_filter == 'sobel':
                relief_img[slice_num] = sobel(img.reshape(1, x, y), type3d=0, verbose =1, gpuMemory=0.1, ngpus=1)

            elif input_filter == 'prewitt':
                relief_img[slice_num] = prewitt(img.reshape(1, x, y), type3d=0, verbose =1, gpuMemory=0.1, ngpus=1)

        elif axisIndex == 1:  # XZ plane
            input = np.ascontiguousarray(input_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(relief_img[:, slice_num, :].reshape((1, *input_img[:, slice_num, :].shape)), dtype=np.float32)
            #z, x, y = out.shape

            if input_filter == 'sobel':
                out = sobel(input, type3d=0, verbose =1, gpuMemory=0.1, ngpus=1)

            elif input_filter == 'prewitt':
                out = prewitt(input, type3d=0, verbose =1, gpuMemory=0.1, ngpus=1)

            relief_img[:, slice_num, :] = out

        elif axisIndex == 2:  # YZ plane
            input = np.ascontiguousarray(input_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #out = np.ascontiguousarray(relief_img[:, :, slice_num].reshape((1, *input_img[:, :, slice_num].shape)), dtype=np.float32)
            #z, x, y = out.shape
                    
            if input_filter == 'sobel':
                out = sobel(input, type3d=0, verbose =1, gpuMemory=0.1, ngpus=1)

            elif input_filter == 'prewitt':
                out = prewitt(input, type3d=0, verbose =1, gpuMemory=0.1, ngpus=1)
                        
            relief_img[:, :, slice_num] = out

        #now we get the markers using the labels
        print("getting markers")
        markers = annot_module.annotation_image[slice_range].astype(np.int32)

        watershed_relief = relief_img[slice_range].astype(np.int32)
        x,y = markers.shape
        print("apply watershed")
        watershed.watershed_meyers_2d(watershed_relief, markers, -1)

        annot_module.multilabel_updated(markers, mk_id)

    else:
        if input_filter == 'sobel':
            relief_img = sobel(input_img, type3d=1, verbose =1, gpuMemory=0.1, ngpus=1)

        elif input_filter == 'prewitt':
            relief_img = prewitt(input_img, type3d=1, verbose =1, gpuMemory=0.1, ngpus=1)

        markers = data_repo.get_image('label').astype(np.int32)
        watershed_relief = relief_img.astype(np.int32)

        print('relief shape:',watershed_relief.shape)
        print('markers shape:',markers.shape)

        #watershed.watershed_meyers_3d(watershed_relief,markers,-1,x,y,z)
        z,x,y = watershed_relief.shape

        for i in range(z):
            watershed.watershed_meyers_2d(watershed_relief[i], markers[i], -1)

        img_label = data_repo.get_image('label')

        if img_label is None:
            img_label = np.zeros_like(input_img)

        print("img_label shape:", img_label.shape)

        img_label[markers >= 0] = markers[markers >= 0]

        data_repo.set_image("label", img_label)

    return jsonify(annot_module.current_mk_id)


@app.route("/remove_islands_apply/<input_id>", methods=["POST"])
@cross_origin()
def remove_islands_apply(input_id: str):
    from harpia.quantification import quantification
    from skimage import morphology #for testing, because my remove islands has another logic and it may results in some bugs

    print(request.json)
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        #parameters
        dimension = request.json.get("dimension")
        min_size = request.json.get('minSize')
        slice_num = request.json.get("current_slice")
        axis = request.json.get("current_axis")
        label = request.json.get("label")
        current_thresh_marker = request.json.get("current_thresh_marker")
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    mk_id = annot_module.current_mk_id

    print('Current markers\n', mk_id, current_thresh_marker)
    # New annotation
    if mk_id != current_thresh_marker:
        new_click = True
    else:
        new_click = False

    if dimension == '2d':
        #now we get the markers using the labels
        annot_slice = annot_module.annotation_image[slice_range]
        input_mask = annot_slice == label

        #x,y = label_mask.shape
        #quantification.removeIslands(input_mask,output_mask,min_size,x,y,1)
        #there is a bug in cuda i dont understand yet, therefore i will use skimage for now... sorry for this
        output_mask = morphology.remove_small_objects(input_mask,min_size=min_size,connectivity=2)
        #get what was removed
        island_image = (~output_mask) * input_mask

        annot_module.labelmask_update(island_image, -1, mk_id, True)

    else:
        input_img = data_repo.get_image('image')

        label_image = data_repo.get_image('label')

        if label_image is None:
            pass

        input_mask  = label_image==label
        output_mask = morphology.remove_small_objects(input_mask,min_size=min_size,connectivity=2)

        #get what was removed
        island_image = (~output_mask) * input_mask

        label_image[island_image]=-1 

        data_repo.set_image("label",label_image)

    return jsonify(annot_module.current_mk_id)



@app.route("/quantification_apply/<input_id>", methods=["POST"])
@cross_origin()
def quantification_apply(input_id: str):
    from harpia.quantification import quantification
    import numpy as np
    import time

    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        elif isinstance(x, (str,)):
            return str(x)
        else:
            raise ValueError(f"Unsupported data type: {type(x)}")

    try:
        # Parameters
        dimension = request.json.get("dimension")
        metrics = request.json.get("metrics", [])  # Initialize as empty list if not provided
        slice_num = request.json.get("current_slice")
        axis = request.json.get("current_axis")
        label = request.json.get("label")
        current_thresh_marker = request.json.get("current_thresh_marker")

        print(f"Received dimension: {dimension}, slice_num: {slice_num}, metrics: {metrics}")
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module("annotation")
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    mk_id = annot_module.current_mk_id
    new_click = mk_id != current_thresh_marker

    if dimension == "2D":
        # Get the markers using the labels
        label_mask = annot_module.annotation_image[slice_range].astype(np.int32)
        x, y = label_mask.shape

        input_mask = label_mask.reshape(1, x, y) + 1
        perimeter = np.zeros_like(input_mask, dtype=np.uint32)
        area = np.zeros_like(input_mask, dtype=np.uint32)

        quantification.compute_perimeter(input_mask, perimeter, x, y, 1)
        quantification.compute_area(input_mask, area, x, y, 1, 0)

        perimeter = perimeter.ravel()
        area = area.ravel()

        print("area: ", area)

        # Recalculate the metrics
        metrics.clear()  # Clear existing metrics before recalculating

        for idx in range(1, np.max(input_mask) + 1):
            label_perimeter = perimeter[idx]
            label_area = area[idx]

            metrics.append({
                "label": python_typer(idx - 1),
                "dimension": dimension,
                "perimeter": python_typer(label_perimeter),
                "area": python_typer(label_area),
            })

    else:  # 3D case
        input_mask = data_repo.get_image("label").astype(np.int32) + 1

        if input_mask is None:
            return jsonify({"error": "No input mask available"}), 400

        z, x, y = input_mask.shape

        # Allocate buffers for metrics
        volume = np.zeros_like(input_mask, dtype=np.uint32)
        surface_area = np.zeros_like(input_mask, dtype=np.uint32)

        # Compute metrics
        quantification.compute_volume(input_mask, volume, x, y, z)
        quantification.compute_area(input_mask, surface_area, x, y, z,1)  # Replace area with surface_area

        # Flatten arrays for easier iteration
        volume = volume.ravel()
        surface_area = surface_area.ravel()

        print("volume: ", volume)
        print("surface_area: ", surface_area)  # Update the log to surface_area

        # Update metrics
        for idx in range(1, np.max(input_mask) + 1):
            label_volume = volume[idx]
            label_surface_area = surface_area[idx]  # Use surface_area here

            # Update or append metrics for this label
            updated = False
            for metric in metrics:
                if metric["label"] == idx - 1:
                    metric["volume"] = python_typer(label_volume)
                    metric["surface_area"] = python_typer(label_surface_area)  # Update surface_area
                    updated = True
                    break

            if not updated:
                metrics.append({
                    "label": python_typer(idx - 1),
                    "dimension": dimension,
                    "volume": python_typer(label_volume),
                    "surface_area": python_typer(label_surface_area),  # Use surface_area here
                })

    # Log the final result before returning
    print(f"Updated Metrics: {metrics}")

    # Return the updated metrics as a JSON response
    return jsonify({"data": metrics})


@app.route("/object_separation_apply/<input_id>", methods=["POST"])
@cross_origin()
def object_separation_apply(input_id: str):
    from harpia.watershed import watershed
    from harpia.filters import (sobel, prewitt)
    from harpia.distanceTransform import distance_transform_log_sum_kernel
    from skimage.feature import peak_local_max
    from scipy import ndimage as ndi
    
    print(request.json)
    def python_typer(x):
        if isinstance(x, (float, np.floating)):
            return float(x)
        elif isinstance(x, (int, np.integer)):
            return int(x)
        else:
            raise ValueError("Unsupported data type")
    
    try:
        #parameters
        algorithm = request.json.get("algorithm")
        dimension = request.json.get("dimension")
        sigma = request.json.get("sigma")
        slice_num = request.json.get("current_slice")
        axis = request.json.get("current_axis")
        label = request.json.get("label")
        current_thresh_marker = request.json.get("current_thresh_marker")
        
    except Exception as e:
        return handle_exception(str(e))

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    # Update backend slice number
    annot_module = module_repo.get_module('annotation')
    axis_dim = utils.get_axis_num(axis)
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)

    mk_id = annot_module.current_mk_id
    new_click = mk_id != current_thresh_marker

    img_label = data_repo.get_image('label')

    if img_label is None:
            return None
    
    z,x,y = img_label.shape
    edt = distance_transform_log_sum_kernel.distance_transform_edt(img_label,sigma,1,z,x,y)

    # Check for NaN or inf values in edt and raise an error if found
    if np.isnan(edt).any() or np.isinf(edt).any():
        return handle_exception("Error: edt contains NaN or infinite values.")
    
    print('local max')
    coords = peak_local_max(edt, footprint=np.ones((5, 5, 5)), min_distance=11,labels=img_label.reshape(edt.shape))

    print('zeroes mask')
    mask = np.zeros(edt.shape, dtype=bool)
    mask[tuple(coords.T)] = True

    print('markers generation')
    markers, _ = ndi.label(mask)

    print('relief creation')
    relief = -edt.astype(np.int32)

    print('watershed start')
    for i in range(z):
            watershed.watershed_meyers_2d(relief[i], markers[i], 0)

    markers = markers*(img_label>0)
    data_repo.set_image('label',markers.astype(np.int32))

    return jsonify(annot_module.current_mk_id)
