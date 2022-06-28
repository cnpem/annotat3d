from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
import os.path

import sscIO.io
import numpy as np
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D.deeplearning import DeepLearningWorkspaceDialog

from flask_cors import cross_origin

app = Blueprint('io', __name__)


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)

def _convert_dtype_to_str(img_dtype: np.dtype):

    return np.dtype(img_dtype).name


@app.route("/open_image/<image_id>", methods=["POST"])
@cross_origin()
def open_image(image_id: str):
    try:
        image_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    file = image_path.split("/")[-1]
    file_name, extension = os.path.splitext(file)

    if (file == ""):
        return handle_exception("Empty path isn't valid !")

    raw_extensions = [".raw", ".b"]
    tif_extensions = [".tif", ".tiff", ".npy", ".cbf"]

    extensions = [*raw_extensions, *tif_extensions]

    if extension not in extensions:
        return handle_exception("The extension {} isn't supported !".format(extension))

    error_msg = ""

    try:
        use_image_raw_parse = request.json["use_image_raw_parse"]
        if (extension in tif_extensions or use_image_raw_parse):
            image, info = sscIO.io.read_volume(image_path, 'numpy')
            error_msg = "No such file or directory {}".format(image_path)

            if (_convert_dtype_to_str(image.dtype) != image_dtype and (image_id == "image" or image_id == "label")):
                image = image.astype(image_dtype)

        else:
            image_raw_shape = request.json["image_raw_shape"]
            image, info = sscIO.io.read_volume(image_path, 'numpy',
                                               shape=(image_raw_shape[2], image_raw_shape[1], image_raw_shape[0]),
                                               dtype=image_dtype)

            error_msg = "Unable to reshape the volume {} into shape {} and type {}. " \
                        "Please change the dtype and shape and load the image again".format(file, request.json[
                "image_raw_shape"],
                                                                                            image_dtype)
        image_shape = image.shape
        image_dtype = _convert_dtype_to_str(image.dtype)
    except:
        return handle_exception(error_msg)

    
    data_repo.set_image(key=image_id, data=image)

    image_info = {"imageShape": {'x':image_shape[2], 'y':image_shape[1], 'z':image_shape[0]}, "imageExt": extension,
                    "imageName": file_name, "imageDtype": image_dtype, "imageFullPath": image_path}

    if image_id == 'image':
        data_repo.set_info(data=image_info)

    return jsonify(image_info)

@app.route("/close_image/<image_id>", methods=["POST"])
@cross_origin()
def close_image(image_id: str):
    try:
        data_repo.delete_image(key=image_id)
    except:
        return handle_exception("failure trying to delete the image")

    return "success on deleting the image !", 200


@app.route("/save_image/<image_id>", methods=["POST"])
@cross_origin()
def save_image(image_id: str):

    try:
        image_path = request.json["image_path"]
    except:
        return handle_exception("Error while trying to get the image path")

    try:
        image_dtype = request.json["image_dtype"]
    except:
        return handle_exception("Error while trying to get the image dtype")

    image = data_repo.get_image(key=image_id)

    if (image.size == 0):
        return handle_exception("Unable to retrieve the image !")

    save_status = sscIO.io.save_volume(image_path, image_dtype, image)

    if (save_status["error_msg"] != ""):
        return handle_exception(save_status["error_msg"])

    image_shape = image.shape
    image_info = {"imageShape": {'x':image_shape[2], 'y':image_shape[1], 'z':image_shape[0]}, "imageExt": save_status["extension"],
                  "imageName": save_status["file_name"], "imageDtype": image_dtype}

    return jsonify(image_info)

@app.route("/open_new_workspace", methods=["POST"])
@cross_origin()
def open_new_workspace():
    """
    Function that opens a new workspace

    Notes:
        the request.json["workspace_path"] receives only the parameter "selected_labels"(str)

    Returns:
        (str): returns a string that contains the new workspace path

    """
    try:
        workspace_path = request.json["workspace_path"]
    except Exception as e:
        return handle_exception(str(e))

    if (workspace_path == ""):
        return handle_exception("Empty path isn't valid !")

    deep_model = DeepLearningWorkspaceDialog()
    save_status, error_desc = deep_model.open_new_workspace(workspace_path)

    if (save_status):
        data_repo.set_deep_model(data={"deep_model_path": workspace_path})
        return jsonify(workspace_path)

    return handle_exception("unable to create the Workspace ! : {}".format(error_desc))

@app.route("/load_workspace", methods=["POST"])
@cross_origin()
def load_workspace():
    """
    Function that loads a created workspace

    Notes:
        the request.json["workspace_path"] receives only the parameter "selected_labels"(str)

    Returns:
        (str): returns a string that contains the loaded workspace path

    """
    try:
        workspace_path = request.json["workspace_path"]
    except Exception as e:
        return handle_exception(str(e))

    deep_model = DeepLearningWorkspaceDialog()
    check_valid_workspace = deep_model.check_workspace(workspace_path)

    if(check_valid_workspace):
        data_repo.set_deep_model(data={"deep_model_path": workspace_path})
        return jsonify(check_valid_workspace)

    return handle_exception("path \"{}\" is a invalid workspace path!".format(workspace_path))

