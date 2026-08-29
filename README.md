# AI-Powered-Image-Quality-Defect-Detection

An end-to-end AI-powered system for automatically detecting common image-quality defects and estimating the overall quality of an image using a multimodal machine-learning pipeline.

The system combines **deep visual features**, **classical computer-vision features**, and **autoencoder-based anomaly features** to produce defect probabilities and an overall image-quality score.

## 🚀 Live Demo

**Deployed Application:**
https://ai-powered-image-quality-defect-8ebf.onrender.com/

---

## 📌 Overview

Image-quality problems such as blur, incorrect exposure, excessive noise, and image corruption can significantly affect the usability of digital images.

This project addresses the problem by building an automated image-quality analysis pipeline that:

* Accepts an uploaded image.
* Extracts visual information using a CNN-based image branch.
* Computes handcrafted classical computer-vision features.
* Uses an autoencoder to capture reconstruction-based anomaly information.
* Combines all three sources using a fusion model.
* Predicts multiple image-quality issues.
* Estimates an overall quality score between 0 and 100.
* Stores analysis results for later inspection.

The system is deployed as a full-stack application with a React frontend and FastAPI backend.

---

## ✨ Key Features

* 🖼️ Image upload and analysis
* 🔍 Multi-defect detection
* 🤖 CNN-based visual feature extraction
* 📐 Classical computer-vision feature extraction
* 🧠 Autoencoder-based anomaly detection
* 🔀 Multimodal feature fusion
* 📊 Individual defect probabilities
* ⭐ Overall image-quality score
* 🗄️ Analysis history
* ☁️ Cloud image storage
* ⚡ ONNX Runtime inference
* 🐳 Docker support
* 🌐 Production deployment

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      User Image      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Image Preprocessing  │
                         │ Resize / Normalize   │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
          │ Image Branch │  │ Classical CV  │  │ Autoencoder  │
          │    CNN       │  │   Features    │  │    Branch    │
          └──────┬───────┘  └───────┬───────┘  └──────┬───────┘
                 │                  │                 │
                 │                  │          Reconstruction
                 │                  │              Error
                 │                  │                 │
                 │                  │                 ▼
                 │                  │        ┌────────────────┐
                 │                  │        │ 6 Anomaly      │
                 │                  │        │ Features       │
                 │                  │        └───────┬────────┘
                 │                  │                │
                 │          16 Classical Features    │
                 │                  │                │
                 └──────────────────┼────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  Fusion Model    │
                           └────────┬─────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          Issue Predictions   Defect Probability   Quality Score
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Result Processing    │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
              PostgreSQL Database             S3 Storage
                     │
                     ▼
              React Frontend
```

---

# 🧠 Machine Learning Pipeline

The model uses three complementary sources of information.

## 1. Image-Based Feature Learning

The input image is processed by a CNN-based image branch.

The image branch learns visual representations directly from the image and captures patterns associated with image-quality degradation.

The production fusion model receives an image tensor with the following shape:

```text
[1, 3, 224, 224]
```

---

## 2. Classical Computer-Vision Features

Handcrafted image-quality features provide explicit information about characteristics such as sharpness, exposure, contrast, noise, and other image statistics.

The final pipeline uses:

```text
16 classical features
```

These features complement the learned CNN representation by providing interpretable numerical measurements of image characteristics.

Before being supplied to the fusion model, these features are normalized using statistics calculated from the training data.

The normalization statistics are stored in:

```text
backend/models/norm_stats.npz
```

This ensures that the same feature scaling procedure is used during training and production inference.

---

# 🔬 Autoencoder-Based Anomaly Detection

A separate convolutional autoencoder is trained to reconstruct images.

The intuition is:

```text
Input Image
     │
     ▼
 Encoder
     │
     ▼
 Latent Representation
     │
     ▼
 Decoder
     │
     ▼
