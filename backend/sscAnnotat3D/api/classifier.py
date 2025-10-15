import pickle
from flask import Blueprint, Flask, request, jsonify
from flask_cors import cross_origin
import numpy as np
from sscAnnotat3D.api.annotation import handle_exception
from sscAnnotat3D.api.superpixel import _debugger_print
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscAnnotat3D.modules.superpixel_segmentation_module import SuperpixelSegmentationModule
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D import utils

app = Blueprint("classifier", __name__)

def _convert_dtype_to_str(img_dtype: np.dtype):
    """
    Build-in function to convert dtype to a str

    Args:
        img_dtype (np.dtype): np.dtype object that contains

    Returns:
        (str): returns the str version of the dtype

    """
    return np.dtype(img_dtype).name

def _default_classifier_front(classifier_dict: dict = None):
    """
    Build-in function that creates the front-end classifier

    Args:
        classifier_dict (dict): a dict that contains the raw pooling

    Returns:
        (dict): returns a dict with the correct front-end template

    """
    if classifier_dict["classifier_type"] == "rf":
        return [
            {
                "id": "rf_n_estimators",
                "label": "Random Forest N. Trees",
                "value": classifier_dict["rf_n_estimators"],
                "input": "number",
            }
        ]

    elif classifier_dict["classifier_type"] == "svm":
        return [{"id": "svm_C", "label": "SVM C", "value": classifier_dict["svm_C"], "input": "number"}]

    elif classifier_dict["classifier_type"] == "mlp":
        return [
            {
                "id": "mlp_hidden_layer_sizes",
                "label": "N. hidden Neurons",
                "value": [*classifier_dict["mlp_hidden_layer_sizes"]],
                "input": "text",
            }
        ]

    elif classifier_dict["classifier_type"] == "adaboost":
        return [
            {
                "id": "adaboost_n_estimators",
                "label": "N. classifiers",
                "value": classifier_dict["adaboost_n_estimators"],
                "input": "number",
            }
        ]

    elif classifier_dict["classifier_type"] == "knn":
        return [
            {
                "id": "knn_n_neighbors",
                "label": "N. neighbors",
                "value": classifier_dict["knn_n_neighbors"],
                "input": "number",
            }
        ]

    return [{}]


@app.route("/save_classifier", methods=["POST"])
@cross_origin()
def save_classifier():
    """
    Save a classifier (pixel or superpixel) into a .model file.

    Notes:
        Used in FileSaveDialog.tsx

    Expects JSON:
        {
            "classificationPath": "<path>",
            "mode": "pixel" | "superpixel"
        }

    Returns:
        (str): "successes" if everything goes well, otherwise an error.
    """
    try:
        path = request.json["classificationPath"]
        mode = request.json.get("mode", "superpixel")  # default = superpixel
    except Exception as e:
        return handle_exception(str(e))

    # Select the right module
    if mode == "pixel":
        module_key = "pixel_segmentation_module"
    else:
        module_key = "superpixel_segmentation_module"

    try:
        segm_module = module_repo.get_module(key=module_key)
    except Exception as e:
        # log técnico (aparece no console, mas não para o usuário)
        print(f"Error while getting module {module_key}: {e}")
        
        # mensagem amigável para o frontend
        return handle_exception(
            f"Unable to save the classifier! Please, run again the preprocess and apply in {mode.capitalize()} Segmentation menu and try again this operation"
        )

    if segm_module is None:
        return handle_exception("Please, load a classifier first!")

    try:
        superpixel_state = data_repo.get_superpixel_state()
        if mode == "pixel":
            superpixel_state["use_pixel_segmentation"] = True
    except Exception:
        return handle_exception("Unable to get superpixel_state")

    try:
        feature_extraction_params = data_repo.get_feature_extraction_params("feature_extraction_params")
    except Exception as e:
        return handle_exception(str(e))

    resp, msg, model_complete = segm_module.save_classifier(
        path, superpixel_state, feature_extraction_params
    )

    if not resp:
        return handle_exception(msg)

    #data_repo.set_classification_model("model_complete", model_complete)

    return jsonify("successes")

