"""Multi-step workflow API endpoints."""

from ninja import Router
from django.http import HttpResponse, JsonResponse
import base64
from .workflow_schemas import (
    SessionStartRequest, SessionStartResponse,
    DemographicsRequest, FingerprintRequest, FingerprintResponse,
    AnalysisResponse, ResultsResponse
)
from .pdf_schemas import PDFGenerateResponse
from .session_manager import get_session_manager
from .gemini_service import get_gemini_service
from .pdf_service import get_pdf_generator
from storage import get_storage

router = Router()


@router.post("/start", response=SessionStartResponse, tags=["Workflow"])
def start_session(request, data: SessionStartRequest):
    """Step 0: Create session with user consent."""
    session_mgr = get_session_manager()
    session_id = session_mgr.create_session(consent=data.consent)
    
    return {
        "session_id": session_id,
        "message": "Session created. Proceed with demographics." if data.consent 
                   else "Session created (data will not be saved).",
        "expires_in_minutes": 60
    }


@router.post("/{session_id}/demographics", tags=["Workflow"])
def submit_demographics(request, session_id: str, data: DemographicsRequest):
    """Step 1: Submit patient demographics."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    
    if not session:
        return JsonResponse({"error": "Invalid or expired session"}, status=404)
    
    height_m = data.height_cm / 100
    bmi = round(data.weight_kg / (height_m ** 2), 2)
    
    demographics = {
        "age": data.age,
        "weight_kg": data.weight_kg,
        "height_cm": data.height_cm,
        "gender": data.gender,
        "bmi": bmi,
        "willing_to_donate": data.willing_to_donate,
        "blood_type": data.blood_type
    }
    
    session_mgr.update_demographics(session_id, demographics)
    
    return {
        "success": True,
        "message": "Demographics saved. Proceed with fingerprint scanning.",
        "bmi": bmi
    }


@router.post("/{session_id}/fingerprint", response=FingerprintResponse, tags=["Workflow"])
def submit_fingerprint(request, session_id: str, data: FingerprintRequest):
    """Step 2: Submit fingerprint scan (call 10 times)."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    
    if not session:
        return JsonResponse({"error": "Invalid or expired session"}, status=404)
    
    session_mgr.add_fingerprint(session_id, data.finger_name, data.image)
    
    total = len(session["fingerprints"])
    remaining = max(0, 10 - total)
    
    return {
        "finger_name": data.finger_name,
        "received": True,
        "total_collected": total,
        "remaining": remaining
    }



def _validate_session_for_analysis(session_id: str):
    """Validate session exists and has required fingerprints."""
    from .constants import REQUIRED_FINGERPRINTS_COUNT, ERROR_INVALID_SESSION
    from .exceptions import SessionNotFoundError, IncompleteFingerprintsError
    
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    
    if not session:
        raise SessionNotFoundError(session_id)
    
    fingerprint_count = len(session["fingerprints"])
    if fingerprint_count < REQUIRED_FINGERPRINTS_COUNT:
        raise IncompleteFingerprintsError(
            required=REQUIRED_FINGERPRINTS_COUNT,
            received=fingerprint_count
        )
    
    return session, session_mgr


def _get_fingerprint_images(session_mgr, session_id: str):
    """Get and decode fingerprint images from session."""
    from .utils.image_processing import decode_fingerprints_from_dict
    
    fingerprints_dict = session_mgr.get_fingerprints(session_id)
    fingerprint_images = decode_fingerprints_from_dict(fingerprints_dict)
    return fingerprint_images


def _run_ml_predictions(demographics: dict, fingerprint_images: list):
    """Run diabetes and blood group predictions."""
    from .ml_service import get_ml_service
    
    ml_service = get_ml_service()
    
    # Load models if not already loaded
    if ml_service.diabetes_model is None:
        ml_service.load_models()
    
    # Run predictions
    diabetes_result = ml_service.predict_diabetes_risk(
        age=demographics["age"],
        weight_kg=demographics["weight_kg"],
        height_cm=demographics["height_cm"],
        gender=demographics["gender"],
        fingerprint_images=fingerprint_images
    )
    
    blood_group_result = ml_service.predict_blood_group(fingerprint_images)
    
    return diabetes_result, blood_group_result


