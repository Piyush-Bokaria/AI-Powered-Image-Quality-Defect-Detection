import cv2
import numpy as np

from app.ml.model_loader import (
    autoencoder_session,
    fusion_session,
    classical_mean,
    classical_std,
    anomaly_mean,
    anomaly_std,
)

from app.services.classical_features import (
    compute_classical_features,
)


# ============================================================
# Configuration
# ============================================================

BASE_IMAGE_SIZE = 400
AE_SIZE = 256
IMG_SIZE = 224


# ImageNet normalization used by the fusion CNN
IMAGENET_MEAN = np.array(
    [0.485, 0.456, 0.406],
    dtype=np.float32,
)

IMAGENET_STD = np.array(
    [0.229, 0.224, 0.225],
    dtype=np.float32,
)


# ============================================================
# Resize with padding
# ============================================================

def resize_with_padding(img, target_size):
    """
    Resize an image while preserving its aspect ratio.

    The result is padded to target_size x target_size.

    Input:
        img: OpenCV BGR image

    Output:
        BGR image of shape:
        target_size x target_size x 3
    """

    h, w = img.shape[:2]

    if h <= 0 or w <= 0:
        raise ValueError("Invalid image dimensions.")

    scale = target_size / max(h, w)

    new_h = int(h * scale)
    new_w = int(w * scale)

    resized = cv2.resize(
        img,
        (new_w, new_h),
        interpolation=cv2.INTER_AREA,
    )

    pad_h = target_size - new_h
    pad_w = target_size - new_w

    top = pad_h // 2
    bottom = pad_h - top

    left = pad_w // 2
    right = pad_w - left

    padded = cv2.copyMakeBorder(
        resized,
        top,
        bottom,
        left,
        right,
        cv2.BORDER_CONSTANT,
        value=[0, 0, 0],
    )

    return padded


# ============================================================
# Autoencoder preprocessing
# ============================================================

def preprocess_for_autoencoder(img_bgr):
    """
    Prepare image exactly like ae_transform used during training.

    Training:
        BGR
        -> RGB
        -> Resize(256, 256)
        -> ToTensor()

    Returns:
        NCHW float32 array
    """

    img_rgb = cv2.cvtColor(
        img_bgr,
        cv2.COLOR_BGR2RGB,
    )

    resized = cv2.resize(
        img_rgb,
        (AE_SIZE, AE_SIZE),
        interpolation=cv2.INTER_AREA,
    )

    # ToTensor() converts uint8 [0,255] to float [0,1]
    image = resized.astype(np.float32) / 255.0

    # HWC -> CHW
    image = np.transpose(
        image,
        (2, 0, 1),
    )

    # CHW -> NCHW
    image = np.expand_dims(
        image,
        axis=0,
    )

    return image.astype(np.float32)


# ============================================================
# Fusion CNN preprocessing
# ============================================================

def preprocess_for_fusion(img_bgr):
    """
    Prepare image exactly like cnn_transform used during
    validation/test training.

    Training:
        BGR
        -> RGB
        -> Resize(224, 224)
        -> ToTensor()
        -> ImageNet Normalize

    Returns:
        NCHW float32 array
    """

    img_rgb = cv2.cvtColor(
        img_bgr,
        cv2.COLOR_BGR2RGB,
    )

    resized = cv2.resize(
        img_rgb,
        (IMG_SIZE, IMG_SIZE),
        interpolation=cv2.INTER_AREA,
    )

    # ToTensor()
    image = resized.astype(np.float32) / 255.0

    # ImageNet normalization
    image = (
        image - IMAGENET_MEAN
    ) / IMAGENET_STD

    # HWC -> CHW
    image = np.transpose(
        image,
        (2, 0, 1),
    )

    # CHW -> NCHW
    image = np.expand_dims(
        image,
        axis=0,
    )

    return image.astype(np.float32)


# ============================================================
# Extract anomaly features
# ============================================================