@app.route("/load_classifier", methods=["POST"])
@cross_origin()
def load_classifier():
    """
    Function that loads a classifier .model and updates the back-end and front-end components.

    Returns:
        (dict): Returns a dict that contains information to dispatch and update the front-end classifier
    """
    try:
        path = request.json["classificationPath"]
    except Exception as e:
        return handle_exception(str(e))

    img = data_repo.get_image("image")

    with open(path, "rb") as f:
        model_complete = pickle.load(f)


    superpixel_state = model_complete["superpixel_params"]
    _debugger_print("superpixel_state", superpixel_state)

    if not superpixel_state["pixel_segmentation"]:
        from sscAnnotat3D.superpixels import superpixel_extraction

        superpixels, max_superpixel_label = superpixel_extraction(img, superpixel_type= superpixel_state["superpixel_type"],
                                                                    seed_spacing = superpixel_state["waterpixels_seed_spacing"],
                                                                    compactness = superpixel_state["waterpixels_compactness"])
        segm_module = SuperpixelSegmentationModule(img, superpixels)
        module_key = "superpixel_segmentation_module"

        if "superpixel_params" not in model_complete:
            return handle_exception("Invalid classifier file! Missing superpixel_params")

    else:
        segm_module = PixelSegmentationModule(img)
        module_key = "pixel_segmentation_module"

    # === Step 3: load the classifier into the chosen module ===
    resp, msg, model_complete = segm_module.load_classifier(model_complete)
    if not resp:
        return handle_exception(msg)

    # === Step 4: register the module ===
    module_repo.set_module(module_key, segm_module)
    data_repo.set_classification_model("model_complete", model_complete)

    # === Step 5: build frontend payload ===
    front_end_superpixel = {
        "method": superpixel_state["superpixel_type"],
        "compactness": superpixel_state["waterpixels_compactness"],
        "seedsSpacing": superpixel_state["waterpixels_seed_spacing"],
    }

    params_front = _default_classifier_front(model_complete["classifier_params"])
    front_end_classifier = {
        "classifier": model_complete["classifier_params"]["classifier_type"],
        "params": params_front,
    }

    chosen_features = model_complete["feature_extraction_params_front"]

    feature_extraction_params = {
        "pooling": chosen_features.get("selected_supervoxel_feat_pooling", []),
        "feats": chosen_features.get("selected_features", []),
        "multiscale": chosen_features.get("sigmas", []),
        "thresholdSelection": (
            chosen_features["feat_selection_method_threshold"]
            if chosen_features.get("feat_selection_enabled")
            else None
        ),
    }

    front_end_payload = {
        "superpixel_parameters": front_end_superpixel,
        "use_pixel_segmentation": superpixel_state["pixel_segmentation"],
        "classifier_parameters": front_end_classifier,
        "feature_extraction_params": feature_extraction_params,
    }

    data_repo.set_info(key="model_loaded_paramaters", data=front_end_payload)
    data_repo.set_info(key="model_status", data={'loaded': True, 'trained': False})

    return jsonify(front_end_payload)


# =====================
# MODEL STATUS CHECK
# =====================
@app.route("/models/current/<segm_type>", methods=["POST"])
@cross_origin()
def get_current_model(segm_type):
    """
    Check if there's a loaded model and return its information.
    Query params:
      ?module=pixel OR ?module=superpixel
    """
    module_type = str(segm_type)
    model_status = data_repo.get_info(key="model_status") or {}
    
    if module_type not in ["pixel", "superpixel"]:
        return handle_exception("Missing or invalid module type (?module=pixel|superpixel)")
    
    try:
        # Check if there's a loaded model in data_repo
        model_complete = data_repo.get_classification_model("model_complete")
        
        if model_complete is None:
            return jsonify({
                "loaded": False,
                "mode": None,
                "classifier_parameters": None,
                "feature_extraction_params": None
            }), 200
        
        # Check if it's pixel segmentation
        superpixel_state = model_complete["superpixel_params"]
        is_pixel_segmentation = superpixel_state.get("pixel_segmentation") == True
        
        # Determine the model type
        current_model_type = "pixel" if is_pixel_segmentation else "superpixel"
        
        # Retrieve the frontend-ready payload we saved earlier
        frontend_params = data_repo.get_info("model_loaded_paramaters")
        if not frontend_params:
            return jsonify({
                "loaded": False,
                "mode": None,
                "classifier_parameters": None,
                "feature_extraction_params": None,
            }), 200

        # Determine the model type from the saved payload
        current_model_type = "pixel" if frontend_params["use_pixel_segmentation"] else "superpixel"

        return jsonify({
            "loaded": True,
            "mode": current_model_type,
            "classifier_parameters": frontend_params["classifier_parameters"],
            "feature_extraction_params": frontend_params["feature_extraction_params"],
        }), 200

    except Exception as e:
        return handle_exception(f"Error checking model status: {str(e)}")

