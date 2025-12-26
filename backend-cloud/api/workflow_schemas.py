"""Updated API schemas for multi-step workflow."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Literal
from datetime import datetime


class SessionStartRequest(BaseModel):
    consent: bool = Field(description="User consent to save data")


class SessionStartResponse(BaseModel):
    session_id: str
    message: str
    expires_in_minutes: int = 60


class DemographicsRequest(BaseModel):
    age: int = Field(gt=0, lt=150)
    weight_kg: float = Field(gt=0)
    height_cm: float = Field(gt=0)
    gender: Literal["male", "female", "other", "prefer_not_say"]



class FingerprintRequest(BaseModel):
    finger_name: Literal[
        "right_thumb", "right_index", "right_middle", "right_ring", "right_pinky",
        "left_thumb", "left_index", "left_middle", "left_ring", "left_pinky"
    ]
    image: str = Field(description="Base64 encoded fingerprint image")


class FingerprintResponse(BaseModel):
    finger_name: str
    received: bool
    total_collected: int
    remaining: int


class AnalysisResponse(BaseModel):
    session_id: str
    diabetes_risk: float
    risk_level: str
    blood_group: str
    blood_group_confidence: float
    pattern_counts: Dict[str, int]
    bmi: float
    explanation: str
    nearby_facilities: list = []
    blood_centers: list = []  # Only if willing_to_donate = true



class ResultsResponse(BaseModel):
    session_id: str
    diabetes_risk: float
    risk_level: str
    blood_group: Optional[str]
    explanation: str
    bmi: float
    saved_to_database: bool
    record_id: Optional[str]
    # Demographics
    age: Optional[int]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    gender: Optional[str]
    # Pattern counts
    pattern_counts: Optional[Dict[str, int]]
