"""Multi-step workflow API endpoints."""

from ninja import Router
from django.http import HttpResponse
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
        return {"error": "Invalid or expired session"}, 404
    
    height_m = data.height_cm / 100
    bmi = round(data.weight_kg / (height_m ** 2), 2)
    
    demographics = {
        "age": data.age,
        "weight_kg": data.weight_kg,
        "height_cm": data.height_cm,
        "gender": data.gender,
        "bmi": bmi
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
        return {"error": "Invalid or expired session"}, 404
    
    session_mgr.add_fingerprint(session_id, data.finger_name, data.image)
    
    total = len(session["fingerprints"])
    remaining = max(0, 10 - total)
    
    return {
        "finger_name": data.finger_name,
        "received": True,
        "total_collected": total,
        "remaining": remaining
    }


@router.post("/{session_id}/analyze", response=AnalysisResponse, tags=["Workflow"])
def analyze_patient(request, session_id: str):
    """Step 3 & 4: Run Pattern CNN + Blood Group CNN + Diabetes Model."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    
    if not session:
        return {"error": "Invalid or expired session"}, 404
    
    if len(session["fingerprints"]) < 10:
        return {"error": f"Need 10 fingerprints, only have {len(session['fingerprints'])}"}, 400
    
    # TODO: Replace with actual ML model calls
    # For now, placeholder predictions
    pattern_counts = {"arc": 2, "whorl": 5, "loop": 3}
    diabetes_risk = 0.65
    risk_level = "Moderate"
    blood_group = "A+"
    blood_group_confidence = 0.85
    
    demographics = session["demographics"]
    
    patient_data = {
        **demographics,
        "pattern_arc": pattern_counts["arc"],
        "pattern_whorl": pattern_counts["whorl"],
        "pattern_loop": pattern_counts["loop"],
        "risk_score": diabetes_risk,
        "risk_level": risk_level,
        "blood_group": blood_group
    }
    
    gemini = get_gemini_service()
    explanation = gemini.generate_risk_explanation(patient_data)
    
    predictions = {
        "diabetes_risk": diabetes_risk,
        "risk_level": risk_level,
        "blood_group": blood_group,
        "blood_group_confidence": blood_group_confidence,
        "pattern_counts": pattern_counts,
        "explanation": explanation
    }
    
    session_mgr.store_predictions(session_id, predictions)
    
    return {
        "session_id": session_id,
        **predictions,
        "bmi": demographics["bmi"]
    }


@router.get("/{session_id}/results", response=ResultsResponse, tags=["Workflow"])
def get_results(request, session_id: str):
    """Step 5: Get final results and optionally save to database."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    
    if not session:
        return {"error": "Invalid or expired session"}, 404
    
    if not session.get("completed"):
        return {"error": "Analysis not completed yet"}, 400
    
    predictions = session["predictions"]
    demographics = session["demographics"]
    
    record_id = None
    saved = False
    
    if session["consent"]:
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
    
    session_mgr.delete_session(session_id)
    
    return {
        "session_id": session_id,
        "diabetes_risk": predictions["diabetes_risk"],
        "risk_level": predictions["risk_level"],
        "blood_group": predictions.get("blood_group"),
        "explanation": predictions["explanation"],
        "bmi": demographics["bmi"],
        "saved_to_database": saved,
        "record_id": record_id
    }

@router.post("/{session_id}/generate-pdf", response=PDFGenerateResponse, tags=["Workflow"])
def generate_pdf_report(request, session_id: str):
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    if not session or not session.get("completed"):
        return {"error": "Invalid session"}, 404
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