# =====================
# TRAIN
# =====================
@app.route("/segmentation_module/train", methods=["POST"])
@cross_origin()
def train_segmentation():
    """
    Train segmentation module (pixel or superpixel).
    Query params:
      ?module=pixel OR ?module=superpixel
      ?finetune=true|false
    """
    module_type = request.args.get("module")
    finetune = request.args.get("finetune", "false").lower() == "true"

    if module_type not in ["pixel", "superpixel"]:
        return handle_exception("Missing or invalid module type (?module=pixel|superpixel)")

    module_key = f"{module_type}_segmentation_module"
    segm_module = module_repo.get_module(key=module_key)

    annotation_module = module_repo.get_module("annotation")
    annotation_slice_dict = annotation_module.get_annotation_slice_dict()
    annotation_image = annotation_module.annotation_image

    if len(annotation_slice_dict) == 0:
        return handle_exception(
            "Unable to train! Please, at least create one label and background annotation and try again."
        )

    # === CASE 1: Finetune ===
    if finetune:
        if segm_module is None:
            return handle_exception("No existing model available to finetune. Please load model.")
        try:
            segm_module.train(annotation_slice_dict, annotation_image, finetune=True)
        except Exception as e:
            return handle_exception(f"Unable to finetune! {str(e)}")
        
        data_repo.set_info(key="model_status", data={'loaded': True, 'trained': True})

        return jsonify({"trained": True, "mode": module_type, "finetune": True}), 200

    # === CASE 2: Fresh training (create new module) ===
    try:
        feature_extraction_params = request.json["feature_extraction_params"]
        classifier_params = request.json["classifier_params"]
        classifier_values = request.json["classifier_values"]

        if isinstance(classifier_values["value"], str):
            value = eval(classifier_values["value"])
        elif isinstance(classifier_values["value"], list):
            value = (*classifier_values["value"],)
        else:
            value = classifier_values["value"]

        classifier_params[classifier_values["id"]] = value
    except Exception as e:
        return handle_exception(f"Error parsing training parameters: {str(e)}")

    img = data_repo.get_image("image")
    if module_type == "superpixel":
        img_superpixel = data_repo.get_image("superpixel")
        if img_superpixel is None:
            return handle_exception("Please create a superpixel of the image first.")
        if _convert_dtype_to_str(img_superpixel.dtype) != "int32":
            img_superpixel = img_superpixel.astype("int32")
        segm_module = SuperpixelSegmentationModule(img, img_superpixel)
    else:
        if img is None:
            return handle_exception("Needs a valid image to create module.")
        segm_module = PixelSegmentationModule(img)

    # Merge defaults
    data_repo.set_feature_extraction_params(key="feature_extraction_params", data=feature_extraction_params.copy())
    segm_module.set_feature_extraction_parameters(**feature_extraction_params)

    segm_module.set_classifier_parameters(**classifier_params)

    module_repo.set_module(module_key, segm_module)

    try:
        segm_module.train(annotation_slice_dict, annotation_image, finetune=False)
    except Exception as e:
        return handle_exception(f"Unable to train new model! {str(e)}")
    data_repo.set_info(key="model_status", data={'loaded': False, 'trained': True, 'pixel_type': module_type})

    return jsonify({"loaded": False, "trained": True, "mode": module_type, "finetune": False}), 200

@app.route("/<segm_type>_segmentation_module/preview", methods=["POST"])
@cross_origin()
def preview(segm_type):
    """
    Creates a preview (single slice) for pixel or superpixel segmentation modules.
    """
    segm_module = module_repo.get_module(key=f"{segm_type}_segmentation_module")

    model_status = data_repo.get_info(key="model_status") or {}
    if (
        not (model_status.get("trained") or model_status.get("loaded"))
        and model_status.get("pixel_type") == segm_type
    ):
        return handle_exception(
            f"Unable to preview! Please train or load a model for {segm_type} segmentation."
        )

    slice_num = request.json.get("slice")
    axis = request.json.get("axis")
    axis_dim = utils.get_axis_num(axis)

    if segm_module is None:
        return handle_exception(
            f"unable to preview! Please train or load a {segm_type} model first!"
            )


    try:
        label, selected_features_names = segm_module.preview(selected_slices = [slice_num], 
                                                             selected_axis = axis_dim)
    except Exception as e:
        return handle_exception(f"unable to preview! {str(e)}")

    data_repo.set_image("label", label)

    return jsonify({"selected_features_names": selected_features_names}), 200


@app.route("/<segm_type>_segmentation_module/execute", methods=["POST"])
@cross_origin()
def execute(segm_type):
    """
    Executes segmentation (applies to all slices) for pixel or superpixel modules.
    """
    segm_module = module_repo.get_module(key=f"{segm_type}_segmentation_module")

    annotation_slice_dict = module_repo.get_module("annotation").get_annotation_slice_dict()
    annotation_image = module_repo.get_module("annotation").annotation_image

    model_status = data_repo.get_info(key="model_status") or {}
    if (
        not (model_status.get("trained") or model_status.get("loaded"))
        and model_status.get("pixel_type") == segm_type
    ):
        return handle_exception(f"unable to apply! Please train or load a {segm_type} model first!")

    if segm_module is None:
        return handle_exception(f"unable to apply! Please train or load a {segm_type} model first!")

    try:
        label, selected_features_names = segm_module.execute()
    except Exception as e:
        return handle_exception(f"unable to execute! {str(e)}")

    data_repo.set_image("label", label)

    return jsonify({"selected_features_names": selected_features_names}), 200