# crop functions

@app.route("/crop_apply", methods=["POST"])
@cross_origin()
def crop_apply():
    """
    Replaces image with a smaller image based on the indexes given by cropX, cropY and cropZ 

    Args:
        No args. Uses information from data_repo and JSON package sent in POST.
    Examples:
        This is an example on how you can use this function to get the annotation using the id\n
        sfetch("POST", "/crop_apply", JSON.stringify(cropShape), "json")

    Returns:
        (tuple[bool, int]): this function returns "True" and 200 if sucessful. Otherwise, this tuple will return "False" and error 400

    """

    input_img = data_repo.get_image('image')

    if input_img is None:
        return handle_exception(f"Image not found.")

    image_info = data_repo.get_info(key='image_info')

    cropX = request.json['cropX']
    cropY = request.json['cropY']
    cropZ = request.json['cropZ']

    xlo, xhi = cropX['lower'], cropX['upper']
    ylo, yhi = cropY['lower'], cropY['upper']
    zlo, zhi = cropZ['lower'], cropZ['upper']

    output_img = input_img[zlo:zhi, ylo:yhi, xlo:xhi]
    output_shape = output_img.shape
        
    crop_info = {
        'cropShape':  {'cropX':cropX, 'cropY':cropY, 'cropZ':cropZ},
        'imageFullShape': image_info['imageShape']
    }
    image_info['imageShape'] =  {'x':output_shape[2], 'y':output_shape[1], 'z':output_shape[0]}

    print('\Full shape: ', crop_info['imageFullShape'])

    data_repo.set_image('image', data=output_img)
    data_repo.set_info(key='image_info', data=image_info)
    data_repo.set_info(key='crop_info', data=crop_info)                      

    return jsonify(image_info)    

@app.route("/crop_merge", methods=["POST"])
@cross_origin()
def crop_merge():
    """
    Replaces cropped image with the original image using its location saved in data_repo and 
    updates the coordinates of the label image and the annotations made.

    Args:
        No args. Uses information from data_repo.
    Examples:
        This is an example on how you can use this function to get the annotation using the id\n
        sfetch("POST", "/crop_merge", '', "json")

    Returns:
        (tuple[bool, int]): this function returns "True" and 200 if sucessful and "False" and 400 otherwise, with info abou the errors.
    """

    crop_info = data_repo.get_info(key='crop_info')

    if (crop_info == {}):
        return handle_exception(f"Image is not a cropped image or doesn't have crop info.")

    crop_img = data_repo.get_image('image')

    if crop_img is None:
        return handle_exception(f"Cropped image not found.")

    image_info = data_repo.get_info(key='image_info')
    imageFullShape = crop_info['imageFullShape']

    # ---
    # opening original image
    # ---
    
    try:
        output_img, info = sscIO.io.read_volume(image_info['imageFullPath'], 'numpy',
                        shape=(imageFullShape['z'], imageFullShape['y'], imageFullShape['x']),
                        dtype=image_info['imageDtype'])
        data_repo.set_image('image', data=output_img)
    except:
        return handle_exception('Reopen original image failed')
    
    # ---
    # crop info for update coordinates of labels and annotations
    # ---

    cropShape = crop_info['cropShape']

    if cropShape is None:
        return handle_exception('Failed to read cropShape')    

    cropX = cropShape['cropX']
    cropY = cropShape['cropY']
    cropZ = cropShape['cropZ']

    zlo, zhi = cropZ['lower'], cropZ['upper']
    ylo, yhi = cropY['lower'], cropY['upper']
    xlo, xhi = cropX['lower'], cropX['upper']

    # ---
    # label image
    # ---

    label_img = data_repo.get_image('label')

    if label_img is not None:
        # print(zlo, zhi, ylo, yhi, xlo, xhi)
        output_labelimg = np.zeros_like(output_img)
        print('bruno..........: ', output_labelimg.shape, label_img.shape, ylo, yhi)
        output_labelimg[zlo:zhi, ylo:yhi, xlo:xhi] = label_img
        data_repo.set_image('label', data=output_labelimg)

    # ---
    # annotation (dictionary)
    # ---

    annot_module = module_repo.get_module('annotation')
    if annot_module is not None:
        dic = annot_module.get_annotation()
        newdic = dict()
        for k in dic.keys():
            kz, ky, kx = k
            new_k = (kz+zlo, ky+ylo, kx+xlo)
            newdic[new_k] = dic[k]
        annot_module.set_annotation(newdic) 

    # ---
    # update infos on data_repo
    # ---

    image_info['imageShape'] =  imageFullShape
    crop_info = {}
    
    data_repo.set_info(key='image_info', data=image_info)
    data_repo.set_info(key='crop_info', data=crop_info)            

    return jsonify(image_info)