def _prepare_patient_data_for_gemini(demographics: dict, diabetes_result: dict, blood_group_result: dict):
    """Prepare patient data dictionary for Gemini API."""
    return {
        **demographics,
        "pattern_arc": diabetes_result["pattern_counts"]["Arc"],
        "pattern_whorl": diabetes_result["pattern_counts"]["Whorl"],
        "pattern_loop": diabetes_result["pattern_counts"]["Loop"],
        "risk_score": diabetes_result["risk_score"],
        "risk_level": diabetes_result["risk_level"],
        "blood_group": blood_group_result["blood_group"]
    }


def _build_predictions_dict(diabetes_result: dict, blood_group_result: dict, explanation: str):
    """Build predictions dictionary for storage."""
    return {
        "diabetes_risk": diabetes_result["risk_score"],
        "risk_level": diabetes_result["risk_level"],
        "blood_group": blood_group_result["blood_group"],
        "blood_group_confidence": blood_group_result["confidence"],
        "pattern_counts": {
            "arc": diabetes_result["pattern_counts"]["Arc"],
            "whorl": diabetes_result["pattern_counts"]["Whorl"],
            "loop": diabetes_result["pattern_counts"]["Loop"]
        },
        "explanation": explanation
    }


@router.post("/{session_id}/analyze", response=AnalysisResponse, tags=["Workflow"])
def analyze_patient(request, session_id: str):
    """Step 3 & 4: Run Pattern CNN + Blood Group CNN + Diabetes Model."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"🎯 Starting analysis for session {session_id}")
        
        # Validate session and get required data
        session, session_mgr = _validate_session_for_analysis(session_id)
        
        # Get fingerprint images
        fingerprint_images = _get_fingerprint_images(session_mgr, session_id)
        logger.info(f"📷 Loaded {len(fingerprint_images)} fingerprint images")
        
        # Run ML predictions
        demographics = session["demographics"]
        logger.info(f"👤 Patient: Age {demographics.get('age')}, Gender {demographics.get('gender')}")
        
        diabetes_result, blood_group_result = _run_ml_predictions(demographics, fingerprint_images)
        logger.info(f"✅ ML predictions complete: Risk={diabetes_result['risk_level']}, Blood={blood_group_result['blood_group']}")
        
        # Generate AI explanation
        patient_data = _prepare_patient_data_for_gemini(demographics, diabetes_result, blood_group_result)
        gemini = get_gemini_service()
        explanation = gemini.generate_risk_explanation(patient_data)
        logger.info("🤖 AI explanation generated")
        
        # Generate health facility recommendations
        logger.info(f"🏥 Requesting facility recommendations for {diabetes_result['risk_level']} risk")
        nearby_facilities = gemini.generate_health_facilities(diabetes_result['risk_level'])
        logger.info(f"✅ Received {len(nearby_facilities)} facility recommendations")
        
        # Get blood donation centers (only if user is willing)
        blood_centers = []
        if demographics.get("willing_to_donate"):
            from .constants import BLOOD_CENTERS_DB
            logger.info("🩸 User willing to donate - providing blood center information")
            blood_centers = BLOOD_CENTERS_DB
            logger.info(f"✅ Provided {len(blood_centers)} blood donation centers")
        else:
            logger.info("ℹ️ User not willing to donate - skipping blood centers")
        
        # Build and store predictions
        from .constants import HOSPITALS_DB, LABORATORIES_DB, DIABETES_DOCTORS_DB
        predictions = _build_predictions_dict(diabetes_result, blood_group_result, explanation)
        predictions["blood_centers"] = blood_centers
        predictions["nearby_facilities"] = nearby_facilities
        # Include verified hospitals database so frontend can render full listings
        predictions["hospitals_db"] = HOSPITALS_DB
        # Include diabetes-related laboratories and doctors directories
        predictions["laboratories_db"] = LABORATORIES_DB
        predictions["diabetes_doctors_db"] = DIABETES_DOCTORS_DB
        predictions["willing_to_donate"] = demographics.get("willing_to_donate", False)
        session_mgr.store_predictions(session_id, predictions)
        
        # Mark session as completed
        session["completed"] = True
        session_mgr.sessions[session_id] = session
        
        logger.info(f"✅ Analysis completed for session {session_id}")
        
        return {
            "session_id": session_id,
            **predictions,
            "bmi": demographics["bmi"]
        }
        
    except Exception as e:
        logger.error(f"❌ Analysis failed for session {session_id}: {e}", exc_info=True)
        
        # Handle custom exceptions with proper status codes
        from .exceptions import BaseAPIException
        if isinstance(e, BaseAPIException):
            return JsonResponse({"error": e.message}, status=e.status_code)
        
        # Generic error
        return JsonResponse({"error": f"Analysis failed: {str(e)}"}, status=500)



@router.get("/{session_id}/results", response=ResultsResponse, tags=["Workflow"])
def get_results(request, session_id: str):
    """Step 5: Get final results and optionally save to database."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    
    if not session:
        return JsonResponse({"error": "Invalid or expired session"}, status=404)
    
    if not session.get("completed"):
        return JsonResponse({"error": "Analysis not completed yet"}, status=400)
    
    predictions = session["predictions"]
    demographics = session["demographics"]
    
    record_id = None
    saved = False
    
    if session["consent"]:
        try:
            storage = get_storage()
            record_data = {
                **demographics,
                "pattern_arc": predictions["pattern_counts"]["arc"],
                "pattern_whorl": predictions["pattern_counts"]["whorl"],
                "pattern_loop": predictions["pattern_counts"]["loop"],
                "risk_score": predictions["diabetes_risk"],
                "risk_level": predictions["risk_level"],
                "blood_group": predictions["blood_group"]
            }
            record_id = storage.save_patient_record(record_data)
            saved = True
        except Exception as e:
            print(f"Failed to save to storage: {e}")
            # Continue without saving
    
    session_mgr.delete_session(session_id)
    
    return {
        "session_id": session_id,
        "diabetes_risk": predictions["diabetes_risk"],
        "risk_level": predictions["risk_level"],
        "blood_group": predictions.get("blood_group"),
        "blood_group_confidence": predictions.get("blood_group_confidence"),
        "explanation": predictions["explanation"],
        "bmi": demographics["bmi"],
        "saved_to_database": saved,
        "record_id": record_id,
        # Include demographics
        "age": demographics.get("age"),
        "weight_kg": demographics.get("weight_kg"),
        "height_cm": demographics.get("height_cm"),
        "gender": demographics.get("gender"),
        "willing_to_donate": demographics.get("willing_to_donate"),
        # Include pattern counts
        "pattern_counts": predictions.get("pattern_counts")
    }

