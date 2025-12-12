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
