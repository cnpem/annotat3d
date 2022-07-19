from flask import Blueprint, request
import numpy as np

from sscAnnotat3D.repository import data_repo
from sscAnnotat3D import utils

from sscPySpin.filters import filter_bm3d as spin_bm3d
from sscPySpin.filters import non_local_means as spin_nlm
from skimage.filters import gaussian as skimage_gaussian

from flask_cors import cross_origin

app = Blueprint('filter', __name__)

@app.route('/filters/bm3d/preview/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def bm3d_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    twostep = request.json['twostep']

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)))

    output_img = spin_bm3d(input_img_3d, sigma, twostep)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200

@app.route('/filters/bm3d/apply/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def bm3d_apply(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    twostep = request.json['twostep']

    output_img = spin_bm3d(input_img, sigma, twostep)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200

@app.route('/filters/gaussian/preview/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def gaussian_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)))

    output_img = skimage_gaussian(input_img_3d, sigma, preserve_range=True).astype(input_img_3d.dtype)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200

@app.route('/filters/gaussian/apply/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def gaussian_apply(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    convType = request.json['convType'] # 2d or 3d
    
    if convType == "2d":
        # convolution in x, y applied for all slices in the the z direction
        output_img = np.zeros_like(input_img)
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[request.json["axis"]]
        typeImg2d = input_img[0].dtype
        for i in range(input_img.shape[axisIndex]):
            # on the annotat3D legacy, this was implemented forcing the stack through the z axis
            if axisIndex == 0:
                # stack following the z axis
                output_img[i] = skimage_gaussian(input_img[i], sigma, preserve_range=True).astype(typeImg2d)
            elif axisIndex == 1:
                # stack following the y axis
                output_img[:,i,:] = skimage_gaussian(input_img[:,i,:], sigma, preserve_range=True).astype(typeImg2d)
            elif axisIndex == 2:
                # stack following the x axis
                output_img[:,:,i] = skimage_gaussian(input_img[:,:,i], sigma, preserve_range=True).astype(typeImg2d)
    elif convType == "3d":
        # convolution in x, y, z
        output_img = skimage_gaussian(input_img, sigma, preserve_range=True).astype(input_img.dtype)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200

@app.route('/filters/nlm/preview/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def nlm_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    nlmStep = request.json['nlmStep']
    gaussianStep = request.json['gaussianStep']

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)))

    output_img = np.zeros_like(input_img_3d)    
    spin_nlm(output_img, input_img_3d, sigma, nlmStep, gaussianStep)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200

@app.route('/filters/nlm/apply/<input_id>/<output_id>', methods=['POST'])
@cross_origin()
def nlm_apply(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json['sigma']
    nlmStep = request.json['nlmStep']
    gaussianStep = request.json['gaussianStep']

    output_img = np.zeros_like(input_img)
    spin_nlm(output_img, input_img, sigma, nlmStep, gaussianStep)

    data_repo.set_image(output_id, data=output_img)

    return 'success', 200
