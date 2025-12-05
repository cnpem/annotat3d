import pickle
from flask import Blueprint, Flask, request, jsonify
from flask_cors import cross_origin
import numpy as np
from sscAnnotat3D.aux_functions import launch_tensorboard
from sscAnnotat3D.modules.pre_trained_deep_learning_module import DeepSegmentationManager
from sscAnnotat3D.api.annotation import handle_exception
from sscAnnotat3D.api.superpixel import _debugger_print
from sscAnnotat3D.modules.pixel_segmentation_module import PixelSegmentationModule
from sscAnnotat3D.modules.superpixel_segmentation_module import SuperpixelSegmentationModule
from sscAnnotat3D.repository import data_repo, module_repo
from sscAnnotat3D import utils


app = Blueprint("segmentation_model", __name__)

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


def load_pixel_or_superpixel_classifier(path, img):
    """
    Loads a scikit-based classifier (pixel or superpixel) from disk,
    restores its segmentation module, registers it in the repository,
    and builds the frontend payload.

    Returns:
        (resp: bool, msg: str, payload: dict | None)
    """
    # ------------------------------
    # Try to load pickle model file
    # ------------------------------
    try:
        with open(path, "rb") as f:
            model_complete = pickle.load(f)
    except Exception as e:
        return False, f"Unable to load classifier file: {e}", None

    # ------------------------------
    # Validation
    # ------------------------------
    if "superpixel_params" not in model_complete:
        return False, "Invalid classifier file! Missing superpixel_params", None

    superpixel_state = model_complete["superpixel_params"]
    _debugger_print("superpixel_state", superpixel_state)

    # ------------------------------
    # Pixel vs Superpixel segmentation module
    # ------------------------------
    if not superpixel_state["pixel_segmentation"]:
        from sscAnnotat3D.superpixels import superpixel_extraction

        superpixels, _ = superpixel_extraction(
            img,
            superpixel_type=superpixel_state["superpixel_type"],
            seed_spacing=superpixel_state["waterpixels_seed_spacing"],
            compactness=superpixel_state["waterpixels_compactness"]
        )

        segm_module = SuperpixelSegmentationModule(img, superpixels)
        module_key = "superpixel_segmentation_module"

    else:
        segm_module = PixelSegmentationModule(img)
        module_key = "pixel_segmentation_module"

    # ------------------------------
    # Load classifier inside the module
    # ------------------------------
    resp, msg, model_complete = segm_module.load_classifier(model_complete)
    if not resp:
        return False, msg, None

    # Register new segmentation module
    module_repo.set_module(module_key, segm_module)
    data_repo.set_classification_model("model_complete", model_complete)

    # ------------------------------
    # Build Frontend Payload
    # ------------------------------
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

    payload = {
        "mode": "pixel" if superpixel_state["pixel_segmentation"] else "superpixel",
        "superpixel_parameters": front_end_superpixel,
        "use_pixel_segmentation": superpixel_state["pixel_segmentation"],
        "classifier_parameters": front_end_classifier,
        "feature_extraction_params": feature_extraction_params,
    }

    data_repo.set_info(key="model_loaded_paramaters", data=payload)
    data_repo.set_info(key="model_status", data={'loaded': True, 'trained': False})

    return True, "Classifier loaded successfully", payload


@app.route("/save_segmentation_model", methods=["POST"])
@cross_origin()
def save_segmentation_model():
    """
    Save a classifier (pixel or superpixel) into a .model file.

    Notes:
        Used in FileSaveDialog.tsx

    Expects JSON:
        {
            "classificationPath": "<path>",
            "mode": "pixel" | "superpixel" | "deep"
        }

    Returns:
        (str): "successes" if everything goes well, otherwise an error.
    """
    try:
        path = request.json["classificationPath"]
        mode = request.json.get("mode", "superpixel")  # default = superpixel
    except Exception as e:
        return handle_exception(str(e))
    
    
    if isinstance(mode, str):
        mode = mode.strip().replace('"', "")


    # Select the right module
    if mode == "pixel":
        module_key = "pixel_segmentation_module"
    elif mode == "deep":
        module_key = "deep_learning_segmentation_module"
    else:
        module_key = "superpixel_segmentation_module"

    print("Module Key", module_key)

    try:
        segm_module = module_repo.get_module(key=module_key)
    except Exception as e:
        # log técnico (aparece no console, mas não para o usuário)
        print(f"Error while getting module {module_key}: {e}")
        
        # mensagem amigável para o frontend
        return handle_exception(
            f"Unable to save the segmentation module! Please, run train the the model {mode.capitalize()} in segmentation menu and try again this operation"
        )

    if segm_module is None:
        return handle_exception(f"Please, train a {mode.capitalize()} segmentation module first!")

    try:
        superpixel_state = data_repo.get_superpixel_state()
        if mode == "pixel":
            superpixel_state["use_pixel_segmentation"] = True
    except Exception:
        return handle_exception("Unable to get superpixel_state")

    if mode == "deep":

        resp, msg  = segm_module.save_model(
            path
        )
        if not resp:
            return handle_exception(msg)

    else:
        try:
            feature_extraction_params = data_repo.get_feature_extraction_params("feature_extraction_params")
        except Exception as e:
            return handle_exception(str(e))
        resp, msg, model_complete = segm_module.save_classifier(
            path, superpixel_state, feature_extraction_params
        )

        if not resp:
            return handle_exception(msg)

    return jsonify("successes")

