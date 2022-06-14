"""
This script contains functions used for annotations
@Docs author : Gabriel Borin Macedo (gabriel.macedo@lnls.com.br or borinmacedo@gmail.com)
"""

from flask import Blueprint, request, send_file, jsonify
import pickle
import io
import zlib

from sscAnnotat3D.modules import annotation_module
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D import utils

from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest

app = Blueprint('annotation', __name__)


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

    annot_module = annotation_module.AnnotationModule(img.shape)

    try:
        annot_path = request.json["annot_path"]
    except:
        return handle_exception("Error while trying to get the annotation path")

    if (annot_path == ""):
        return handle_exception("Empty path isn't valid !")

    module_repo.set_module('annotation', module=annot_module)
    label_list = []
    annotation = set()
    for label in annot_module.get_annotation().values():

        if(label[0] not in annotation):
            annotation.add(label[0])
            label_list.append({
                "labelName": "Label {}".format(label[0]) if label[0] > 0 else "Background",
                "id": label[0],
                "color": []
            })

    return jsonify(label_list)


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
        annot_module.erase_all_markers()
    except:
        return handle_exception("Failed to erase all markers")

    return "All markers erased successfully", 200


@app.route("/save_annot", methods=["POST"])
@cross_origin()
def save_annot():
    annot_module = module_repo.get_module('annotation')
    annot = annot_module.annotation

    if annot is None:
        return handle_exception("Failed to fetch annotation")

    try:
        annot_path = request.json["annot_path"]
    except:
        return handle_exception("Failed to receive annotation path")

    with open(annot_path, "wb") as f:
        pickle.dump(annot, f)

    return "success", 200


@app.route("/draw", methods=["POST"])
@cross_origin()
def draw():

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    size = request.json["size"]
    label = request.json["label"]
    mode = request.json["mode"]

    axis_dim = utils.get_axis_num(axis)

    annot_module = module_repo.get_module('annotation')

    if annot_module is None:
        return handle_exception("Annotation module not found")

    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)
    annot_module.set_radius(size // 2)

    erase = (mode == 'erase_brush')

    mk_id = annot_module.current_mk_id

    for coord in request.json['coords']:
        annot_module.draw_marker_dot(coord[1], coord[0], label, mk_id, erase)

    return "success", 200


@app.route("/get_annot_slice", methods=["POST"])
@cross_origin()
def get_annot_slice():

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    axis_dim = utils.get_axis_num(axis)
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    annot_module = module_repo.get_module('annotation')

    if(annot_module != None):
        img_slice = annot_module.annotation_image[slice_range]

        img_slice = zlib.compress(utils.toNpyBytes(img_slice))

        return send_file(io.BytesIO(img_slice), "application/gzip")

    return "test", "application/gzip"


@app.route("/undo_annot", methods=['POST'])
@cross_origin()
def undo_annot():
    annot_module = module_repo.get_module('annotation')
    annot_module.undo()

    return 'success', 200

@app.route("/delete_label_annot", methods=["POST"])
@cross_origin()
def delete_label_annot():

    try:
        label_id = request.json["label_id"]
    ./

    try:
        annot_module = module_repo.get_module('annotation')
        annot_module.remove_label(label_id)
    except Exception as e:
        return handle_exception(str(e))

    return "success", 200

@app.route("/find_label_by_click", methods=["POST"])
@cross_origin()
def find_label_by_click():

    try:
        x = request.json["x_coord"]
        y = request.json["y_coord"]
        slice = request.json["slice"]
        axis = request.json["axis"]
    except Exception as e:
        return handle_exception(str(e))

    try:
        annot_module = module_repo.get_module('annotation')
        annotations = annot_module.get_annotation()
    except Exception as e:
        return handle_exception(str(e))

    if(axis == "XY"):
        data = (slice, y, x)

    elif(axis == "XZ"):
        data = (y, slice, x)

    else:
        data = (x, y, slice)

    if (data in annotations):
        print("data : {}".format(data))
        print("data found by key : {}".format(annotations[data]))
        return jsonify(annotations[data][0])

    return jsonify(-1)

@app.route("/merge_labels", methods=["POST"])
@cross_origin()
def merge_labels():
    """
    Function that merge n labels into one label.

    Notes:
        the request.json["selected_labels"] receives only the parameter "selected_labels"(list[int]).

    Returns:
        (list[int]): this function returns a list that contains the labels to delete in front-end component label table

    """

    try:
        selected_labels = request.json["selected_labels"]
    except Exception as e:
        return handle_exception(str(e))

    if (len(selected_labels) <= 1):
        return handle_exception("Please, choose at least 2 labels to merge")

    pivot_label = selected_labels[0]
    annot_module = module_repo.get_module('annotation')
    annotations = annot_module.get_annotation()

    if (annotations != None):
        for i in range(1, len(selected_labels)):
            label_to_find = selected_labels[i]

            for key, value in annotations.items():
                """
                Notes:
                    In this case, value is a tuple with coordinates (label, click_order)
                    
                Examples:
                    (0, 4): label 0 (Background) was created on the 4 click  
                """
                if (label_to_find == value[0]):
                    annotations[key] = (pivot_label, value[1])

    annot_module.set_annotation(annotations)
    data_repo.set_annotation(data=annotations)

    return jsonify(selected_labels[1:])

@app.route("/is_annotation_empty", methods=["POST"])
@cross_origin()
def is_annotation_empty():
    """
    Function that verify if exist any previous annotation

    Notes:
        This function is only used in CanvasContainer.tsx just to verify if is needed to create a new annotaiton

    Returns:
        (bool): return True to create a new annotation and False otherwise

    """
    annot_module = module_repo.get_module('annotation')

    if (annot_module == None):
        return jsonify(True)

    return jsonify(False)