def extract_anomaly_features(img_bgr):
    """
    Run autoencoder.onnx and reproduce the same 11 anomaly
    features used during training.
    """

    tensor = preprocess_for_autoencoder(
        img_bgr
    )

    reconstruction = autoencoder_session.run(
        ["reconstruction"],
        {
            "image": tensor,
        },
    )[0]

    # --------------------------------------------------------
    # Reconstruction error
    # --------------------------------------------------------

    err_map = (
        tensor - reconstruction
    ) ** 2

    err_map = np.mean(
        err_map,
        axis=1,
    )[0]

    # --------------------------------------------------------
    # 8 x 8 local grid
    # --------------------------------------------------------

    h, w = err_map.shape

    grid_errors = []

    for gy in range(8):

        for gx in range(8):

            y1 = gy * h // 8
            y2 = (gy + 1) * h // 8

            x1 = gx * w // 8
            x2 = (gx + 1) * w // 8

            patch = err_map[
                y1:y2,
                x1:x2,
            ]

            grid_errors.append(
                patch.mean()
            )

    grid_errors = np.array(
        grid_errors,
        dtype=np.float32,
    )

    # --------------------------------------------------------
    # Reconstruction statistics
    # --------------------------------------------------------

    mean_err = err_map.mean()
    max_err = err_map.max()
    std_err = err_map.std()

    p90 = np.percentile(
        err_map,
        90,
    )

    p99 = np.percentile(
        err_map,
        99,
    )

    pct_anomalous = np.mean(
        err_map >
        (mean_err + 2 * std_err)
    )

    # --------------------------------------------------------
    # Gradient errors
    # --------------------------------------------------------

    gray_input = (
        0.299 * tensor[:, 0]
        + 0.587 * tensor[:, 1]
        + 0.114 * tensor[:, 2]
    )

    gray_recon = (
        0.299 * reconstruction[:, 0]
        + 0.587 * reconstruction[:, 1]
        + 0.114 * reconstruction[:, 2]
    )

    input_dx = (
        gray_input[:, :, 1:]
        - gray_input[:, :, :-1]
    )

    input_dy = (
        gray_input[:, 1:, :]
        - gray_input[:, :-1, :]
    )

    recon_dx = (
        gray_recon[:, :, 1:]
        - gray_recon[:, :, :-1]
    )

    recon_dy = (
        gray_recon[:, 1:, :]
        - gray_recon[:, :-1, :]
    )

    grad_error_x = np.abs(
        input_dx - recon_dx
    )

    grad_error_y = np.abs(
        input_dy - recon_dy
    )

    grad_error = np.concatenate(
        [
            grad_error_x.flatten(),
            grad_error_y.flatten(),
        ]
    )

    mean_grad_err = grad_error.mean()

    max_grad_err = grad_error.max()

    p95_grad_err = np.percentile(
        grad_error,
        95,
    )

    # --------------------------------------------------------
    # Local error statistics
    # --------------------------------------------------------

    local_max_err = grid_errors.max()

    local_std_err = grid_errors.std()

    # --------------------------------------------------------
    # IMPORTANT:
    # Exact same 11-feature ordering as training
    # --------------------------------------------------------

    anomaly_features = np.array(
        [
            mean_err,
            max_err,
            std_err,
            p90,
            p99,
            pct_anomalous,
            mean_grad_err,
            max_grad_err,
            p95_grad_err,
            local_max_err,
            local_std_err,
        ],
        dtype=np.float32,
    )

    return anomaly_features, err_map


# ============================================================
# Normalize engineered features
# ============================================================

def normalize_features(
    classical_features,
    anomaly_features,
):
    """
    Apply the training-set normalization statistics.

    DO NOT calculate mean/std from the uploaded image.
    """

    classical_normalized = (
        classical_features - classical_mean
    ) / classical_std

    anomaly_normalized = (
        anomaly_features - anomaly_mean
    ) / anomaly_std

    return (
        classical_normalized.astype(
            np.float32
        ),
        anomaly_normalized.astype(
            np.float32
        ),
    )


# ============================================================
# Fusion model inference
# ============================================================

def run_fusion_model(
    img_bgr,
    classical_features,
    anomaly_features,
):
    """
    Run fusion_model.onnx.

    Inputs:
        image          -> [1, 3, 224, 224]
        classical     -> [1, 16]
        anomaly       -> [1, 11]

    Outputs:
        issue_logits
        defect_logit
        score_pred
    """

    image_input = preprocess_for_fusion(
        img_bgr
    )

    classical_input = (
        classical_features
        .reshape(1, 16)
        .astype(np.float32)
    )

    anomaly_input = (
        anomaly_features
        .reshape(1, 11)
        .astype(np.float32)
    )

    outputs = fusion_session.run(
        [
            "issue_logits",
            "defect_logit",
            "score_pred",
        ],
        {
            "image": image_input,
            "classical_feats": classical_input,
            "anomaly_feats": anomaly_input,
        },
    )

    return outputs


# ============================================================
# Sigmoid
# ============================================================

def sigmoid(x):
    """
    Numerically stable sigmoid.
    """

    x = np.asarray(
        x,
        dtype=np.float32,
    )

    return 1.0 / (
        1.0 + np.exp(-x)
    )


