"""Main Django Ninja API router."""

from ninja import NinjaAPI
from datetime import datetime
from .schemas import (
    DiagnoseRequest, DiagnoseResponse, HealthCheckResponse,
    AnalyzeRequest, AnalyzeResponse
)
from .gemini_service import get_gemini_service
from .ml_service import get_ml_service
from .workflow_api import router as workflow_router
from storage import get_storage
import base64
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

api = NinjaAPI(
    title="Diabetes Risk Prediction API",
    version="1.0.0",
    description="Cloud-hybrid IoT system for diabetes risk assessment"
)

api.add_router("/session", workflow_router)

@api.post("/analyze", response=AnalyzeResponse, tags=["Prediction"])
def analyze_patient(request, data: AnalyzeRequest):
    """Process patient data with ML models and generate comprehensive report."""
    
    try:
        # Get services
        ml_service = get_ml_service()
        gemini_service = get_gemini_service()
        storage = get_storage()
        
        # Ensure models are loaded
        if ml_service.diabetes_model is None:
            logger.info("Loading ML models on first request...")
            ml_service.load_models()
        
        # Decode fingerprint images from base64
        fingerprint_images = []
        for b64_image in data.fingerprint_images:
            try:
                # Remove data URI prefix if present
                if ',' in b64_image:
                    b64_image = b64_image.split(',')[1]
                
                img_bytes = base64.b64decode(b64_image)
                img = Image.open(io.BytesIO(img_bytes))
                img_array = np.array(img)
                fingerprint_images.append(img_array)
            except Exception as e:
                logger.error(f"Failed to decode image: {e}")
                continue
        
        if len(fingerprint_images) == 0:
            return api.create_response(
                request,
                {"error": "No valid fingerprint images provided"},
                status=400
            )
        
        # Run ML predictions
        diabetes_result = ml_service.predict_diabetes_risk(
            age=data.age,
            weight_kg=data.weight_kg,
            height_cm=data.height_cm,
            gender=data.gender,
            fingerprint_images=fingerprint_images
        )
        
        blood_group_result = ml_service.predict_blood_group(fingerprint_images)
        
        # Combine results
        analysis_results = {
            'diabetes_risk_score': diabetes_result['risk_score'],
            'diabetes_risk_level': diabetes_result['risk_level'],
            'diabetes_confidence': diabetes_result['confidence'],
            'pattern_counts': diabetes_result['pattern_counts'],
            'bmi': diabetes_result['bmi'],
            'predicted_blood_group': blood_group_result['blood_group'],
            'blood_group_confidence': blood_group_result['confidence']
        }
        
        # Generate AI explanation
        demographics = {
            'age': data.age,
            'gender': data.gender,
            'blood_type': data.blood_type,
            'willing_to_donate': data.willing_to_donate
        }
        
        explanation = gemini_service.generate_patient_explanation(
            analysis_results, demographics
        )
        
        # Save to database if consent given
        record_id = None
        if data.consent:
            patient_record = {
                'age': data.age,
                'weight_kg': data.weight_kg,
                'height_cm': data.height_cm,
                'gender': data.gender,
                'blood_type': data.blood_type,
                'bmi': analysis_results['bmi'],
                'diabetes_risk_score': analysis_results['diabetes_risk_score'],
                'diabetes_risk_level': analysis_results['diabetes_risk_level'],
                'predicted_blood_group': analysis_results['predicted_blood_group'],
                'pattern_whorl': analysis_results['pattern_counts']['Whorl'],
                'pattern_loop': analysis_results['pattern_counts']['Loop'],
                'pattern_arc': analysis_results['pattern_counts']['Arc'],
                'willing_to_donate': data.willing_to_donate,
                'timestamp': datetime.utcnow().isoformat()
            }
            record_id = storage.save_patient_record(patient_record)
            logger.info(f"Patient record saved with ID: {record_id}")
        
        return AnalyzeResponse(
            success=True,
            record_id=record_id,
            diabetes_risk_score=analysis_results['diabetes_risk_score'],
            diabetes_risk_level=analysis_results['diabetes_risk_level'],
            diabetes_confidence=analysis_results['diabetes_confidence'],
            pattern_counts=analysis_results['pattern_counts'],
            bmi=analysis_results['bmi'],
            predicted_blood_group=analysis_results['predicted_blood_group'],
            blood_group_confidence=analysis_results['blood_group_confidence'],
            explanation=explanation,
            saved=data.consent,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        return api.create_response(
            request,
            {"error": f"Analysis failed: {str(e)}"},
            status=500
        )


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
    db_connected = False
    try:
        storage = get_storage()
        db_connected = storage.health_check()
    except Exception as e:
        # Storage not configured, but API is still healthy
        print(f"Storage health check failed: {e}")
    
    return {
        "status": "healthy",  # API is always healthy if this endpoint responds
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
