import cv2
import numpy as np


# ============================================================
# Classical Image Quality Features
# ============================================================

def compute_classical_features(img_bgr):
    """
    img_bgr: HxWx3 uint8 BGR image.

    Returns:
        16-dimensional np.float32 feature vector.
    """

    if img_bgr is None:
        raise ValueError("Image is None")

    if not isinstance(img_bgr, np.ndarray):
        raise ValueError("Image must be a NumPy array")

    if img_bgr.size == 0:
        raise ValueError("Image is empty")

    if len(img_bgr.shape) != 3 or img_bgr.shape[2] != 3:
        raise ValueError("Expected a BGR image with 3 channels")

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    # --------------------------------------------------------
    # 1. Sharpness — variance of Laplacian
    # --------------------------------------------------------
    sharpness = cv2.Laplacian(
        gray,
        cv2.CV_64F
    ).var()

    # --------------------------------------------------------
    # 2. Brightness — mean pixel intensity
    # --------------------------------------------------------
    brightness = gray.mean()

    # --------------------------------------------------------
    # 3. Contrast — standard deviation of intensity
    # --------------------------------------------------------
    contrast = gray.std()

    # --------------------------------------------------------
    # 4. Noise estimate
    #    High-frequency residual after median blur
    # --------------------------------------------------------
    median = cv2.medianBlur(gray, 3)

    noise_estimate = np.mean(
        np.abs(
            gray.astype(np.float32)
            -
            median.astype(np.float32)
        )
    )

    # --------------------------------------------------------
    # 5. Saturation — mean HSV saturation
    # --------------------------------------------------------
    saturation = hsv[:, :, 1].mean()

    # --------------------------------------------------------
    # 6. Edge density — fraction of Canny edge pixels
    # --------------------------------------------------------
    edges = cv2.Canny(
        gray,
        100,
        200
    )

    edge_density = np.mean(
        edges > 0
    )

    # --------------------------------------------------------
    # 7. Entropy — histogram based
    # --------------------------------------------------------
    hist = cv2.calcHist(
        [gray],
        [0],
        None,
        [256],
        [0, 256]
    ).flatten()

    hist = hist / (
        hist.sum() + 1e-8
    )

    entropy = -np.sum(
        hist * np.log2(hist + 1e-8)
    )

    # --------------------------------------------------------
    # 8. Colorfulness — Hasler-Süsstrunk metric
    # --------------------------------------------------------
    b, g, r = cv2.split(
        img_bgr.astype(np.float32)
    )

    rg = r - g

    yb = 0.5 * (r + g) - b

    colorfulness = (
        np.sqrt(
            rg.std() ** 2 +
            yb.std() ** 2
        )
        +
        0.3 * np.sqrt(
            rg.mean() ** 2 +
            yb.mean() ** 2
        )
    )

    # --------------------------------------------------------
    # 9-12. Shadow / Highlight clipping
    # --------------------------------------------------------
    pct_shadow_clip_15 = np.mean(
        gray < 15
    )

    pct_shadow_clip_30 = np.mean(
        gray < 30
    )

    pct_highlight_clip_240 = np.mean(
        gray > 240
    )

    pct_highlight_clip_225 = np.mean(
        gray > 225
    )

    # --------------------------------------------------------
    # 13-16. Histogram percentiles
    # --------------------------------------------------------
    p01 = np.percentile(
        gray,
        1
    )

    p05 = np.percentile(
        gray,
        5
    )

    p95 = np.percentile(
        gray,
        95
    )

    p99 = np.percentile(
        gray,
        99
    )

    # --------------------------------------------------------
    # Final 16-dimensional feature vector
    # --------------------------------------------------------
    feats = np.array(
        [
            sharpness,
            brightness,
            contrast,
            noise_estimate,
            saturation,
            edge_density,
            entropy,
            colorfulness,
            pct_shadow_clip_15,
            pct_shadow_clip_30,
            pct_highlight_clip_240,
            pct_highlight_clip_225,
            p01,
            p05,
            p95,
            p99,
        ],
        dtype=np.float32
    )

    return feats


# ============================================================
# Feature Names
# ============================================================

CLASSICAL_FEAT_NAMES = [
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
]


# ============================================================
# Resize with Padding
# ============================================================

def resize_with_padding(img, target_size):
    """
    Resize an image while preserving its aspect ratio.

    The remaining area is padded with black pixels.

    Parameters
    ----------
    img : np.ndarray
        Input BGR image.

    target_size : int
        Target height and width.

    Returns
    -------
    np.ndarray
        Resized and padded image.
    """

    if img is None:
        raise ValueError("Image is None")

    h, w = img.shape[:2]

    if h <= 0 or w <= 0:
        raise ValueError("Invalid image dimensions")

    scale = target_size / max(h, w)

    new_h = int(h * scale)
    new_w = int(w * scale)

    resized = cv2.resize(
        img,
        (new_w, new_h)
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
        value=[0, 0, 0]
    )

    return padded