# ============================================================
# Complete image analysis
# ============================================================

def analyze_image(img_bgr):
    """
    Complete AI image-quality assessment.

    The uploaded image can have ANY original resolution.

    Internally:
        original
          ↓
        400x400 padded image
          ↓
        classical + anomaly features

        400x400 padded image
          ↓
        224x224
          ↓
        fusion model

    Returns a JSON-friendly dictionary.
    """

    if img_bgr is None:
        raise ValueError(
            "Image could not be decoded."
        )

    if len(img_bgr.shape) != 3:
        raise ValueError(
            "Expected a color image."
        )

    # --------------------------------------------------------
    # 1. Match training preprocessing
    # --------------------------------------------------------

    processed_img = resize_with_padding(
        img_bgr,
        BASE_IMAGE_SIZE,
    )

    # --------------------------------------------------------
    # 2. Classical features
    # --------------------------------------------------------

    classical_features = (
        compute_classical_features(
            processed_img
        )
    )

    if classical_features.shape != (16,):
        raise ValueError(
            f"Expected 16 classical features, "
            f"got {classical_features.shape}"
        )

    # --------------------------------------------------------
    # 3. Anomaly features
    # --------------------------------------------------------

    anomaly_features, error_map = (
        extract_anomaly_features(
            processed_img
        )
    )

    if anomaly_features.shape != (11,):
        raise ValueError(
            f"Expected 11 anomaly features, "
            f"got {anomaly_features.shape}"
        )

    # --------------------------------------------------------
    # 4. Normalize features
    # --------------------------------------------------------

    classical_normalized, anomaly_normalized = (
        normalize_features(
            classical_features,
            anomaly_features,
        )
    )

    # --------------------------------------------------------
    # 5. Fusion model
    # --------------------------------------------------------

    (
        issue_logits,
        defect_logit,
        score_pred,
    ) = run_fusion_model(
        processed_img,
        classical_normalized,
        anomaly_normalized,
    )

    # --------------------------------------------------------
    # 6. Convert model outputs
    # --------------------------------------------------------

    issue_logits = np.asarray(
        issue_logits
    ).reshape(-1)

    defect_logit = float(
        np.asarray(defect_logit).reshape(-1)[0]
    )

    score_pred = float(
        np.asarray(score_pred).reshape(-1)[0]
    )

    issue_probs = sigmoid(
        issue_logits
    )

    defect_probability = float(
        sigmoid(defect_logit)
    )

    # Model predicts score in [0, 1].
    quality_score = float(
        np.clip(
            score_pred,
            0.0,
            1.0,
        ) * 100.0
    )

    # --------------------------------------------------------
    # 7. Issue names
    # --------------------------------------------------------

    issue_names = [
        "blur",
        "underexposure",
        "overexposure",
        "noise",
        "corruption",
    ]

    issue_probabilities = {
        name: float(prob)
        for name, prob in zip(
            issue_names,
            issue_probs,
        )
    }

    # --------------------------------------------------------
    # 8. Binary issue decisions
    # --------------------------------------------------------

    detected_issues = [
        name
        for name, prob in issue_probabilities.items()
        if prob > 0.5
    ]

    # --------------------------------------------------------
    # 9. Final result
    # --------------------------------------------------------

    return {
        "quality_score": round(
            quality_score,
            2,
        ),

        "defect_probability": round(
            defect_probability,
            4,
        ),

        "has_defect": (
            defect_probability > 0.5
        ),

        "detected_issues": detected_issues,

        "issue_probabilities": (
            issue_probabilities
        ),

        "classical_features": {
            name: float(value)
            for name, value in zip(
                [
                    "sharpness",
                    "brightness",
                    "contrast",
                    "noise_estimate",
                    "saturation",
                    "edge_density",
                    "entropy",
                    "colorfulness",
                    "pct_shadow_clip_15",
                    "pct_shadow_clip_30",
                    "pct_highlight_clip_240",
                    "pct_highlight_clip_225",
                    "p01",
                    "p05",
                    "p95",
                    "p99",
                ],
                classical_features,
            )
        },

        "anomaly_features": {
            name: float(value)
            for name, value in zip(
                [
                    "mean_err",
                    "max_err",
                    "std_err",
                    "p90_err",
                    "p99_err",
                    "pct_anomalous",
                    "mean_grad_err",
                    "max_grad_err",
                    "p95_grad_err",
                    "local_max_err",
                    "local_std_err",
                ],
                anomaly_features,
            )
        },
    }