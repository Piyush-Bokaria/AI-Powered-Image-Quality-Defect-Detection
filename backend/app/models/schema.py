from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.core.database import Base


class Schema(Base):
    __tablename__ = "analyses"

    # ---------------------------------------------------------
    # Primary key
    # ---------------------------------------------------------
    id = Column(Integer, primary_key=True, index=True)

    # ---------------------------------------------------------
    # Image information
    # ---------------------------------------------------------
    filename = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=True)

    # ---------------------------------------------------------
    # Overall quality assessment
    # ---------------------------------------------------------
    quality_score = Column(Float, nullable=False)
    quality_label = Column(String(50), nullable=False)

    # ---------------------------------------------------------
    # Detected issues
    #
    # Example:
    # [
    #     {
    #         "type": "blur",
    #         "severity": "high",
    #         "confidence": 0.91
    #     }
    # ]
    # ---------------------------------------------------------
    issues = Column(JSON, nullable=False, default=list)

    # ---------------------------------------------------------
    # Image statistics
    #
    # Example:
    # {
    #     "brightness": 128.4,
    #     "contrast": 42.7,
    #     "sharpness": 183.2,
    #     "noise": 0.08
    # }
    # ---------------------------------------------------------
    statistics = Column(JSON, nullable=True)

    img_url = Column(String(500), nullable=True)

    # ---------------------------------------------------------
    # Timestamp
    # ---------------------------------------------------------
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )