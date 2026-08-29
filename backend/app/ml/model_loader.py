from pathlib import Path

import numpy as np
import onnxruntime as ort


# ============================================================
# Paths
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODEL_DIR = BASE_DIR / "models"

AUTOENCODER_PATH = MODEL_DIR / "autoencoder.onnx"
FUSION_MODEL_PATH = MODEL_DIR / "fusion_model.onnx"
NORM_STATS_PATH = MODEL_DIR / "norm_stats.npz"


# ============================================================
# Check model files
# ============================================================

def check_model_files():
    """
    Verify that all required model files exist.
    """

    required_files = [
        AUTOENCODER_PATH,
        FUSION_MODEL_PATH,
        NORM_STATS_PATH,
    ]

    missing_files = [
        str(path)
        for path in required_files
        if not path.exists()
    ]

    if missing_files:
        raise FileNotFoundError(
            "Missing model files:\n"
            + "\n".join(missing_files)
        )


# ============================================================
# ONNX Runtime Providers
# ============================================================

def get_providers():
    """
    Select the best available ONNX Runtime execution provider.
    """

    available = ort.get_available_providers()

    if "CUDAExecutionProvider" in available:
        return [
            "CUDAExecutionProvider",
            "CPUExecutionProvider",
        ]

    return [
        "CPUExecutionProvider"
    ]


# ============================================================
# Load Models
# ============================================================

def load_models():
    """
    Load the autoencoder and fusion model using ONNX Runtime.
    """

    check_model_files()

    providers = get_providers()

    autoencoder_session = ort.InferenceSession(
        str(AUTOENCODER_PATH),
        providers=providers,
    )

    fusion_session = ort.InferenceSession(
        str(FUSION_MODEL_PATH),
        providers=providers,
    )

    return (
        autoencoder_session,
        fusion_session,
    )


# ============================================================
# Load Normalization Statistics
# ============================================================

def load_normalization_stats():
    """
    Load train-set normalization statistics.

    These statistics MUST NOT be recalculated on the
    uploaded image.
    """

    check_model_files()

    stats = np.load(
        str(NORM_STATS_PATH)
    )

    classical_mean = stats["classical_mean"].astype(
        np.float32
    )

    classical_std = stats["classical_std"].astype(
        np.float32
    )

    anomaly_mean = stats["anomaly_mean"].astype(
        np.float32
    )

    anomaly_std = stats["anomaly_std"].astype(
        np.float32
    )

    return (
        classical_mean,
        classical_std,
        anomaly_mean,
        anomaly_std,
    )


# ============================================================
# Initialize model sessions
# ============================================================

(
    autoencoder_session,
    fusion_session,
) = load_models()


# ============================================================
# Initialize normalization statistics
# ============================================================

(
    classical_mean,
    classical_std,
    anomaly_mean,
    anomaly_std,
) = load_normalization_stats()