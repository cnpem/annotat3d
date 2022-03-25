from flask import Blueprint, request
import numpy as np
import pickle

from sscAnnotat3D.repository import data_repo

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

    z = request.json["z"]
    size = request.json["size"]
    label = request.json["label"]
    mode = request.json["mode"]

    for coord in request.json["coords"]:
        # x = np.arange(coord[0],coord[0]+size)
        # y = np.arange(coord[1],coord[1]+size)
        # X, Y = np.meshgrid(x, y)
        # xy = np.column_stack([X.ravel(), Y.ravel()])
        # for x, y in xy:
        #     annot[(z,y,x)] = (label, 0)
        for x in np.arange(coord[0], coord[0] + size):
            for y in np.arange(coord[1], coord[1] + size):
                if mode == "draw_brush":
                    annot[(z, y, x)] = (label, 0)
                else:
                    annot.pop((z, y, x), True)

    data_repo.set_annotation(annot)

    return "success", 200

@app.route("/get_annot_slice", methods=["POST"])
@cross_origin()
def get_annot_slice():

    return "slice", 200

    annot = data_repo.get_annotation()
    image = data_repo.get_image()

    if annot is None:
        return "failure", 400


    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)


    # img_slice = np.ones(image[slice_range].shape)
    # img_slice = img_slice * -1
    # for coords in annot:
        # if coords[0] == z:
            # img_slice[coords[1], coords[2]] = annot[coords][0]

    # slice = slice.astype(np.int16)
    print("annot_slice", img_slice[0])
    print("annot_dtype", img_slice.dtype)
    print("annot_shape", img_slice.shape, img_slice.reshape(-1).shape)
    # print("annot_bytes", len(img_slice.tobytes()))

    # print(img_slice.mean(), img_slice.std())

    img_slice = zlib.compress(img_slice.tobytes())
    # print("annot_gzip_bytes", len(img_slice))

    return send_file(io.BytesIO(img_slice), "application/gzip")