@router.post("/{session_id}/generate-pdf", response=PDFGenerateResponse, tags=["Workflow"])
def generate_pdf_report(request, session_id: str):
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    if not session or not session.get("completed"):
        return JsonResponse({"error": "Invalid session"}, status=404)
    predictions = session["predictions"]
    demographics = session["demographics"]
    patient_data = {**demographics, "pattern_arc": predictions["pattern_counts"]["arc"], "pattern_whorl": predictions["pattern_counts"]["whorl"], "pattern_loop": predictions["pattern_counts"]["loop"], "risk_score": predictions["diabetes_risk"], "risk_level": predictions["risk_level"], "blood_group": predictions.get("blood_group", "Not analyzed")}
    pdf_gen = get_pdf_generator()
    pdf_bytes = pdf_gen.generate_report(patient_data, predictions["explanation"])
    storage = get_storage()
    filename = f"report_{session_id}.pdf"
    pdf_url = storage.save_file(pdf_bytes, filename, folder="reports")
    qr_bytes = pdf_gen.generate_qr_code(pdf_url)
    qr_filename = f"qr_{session_id}.png"
    qr_url = storage.save_file(qr_bytes, qr_filename, folder="qr_codes")
    return {"success": True, "pdf_url": pdf_url, "qr_code_url": qr_url, "message": "PDF generated"}
