import numpy as np
from flask import Blueprint, request
from flask_cors import cross_origin
from harpia.filters import (
    anisotropic_diffusion2D,
    anisotropic_diffusion3D,
    gaussian,
    mean,
    median,
    unsharp_mask,
    non_local_means,
)
from skimage.filters import gaussian as skimage_gaussian
from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo
from sscPySpin.filters import filter_bm3d as spin_bm3d
from sscPySpin.filters import non_local_means as spin_nlm

app = Blueprint("filter", __name__)


@app.route("/filters/bm3d/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def bm3d_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json["sigma"]
    twostep = request.json["twostep"]

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)))

    output_img = spin_bm3d(input_img_3d, sigma, twostep)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/bm3d/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def bm3d_apply(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json["sigma"]
    twostep = request.json["twostep"]

    output_img = spin_bm3d(input_img, sigma, twostep)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/gaussian/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def gaussian_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json["sigma"]

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)),dtype=np.float32)

    output_img = np.ascontiguousarray(np.zeros_like(input_img_3d,dtype=np.float32))

    z,x,y = output_img.shape

    #output_img = skimage_gaussian(input_img_3d, sigma, preserve_range=True).astype(input_img_3d.dtype)

    gaussian(input_img_3d,output_img,x,y,z,sigma,0)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/gaussian/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def gaussian_apply(input_id: str, output_id: str):
    input_img = np.ascontiguousarray(data_repo.get_image(input_id),dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img),dtype=np.float32)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json["sigma"]
    convType = request.json["convType"]  # 2d or 3d

    z,x,y = input_img.shape

    if convType == "2d":
        # convolution in x, y applied for all slices in the the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[request.json["axis"]]
        typeImg2d = input_img[0].dtype
        for i in range(input_img.shape[axisIndex]):
            # on the annotat3D legacy, this was implemented forcing the stack through the z axis
            if axisIndex == 0:
                # stack following the z axis
                #output_img[i] = skimage_gaussian(input_img[i], sigma, preserve_range=True).astype(typeImg2d)
                img = input_img[i]
                
                gaussian(img.reshape(1,x,y),output_img[i].reshape(1,x,y),x,y,1,sigma,0)

            elif axisIndex == 1:
                # stack following the y axis
                #output_img[:, i, :] = skimage_gaussian(input_img[:, i, :], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                z,x,y = out.shape
                gaussian(input,out,x,y,z,sigma,0)
                output_img[:,i,:] = out

            elif axisIndex == 2:
                # stack following the x axis
                #output_img[:, :, i] = skimage_gaussian(input_img[:, :, i], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                z,x,y = out.shape
                gaussian(input,out,x,y,z,sigma,0)
                output_img[:,:,i] = out


    elif convType == "3d":
        # convolution in x, y, z
        gaussian(input_img,output_img,x,y,z,sigma,1)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/nlm/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def nlm_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    h = request.json['h']
    sigma = request.json["sigma"]
    bigWindow = request.json["bigWindow"]
    smallWindow = request.json["smallWindow"]

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    x,y = input_img_slice.shape
    input_img_2d = np.ascontiguousarray(input_img_slice,dtype=np.float32)

    output_img = np.zeros_like(input_img_2d,dtype=np.float64)
    non_local_means(input_img_2d,output_img, x,y,smallWindow,bigWindow,h,sigma)

    data_repo.set_image(output_id, data=output_img.reshape((1,x,y)))

    return "success", 200


