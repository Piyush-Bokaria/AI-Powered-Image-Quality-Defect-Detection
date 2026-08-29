from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class Issue(BaseModel):
    """
    Represents a detected image-quality issue.
    """

    type: str = Field(
        ...,
        description="Type of detected issue, e.g. blur, noise, underexposure"
    )

    severity: str = Field(
        ...,
        description="Issue severity: low, medium, or high"
    )

    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence between 0 and 1"
    )


class ImageStatistics(BaseModel):
    """
    Image-level statistics produced by the CV pipeline.
    """

    brightness: Optional[float] = None
    contrast: Optional[float] = None
    sharpness: Optional[float] = None
    noise: Optional[float] = None
    saturation: Optional[float] = None


class AnalysisResponse(BaseModel):
    """
    Response returned after analyzing an image.
    """

    id: int

    filename: str

    quality_score: float = Field(
        ...,
        ge=0.0,
        le=100.0
    )

    quality_label: str

    issues: List[Issue]

    statistics: Optional[ImageStatistics] = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )