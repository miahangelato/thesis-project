"""Main Django Ninja API router."""

from ninja import NinjaAPI
from datetime import datetime
from .schemas import DiagnoseRequest, DiagnoseResponse, HealthCheckResponse
from .gemini_service import get_gemini_service
from .workflow_api import router as workflow_router
from storage import get_storage

api = NinjaAPI(
    title="Diabetes Risk Prediction API",
    version="1.0.0",
    description="Cloud-hybrid IoT system for diabetes risk assessment"
)

api.add_router("/session", workflow_router)

@api.post("/diagnose", response=DiagnoseResponse, tags=["Prediction"])
def diagnose_patient(request, data: DiagnoseRequest):
    """Process patient data and return diabetes risk assessment."""
    
    height_m = data.height_cm / 100
    bmi = round(data.weight_kg / (height_m ** 2), 2)
    
    # TODO: Replace with actual ML model inference
    risk_score = 0.65
    risk_level = "Moderate" if risk_score > 0.5 else "Low"
    
    patient_record = {
        "age": data.age,
        "weight_kg": data.weight_kg,
        "height_cm": data.height_cm,
        "bmi": bmi,
        "pattern_arc": data.fingerprint_patterns.arc,
        "pattern_whorl": data.fingerprint_patterns.whorl,
        "pattern_loop": data.fingerprint_patterns.loop,
        "risk_score": risk_score,
        "risk_level": risk_level
    }
    
    storage = get_storage()
    record_id = storage.save_patient_record(patient_record)
    
    gemini = get_gemini_service()
    explanation = gemini.generate_risk_explanation(patient_record)
    
    return {
        "record_id": record_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "bmi": bmi,
        "message": explanation
    }


@api.get("/health", response=HealthCheckResponse, tags=["System"])
def health_check(request):
    """Check API and database health."""
    storage = get_storage()
    db_connected = storage.health_check()
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database_connected": db_connected,
        "timestamp": datetime.utcnow()
    }


@api.get("/records/{record_id}", tags=["Records"])
def get_record(request, record_id: str):
    """Retrieve a specific patient record."""
    storage = get_storage()
    record = storage.get_patient_record(record_id)
    
    if not record:
        return api.create_response(request, {"error": "Record not found"}, status=404)
    
    return record