@app.route("/load_segmentation_model", methods=["POST"])
@cross_origin()
def load_segmentation_model():
    """
    Loads a saved segmentation model.
    Automatically detects whether it is pixel/superpixel (pickle)
    or a deep model (torch checkpoint).
    """

    # === Step 1: get parameters from frontend ===
    try:
        path = request.json["classificationPath"]
    except Exception as e:
        return handle_exception(str(e))

    img = data_repo.get_image("image")

    # =========================================================
    # 1️⃣ Try to parse as PIXEL / SUPERPIXEL classifier first
    # =========================================================
    try:
        resp, msg, payload = load_pixel_or_superpixel_classifier(path, img)
        if resp:
            print("✅ Pixel/Superpixel model detected")
            return jsonify(payload)
    except Exception as e:
        print(f"Not a pixel/superpixel model: {e}")

    # =========================================================
    # 2️⃣ Fallback → assume DEEP model
    # =========================================================
    print("➡️ Fallback: trying to load as DEEP checkpoint...")

    #try:
    import torch
    checkpoint = torch.load(path, map_location="cpu", weights_only=False)
    if checkpoint.get("model_type") == "deep":
        print("➡️ Detected DEEP model")
        
        deep_module = DeepSegmentationManager(
            model=None,  # init will replace model internally
            selected_labels=checkpoint["selected_labels"],
            num_classes=checkpoint["num_classes"],
            ignore_index=checkpoint["ignore_index"],
        )

        resp, msg = deep_module.load_model(path)

        print(f"➡️ load_model() returned: resp={resp}, msg={msg}")  

        if deep_module.model is None:
            raise RuntimeError(
                f"❌ DeepSegmentationManager.load_model() did not create a model "
                f"(self.model is None).\nBackend message: {msg}"
            )

        module_repo.set_module("deep_learning_segmentation_module", deep_module)

        return jsonify({"mode": "deep", "msg": "Deep model loaded"})

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


# =====================
# DEEP LEARNING CLASSIFIER
# =====================
@app.route("/pre_trained_deep_learning/init", methods=["POST"])
@cross_origin()
def init_deep_training():
    """
    Start TensorBoard and return its URL.
    Only launches a new instance if one is not already running.
    """
    body = request.json

    # read logDir from frontend (can be null or a path)
    log_dir = body.get("logDir", None)

    # model metadata (frontend or default)
    model_name = body.get("model", "DeepLabV3+")
    encoder_name = body.get("encoder", "ResNet50")

    # backend default log dir
    if log_dir is None:
        from os import getenv
        base = getenv("REACT_APP_OUTPUT_PATH", "runs/DeepSeg")
        log_dir = base

    # check if writer already exists
    writer_info = data_repo.get_info("tensorboard_writer")

    if writer_info is not None:
        writer = writer_info.get("writer")
        url = writer_info.get("url")

        # inline metadata logging
        if writer:
            writer.add_hparams(
                hparam_dict={"model": model_name, "encoder": encoder_name},
                metric_dict={"init": 0}
            )

            text = (
                f"### Deep Learning Segmentation — Initialization\n"
                f"- **Model:** {model_name}\n"
                f"- **Encoder:** {encoder_name}\n"
            )
            writer.add_text("Model Metadata", text)

        return jsonify({"tensorboard_url": url})

    # Launch TensorBoard only if needed
    writer, url = launch_tensorboard(log_dir)

    # inline metadata logging
    writer.add_hparams(
        hparam_dict={"model": model_name, "encoder": encoder_name},
        metric_dict={"init": 0}
    )

    text = (
        f"### Deep Learning Segmentation — Initialization\n"
        f"- **Model:** {model_name}\n"
        f"- **Encoder:** {encoder_name}\n"
    )
    writer.add_text("Model Metadata", text)

    # Store writer + URL
    data_repo.set_info(
        key="tensorboard_writer",
        data={"writer": writer, "url": url}
    )

    return jsonify({"tensorboard_url": url})