Reconstructed Image
```

The difference between the original image and reconstructed image produces a **reconstruction-error map**.

Images containing unusual distortions or quality problems can produce different reconstruction-error patterns compared with normal images.

Instead of using only a single reconstruction-error value, the system summarizes the reconstruction-error map using six statistical features.

### Anomaly Features

The final anomaly feature vector contains:

1. `mean_err`
2. `max_err`
3. `std_err`
4. `p90_err`
5. `p99_err`
6. `pct_anomalous`

Therefore:

```text
Anomaly feature vector = 6 features
```

These features are also normalized using training-set statistics before being passed to the fusion model.

---

# 🔀 Multimodal Fusion Model

The final model combines:

```text
Image Features
      +
16 Classical CV Features
      +
6 Anomaly Features
      ↓
Fusion Model
```

This allows the model to use both learned and explicitly engineered information.

The production model accepts three inputs:

```text
image
classical_feats
anomaly_feats
```

with shapes:

```text
image           → [1, 3, 224, 224]
classical_feats → [1, 16]
anomaly_feats   → [1, 6]
```

---

# 🎯 Model Outputs

The fusion model produces three categories of outputs.

## Issue Predictions

The model predicts probabilities for the supported image-quality issues:

| Issue         | Description                                              |
| ------------- | -------------------------------------------------------- |
| Blur          | Loss of image sharpness                                  |
| Underexposure | Image is excessively dark                                |
| Overexposure  | Image contains excessive brightness                      |
| Noise         | Excessive unwanted pixel-level variation                 |
| Corruption    | Digital/image data corruption or severe visual artifacts |

The model produces logits for these issue predictions, which are converted to probabilities during inference.

---

## Defect Probability

A separate output estimates the probability that the image contains a quality defect.

```text
Defect probability ∈ [0, 1]
```

This provides an overall defect-oriented prediction in addition to the individual issue probabilities.

---

## Image Quality Score

The model also predicts a continuous image-quality score.

The production application converts this prediction into a user-facing score between:

```text
0 – 100
```

Higher scores represent better estimated image quality.

---

# 📊 Quality Classification

The application maps the quality score into three user-facing categories:

| Quality Score | Classification          |
| ------------: | ----------------------- |
|      80 – 100 | `ACCEPTABLE`            |
|    50 – 79.99 | `DEGRADED`              |
|          < 50 | `POTENTIALLY_DEFECTIVE` |

These thresholds are application-level interpretation rules applied to the predicted quality score.

---

# 🏋️ Model Training Strategy

The training process is divided into separate stages.

## Stage 1 — Autoencoder Training

The autoencoder is trained independently to learn image reconstruction.

After training, the best-performing autoencoder is loaded and used to generate reconstruction-error-based anomaly features.

The autoencoder is then kept frozen while the fusion model is trained.

---

## Stage 2 — Fusion Model Training

The fusion model is trained using:

* Image input
* Classical feature vector
* Anomaly feature vector
* Multi-output prediction targets

Training uses a two-phase approach.

### Phase 2A — Head Warm-up

Initially, the model focuses on training the fusion/output components while limiting changes to the image backbone.

This allows the prediction heads to adapt to the combined feature representation.

### Phase 2B — Backbone Fine-tuning

After the warm-up stage, selected deeper layers of the image backbone are unfrozen.

The backbone is then fine-tuned using a smaller learning rate.

This allows the visual representation to adapt to the image-quality detection task while reducing the risk of destroying useful pretrained representations.

---

# 📈 Anomaly Detection Evaluation

The autoencoder-based anomaly representation was evaluated independently to determine whether reconstruction-error statistics could distinguish clean and defective images.

One evaluation produced a reconstruction-error ROC-AUC of approximately:

```text
ROC-AUC = 0.644
```

The measured mean reconstruction error was approximately:

```text
Clean images  → 0.00305
Defect images → 0.00477
```

This indicates that the anomaly branch provides useful additional information, while also showing why reconstruction error alone is not used as the final defect detector.

Instead, anomaly features are combined with learned image features and classical computer-vision features through the fusion model.

---

# 📦 Model Export & Production Inference

For deployment, the trained models are exported to **ONNX**.

The production backend uses **ONNX Runtime** for inference rather than requiring the complete training environment.

The deployed model files include:

```text
backend/models/
├── autoencoder.onnx
├── autoencoder.onnx.data
├── fusion_model.onnx
├── fusion_model.onnx.data
└── norm_stats.npz
```

This provides a lightweight inference pipeline suitable for deployment.

The inference backend can use CUDA when available and otherwise falls back to CPU execution.

---

# ⚙️ Backend

The backend is built using **FastAPI**.

### Main responsibilities

* Image upload handling
* Input validation
* Image decoding
* Image preprocessing
* Classical feature extraction
* Autoencoder inference
* Anomaly feature extraction
* Feature normalization
* Fusion-model inference
* Quality-score calculation
* Result persistence
* Image storage
* API responses

### Main Analysis Endpoint

```http
POST /api/analyze
```

The endpoint accepts an image upload and returns the corresponding quality-analysis results.

---

# 🎨 Frontend

The frontend is built using:

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* Recharts

The frontend provides an interactive interface for:

* Uploading images
* Starting analysis
* Displaying quality scores
* Displaying detected issues
* Visualizing prediction probabilities
* Viewing analysis history
* Inspecting individual analysis results

---

# 🗄️ Data Storage

The application uses two different storage mechanisms.

### PostgreSQL

Used for persistent application data such as:

* Analysis records
* Prediction results
* Quality scores
* Defect information
* Analysis history

### Amazon S3

Used for storing uploaded/original images.

This separation allows the database to store structured metadata while object storage handles image files.

---

# 🔌 API

The backend exposes API routes under:

```text
/api
```

Important endpoints include:

```text
GET  /
GET  /api/health
POST /api/analyze
GET  /api/history
GET  /api/analysis/{id}
```

The exact available routes can be inspected through the FastAPI application.

FastAPI also provides interactive API documentation when running the backend.

---

# 📁 Project Structure

```text
AI-Powered-Image-Quality-Defect-Detection/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── ml/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── server.py
│   │
│   ├── models/
│   │   ├── autoencoder.onnx
│   │   ├── autoencoder.onnx.data
│   │   ├── fusion_model.onnx
│   │   ├── fusion_model.onnx.data
│   │   └── norm_stats.npz
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── notebooks/
│   └── ...
│
├── docker-compose.yml
├── README.md
└── ...
```

---

# 🚀 Running Locally

## Prerequisites

Make sure the following are installed:

* Python 3.x
* Node.js
* npm
* PostgreSQL
* Git
* Docker (optional)

---

## Clone the Repository

```bash
git clone https://github.com/Piyush-Bokaria/AI-Powered-Image-Quality-Defect-Detection.git

