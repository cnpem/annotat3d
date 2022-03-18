from flask import Blueprint, request
import numpy as np

from repository import data_repo, module_repo
from sscAnnotat3D.modules.superpixel_segmentation_module import SuperpixelSegmentationModule

app = Blueprint('superpixel_segmentation_module', __name__)


@app.route('/superpixel_segmentation_module/create', methods=['POST', 'GET'])
def create():
    img = data_repo.get_image('image')
    img_superpixel = data_repo.get_image('superpixel')

    if img is None or img_superpixel is None:
        return 'Needs a valid image and superpixel to create module.', 400

    segm_module = SuperpixelSegmentationModule(img, img_superpixel)

    if segm_module.has_preprocess():
        segm_module.preprocess()

    module_repo.set_module('superpixel_segmentation_module', segm_module)

    return "success", 200


@app.route('/superpixel_segmentation_module/preview', methods=['POST'])
def preview():

    segm_module = module_repo.get_module(key='superpixel_segmentation_module')

    annotations = data_repo.get_annotation('annotation')

    z = request.json['z']

    if segm_module is None:
        return "Not a valid segmentation module", 400

    if not segm_module.has_preview():
        return "This module does not have a preview", 400

    label = segm_module.preview(annotations, [z - 1, z, z + 1], 0)

    print(label.mean(), label.shape)

    data_repo.set_image('label', label)

    return "success", 200


@app.route('/superpixel_segmentation_module/execute', methods=['POST'])
def execute():

    segm_module = module_repo.get_module(key='superpixel_segmentation_module')

    annotations = data_repo.get_annotation('annotation')

    if segm_module is None:
        return "Not a valid segmentation module", 400

    label = segm_module.execute(annotations)

    print(label.mean(), label.shape)

    return "success", 200