@app.route("/pre_trained_deep_learning/train", methods=["POST"])
@cross_origin()
def train_deep_segmentation():

    continue_training = request.json.get("continueTraining", False)
    data_aug         = request.json.get("dataAug", True)
    learning_rate    = request.json.get("lr", 1e-4)
    num_epochs       = request.json["epochs"]
    selected_labels  = request.json["selectedLabels"]
    n_classes        = len(selected_labels)

    annotation_module = module_repo.get_module("annotation")
    annotation_slice_dict = annotation_module.get_annotation_slice_dict()
    annotation_image = annotation_module.annotation_image

    if len(annotation_slice_dict) == 0:
        return handle_exception(
            "Unable to train! Please, at least create one label and background annotation and try again."
        )

    # Try to retrieve existing deep model
    deep_module = module_repo.get_module("deep_learning_segmentation_module")

    # ================================================================
    # CASE 1: CONTINUE TRAINING (finetune)
    # ================================================================
    if continue_training and deep_module is not None:
        print("🔁 Training continuation requested...")

        # Check if number of classes matches
        if hasattr(deep_module, "num_classes") and deep_module.num_classes == n_classes:
            print("✅ Continuing training from existing model (same number of classes)")
        else:
            print("⚠️ Existing model has different #classes → starting from zero")
            deep_module = None  # force recreation

    # ================================================================
    # CASE 2: TRAIN FROM ZERO (new model)
    # ================================================================
    if deep_module is None or continue_training == False:
        print("🚀 Creating NEW model...")

        try:
            encoder        = "resnet50"
            encoderweights = "imagenet"
            dropout        = 0.5

            import segmentation_models_pytorch as smp
            from aux_functions import convert_batchnorm_to_groupnorm

            model = smp.DeepLabV3Plus(
                encoder_name=encoder,
                encoder_weights=encoderweights,
                in_channels=1,
                classes=n_classes,
                decoder_attention_type="scse",
                aux_params={"classes": n_classes, "dropout": dropout},
            )

            # Replace BatchNorm → GroupNorm
            model = convert_batchnorm_to_groupnorm(model, num_groups=8)

            deep_module = DeepSegmentationManager(
                model,
                ignore_index=-1,
                num_classes=n_classes,
                selected_labels=selected_labels,
            )

            module_repo.set_module("deep_learning_segmentation_module", deep_module)

        except Exception as e:
            return handle_exception(f"Unable to create model! {e}")

    # ================================================================
    # TRAIN
    # ================================================================
    try:
        img = data_repo.get_image("image")

        deep_module.selected_labels = selected_labels  # update if changed

        deep_module.prepare_training_data(img, annotation_image, annotation_slice_dict)

        writer_dict = data_repo.get_info("tensorboard_writer")
        writer = writer_dict["writer"] if writer_dict else None

        deep_module.train(
            epochs=num_epochs,
            lr=learning_rate,
            data_aug=data_aug,
            writer=writer
        )

        module_repo.set_module("deep_learning_segmentation_module", deep_module)

    except Exception as e:
        return handle_exception(f"Unable to Train! {e}")

    return jsonify({"status": "success"}), 200


@app.route("/pre_trained_deep_learning/preview", methods=["POST"])
@cross_origin()
def preview_deep_segmentation():
    """
    Preview a single slice using the trained deep learning model.
    Returns the mask for the slice.
    """

    # -------- INPUT VALIDATION --------
    deep_module = module_repo.get_module("deep_learning_segmentation_module")

    if deep_module is None:
        return handle_exception(
            "Unable to preview! Please train or load a deep learning model first."
        )

    slice_num = request.json.get("slice")
    axis = request.json.get("axis")          # e.g., "xy", "yz", "xz"

    slice_range = utils.get_3d_slice_range_from(axis, slice_num)

    if slice_num is None:
        return handle_exception("Slice index was not provided.")

    try:
        img = data_repo.get_image("image")        # (Z,Y,X)
    except Exception:
        return handle_exception("No image loaded to preview on.")

    # -------- EXTRACT SLICE --------
    slice_np = img[slice_range]
    pred_vol = np.zeros(img.shape, 'int16') - 1
    # -------- RUN PREDICTION --------
    #try:
    pred_vol[slice_range] = deep_module.predict_slice(slice_np)       # -> returns (H, W)
    #except Exception as e:
    #    return handle_exception(f"Unable to preview slice! {e}")

    # Send result to UI (stored as temporary mask layer)
    data_repo.set_image("label", pred_vol)

    return jsonify({"status": "ok"}), 200


@app.route("/pre_trained_deep_learning/execute", methods=["POST"])
@cross_origin()
def execute_deep_segmentation():
    """
    Executes the trained deep learning model and segments the entire volume.
    """
    deep_module = module_repo.get_module("deep_learning_segmentation_module")

    multi_axis = request.json.get("multiAxis")

    if multi_axis == None:
        multi_axis = False

    if deep_module is None:
        return handle_exception(
            "Unable to execute! Please train or load a deep-learning model first."
        )

    # --- Fetch current volume ---
    try:
        img = data_repo.get_image("image")
        if img is None:
            return handle_exception("No image available to execute segmentation.")
    except Exception:
        return handle_exception("No image available to execute segmentation.")

    try:
        # ========================
        # 🔥 FULL VOLUME INFERENCE
        # ========================
        print("🔁 Executing Deep Learning Segmentation...")

        pred_vol = deep_module.predict_volume(img, multi_axis = multi_axis)  # -> returns (Z, Y, X)
        pred_vol = pred_vol.astype(np.int16)

        # Write result back to Annotat3D UI
        data_repo.set_image("label", pred_vol)

    except Exception as e:
        return handle_exception(f"Execution failed! {e}")

    return jsonify({"status": "ok"}), 200
