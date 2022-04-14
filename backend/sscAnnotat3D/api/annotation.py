from flask import Blueprint, request, send_file, jsonify
import numpy as np
import pickle
import io
import zlib

from sscAnnotat3D.modules import annotation_module
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D import utils

from flask_cors import cross_origin

app = Blueprint('annotation', __name__)


@app.route("/new_annot", methods=["POST"])
@cross_origin()
def new_annot():
    annot = {}
    annot_path = ""

    img = data_repo.get_image('image')
    if img is None:
        return 'No image associated', 400

    annot_module = annotation_module.AnnotationModule(img.shape)

    module_repo.set_module('annotation', module=annot_module)

    return "success", 200


@app.route("/is_available_annot", methods=["POST"])
@cross_origin
def is_available_annot():
    annot = data_repo.get_annotation()
    return jsonify({'available': annot is not None})


@app.route("/open_annot", methods=["POST"])
@cross_origin()
def open_annot():
    img = data_repo.get_image('image')
    if img is None:
        return 'No image associated', 400

    annot_module = annotation_module.AnnotationModule(img.shape)

    try:
        annot_path = request.json["annot_path"]
    except:
        return "Error while trying to get the annotation path", 400

    with open(annot_path, "rb") as f:
        annot = pickle.load(f)
    print("annot", len(annot))

    annot_module.annotation = annot
    module_repo.set_module('annotation', module=annot_module)

    return "success", 200


@app.route("/close_annot", methods=["POST"])
@cross_origin()
def close_annot():
    try:
        annot_module = module_repo.get_module('annotation')
        annot_module.annotation = {}
    except:
        return "failure", 400

    return "success", 200


@app.route("/save_annot", methods=["POST"])
@cross_origin()
def save_annot():
    annot_module = module_repo.get_module('annotation')
    annot = annot_module.annotation

    if annot is None:
        return "Failed to fetch annotation", 400

    try:
        annot_path = request.json["annot_path"]
    except:
        return "Failed to receive annotation path", 400

    with open(annot_path, "wb") as f:
        pickle.dump(annot, f)

    return "success", 200


@app.route("/draw", methods=["POST"])
@cross_origin()
def draw():
    print(request.json)

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    size = request.json["size"]
    label = request.json["label"]
    mode = request.json["mode"]

    axis_dim = utils.get_axis_num(axis)

    annot_module = module_repo.get_module('annotation')
    annot_module.set_current_axis(axis_dim)
    annot_module.set_current_slice(slice_num)
    annot_module.set_radius(size // 2)

    erase = (mode == 'erase_brush')

    mk_id = annot_module.current_mk_id

    for coord in request.json['coords']:
        annot_module.draw_marker_dot(coord[1], coord[0], label, mk_id, erase)

    # data_repo.set_annotation(annot_module.annotation)

    return "success", 200


@app.route("/get_annot_slice", methods=["POST"])
@cross_origin()
def get_annot_slice():
    # annot = data_repo.get_annotation()
    image = data_repo.get_image()

    # if annot is None:
    #     return "failure", 400

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    axis_dim = utils.get_axis_num(axis)
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    annot_module = module_repo.get_module('annotation')

    img_slice = annot_module.annotation_image[slice_range]

    img_slice = zlib.compress(utils.toNpyBytes(img_slice))

    return send_file(io.BytesIO(img_slice), "application/gzip")


@app.route("/undo_annot", methods=['POST'])
@cross_origin()
def undo_annot():
    annot_module = module_repo.get_module('annotation')
    annot_module.undo()

    return 'success', 200