@app.route("/filters/nlm/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def nlm_apply(input_id: str, output_id: str):
    input_img = np.ascontiguousarray(data_repo.get_image(input_id),dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img),dtype=np.float64)

    if input_img is None:
        return f"Image {input_id} not found.", 400
    
    h = request.json['h']
    sigma = request.json["sigma"]
    bigWindow = request.json["bigWindow"]
    smallWindow = request.json["smallWindow"]

    z,x,y = input_img.shape


    # convolution in x, y applied for all slices in the the z direction
    # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
    axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
    axisIndex = axisIndexDict[request.json["axis"]]
    typeImg2d = input_img[0].dtype
    for i in range(input_img.shape[axisIndex]):
        # on the annotat3D legacy, this was implemented forcing the stack through the z axis
        if axisIndex == 0:
            # stack following the z axis
            #output_img[i] = skimage_gaussian(input_img[i], sigma, preserve_range=True).astype(typeImg2d)
            img = input_img[i]
                
            non_local_means(img.reshape(x,y),output_img[i].reshape(x,y),x,y,smallWindow,bigWindow,h,sigma)

        elif axisIndex == 1:
            # stack following the y axis
            #output_img[:, i, :] = skimage_gaussian(input_img[:, i, :], sigma, preserve_range=True).astype(typeImg2d)
            input = np.ascontiguousarray(input_img[:,i,:].reshape((input_img[:,i,:].shape)),dtype=np.float32)
            out = np.ascontiguousarray(output_img[:,i,:].reshape((input_img[:,i,:].shape)),dtype=np.float64)
            x,y = out.shape
            non_local_means(img.reshape(x,y),output_img[i].reshape(x,y),x,y,smallWindow,bigWindow,h,sigma)
            output_img[:,i,:] = out

        elif axisIndex == 2:
            # stack following the x axis
            #output_img[:, :, i] = skimage_gaussian(input_img[:, :, i], sigma, preserve_range=True).astype(typeImg2d)
            input = np.ascontiguousarray(input_img[:,:,i].reshape((input_img[:,:,i].shape)),dtype=np.float32)
            out = np.ascontiguousarray(output_img[:,:,i].reshape((input_img[:,:,i].shape)),dtype=np.float64)
            x,y = out.shape
            non_local_means(img.reshape(x,y),output_img[i].reshape(x,y),x,y,smallWindow,bigWindow,h,sigma)
            output_img[:,:,i] = out

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/anisodiff/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def anisodiff_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    total_iterations = request.json["total_iterations"]
    delta_t = request.json["delta_t"]
    kappa = request.json["kappa"]
    diffusion_option = request.json["diffusion_option"]
    aniso3D = request.json["aniso3D"]

    slice_num = request.json["slice"]
    axis = request.json["axis"]

    if aniso3D:
        # arbitrary selection of 5 slices up and five slices down (if possible)
        slice_start = max(0, slice_num - 5)
        slice_range = utils.get_3d_slice_range_from(axis, slice_start, slice_num + 5)
        slice_num_map = slice_num - slice_start

        input_img_vol = input_img[slice_range].astype("float32")

        output_img = anisotropic_diffusion3D(input_img_vol, total_iterations, delta_t, kappa, diffusion_option, 0, 0.4, True)

        slice_range = utils.get_3d_slice_range_from(axis, slice_num_map, slice_num_map + 1)
        output_img = output_img[slice_range].squeeze()

    else:
        slice_range = utils.get_3d_slice_range_from(axis, slice_num)

        output_img = anisotropic_diffusion2D(input_img[slice_range].astype("float32"), total_iterations, delta_t, kappa, diffusion_option)

    output_img = output_img.reshape((1, *output_img.shape))
    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/anisodiff/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def anisodiff_apply(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    img_dtype = input_img.dtype

    total_iterations = request.json["total_iterations"]
    delta_t = request.json["delta_t"]
    kappa = request.json["kappa"]
    diffusion_option = request.json["diffusion_option"]
    aniso3D = request.json["aniso3D"]

    if aniso3D:
        try:
            output_img = anisotropic_diffusion3D(input_img.astype("float32"), total_iterations, delta_t, kappa, diffusion_option, 1, 0.4, True)
        except Exception as e:
            print("Error" + str(e))
            return "Error " + str(e), 400
    else:
        # apply 2D aniso diffusion in xy slices
        output_img = []
        for image_slice in input_img:
            slice_output = anisotropic_diffusion2D(image_slice.astype("float32"), total_iterations, delta_t, kappa, diffusion_option)
            output_img.append(slice_output)

        output_img = np.asarray(output_img)

    #convert back to image type
    output_img = output_img.astype(img_dtype)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/mean/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def mean_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    N = request.json["Kernel"]

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)),dtype=np.float32)

    output_img = np.ascontiguousarray(np.zeros_like(input_img_3d,dtype=np.float32))

    z,x,y = output_img.shape

    #output_img = skimage_gaussian(input_img_3d, sigma, preserve_range=True).astype(input_img_3d.dtype)

    mean(input_img_3d,output_img,x,y,z,N,N,1)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/mean/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def mean_apply(input_id: str, output_id: str):
    input_img = np.ascontiguousarray(data_repo.get_image(input_id),dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img),dtype=np.float32)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    N = request.json["Kernel"]
    convType = request.json["convType"]  # 2d or 3d

    z,x,y = input_img.shape

    if convType == "2d":
        # convolution in x, y applied for all slices in the the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[request.json["axis"]]
        typeImg2d = input_img[0].dtype
        for i in range(input_img.shape[axisIndex]):
            # on the annotat3D legacy, this was implemented forcing the stack through the z axis
            if axisIndex == 0:
                # stack following the z axis
                #output_img[i] = skimage_gaussian(input_img[i], sigma, preserve_range=True).astype(typeImg2d)
                img = input_img[i]
                mean(img.reshape(1,x,y),output_img[i].reshape(1,x,y),x,y,1,N,N,1)

            elif axisIndex == 1:
                # stack following the y axis
                #output_img[:, i, :] = skimage_gaussian(input_img[:, i, :], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                z,x,y = out.shape
                mean(input,out,x,y,z,N,N,1)
                output_img[:,i,:] = out

            elif axisIndex == 2:
                # stack following the x axis
                #output_img[:, :, i] = skimage_gaussian(input_img[:, :, i], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                z,x,y = out.shape
                mean(input,out,x,y,z,N,N,1)
                output_img[:,:,i] = out


    elif convType == "3d":
        # convolution in x, y, z
        mean(input_img,output_img,x,y,z,N,N,N)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200



