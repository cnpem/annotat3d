from flask import Blueprint, request, send_file, jsonify
from werkzeug.exceptions import BadRequest
import zlib
import io

import sscIO.io
import numpy as np
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D import utils, label

from flask_cors import cross_origin

app = Blueprint('image', __name__)

@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400

app.register_error_handler(400, handle_exception)


@app.route('/is_available_image/<image_id>', methods=["POST"])
@cross_origin()
def is_available_image(image_id: str):
    image = data_repo.get_image(image_id)
    return jsonify({ 'available': image is not None })

@app.route("/get_image_slice/<image_id>", methods=["POST"])
@cross_origin()
def get_image_slice(image_id: str):

    image = data_repo.get_image(key=image_id)

    if image is None:
        return handle_exception(f"Image {image_id} not found.")

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    img_slice = image[slice_range]

    get_contour = request.json.get('contour', False)

    if get_contour:
        img_slice = label.label_slice_contour(img_slice)

    import time

    npy_st = time.time()
    byte_slice = utils.toNpyBytes(img_slice)
    npy_en = time.time()

    comp_st = time.time()
    compressed_byte_slice = zlib.compress(byte_slice)
    comp_en = time.time()

    print('npy time: ', npy_en - npy_st)
    print('compress time: ', comp_en - comp_st)

    return send_file(io.BytesIO(compressed_byte_slice), "application/gzip")


@app.route("/get_image_info/<image_info_key>", methods=["POST"])
@cross_origin()
def get_image_info(image_info_key: str):
    img = data_repo.get_image('image')

    if img is None:
        return handle_exception("Image not found.")
    
    image_info = data_repo.get_info(image_info_key)
    
    if (image_info == None):
        return handle_exception("Image info not found.")

    return jsonify(image_info)

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

    crop_img_info = data_repo.get_info(key='image_info')

    # ---
    # input crop info from json sent by the function onApply() in CropMenu.tsx 
    # ---

    cropZ = request.json['cropZ']
    cropY = request.json['cropY']
    cropX = request.json['cropX']

    zlo, zhi = cropZ['lower'], cropZ['upper']
    ylo, yhi = cropY['lower'], cropY['upper']
    xlo, xhi = cropX['lower'], cropX['upper']

    # ---
    # cropping image
    # ---
    print('on crop_apply: shape = ', cropZ, cropY, cropX)
    crop_img = input_img[zlo:zhi, ylo:yhi, xlo:xhi]

    # updating image info and crop info
    crop_info = {
        'cropShape':  {'cropX':cropX, 'cropY':cropY, 'cropZ':cropZ},
        'imageFullShape': crop_img_info['imageShape']
    }
    crop_img_info['imageShape'] =  {'x':crop_img.shape[2], 'y':crop_img.shape[1], 'z':crop_img.shape[0]}

    # ---
    # annotation 
    # ---
    annot_module = module_repo.get_module('annotation') # bruno
    if annot_module is not None:
        anot_full = annot_module.get_annotation()
        anot_crop = dict()
        keylist = list(anot_full.keys());
        for coords in keylist:
            kz, ky, kx = coords
            if (zlo <= kz <  zhi and ylo <= ky <  yhi and xlo <= kx <  xhi):
                # removes annotation from annot_full and adds to annot_crop
                # so it can work with the cropped image and when the merge operation occurs, 
                # annot_crop can be appended to the annot_full dictionary preserving its original order (ordered by clicks) 
                k_crop = (kz-zlo, ky-ylo, kx-xlo) # new key with coordinates relative to the cropped image
                anot_crop[k_crop] = anot_full.pop(coords)
        # replaces the annotation dictionary with the new dictionary for the cropped image
        annot_module.set_annotation(anot_crop)
        # saves the remaining annotations related to the original image as backup in the repository 
        data_repo.set_info(key='anot_backup', data=anot_full)   

    data_repo.set_image('image', data=crop_img)
    data_repo.set_info(key='image_info', data=crop_img_info)
    data_repo.set_info(key='crop_info', data=crop_info)                      

    return jsonify(crop_img_info)    

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
    
    try: # bruno
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

    zlo, zhi = cropShape['cropZ']['lower'], cropShape['cropZ']['upper']
    ylo, yhi = cropShape['cropY']['lower'], cropShape['cropY']['upper']
    xlo, xhi = cropShape['cropX']['lower'], cropShape['cropX']['upper']

    # ---
    # label image
    # ---
    label_img = data_repo.get_image('label')

    if label_img is not None:
        output_label_img = np.zeros_like(output_img)
        # does numpy optimizes this?
        print('Painting labeled section on the original image.', label_img.shape)
        output_label_img[zlo:zhi, ylo:yhi, xlo:xhi] = label_img
        data_repo.set_image('label', data=output_label_img)

    # ---
    # annotation 
    # ---
    annot_module = module_repo.get_module('annotation')
    if annot_module is not None:
        annot_full = data_repo.get_info(key='anot_backup')
        if annot_full is None:
            annot_full = dict()
        anot_crop = annot_module.get_annotation()
        for k in anot_crop.keys():
            kz, ky, kx = k
            kz_new, ky_new, kx_new  = (kz+zlo, ky+ylo, kx+xlo)
            zmax, ymax, xmax = (imageFullShape['z'], imageFullShape['y'], imageFullShape['x'])
            if (kz_new <  zmax and ky_new <  ymax and kx_new <  xmax):
                # saves new coordinates avoiding anotations outside the image shape
                k_full = (kz_new, ky_new, kx_new)
                annot_full[k_full] = anot_crop[k]
            elif (kz_new ==  zmax or ky_new ==  ymax or kx_new ==  xmax):
                print('crop_merge: border -> ',(kz_new, ky_new, kx_new))
            else:
                print('crop_merge: outside bounds -> ',(kz_new, ky_new, kx_new))
        annot_module.set_annotation(annot_full) 

    # ---
    # update info on data_repo
    # ---

    image_info['imageShape'] =  imageFullShape
    crop_info = {}
    
    data_repo.set_info(key='image_info', data=image_info)
    data_repo.set_info(key='crop_info', data=crop_info)            

    return jsonify(image_info)

@app.route("/delete_info/<info_key>", methods=["POST"])
@cross_origin()
def delete_info(info_key: str):
    print('delete_info: ', info_key)
    
    try:
        data_repo.delete_info(key=info_key)
    except:
        return jsonify("delete info: "+info_key+" not found.")

    return jsonify("deleted info: "+info_key)