cd AI-Powered-Image-Quality-Defect-Detection
```

---

# 🐍 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables.

Example:

```env
DATABASE_URL=your_database_url

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET=your_bucket

FRONTEND_URI=http://localhost:5173
```

Start the backend:

```bash
uvicorn app.server:app --reload
```

The backend will be available at:

```text
http://localhost:8000
```

---

# 💻 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create/configure the frontend environment variables as required by the application.

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🐳 Docker

The project also includes Docker configuration for running the application using containers.

From the project root:

```bash
docker compose up --build
```

This allows the frontend and backend services to be built and started using the project's container configuration.

---

# 🌐 Deployment

The application is deployed as a production web application.

### Production frontend

The React frontend communicates with the deployed backend/API.

### Production backend

The FastAPI backend performs ONNX inference and communicates with:

* PostgreSQL
* Amazon S3

### Live Application

https://ai-powered-image-quality-defect-8ebf.onrender.com/

---

# 🔐 Environment Variables

Sensitive credentials are kept outside the source code through environment variables.

Typical configuration includes:

```env
DATABASE_URL=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=

FRONTEND_URI=
```

**Never commit production credentials, AWS keys, database passwords, or other secrets to Git.**

---

# 🔄 End-to-End Inference Flow

When a user uploads an image:

```text
1. User uploads image
          ↓
