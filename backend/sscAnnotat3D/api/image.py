import io
import zlib

import numpy as np
from flask import Blueprint, jsonify, request, send_file
from flask_cors import cross_origin
from sscAnnotat3D import label, utils
from sscAnnotat3D.repository import data_repo, module_repo
from werkzeug.exceptions import BadRequest
from collections import defaultdict

app = Blueprint("image", __name__)


@app.errorhandler(BadRequest)
def handle_exception(error_msg: str):
    return jsonify({"error_msg": error_msg}), 400


app.register_error_handler(400, handle_exception)


@app.route("/is_available_image/<image_id>", methods=["POST"])
@cross_origin()
def is_available_image(image_id: str):
    image = data_repo.get_image(image_id)
    return jsonify({"available": image is not None})


@app.route("/get_image_slice/<image_id>", methods=["POST"])
@cross_origin()
def get_image_slice(image_id: str):

    image = data_repo.get_image(key=image_id)

    if image is None:
        return handle_exception(f"Image {image_id} not found.")

    slice_num = request.json["slice"]
    axis = request.json["axis"]
    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    data_repo.set_info(key="current_slice", data = {'slice_num': slice_num, 'axis': axis })

    img_slice = image[slice_range]

    get_contour = request.json.get("contour", False)

    if get_contour:
        img_slice = label.label_slice_contour(img_slice + 1) - 1

    import time

    npy_st = time.time()
    byte_slice = utils.toNpyBytes(img_slice)
    npy_en = time.time()

    comp_st = time.time()
    compressed_byte_slice = zlib.compress(byte_slice)
    comp_en = time.time()

    print("npy time: ", npy_en - npy_st)
    print("compress time: ", comp_en - comp_st)

    return send_file(io.BytesIO(compressed_byte_slice), "application/gzip")