@app.route("/filters/UMFilter/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def unsharp_mask_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json["Sigma"]
    ammount = request.json['Amount']
    threshold = request.json['Threshold']

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)),dtype=np.float32)

    output_img = np.ascontiguousarray(np.zeros_like(input_img_3d,dtype=np.float32))

    z,x,y = output_img.shape

    #output_img = skimage_gaussian(input_img_3d, sigma, preserve_range=True).astype(input_img_3d.dtype)

    unsharp_mask(input_img_3d,output_img,x,y,z,sigma,ammount,threshold,0)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/UMFilter/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def unsharp_mask_apply(input_id: str, output_id: str):
    input_img = np.ascontiguousarray(data_repo.get_image(input_id),dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img),dtype=np.float32)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    sigma = request.json["Sigma"]
    ammount = request.json['Amount']
    threshold = request.json['Threshold']
    convType = request.json["convType"]  # 2d or 3d

    z,x,y = input_img.shape

    if convType == "2d":
        # convolution in x, y applied for all slices in the the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[request.json["axis"]]
        typeImg2d = input_img[0].dtype
        for i in range(input_img.shape[axisIndex]):
            # on the annotat3D legacy, this was implemented forcing the stack through the z axis
            if axisIndex == 0:
                # stack following the z axis
                #output_img[i] = skimage_gaussian(input_img[i], sigma, preserve_range=True).astype(typeImg2d)
                img = input_img[i]
                unsharp_mask(img.reshape(1,x,y),output_img[i].reshape(1,x,y),x,y,1,sigma,ammount,threshold,0)

            elif axisIndex == 1:
                # stack following the y axis
                #output_img[:, i, :] = skimage_gaussian(input_img[:, i, :], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                z,x,y = out.shape
                unsharp_mask(input,out,x,y,z,sigma,ammount,threshold,0)
                output_img[:,i,:] = out

            elif axisIndex == 2:
                # stack following the x axis
                #output_img[:, :, i] = skimage_gaussian(input_img[:, :, i], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                z,x,y = out.shape
                unsharp_mask(input,out,x,y,z,sigma,ammount,threshold,0)
                output_img[:,:,i] = out


    elif convType == "3d":
        # convolution in x, y, z
        unsharp_mask(input_img,output_img,x,y,z,sigma,ammount,threshold,1)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200