2. FastAPI receives image
          ↓
3. Image is validated and decoded
          ↓
4. Image is preprocessed
          ↓
5. Classical CV features are extracted
          ↓
6. Autoencoder reconstructs the image
          ↓
7. Reconstruction-error map is calculated
          ↓
8. Six anomaly features are extracted
          ↓
9. Classical + anomaly features are normalized
          ↓
10. Image + 16 classical + 6 anomaly features
          ↓
11. Fusion model performs inference
          ↓
12. Issue probabilities are calculated
          ↓
13. Defect probability is calculated
          ↓
14. Quality score is calculated
          ↓
15. Quality category is assigned
          ↓
16. Results are stored
          ↓
17. Results are returned to frontend
          ↓
18. User views analysis
```

---

# 🧪 Example Analysis

A typical analysis provides information such as:

```json
{
  "quality_score": 82.4,
  "quality_label": "ACCEPTABLE",
  "defect_probability": 0.18,
  "issues": {
    "blur": 0.12,
    "underexposure": 0.04,
    "overexposure": 0.08,
    "noise": 0.21,
    "corruption": 0.06
  }
}
```

*The values above are illustrative and do not represent a specific model prediction.*

---

# ⚠️ Limitations

The system has several limitations:

* Model performance depends on the diversity and quality of the training data.
* Very unusual distortions may not be detected reliably.
* The autoencoder reconstruction error alone is not sufficient for robust defect classification.
* Predictions are probabilistic and should not be interpreted as absolute guarantees.
* CPU inference can be slower than GPU inference.
* Real-world images may contain combinations of defects that are not equally represented in training data.

---

# 🔮 Future Improvements

Potential improvements include:

* Expanding the training dataset.
* Adding more image-quality defect categories.
* Improving anomaly detection representations.
* Exploring stronger pretrained vision backbones.
* Adding explainability/visual defect localization.
* Generating heatmaps showing regions contributing to quality degradation.
* Improving calibration of defect probabilities.
* Adding automated model monitoring.
* Optimizing ONNX inference further.
* Adding batch image analysis.
* Supporting video/frame-level quality analysis.
* Adding more comprehensive automated testing.

---

# 🛠️ Technology Stack

| Layer            | Technologies                |
| ---------------- | --------------------------- |
| Frontend         | React, TypeScript, Vite     |
| UI               | Tailwind CSS, Framer Motion |
| Visualization    | Recharts                    |
| Backend          | FastAPI, Python             |
| Computer Vision  | OpenCV, NumPy               |
| ML Inference     | ONNX Runtime                |
| ML Training      | PyTorch                     |
| Database         | PostgreSQL                  |
| ORM              | SQLAlchemy                  |
| Object Storage   | Amazon S3                   |
| Deployment       | Render                      |
| Containerization | Docker                      |

---

# 🎯 Project Objective

The primary objective of this project is to demonstrate how multiple sources of image-quality information can be combined into a single production-oriented system.

Instead of relying exclusively on a single CNN classifier, the system combines:

```text
Deep Visual Representation
          +
Classical Computer Vision
          +
Autoencoder-Based Anomaly Information
          ↓
       Fusion Model
          ↓
Image Quality Assessment
```

This design provides a more comprehensive approach to automated image-quality analysis.

---

# 👨‍💻 Author

**Piyush Bokaria**

GitHub:
https://github.com/Piyush-Bokaria

---

# 📄 License

This project is intended for educational, experimental, and portfolio purposes.
