"""Updated API schemas for multi-step workflow."""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class SessionStartRequest(BaseModel):
    consent: bool = Field(description="User consent to save data")


class SessionStartResponse(BaseModel):
    session_id: str
    message: str
    expires_in_minutes: int = 60


class ConsentUpdateRequest(BaseModel):
    consent: bool = Field(description="Updated consent value")


class DemographicsRequest(BaseModel):
    age: int = Field(gt=0, lt=150, description="Age in years")
    weight_kg: float = Field(gt=10, lt=500, description="Weight in kg (10-500)")
    height_cm: float = Field(gt=50, lt=300, description="Height in cm (50-300)")
    gender: Literal["male", "female", "other", "prefer_not_say"]
    willing_to_donate: bool = False
    blood_type: Optional[str] = Field(
        None, 
        max_length=10,
        description="Blood type (A+, B-, etc.) - optional"
    )


class FingerprintRequest(BaseModel):
    finger_name: Literal[
        "right_thumb",
        "right_index",
        "right_middle",
        "right_ring",
        "right_pinky",
        "left_thumb",
        "left_index",
        "left_middle",
        "left_ring",
        "left_pinky",
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
    nearby_facilities: List[Dict[str, Any]] = []
    blood_centers: List[Dict[str, Any]] = []  # Only if willing_to_donate = true
    hospitals_db: List[Dict[str, Any]] = []
    laboratories_db: List[Dict[str, Any]] = []
    diabetes_doctors_db: List[Dict[str, Any]] = []
    willing_to_donate: bool = False


class ResultsResponse(BaseModel):
    session_id: str
    diabetes_risk: float
    risk_level: str
    blood_group: Optional[str]
    blood_group_confidence: Optional[float] = None
    explanation: str
    bmi: float
    saved_to_database: bool
    record_id: Optional[str]
    # QR Code & PDF Download
    qr_code_url: str = Field(description="URL to QR code image for phone download")
    download_url: str = Field(description="Direct PDF download URL")
    # Demographics
    age: Optional[int]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    gender: Optional[str]
    willing_to_donate: Optional[bool] = False
    # Pattern counts
    pattern_counts: Optional[Dict[str, int]]
    # Facilities
    nearby_facilities: List[Dict[str, Any]] = []
    blood_centers: List[Dict[str, Any]] = []
    hospitals_db: List[Dict[str, Any]] = []
    laboratories_db: List[Dict[str, Any]] = []
    diabetes_doctors_db: List[Dict[str, Any]] = []
