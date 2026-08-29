import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schema import Schema
from app.services.inference import analyze_image
from app.services.s3 import s3_service


router = APIRouter(
    prefix="/api",
    tags=["Image Analysis"],
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


def get_quality_label(score):
    """
    Convert the model's 0-100 quality score into a human-readable
    quality label.

    These thresholds are application-level presentation rules,
    not outputs directly learned by the model.
    """

    if score >= 80:
        return "ACCEPTABLE"

    if score >= 50:
        return "DEGRADED"

    return "POTENTIALLY_DEFECTIVE"

def get_issue_severity(confidence):
    """
    Convert issue probability into a simple severity level.

    The model outputs confidence/probability. Severity is an
    application-level interpretation of that probability.
    """

    if confidence >= 0.80:
        return "high"

    if confidence >= 0.50:
        return "medium"

    return "low"

def build_issues(issue_probabilities, defect_probability):
    issues = []

    for issue_type, confidence in issue_probabilities.items():

        if confidence >= 0.50:

            issues.append(
                {
                    "type": issue_type,
                    "severity": get_issue_severity(confidence),
                    "confidence": round(float(confidence), 4),
                }
            )

    if defect_probability >= 0.50:
        issues.append(
            {
                "type": "potential_visual_defect",
                "severity": get_issue_severity(defect_probability),
                "confidence": round(float(defect_probability), 4),
            }
        )

    return issues


# ============================================================
# POST /api/analyze
# ============================================================

@router.post("/analyze")
async def analyze_uploaded_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload an image, store it in S3, analyze it using the
    ONNX models, and persist the analysis in PostgreSQL.
    """

    # 1. Validate content type
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Could not determine file type.",
        )

    if file.content_type not in ALLOWED_IMAGE_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Please upload a JPEG, PNG, WEBP, BMP, "
                "or TIFF image."
            ),
        )

    # 2. Read uploaded file
    try:
        contents = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read uploaded file.",
        ) from exc

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # 3. Upload original image to S3
    s3_key = await s3_service.upload_image(
        file_bytes=contents,
        filename=file.filename or "image",
        content_type=file.content_type,
    )

    if not s3_key:

        raise HTTPException(
            status_code=500,
            detail="Could not upload image to S3.",
        )

    # 4. Decode image
    try:
        image_array = np.frombuffer(contents, dtype=np.uint8)
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    except Exception as exc:
        s3_service.delete_image(s3_key)

        raise HTTPException(
            status_code=400,
            detail="Could not decode image.",
        ) from exc

    if img is None:
        s3_service.delete_image(s3_key)

        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image.",
        )

    # 5. Get original image dimensions
    image_height = int(img.shape[0])
    image_width = int(img.shape[1])

    # 6. Run AI inference
    try:
        result = analyze_image(img)
    except ValueError as exc:
        s3_service.delete_image(s3_key)

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        s3_service.delete_image(s3_key)

        raise HTTPException(
            status_code=500,
            detail="Image analysis failed.",
        ) from exc

    # 7. Extract model results
    quality_score = float(result["quality_score"])
    defect_probability = float(result["defect_probability"])
    issue_probabilities = result["issue_probabilities"]

    # 8. Generate quality label
    quality_label = get_quality_label(quality_score)

    # 8. Build structured issue list

    issues = build_issues(issue_probabilities, defect_probability)

    # 9. Build statistics

    statistics = {
        "image_width": image_width,
        "image_height": image_height,

        "classical_features": (
            result["classical_features"]
        ),

        "anomaly_features": (
            result["anomaly_features"]
        ),

        "defect_probability": (
            defect_probability
        ),
    }

    # 10. Save analysis to PostgreSQL

    schema = Schema(
        filename=file.filename or "unknown",
        image_path=None,
        quality_score=quality_score,
        quality_label=quality_label,
        issues=issues,
        statistics=statistics,
        img_url=s3_key,
    )

    try:
        db.add(schema)
        db.commit()
        db.refresh(schema)
    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Could not save schema result.",
        ) from exc

    # 11. Generate presigned URL for display
    display_url = s3_service.generate_presigned_url(s3_key)

    # 12. Return response
    return {
        "id": schema.id,
        "filename": file.filename,
        "content_type": file.content_type,
        "image_width": image_width,
        "image_height": image_height,
        "quality_score": round(quality_score,2),
        "quality_label": quality_label,
        "issues": issues,
        "statistics": statistics,
        "img_url": display_url,
        "created_at": schema.created_at,
    }


# ============================================================
# GET /api/history
# ============================================================
@router.get("/history")
async def get_history(db:Session = Depends(get_db)):
    """
    Retrieve all past analyses.
    """
    try:
        schemas = db.query(Schema).order_by(Schema.created_at.desc()).all()
        
        result = []
        for schema in schemas:
            display_url = s3_service.generate_presigned_url(schema.img_url) if schema.img_url else None
            result.append({
                "id": schema.id,
                "filename": schema.filename,
                "quality_score": round(float(schema.quality_score),2),
                "quality_label": schema.quality_label,
                "img_url": display_url,
                "created_at": schema.created_at,
            })
            
        return {
            "data": result,
            "total": len(result),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve analysis history.",
        ) from exc

@router.get("/analysis/{id}")
async def get_individual_data(id: int, dbSession = Depends(get_db)):
    """
    Retrieve individual history data
    """
    try:
        schema = dbSession.query(Schema).filter(Schema.id == id).first()
        if not schema:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found.",
            )
        display_url = s3_service.generate_presigned_url(schema.img_url) if schema.img_url else None
        return {
            "id": schema.id,
            "filename": schema.filename,
            "quality_score": round(float(schema.quality_score),2),
            "quality_label": schema.quality_label,
            "issues": schema.issues,
            "statistics": schema.statistics,
            "img_url": display_url,
            "image_url": display_url,
            "created_at": schema.created_at,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve analysis history.",
        ) from exc