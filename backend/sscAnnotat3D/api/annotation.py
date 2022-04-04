from flask import Blueprint, request, send_file
import numpy as np
import pickle
import io
import zlib

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import utils

from flask_cors import cross_origin

app = Blueprint('annotation', __name__)

@app.route("/new_annot", methods=["POST"])
@cross_origin()
def new_annot():

    annot = {}
    annot_path = ""

    data_repo.set_annotation(data=annot)

    return "success", 200


@app.route("/open_annot", methods=["POST"])
@cross_origin()
def open_annot():

    annot_path = request.json["annot_path"]
    with open(annot_path, "rb") as f:
        annot = pickle.load(f)

    data_repo.set_annotation(data=annot)
    print("annot", len(annot))

    most = {}
    for coords in annot:
        if coords[0] in most:
            most[coords[0]] = most[coords[0]] + 1
        else:
            most[coords[0]] = 0

    return "success", 200


@app.route("/close_annot", methods=["POST"])
@cross_origin()
def close_annot():

    try:
        data_repo.delete_annotation()
    except:
        return "failure", 400

    return "success", 200


@app.route("/save_annot", methods=["POST"])
@cross_origin()
def save_annot():

    annot = data_repo.get_annotation()

    if annot is None:
        return "failure", 400

    annot_path = request.json["annot_path"]

    with open(annot_path, "wb") as f:
        pickle.dump(annot, f)

    return "success", 200


@app.route("/draw", methods=["POST"])
@cross_origin()
def draw():

    annot = data_repo.get_annotation()

    if annot is None:
        return "failure", 400

    print(request.json)

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    size = request.json["size"]
    label = request.json["label"]
    mode = request.json["mode"]

    axis_dim = utils.get_axis_num(axis)
    coords_dim = [i for i in range(3)[::-1] if i != axis_dim]

    for coord in request.json["coords"]:
        for d1 in np.arange(coord[0], coord[0] + size):
            for d2 in np.arange(coord[1], coord[1] + size):
                voxel_coord = [None, None, None]
                voxel_coord[coords_dim[0]] = d1
                voxel_coord[coords_dim[1]] = d2
                voxel_coord[axis_dim] = slice_num
                voxel_coord = tuple(voxel_coord)
                if mode == "draw_brush":
                    annot[voxel_coord] = (label, 0)
                else:
                    annot.pop(voxel_coord, True)

    data_repo.set_annotation(annot)

    return "success", 200

@app.route("/get_annot_slice", methods=["POST"])
@cross_origin()
def get_annot_slice():

    annot = data_repo.get_annotation()
    image = data_repo.get_image()

    if annot is None:
        return "failure", 400


    slice_num = request.json["slice"]
    axis = request.json["axis"]
    axis_dim = utils.get_axis_num(axis)
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)


    img_slice = np.ones(image[slice_range].shape, dtype='int32')
    img_slice = img_slice * -1
    print(axis_dim, slice_num)
    for coords in annot:
        print(coords)
        if coords[axis_dim] == slice_num:
            coord_2d = [c for i, c in enumerate(coords) if i!=axis_dim]
            print(coord_2d)
            img_slice[coord_2d[0], coord_2d[1]] = annot[coords][0]
            print(annot[coords][0])

    # slice = slice.astype(np.int16)
    print("annot_slice", img_slice)
    print("annot_dtype", img_slice.dtype)
    print("annot_shape", img_slice.shape, img_slice.reshape(-1).shape)
    # print("annot_bytes", len(img_slice.tobytes()))

    print(img_slice.mean(), img_slice.std())

    img_slice = zlib.compress(utils.toNpyBytes(img_slice))
    # print("annot_gzip_bytes", len(img_slice))

    return send_file(io.BytesIO(img_slice), "application/gzip")