@app.route("/filters/median/preview/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def median_preview(input_id: str, output_id: str):
    input_img = data_repo.get_image(input_id)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    N = request.json["Kernel"]

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    input_img_slice = input_img[slice_range]
    input_img_3d = np.ascontiguousarray(input_img_slice.reshape((1, *input_img_slice.shape)),dtype=np.float32)

    output_img = np.ascontiguousarray(np.zeros_like(input_img_3d,dtype=np.float32))

    z,x,y = output_img.shape

    #output_img = skimage_gaussian(input_img_3d, sigma, preserve_range=True).astype(input_img_3d.dtype)

    mean(input_img_3d,output_img,x,y,z,N,N,1)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200


@app.route("/filters/median/apply/<input_id>/<output_id>", methods=["POST"])
@cross_origin()
def median_apply(input_id: str, output_id: str):
    input_img = np.ascontiguousarray(data_repo.get_image(input_id),dtype=np.float32)
    output_img = np.ascontiguousarray(np.zeros_like(input_img),dtype=np.float32)

    if input_img is None:
        return f"Image {input_id} not found.", 400

    N = request.json["Kernel"]
    convType = "2d"#request.json["convType"]  # 2d or 3d

    z,x,y = input_img.shape

    if convType == "2d":
        # convolution in x, y applied for all slices in the the z direction
        # select range direction by plane info in ```axis = request.json["axis"]``` which contains the values "XY", "XZ" or "YZ"
        axisIndexDict = {"XY": 0, "XZ": 1, "YZ": 2}
        axisIndex = axisIndexDict[request.json["axis"]]
        typeImg2d = input_img[0].dtype
        for i in range(input_img.shape[axisIndex]):
            # on the annotat3D legacy, this was implemented forcing the stack through the z axis
            if axisIndex == 0:
                # stack following the z axis
                #output_img[i] = skimage_gaussian(input_img[i], sigma, preserve_range=True).astype(typeImg2d)
                img = input_img[i]
                median(img.reshape(1,x,y),output_img[i].reshape(1,x,y),x,y,1,N,N,1)

            elif axisIndex == 1:
                # stack following the y axis
                #output_img[:, i, :] = skimage_gaussian(input_img[:, i, :], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,i,:].reshape((1, *input_img[:,i,:].shape)),dtype=np.float32)
                z,x,y = out.shape
                median(input,out,x,y,z,N,N,1)
                output_img[:,i,:] = out

            elif axisIndex == 2:
                # stack following the x axis
                #output_img[:, :, i] = skimage_gaussian(input_img[:, :, i], sigma, preserve_range=True).astype(typeImg2d)
                input = np.ascontiguousarray(input_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                out = np.ascontiguousarray(output_img[:,:,i].reshape((1, *input_img[:,:,i].shape)),dtype=np.float32)
                z,x,y = out.shape
                median(input,out,x,y,z,N,N,1)
                output_img[:,:,i] = out


    elif convType == "3d":
        # convolution in x, y, z
        median(input_img,output_img,x,y,z,N,N,N)

    data_repo.set_image(output_id, data=output_img)

    return "success", 200