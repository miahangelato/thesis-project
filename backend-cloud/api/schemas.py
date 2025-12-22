"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime


class PatternData(BaseModel):
    arc: int = Field(ge=0, le=10)
    whorl: int = Field(ge=0, le=10)
    loop: int = Field(ge=0, le=10)


class DiagnoseRequest(BaseModel):
    age: int = Field(gt=0, lt=150)
    weight_kg: float = Field(gt=0)
    height_cm: float = Field(gt=0)
    fingerprint_patterns: PatternData
    
    class Config:
        json_schema_extra = {
            "example": {
                "age": 45,
                "weight_kg": 75.5,
                "height_cm": 170,
                "fingerprint_patterns": {
                    "arc": 2,
                    "whorl": 5,
                    "loop": 3
                }
            }
        }


class DiagnoseResponse(BaseModel):
    record_id: str
    risk_score: float
    risk_level: str
    bmi: float
    message: str


class HealthCheckResponse(BaseModel):
    status: str
    database_connected: bool
    timestamp: datetime


class AnalyzeRequest(BaseModel):
    """Request schema for full patient analysis."""
    # Demographics
    age: int = Field(gt=0, lt=150)
    weight_kg: float = Field(gt=0)
    height_cm: float = Field(gt=0)
    gender: str = Field(pattern="^(male|female|Male|Female)$")
    blood_type: Optional[str] = None
    
    # Consent and donation
    consent: bool
    willing_to_donate: bool = False
    
    # Fingerprint images (base64 encoded PNG/JPEG)
    fingerprint_images: list[str] = Field(min_length=1, max_length=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "age": 45,
                "weight_kg": 75.5,
                "height_cm": 170,
                "gender": "male",
                "blood_type": "O+",
                "consent": True,
                "willing_to_donate": True,
                "fingerprint_images": ["base64_encoded_image_1", "base64_encoded_image_2"]
            }
        }


class AnalyzeResponse(BaseModel):
    """Response schema for patient analysis."""
    success: bool
    record_id: Optional[str] = None
    
    # Diabetes prediction
    diabetes_risk_score: float
    diabetes_risk_level: str
    diabetes_confidence: float
    pattern_counts: Dict[str, int]
    bmi: float
    
    # Blood group prediction
    predicted_blood_group: str
    blood_group_confidence: float
    
    # AI-generated explanation
    explanation: str
    
    # Metadata
    saved: bool
    timestamp: datetime