@app.route("/get_image_info/<image_info_key>", methods=["POST"])
@cross_origin()
def get_image_info(image_info_key: str):
    img = data_repo.get_image("image")

    if img is None:
        return handle_exception("Image not found.")

    image_info = data_repo.get_info(image_info_key)

    if image_info == None:
        return handle_exception("Image info not found.")

    print('get image info', image_info)

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

    input_img = data_repo.get_image("image")

    if input_img is None:
        return handle_exception(f"Image not found.")

    crop_img_info = data_repo.get_info(key="image_info")

    # ---
    # input crop info from json sent by the function onApply() in CropMenu.tsx
    # ---

    cropZ = request.json["cropZ"]
    cropY = request.json["cropY"]
    cropX = request.json["cropX"]

    zlo, zhi = cropZ["lower"], cropZ["upper"]
    ylo, yhi = cropY["lower"], cropY["upper"]
    xlo, xhi = cropX["lower"], cropX["upper"]

    # ---
    # cropping image
    # ---
    print("on crop_apply: shape = ", cropZ, cropY, cropX)
    crop_img = input_img[zlo:zhi, ylo:yhi, xlo:xhi]

    # updating image info and crop info
    crop_info = {
        "cropShape": {"cropX": cropX, "cropY": cropY, "cropZ": cropZ},
        "imageFullShape": crop_img_info["imageShape"],
    }
    crop_img_info["imageShape"] = {"x": crop_img.shape[2], "y": crop_img.shape[1], "z": crop_img.shape[0]}

    # ---
    # superpixels
    # ---
    img_superpixels = data_repo.get_image("superpixel")
    if img_superpixels is not None:
        print("Removing superpixel img from workspace.")
        data_repo.delete_image(key="superpixel")

    # ---
    # label image
    # ---
    label_img = data_repo.get_image("label")
    if label_img is not None:
        # does numpy optimizes this?
        print("Creating cropped label image.")
        output_label_img = label_img[zlo:zhi, ylo:yhi, xlo:xhi]
        data_repo.set_image("label", data=output_label_img)

    # ---
    # annotation
    # ---
    annot_module = module_repo.get_module("annotation")
    if annot_module is not None:
        annot_img = annot_module.annotation_image
        output_annot_img = annot_img[zlo:zhi, ylo:yhi, xlo:xhi]

        annotation_slice_dict = annot_module.get_annotation_slice_dict()     

        axis_limit = [(zlo, zhi), (ylo, yhi), (xlo, xhi)]
        annot_cutted = {0: set(), 1: set(), 2: set()}
        new_annot_slice_dict = {0: set(), 1: set(), 2: set()}

        annot_slices_backup = []

        for axis, slice_nums in annotation_slice_dict.items():
            for slice_num in slice_nums:
                #save the annotation before the crop
                slice_range = [slice(None, None, None), slice(None, None, None), slice(None, None, None)]
                slice_range[axis] = slice_num

                annot_slices_backup.append([(axis,slice_num), np.squeeze(annot_img[slice_range])])

                if slice_num < axis_limit[axis][0] or slice_num >= axis_limit[axis][1]:
                    #save that it was previously annotated
                    annot_cutted[axis].add(slice_num)
                else:
                    #save the axis and slice_num as annot slice since it didn't get cut
                    new_annot_slice_dict[axis].add(slice_num - axis_limit[axis][0])

        # replaces the annotation dictionary with the new dictionary for the cropped image
        annot_module.set_annotation_slice_dict(new_annot_slice_dict)
        # saves the remaining annotations related to the original image as backup in the repository
        annot_backup = {"annot_cutted": annot_cutted, "annot_slices_backup": annot_slices_backup}
        data_repo.set_info(key = "annot_backup", data = annot_backup)

        annot_module.set_annotation_image(output_annot_img)

    data_repo.set_image("image", data=crop_img)
    data_repo.set_info(key="image_info", data=crop_img_info)
    data_repo.set_info(key="crop_info", data=crop_info)
    #update image shape
    annot_module = module_repo.get_module('annotation')
    annot_module.update_image_shape(crop_img.shape)

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

    crop_info = data_repo.get_info(key="crop_info")

    if crop_info == {}:
        return handle_exception(f"Image is not a cropped image or doesn't have crop info.")

    crop_img = data_repo.get_image("image")

    if crop_img is None:
        return handle_exception(f"Cropped image not found.")

    image_info = data_repo.get_info(key="image_info")
    imageFullShape = crop_info["imageFullShape"]

    # ---
    # opening original image
    # ---

    try:
        output_img, info = utils.read_volume(
            image_info["imageFullPath"],
            "numpy",
            shape=(imageFullShape["z"], imageFullShape["y"], imageFullShape["x"]),
            dtype=image_info["imageDtype"],
        )
        #update image shape
        annot_module = module_repo.get_module('annotation')
        annot_module.update_image_shape(output_img.shape)
        data_repo.set_image("image", data=output_img)
    except:
        return handle_exception("Reopen original image failed")

    # ---
    # crop info for update coordinates of labels and annotations
    # ---
    cropShape = crop_info["cropShape"]

    if cropShape is None:
        return handle_exception("Failed to read cropShape")

    zlo, zhi = cropShape["cropZ"]["lower"], cropShape["cropZ"]["upper"]
    ylo, yhi = cropShape["cropY"]["lower"], cropShape["cropY"]["upper"]
    xlo, xhi = cropShape["cropX"]["lower"], cropShape["cropX"]["upper"]

    # ---
    # superpixels
    # ---
    img_superpixels = data_repo.get_image("superpixel")
    if img_superpixels is not None:
        print("Removing superpixel img from workspace.")
        data_repo.delete_image(key="superpixel")

    # ---
    # label image
    # ---
    label_img = data_repo.get_image("label")
    if label_img is not None:
        output_label_img = np.zeros_like(output_img, dtype='int32') - 1
        # does numpy optimizes this?
        print("Painting labeled section on the original image.", label_img.shape)
        output_label_img[zlo:zhi, ylo:yhi, xlo:xhi] = label_img
        data_repo.set_image("label", data=output_label_img)

    # ---
    # annotation
    # ---
    annot_module = module_repo.get_module("annotation")
    if annot_module is not None:
        annot_backup = data_repo.get_info(key="annot_backup")
        annot_cutted, annot_slices_backup = annot_backup["annot_cutted"], annot_backup["annot_slices_backup"]
        data_repo.delete_info(key="annot_backup")

        annot_img_crop = annot_module.annotation_image
        annot_img_full = np.zeros_like(output_img, dtype='int16') - 1

        annot_bool = np.ones(annot_img_full.shape, dtype='bool')
        
        annot_img_full[zlo:zhi, ylo:yhi, xlo:xhi] = annot_img_crop
        #region forbidden to fill
        annot_bool[zlo:zhi, ylo:yhi, xlo:xhi] = False

        annotation_slice_dict = annot_module.get_annotation_slice_dict()     

        axis_limit = [(xlo, xhi), (ylo, yhi), (zlo, zhi)]
        new_annot_slice_dict = {0: set(), 1: set(), 2: set()}

        #lets do a linear transform the coords space from cropped to full image and restore annot slices from full image
        for axis, slice_nums in annotation_slice_dict.items():
            #restore cutted annotatation
            new_annot_slice_dict[axis].update(annot_cutted[axis])
            for slice_num in slice_nums:
                new_annot_slice_dict[axis].add(slice_num + axis_limit[axis][0])

        #now lets retore the previous annot slices
        for (axis, slice_num), slice_backup in annot_slices_backup:
            slice_range = [slice(None, None, None), slice(None, None, None), slice(None, None, None)]
            slice_range[axis] = slice_num

            mask = annot_bool[slice_range]
            indices = np.where(mask)
            annot_img_full[slice_range][indices] = slice_backup[indices]

    annot_module.set_annotation_image(annot_img_full)


    # ---
    # update info on data_repo
    # ---
    image_info["imageShape"] = imageFullShape
    crop_info = {}

    data_repo.set_info(key="image_info", data=image_info)
    data_repo.set_info(key="crop_info", data=crop_info)

    return jsonify(image_info)


@app.route("/get_open_images", methods=["POST", "GET"])
@cross_origin()
def get_open_images():

    image_keys = data_repo.get_images_keys()

    if "image" in image_keys:
        # annotations will open alog image
        image_keys.append("Annotation")

    image_keys = [string_keys.capitalize() for string_keys in image_keys]
    return jsonify(image_keys)


@app.route("/delete_info/<info_key>", methods=["POST"])
@cross_origin()
def delete_info(info_key: str):
    print("delete_info: ", info_key)

    try:
        data_repo.delete_info(key=info_key)
    except:
        return jsonify("delete info: " + info_key + " not found.")

    return jsonify("deleted info: " + info_key)
