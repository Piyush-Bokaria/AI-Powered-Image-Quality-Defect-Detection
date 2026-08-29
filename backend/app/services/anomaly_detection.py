import cv2
import numpy as np
import torch


# ============================================================
# Anomaly Feature Names
# ============================================================

ANOMALY_FEAT_NAMES = [
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
]


# ============================================================
# Extract Anomaly Features
# ============================================================

@torch.no_grad()
def extract_anomaly_feats(model, img_bgr, ae_transform, device):
    """
    Extract anomaly-detection features using the trained
    autoencoder.

    Parameters
    ----------
    model : torch.nn.Module
        Trained autoencoder.

    img_bgr : np.ndarray
        HxWx3 BGR uint8 image.

    ae_transform : torchvision transform
        Transform used during autoencoder training.

    device : torch.device
        Device used for inference.

    Returns
    -------
    tuple
        (
            anomaly_features,
            error_map
        )

    anomaly_features:
        11-dimensional np.float32 vector.

    error_map:
        2D NumPy array containing pixel-wise reconstruction error.
    """

    if model is None:
        raise ValueError("Autoencoder model is None")

    if img_bgr is None:
        raise ValueError("Image is None")

    if not isinstance(img_bgr, np.ndarray):
        raise ValueError("Image must be a NumPy array")

    if img_bgr.size == 0:
        raise ValueError("Image is empty")

    # ---------------------------------------------------------
    # Convert BGR → RGB
    # ---------------------------------------------------------

    img_rgb = cv2.cvtColor(
        img_bgr,
        cv2.COLOR_BGR2RGB
    )

    # ---------------------------------------------------------
    # Apply the SAME transform used during training
    # ---------------------------------------------------------

    tensor = ae_transform(
        img_rgb
    ).unsqueeze(0).to(device)

    # ---------------------------------------------------------
    # Autoencoder reconstruction
    # ---------------------------------------------------------

    recon = model(tensor)

    # ---------------------------------------------------------
    # Pixel-wise reconstruction error
    #
    # Average error across RGB channels.
    # ---------------------------------------------------------

    err_map = (
        tensor - recon
    ).pow(2).mean(dim=1).squeeze(0).cpu().numpy()

    # ---------------------------------------------------------
    # 8 × 8 local error grid
    # ---------------------------------------------------------

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
                x1:x2
            ]

            grid_errors.append(
                patch.mean()
            )

    grid_errors = np.array(
        grid_errors,
        dtype=np.float32
    )

    # ---------------------------------------------------------
    # Local anomaly statistics
    # ---------------------------------------------------------

    local_max_err = grid_errors.max()

    local_top3_mean = np.mean(
        np.sort(grid_errors)[-3:]
    )

    local_std_err = grid_errors.std()

    # ---------------------------------------------------------
    # Global reconstruction error
    # ---------------------------------------------------------

    mean_err = err_map.mean()

    max_err = err_map.max()

    std_err = err_map.std()

    p90 = np.percentile(
        err_map,
        90
    )

    p99 = np.percentile(
        err_map,
        99
    )

    # ---------------------------------------------------------
    # Percentage of anomalous pixels
    # ---------------------------------------------------------

    pct_anomalous = np.mean(
        err_map > (
            mean_err +
            2 * std_err
        )
    )

    # ---------------------------------------------------------
    # Convert reconstructed/input images to grayscale
    # ---------------------------------------------------------

    gray_input = (
        0.299 * tensor[:, 0]
        +
        0.587 * tensor[:, 1]
        +
        0.114 * tensor[:, 2]
    ).unsqueeze(1)

    gray_recon = (
        0.299 * recon[:, 0]
        +
        0.587 * recon[:, 1]
        +
        0.114 * recon[:, 2]
    ).unsqueeze(1)

    # ---------------------------------------------------------
    # Image gradients
    # ---------------------------------------------------------

    input_dx = (
        gray_input[:, :, :, 1:]
        -
        gray_input[:, :, :, :-1]
    )

    input_dy = (
        gray_input[:, :, 1:, :]
        -
        gray_input[:, :, :-1, :]
    )

    recon_dx = (
        gray_recon[:, :, :, 1:]
        -
        gray_recon[:, :, :, :-1]
    )

    recon_dy = (
        gray_recon[:, :, 1:, :]
        -
        gray_recon[:, :, :-1, :]
    )

    # ---------------------------------------------------------
    # Gradient reconstruction errors
    # ---------------------------------------------------------

    grad_error_x = torch.abs(
        input_dx - recon_dx
    )

    grad_error_y = torch.abs(
        input_dy - recon_dy
    )

    grad_error = torch.cat(
        [
            grad_error_x.flatten(),
            grad_error_y.flatten()
        ]
    )

    # ---------------------------------------------------------
    # Gradient statistics
    # ---------------------------------------------------------

    mean_grad_err = (
        grad_error.mean().item()
    )

    max_grad_err = (
        grad_error.max().item()
    )

    p95_grad_err = torch.quantile(
        grad_error,
        0.95
    ).item()

    # ---------------------------------------------------------
    # Input edge strength
    #
    # Slice to common dimensions (H-1, W-1)
    # ---------------------------------------------------------

    input_edges = torch.sqrt(
        input_dx[:, :, :-1, :].pow(2)
        +
        input_dy[:, :, :, :-1].pow(2)
        +
        1e-8
    )

    mean_edge_strength = (
        input_edges.mean().item()
    )

    # ---------------------------------------------------------
    # Final 11-dimensional anomaly feature vector
    # ---------------------------------------------------------

    features = np.array(
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
        dtype=np.float32
    )

    return features, err_map