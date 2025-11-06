import gc
import math
from typing import Dict, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from einops import rearrange
from torch.utils.data import DataLoader, TensorDataset
from tqdm import tqdm
import gc
import math
from typing import Dict, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from einops import rearrange
from torch.utils.data import DataLoader, TensorDataset
from tqdm import tqdm
from sscAnnotat3D.aux_functions import random_augment
import segmentation_models_pytorch as smp

# -------------------------------------------------------------------------
# --- Main Manager --------------------------------------------------------
# -------------------------------------------------------------------------
class DeepSegmentationManager:
    """
    2.5D segmentation manager with automatic GPU memory-aware patch splitting.
    """

    def __init__(
        self,
        model: nn.Module,
        base: int = 16,
        target_std: float = 0.25,
        target_mean: float = 0.5,
        ignore_index: int = -1,
        selected_labels: list[int] = [0],     # <--- novo
        num_classes: Optional[int] = None,  # ← allow passing this explicitly
    ):
        self.model = model
        self.base = base
        self.target_std = target_std
        self.target_mean = target_mean
        self.ignore_index = ignore_index
        self.selected_labels = selected_labels
        self.start_epoch = 0

        # try to infer num_classes if not provided
        if num_classes is None:
            # most SMP models expose the number of channels in the final conv
            try:
                self.num_classes = model.segmentation_head[0].out_channels
            except Exception:
                try:
                    self.num_classes = model.segmentation_head.out_channels
                except Exception:
                    self.num_classes = 1  # safe default
        else:
            self.num_classes = num_classes

        self.is_binary = (self.num_classes == 1)

        self.mean: Optional[float] = None
        self.std: Optional[float] = None
        self.global_patch: Optional[Tuple[int, int]] = None
        self.batch_size: Optional[int] = None

    # ---------------------------------------------------------------------
    # Auto-calibration using true GPU memory
    # ---------------------------------------------------------------------
    def _auto_calibrate_patch_and_batch(
        self, img_shape: Tuple[int, int, int], device: str = "cuda:0"
    ) -> Tuple[Tuple[int, int], int]:
        """
        Dynamically calibrate patch and batch size using real GPU memory measurement.
        """
        # NOTE: expects measure_runtime_memory_safe to be defined in your env
        z, y, x = img_shape
        max_dim = max(z, y, x)

        # --- Patch selection rule ---
        if max_dim > 2064:
            patch = (1024, 1024)
        else:
            patch = (
                min(2048, math.ceil(max_dim / self.base) * self.base),
                min(2048, math.ceil(max_dim / self.base) * self.base),
            )

        # --- Measure runtime usage (batch=2) per your latest code ---
        print(f" Measuring memory for patch={patch} ...")
        used_mb, peak_mb = self._measure_runtime_memory_safe(
            input_size=(2, 1, patch[0], patch[1]), device=device
        )

        # --- Determine available memory ---
        free_bytes, total_bytes = torch.cuda.mem_get_info(torch.device(device))
        free_mb = free_bytes / (1024 ** 2)
        usable_mb = free_mb * 0.9  # 90 % safety margin

        # --- Compute max batch size ---
        if peak_mb == float("inf") or peak_mb == 0:
            max_batch = 2
        else:
            max_batch = max(2, 2 * int(usable_mb / peak_mb))

        print(
            f" Patch={patch}, peak={peak_mb:.1f} MB, usable={usable_mb:.1f} MB → "
            f"batch≈{max_batch}"
        )

        self.global_patch = patch
        self.batch_size = max_batch
        return patch, max_batch

    # ---------------------------------------------------------------------
    # Basic utilities
    # ---------------------------------------------------------------------

    def _measure_runtime_memory_safe(self, input_size=(2, 1, 512, 512), device="cuda:0"):
        """
        Safely measure GPU memory usage by running a forward pass.
        Returns (used_mb, peak_mb).
        """
        torch.cuda.empty_cache()
        gc.collect()

        try:
            torch.cuda.reset_peak_memory_stats(device)
        except Exception:
            pass

        before = torch.cuda.memory_allocated(device)
        self.model = self.model.to(device)
        self.model.eval()

        dummy = torch.randn(input_size, device=device, dtype=torch.float32)

        try:
            with torch.no_grad():
                _ = self.model(dummy)
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                print(" OOM during calibration test — returning inf")
                torch.cuda.empty_cache()
                return float("inf"), float("inf")
            raise e

        after = torch.cuda.memory_allocated(device)
        peak = torch.cuda.max_memory_allocated(device)

        used_mb = (after - before) / (1024 ** 2)
        peak_mb = peak / (1024 ** 2)

        torch.cuda.empty_cache()
        gc.collect()
        return used_mb, peak_mb


    def _pad_to_multiple(self, img: np.ndarray) -> np.ndarray:
        h, w = img.shape
        new_h = math.ceil(h / self.base) * self.base
        new_w = math.ceil(w / self.base) * self.base
        if new_h != h or new_w != w:
            img = np.pad(img, ((0, new_h - h), (0, new_w - w)), mode="edge")
        return img

    def _patchify(self, img: np.ndarray) -> np.ndarray:
        ph, pw = self.global_patch
        h, w = img.shape
        nH = math.ceil(h / ph)
        nW = math.ceil(w / pw)
        pad_h = nH * ph - h
        pad_w = nW * pw - w
        if pad_h or pad_w:
            img = np.pad(img, ((0, pad_h), (0, pad_w)), mode="edge")
        patches = rearrange(img, "(nH ph) (nW pw) -> (nH nW) ph pw", nH=nH, nW=nW)
        return patches

    def _unpatchify(self, patches: np.ndarray, full_hw: Tuple[int, int]) -> np.ndarray:
        if len(patches) == 1:
            return patches[0]
        ph, pw = self.global_patch
        h, w = full_hw
        nH = math.ceil(h / ph)
        nW = math.ceil(w / pw)
        img = rearrange(patches[: nH * nW], "(nH nW) ph pw -> (nH ph) (nW pw)", nH=nH)
        return img[:h, :w]

    # ---------------------------------------------------------------------
    # Filter unlabeled / sparse patches
    # ---------------------------------------------------------------------
    def _filter_low_annotation(self, x_list, y_list, min_frac=0.05):
        kept_x, kept_y = [], []
        for xi, yi in zip(x_list, y_list):
            mask = yi != self.ignore_index
            frac = mask.sum() / mask.size
            if frac >= min_frac:
                kept_x.append(xi)
                kept_y.append(yi)
        print(f" {len(kept_x)}/{len(x_list)} patches kept after filtering (<5 % ignored).")
        return kept_x, kept_y

    # ---------------------------------------------------------------------
    # Data preparation
    # ---------------------------------------------------------------------
    def prepare_training_data(
        self, img: np.ndarray, annot: np.ndarray, annot_slices: Dict[int, list], device="cuda:0"
    ):
        """
        Extract, pad, normalize, patchify, and filter data automatically.
        """
        # 1️⃣ Calibrate patch/batch based on GPU memory
        self._auto_calibrate_patch_and_batch(img.shape, device=device)

        # 2️⃣ Determine global slice dimensions
        shapes = []
        for axis, idxs in annot_slices.items():
            for _ in idxs:
                if axis == 0:
                    h, w = img.shape[1:]
                elif axis == 1:
                    h, w = img.shape[0], img.shape[2]
                else:
                    h, w = img.shape[0], img.shape[1]
                shapes.append((h, w))
        max_h = max(s[0] for s in shapes)
        max_w = max(s[1] for s in shapes)
        print(f" Global slice shape for padding: ({max_h}, {max_w})")

        x_patches, y_patches = [], []

        # 3️⃣ Extract and pad slices
        for axis, idxs in annot_slices.items():
            for idx in sorted(idxs):
                if axis == 0:
                    s_img, s_ann = img[idx, :, :], annot[idx, :, :]
                elif axis == 1:
                    s_img, s_ann = img[:, idx, :], annot[:, idx, :]
                else:
                    s_img, s_ann = img[:, :, idx], annot[:, :, idx]

                pad_h, pad_w = max_h - s_img.shape[0], max_w - s_img.shape[1]
                if pad_h or pad_w:
                    s_img = np.pad(s_img, ((0, pad_h), (0, pad_w)), mode="edge")
                    s_ann = np.pad(
                        s_ann,
                        ((0, pad_h), (0, pad_w)),
                        mode="constant",
                        constant_values=self.ignore_index,
                    )

                s_img = self._pad_to_multiple(s_img)
                s_ann = self._pad_to_multiple(s_ann)

                x_patches.extend(self._patchify(s_img))
                y_patches.extend(self._patchify(s_ann))

        # 4️⃣ Filter and normalize
        x_patches, y_patches = self._filter_low_annotation(x_patches, y_patches)
        x = np.asarray(x_patches, np.float32)
        y = np.asarray(y_patches, np.int32)

        if self.is_binary:
            #get ignore index map
            ignore_mask = y == self.ignore_index
            # Convert all labels except IGNORE to {1,0}
            y = np.where(y == self.selected_labels[0], 1, 0)

            # Restore ignore index
            y[ignore_mask] = self.ignore_index

        self.mean, self.std = x.mean(), x.std()
        # avoid div-by-zero
        std = self.std if self.std > 0 else 1.0
        x = (x - self.mean) / std * self.target_std + self.target_mean

        self._train_numpy, self._train_label_numpy = x, y
        # Cap batch size by dataset length
        self.batch_size = min(self.batch_size, len(x))
        print(f" Normalized mean={self.mean:.3f}, std={self.std:.3f}")
        print(f" Patch size={self.global_patch}, Max batch size={self.batch_size}")

    # ---------------------------------------------------------------------
    # Training loop (binary or multiclass)
    # ---------------------------------------------------------------------
    def train(self, device="cuda:0", epochs=200, lr=1e-4, data_aug=True, writer=None):
        """
        Train the model for either binary or multiclass segmentation.
    
        - Binary: uses BCEWithLogitsLoss + DiceLoss (mode='binary')
        - Multiclass: uses CrossEntropyLoss + DiceLoss (mode='multiclass')
        """
    
        # Prepare tensors
        x_tensor = torch.from_numpy(self._train_numpy).unsqueeze(1)  # (N, 1, H, W)
        y_tensor = torch.from_numpy(self._train_label_numpy)         # (N, H, W)
    
        loader = DataLoader(
            TensorDataset(x_tensor, y_tensor),
            batch_size=self.batch_size,
            shuffle=True,
        )
    
        self.model = self.model.to(device)
        self.model.train()
    
        # === Define loss functions ===
        if self.is_binary:
            bce_raw = nn.BCEWithLogitsLoss(reduction="none")
            dice_loss = smp.losses.DiceLoss(mode="binary", ignore_index=self.ignore_index)

            def criterion(pred, target):
                # pred: [B,1,H,W]
                # target: [B,H,W] or [B,1,H,W]

                if target.ndim == 3:
                    target = target.unsqueeze(1)

                # ------------------------------------------------------------------
                # ✅ DICE LOSS (SMP handles ignore_index automatically)
                # ------------------------------------------------------------------
                dice = dice_loss(pred, target)

                # ------------------------------------------------------------------
                # ✅ BCE LOSS with IGNORE INDEX masking
                # ------------------------------------------------------------------
                # Mask of valid pixels (1 = keep, 0 = ignore)
                mask = (target != self.ignore_index).float()  # shape [B,1,H,W]

                bce_pixelwise = bce_raw(pred, target.float())  # no reduction

                # multiply → invalid pixels become 0 loss
                bce_masked = bce_pixelwise * mask

                # prevent division by zero
                denom = mask.sum().clamp(min=1.0)

                bce = bce_masked.sum() / denom

                # ------------------------------------------------------------------
                return 0.5 * dice + 0.5 * bce

        else:
            dice_loss = smp.losses.DiceLoss(mode='multiclass', ignore_index = self.ignore_index)
            ce_loss   = nn.CrossEntropyLoss(ignore_index = self.ignore_index)
            def criterion(pred, target):
                return 0.5 * dice_loss(pred, target) + 0.5 * ce_loss(pred, target.long())
    
        optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
    
        # === Training loop ===
        for epoch in range(self.start_epoch, self.start_epoch + epochs):
            n_samples = 0
            epoch_loss = 0.0
            
            for xb, yb in tqdm(loader, desc=f"Epoch {epoch+1}/{epochs}", leave=False):
                xb, yb = xb.to(device), yb.to(device)
                if data_aug:
                    xb, yb = random_augment(xb, yb)
    
                optimizer.zero_grad()
    
                pred = self.model(xb)
                if isinstance(pred, (tuple, list)):
                    pred = pred[0]
    
                loss = criterion(pred, yb)
                loss.backward()
                optimizer.step()
    
                epoch_loss += loss.item()
                n_samples += 1
    
    
            train_loss = epoch_loss / (n_samples // self.batch_size + 1)
            if writer:
                writer.add_scalar("training/loss", train_loss, epoch+1)
            print(f" Epoch {epoch+1} | Loss={train_loss:.4f}")
    
        print(" Training complete.")
        self.start_epoch = self.start_epoch + epochs


    # ---------------------------------------------------------------------
    # Prediction for a single slice
    # ---------------------------------------------------------------------
    def predict_slice(self, slice_img: np.ndarray, device="cuda:0") -> np.ndarray:
        """
        Predict segmentation for a single 2D slice.
        Automatically pads image to satisfy model stride requirements.
        """
        self.model = self.model.to(device)
        self.model.eval()
    
        # --- Pad to multiple of base (e.g., 16) ---
        padded = self._pad_to_multiple(slice_img)
        orig_h, orig_w = slice_img.shape
    
        # --- Normalize ---
        norm_img = (padded - self.mean) / (self.std if self.std > 0 else 1.0)
        norm_img = norm_img * self.target_std + self.target_mean
    
        inp = torch.from_numpy(norm_img[None, None]).float().to(device)
    
        with torch.no_grad():
            pred = self.model(inp)
            if isinstance(pred, (tuple, list)):
                pred = pred[0]
    
            # --- Binary segmentation: sigmoid + threshold ---
            if self.is_binary:
                pred = torch.sigmoid(pred) > 0.5

                pred = torch.where(
                    pred,
                    torch.tensor(self.selected_labels[0], device=pred.device),
                    torch.tensor(-1, device=pred.device)
                )

            else:
                pred = torch.softmax(pred, dim=1)
                pred = torch.argmax(pred, dim=1, keepdim=True).float()
    
        # --- Remove padding back to original size ---
        pred = pred[..., :orig_h, :orig_w]
        return pred.squeeze().cpu().numpy()

    # ---------------------------------------------------------------------
    # Full 3D multi-axis prediction
    # ---------------------------------------------------------------------
    def predict_volume(self, img: np.ndarray, device="cuda:0", multi_axis=True):
        """
        Predict a 3D volume along one or more axes.
        - Always computes axis 0 (YZ slices)
        - Optionally also runs along axis 1 and 2, then averages
        Returns torch.Tensor (Z, Y, X)
        """
        self.model.eval()
        device = torch.device(device)
        z, y, x = img.shape
    
        def _norm(a2d: np.ndarray):
            std = self.std if self.std > 0 else 1.0
            return (a2d - self.mean) / std * self.target_std + self.target_mean
    
        preds = []
    
        # -------------------------------------------------------
        # AXIS 0 (default, YZ slices)
        # -------------------------------------------------------
        y_pred_0 = []
        with torch.no_grad():
            for i in range(z):
                slice_np = _norm(img[i])
                orig_h, orig_w = slice_np.shape
                padded = self._pad_to_multiple(slice_np)
                inp = torch.from_numpy(padded[None, None]).float().to(device)
                out = self.model(inp)
                if isinstance(out, (tuple, list)):
                    out = out[0]
                out = out[..., :orig_h, :orig_w]
                y_pred_0.append(out.detach().cpu())
        y_pred_0 = torch.cat(y_pred_0, dim=0)  # (Z, C, Y, X)
        preds.append(y_pred_0)
    
        # -------------------------------------------------------
        # AXIS 1 (XZ slices)
        # -------------------------------------------------------
        if multi_axis:
            y_pred_1 = []
            with torch.no_grad():
                for i in range(y):
                    slice_np = _norm(img[:, i, :])
                    orig_h, orig_w = slice_np.shape
                    padded = self._pad_to_multiple(slice_np)
                    inp = torch.from_numpy(padded[None, None]).float().to(device)
                    out = self.model(inp)
                    if isinstance(out, (tuple, list)):
                        out = out[0]
                    out = out[..., :orig_h, :orig_w]
                    y_pred_1.append(out.detach().cpu())
            y_pred_1 = torch.cat(y_pred_1, dim=0)      # (Y, C, Z, X)
            y_pred_1 = y_pred_1.permute(2, 1, 0, 3)    # (Z, C, Y, X)
            preds.append(y_pred_1)
    
            # ---------------------------------------------------
            # AXIS 2 (XY slices)
            # ---------------------------------------------------
            y_pred_2 = []
            with torch.no_grad():
                for i in range(x):
                    slice_np = _norm(img[:, :, i])
                    orig_h, orig_w = slice_np.shape
                    padded = self._pad_to_multiple(slice_np)
                    inp = torch.from_numpy(padded[None, None]).float().to(device)
                    out = self.model(inp)
                    if isinstance(out, (tuple, list)):
                        out = out[0]
                    out = out[..., :orig_h, :orig_w]
                    y_pred_2.append(out.detach().cpu())
            y_pred_2 = torch.cat(y_pred_2, dim=0)      # (X, C, Z, Y)
            y_pred_2 = y_pred_2.permute(2, 1, 3, 0)    # (Z, C, Y, X)
            preds.append(y_pred_2)
    
        # -------------------------------------------------------
        # Combine predictions (mean ensemble)
        # -------------------------------------------------------
        if len(preds) > 1:
            pred_mean = torch.stack(preds, dim=0).mean(dim=0)
        else:
            pred_mean = preds[0]
    
        # -------------------------------------------------------
        # Activation + threshold
        # -------------------------------------------------------
        if self.is_binary:
            pred_mean = torch.sigmoid(pred_mean)
            pred_mean = (pred_mean > 0.5).to(torch.uint8).squeeze(1)  # (Z, Y, X)
            pred_mean = torch.where(
                            pred_mean,
                            torch.tensor(self.selected_labels[0], device=pred_mean.device),
                            torch.tensor(-1, device=pred_mean.device)
                        )

        else:
            pred_mean = torch.softmax(pred_mean, dim=1)
            pred_mean = torch.argmax(pred_mean, dim=1).to(torch.uint8)  # (Z, Y, X)
    
        return pred_mean.squeeze().cpu().numpy()
    
    # ---------------------------------------------------------------------
    # Save & Load
    # ---------------------------------------------------------------------
    def save_model(self, path: str):
        try:
            checkpoint = {
                "model_type": "deep",
                "state_dict": self.model.state_dict(),

                # training metadata
                "selected_labels": list(map(int, self.selected_labels)),
                "num_classes": int(self.num_classes),
                "ignore_index": int(self.ignore_index),
                "mean": float(self.mean),
                "std": float(self.std),
                "base": int(self.base),
                "target_std": float(self.target_std),
                "target_mean": float(self.target_mean),
                "last_epoch": int(self.start_epoch),

                # model metadata (used to rebuild architecture)
                "encoder_name": getattr(self.model, "encoder_name", "resnet50"),
                "encoder_weights": "imagenet",
                "architecture": "deeplabv3plus", 
            }

            torch.save(checkpoint, path)
            return True, f"✅ Model saved to: {path}"

        except Exception as e:
            return False, f"❌ Error while saving model: {e}"

    def load_model(self, path: str, device="cuda:0"):
        try:
            checkpoint = torch.load(path, map_location=device)

            import segmentation_models_pytorch as smp
            from sscAnnotat3D.aux_functions import convert_batchnorm_to_groupnorm

            encoder         = checkpoint.get("encoder", "resnet50")
            encoderweights  = checkpoint.get("encoder_weights", None)
            n_classes       = checkpoint["num_classes"]
            dropout         = 0.5

            model = smp.DeepLabV3Plus(
                encoder_name=encoder,
                encoder_weights=encoderweights,
                in_channels=1,
                classes=n_classes,
                decoder_attention_type="scse",
                aux_params={"classes": n_classes, "dropout": dropout},
            )

            model = convert_batchnorm_to_groupnorm(model, num_groups=8)

            model.load_state_dict(checkpoint["state_dict"])
            model.to(device)
            model.eval()

            # Restore metadata
            self.model           =  model
            self.selected_labels = checkpoint["selected_labels"]
            self.num_classes     = checkpoint["num_classes"]
            self.ignore_index    = checkpoint["ignore_index"]
            self.mean            = checkpoint["mean"]
            self.std             = checkpoint["std"]
            self.base            = checkpoint["base"]
            self.target_std      = checkpoint["target_std"]
            self.target_mean     = checkpoint["target_mean"]
            self.start_epoch     = checkpoint.get("last_epoch", 0)
            self.is_binary       = (self.num_classes == 1)

            return True, f"✅ Deep model loaded from: {path}"

        except Exception as e:
            return False, f"❌ Error while loading deep model: {e}"
