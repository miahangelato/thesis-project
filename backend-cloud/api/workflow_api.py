"""Multi-step workflow API endpoints."""

import logging
import os
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponseRedirect, JsonResponse
from ninja import Router

from storage import get_storage

from .openai_service import get_openai_service
from .ml_service import generate_patient_explanation
from .pdf_schemas import PDFGenerateResponse
from .pdf_service import get_pdf_generator
from .session_manager import get_session_manager
from .workflow_schemas import (
    AnalysisResponse,
    ConsentUpdateRequest,
    DemographicsRequest,
    FingerprintRequest,
    FingerprintResponse,
    ResultsResponse,
    SessionStartRequest,
    SessionStartResponse,
)

logger = logging.getLogger(__name__)

router = Router()


def _get_public_base_url(request) -> str:
    """Public base URL for links/QR codes.

    Prefer PUBLIC_BASE_URL env var (e.g., http://192.168.1.25:8000) so phones can
    access the backend. Fallback to request host.
    """
    env_base = os.getenv("PUBLIC_BASE_URL")
    if env_base:
        return env_base.rstrip("/")

    try:
        return request.build_absolute_uri("/").rstrip("/")
    except Exception:
        return "http://localhost:8000"


@router.post("/start", response=SessionStartResponse, auth=None, tags=["Workflow"])
def start_session(request, data: SessionStartRequest):
    """Step 0: Create session with user consent."""
    session_mgr = get_session_manager()
    session_id = session_mgr.create_session(consent=data.consent)

    return {
        "session_id": session_id,
        "message": "Session created. Proceed with demographics."
        if data.consent
        else "Session created (data will not be saved).",
        "expires_in_minutes": 60,
    }


@router.get("/{session_id}/debug", tags=["Debug"])
def debug_session(request, session_id: str):
    """Debug endpoint to check session state."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)

    if not session:
        return {"error": "Session not found or expired"}

    return {
        "session_id": session_id,
        "consent": session.get("consent"),
        "completed": session.get("completed"),
        "has_demographics": session.get("demographics") is not None,
        "has_predictions": session.get("predictions") is not None,
        "demographics_keys": list(session.get("demographics", {}).keys())
        if session.get("demographics")
        else [],
        "predictions_keys": list(session.get("predictions", {}).keys())
        if session.get("predictions")
        else [],
        "session_keys": list(session.keys()),
    }


@router.patch("/{session_id}/consent", tags=["Workflow"])
def update_consent(request, session_id: str, data: ConsentUpdateRequest):
    """Update consent status for an existing session."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)

    if not session:
        return JsonResponse({"error": "Invalid or expired session"}, status=404)

    # Update consent in the session
    session["consent"] = data.consent
    session_mgr.sessions[session_id] = session
    session_mgr._save_sessions()

    logger.info(
        f"[CONSENT UPDATE] Session {session_id} consent updated to: {data.consent}"
    )

    return {
        "success": True,
        "session_id": session_id,
        "consent": data.consent,
        "message": "Consent updated successfully",
    }


@router.post("/{session_id}/demographics", tags=["Workflow"])
def submit_demographics(request, session_id: str, data: DemographicsRequest):
    """Step 1: Submit patient demographics."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)

    if not session:
        return JsonResponse({"error": "Invalid or expired session"}, status=404)

    height_m = data.height_cm / 100
    bmi = round(data.weight_kg / (height_m**2), 2)

    demographics = {
        "age": data.age,
        "weight_kg": data.weight_kg,
        "height_cm": data.height_cm,
        "gender": data.gender,
        "bmi": bmi,
        "willing_to_donate": data.willing_to_donate,
        "blood_type": data.blood_type,
    }

    session_mgr.update_demographics(session_id, demographics)

    return {
        "success": True,
        "message": "Demographics saved. Proceed with fingerprint scanning.",
        "bmi": bmi,
    }


@router.post(
    "/{session_id}/fingerprint", response=FingerprintResponse, tags=["Workflow"]
)
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
        "remaining": remaining,
    }


def _validate_session_for_analysis(session_id: str):
    """Validate session exists and has required fingerprints."""
    from .constants import REQUIRED_FINGERPRINTS_COUNT  # noqa: PLC0415
    from .exceptions import (  # noqa: PLC0415
        IncompleteFingerprintsError,
        SessionNotFoundError,
    )

    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)

    if not session:
        raise SessionNotFoundError(session_id)

    fingerprint_count = len(session["fingerprints"])
    if fingerprint_count < REQUIRED_FINGERPRINTS_COUNT:
        raise IncompleteFingerprintsError(
            required=REQUIRED_FINGERPRINTS_COUNT, received=fingerprint_count
        )

    return session, session_mgr


def _get_fingerprint_images(session_mgr, session_id: str):
    """Get and decode fingerprint images from session."""
    from .utils.image_processing import decode_fingerprints_from_dict  # noqa: PLC0415

    fingerprints_dict = session_mgr.get_fingerprints(session_id)
    fingerprint_images = decode_fingerprints_from_dict(fingerprints_dict)
    return fingerprint_images


def _run_ml_predictions(demographics: dict, fingerprint_images: list):
    """Run diabetes and blood group predictions."""
    from .ml_service import get_ml_service  # noqa: PLC0415

    ml_service = get_ml_service()

    # Ensure all required models are ready (handles partial loads)
    ml_service.ensure_models_loaded()

    # Run predictions
    diabetes_result = ml_service.predict_diabetes_risk(
        age=demographics["age"],
        weight_kg=demographics["weight_kg"],
        height_cm=demographics["height_cm"],
        gender=demographics["gender"],
        fingerprint_images=fingerprint_images,
    )

    blood_group_result = ml_service.predict_blood_group(fingerprint_images)

    return diabetes_result, blood_group_result


def _get_bmi_category(bmi: float) -> str:
    """Determine BMI category."""
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25:
        return "Normal"
    elif bmi < 30:
        return "Overweight"
    else:
        return "Obese"


def _determine_primary_risk_factor(diabetes_result: dict, demographics: dict) -> str:
    """Determine the primary risk factor based on patterns and BMI."""
    dominant_pattern = diabetes_result["pattern_probabilities"]["dominant_pattern"]
    bmi = demographics["bmi"]
    bmi_category = _get_bmi_category(bmi)
    
    if dominant_pattern == "Loop" and bmi >= 25:
        return f"Loop-dominant fingerprint pattern combined with elevated BMI ({bmi}, {bmi_category})"
    elif dominant_pattern == "Loop":
        return "Loop-dominant fingerprint pattern (associated with 2.13× increased risk in studies)"
    elif bmi >= 30:
        return f"Elevated BMI ({bmi}, categorized as {bmi_category})"
    elif bmi >= 25:
        return f"BMI in overweight range ({bmi})"
    elif dominant_pattern == "Whorl":
        return "Whorl-dominant pattern (2.02× protective effect) - favorable indicator"
    else:
        return "No single dominant risk factor identified"


def _build_predictions_dict(
    diabetes_result: dict, blood_group_result: dict, explanation: dict
):
    """Build predictions dictionary for storage."""
    return {
        "diabetes_risk": diabetes_result["diabetes_probability"],
        "diabetes_probability": diabetes_result["diabetes_probability"],
        "diabetes_probability_percent": diabetes_result["diabetes_probability_percent"],
        "risk_level": diabetes_result["risk_level"],
        "urgency": diabetes_result["urgency"],
        "recommendation": diabetes_result["recommendation"],
        "binary_classification": diabetes_result["binary_classification"],
        "risk_score": diabetes_result["risk_score"],
        "blood_group": blood_group_result["blood_group"],
        "blood_group_confidence": blood_group_result["confidence"],
        "pattern_counts": {
            "arc": diabetes_result["pattern_counts"]["Arc"],
            "whorl": diabetes_result["pattern_counts"]["Whorl"],
            "loop": diabetes_result["pattern_counts"]["Loop"],
        },
        "pattern_probabilities": diabetes_result["pattern_probabilities"],
        "explanation": explanation,
    }


@router.post("/{session_id}/analyze", response=AnalysisResponse, tags=["Workflow"])
def analyze_patient(request, session_id: str):
    """Step 3 & 4: Run Pattern CNN + Blood Group CNN + Diabetes Model."""
    import logging  # noqa: PLC0415

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
        logger.info("👤 Patient demographics loaded")

        diabetes_result, blood_group_result = _run_ml_predictions(
            demographics, fingerprint_images
        )
        logger.info(f"✅ ML predictions complete: Risk={diabetes_result['risk_level']}")

        # Build structured response for OpenAI explanation
        structured_response = {
            "input": {
                "weight_kg": demographics["weight_kg"],
                "height_cm": demographics["height_cm"],
                "gender": demographics["gender"],
                "bmi": demographics["bmi"],
                "fingerprint_patterns": diabetes_result["pattern_probabilities"],
            },
            "predictions": {
                "diabetes_probability": diabetes_result["diabetes_probability"],
                "diabetes_probability_percent": diabetes_result["diabetes_probability_percent"],
                "predicted_class": "Diabetic" if diabetes_result["diabetes_probability"] >= 0.55 else "Non-Diabetic",
                "binary_classification": diabetes_result["binary_classification"],
            },
            "risk_assessment": {
                "risk_level": diabetes_result["risk_level"],
                "urgency": diabetes_result["urgency"],
                "recommendation": diabetes_result["recommendation"],
                "risk_score": diabetes_result["risk_score"],
            },
            "clinical_interpretation": {
                "primary_risk_factor": _determine_primary_risk_factor(diabetes_result, demographics),
                "bmi_category": _get_bmi_category(demographics["bmi"]),
                "confidence": diabetes_result["confidence"],
            },
            "model_info": {
                "model_version": "v3_calibrated",
                "model_accuracy": "94.7%",
                "calibrated": True,
                "features_used": ["weight", "height", "gender", "bmi", "fingerprint_patterns"],
                "features_excluded": ["age"],
            },
        }
        
        # Generate AI-powered doctor explanation using OpenAI (Privacy Optimized)
        openai_service = get_openai_service()
        doctor_explanation = openai_service.generate_doctor_explanation(structured_response, session_id)
        logger.info(f"🧑‍⚕️ OpenAI doctor explanation generated (Session {session_id})")
        
        # Use doctor explanation as the primary explanation (string)
        # If OpenAI fails, it automatically falls back to template in the openai_service
        explanation = doctor_explanation
        logger.info("📝 Explanation ready")

        # Use static facility list to avoid hitting API quota limits
        # AI facility generation disabled to conserve API calls
        logger.info(
            f"🏥 Using static facility recommendations for {diabetes_result['risk_level']} risk"
        )
        from .constants import FACILITIES_DB  # noqa: PLC0415

        nearby_facilities = FACILITIES_DB.get("Angeles", [])[
            :3
        ]  # Return first 3 from Angeles
        logger.info(
            f"✅ Provided {len(nearby_facilities)} static facility recommendations"
        )

        # Get blood donation centers (only if user is willing)
        blood_centers = []
        if demographics.get("willing_to_donate"):
            from .constants import BLOOD_CENTERS_DB  # noqa: PLC0415

            logger.info(
                "🩸 User willing to donate - providing blood center information"
            )
            blood_centers = BLOOD_CENTERS_DB
            logger.info(f"✅ Provided {len(blood_centers)} blood donation centers")
        else:
            logger.info("ℹ️ User not willing to donate - skipping blood centers")  # noqa: RUF001

        # Build and store predictions
        from .constants import (  # noqa: PLC0415
            DIABETES_DOCTORS_DB,
            HOSPITALS_DB,
            LABORATORIES_DB,
        )

        predictions = _build_predictions_dict(
            diabetes_result, blood_group_result, explanation
        )
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

        return {"session_id": session_id, **predictions, "bmi": demographics["bmi"]}

    except Exception as e:
        logger.error(f"❌ Analysis failed for session {session_id}: {e}", exc_info=True)

        # Handle custom exceptions with proper status codes
        from .exceptions import BaseAPIException  # noqa: PLC0415

        if isinstance(e, BaseAPIException):
            return JsonResponse({"error": e.message}, status=e.status_code)

        # Generic error
        return JsonResponse({"error": f"Analysis failed: {e!s}"}, status=500)


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

    # ====== AUTO-GENERATE PDF + QR CODE (FOR ALL USERS) ======
    logger.info(f"[PDF] Auto-generating PDF and QR code for session {session_id}")
    
    # Prepare patient data for PDF
    patient_data = {
        **demographics,
        "pattern_arc": predictions["pattern_counts"]["arc"],
        "pattern_whorl": predictions["pattern_counts"]["whorl"],
        "pattern_loop": predictions["pattern_counts"]["loop"],
        "risk_score": predictions["diabetes_risk"],
        "risk_level": predictions["risk_level"],
        "blood_group": predictions.get("blood_group", "Not analyzed"),
    }
    
    # Generate PDF
    pdf_gen = get_pdf_generator()
    pdf_bytes = pdf_gen.generate_report(patient_data, predictions["explanation"])
    logger.info(f"[PDF] Generated PDF report ({len(pdf_bytes)} bytes)")
    
    # Save PDF to storage
    storage = get_storage()
    filename = f"report_{session_id}.pdf"
    pdf_url = storage.save_file(pdf_bytes, filename, folder="reports")
    logger.info(f"[PDF] Saved PDF to storage: {pdf_url}")
    
    # Generate QR code with PROXY URL (using Custom Domain)
    # This ensures the QR code points to api.team3thesis.dev (branding)
    # which then redirects to the Supabase file
    public_base = _get_public_base_url(request)
    proxy_url = f"{public_base}/api/session/{session_id}/download-pdf"
    
    qr_bytes = pdf_gen.generate_qr_code(proxy_url)
    logger.info(f"[QR] Generated QR code for Proxy URL: {proxy_url}")
    
    # Save QR code to storage
    qr_filename = f"qr_{session_id}.png"
    qr_url = storage.save_file(qr_bytes, qr_filename, folder="qr_codes")
    logger.info(f"[QR] Saved QR code to storage: {qr_url}")

    record_id = None
    saved = False

    # DEBUG: Log session state
    logger.info(f"[DEBUG] get_results called for session_id={session_id}")
    logger.info(f"[DEBUG] session['consent'] = {session.get('consent')}")
    logger.info(f"[DEBUG] demographics keys = {list(demographics.keys())}")
    logger.info(f"[DEBUG] predictions keys = {list(predictions.keys())}")

    if session["consent"]:
        try:
            storage = get_storage()

            # Filter out blood_type from demographics (we use blood_group from predictions)
            demographics_filtered = {
                k: v for k, v in demographics.items() if k != "blood_type"
            }

            record_data = {
                **demographics_filtered,
                "pattern_arc": predictions["pattern_counts"]["arc"],
                "pattern_whorl": predictions["pattern_counts"]["whorl"],
                "pattern_loop": predictions["pattern_counts"]["loop"],
                "risk_score": predictions["diabetes_risk"],
                "risk_level": predictions["risk_level"],
                "blood_group": predictions["blood_group"],
                "willing_to_donate": demographics.get(
                    "willing_to_donate", False
                ),  # Ensure this is passed
            }
            logger.info(
                f"[SAVE] Attempting to save patient record for session {session_id}..."
            )
            logger.info(f"[SAVE] Record data keys: {list(record_data.keys())}")
            record_id = storage.save_patient_record(record_data)
            saved = True
            logger.info(f"[SUCCESS] Successfully saved record ID: {record_id}")
        except Exception as e:
            logger.error(f"[FAILED] Failed to save to storage: {e}", exc_info=True)
            # Continue without saving
    else:
        logger.warning(
            f"[SKIP] Session {session_id} skipped saving: Consent was {session.get('consent')}"
        )

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
        # QR Code & PDF Download
        "qr_code_url": qr_url,
        "download_url": pdf_url,  # Direct Supabase URL (works after session deleted)
        # Include demographics
        "age": demographics.get("age"),
        "weight_kg": demographics.get("weight_kg"),
        "height_cm": demographics.get("height_cm"),
        "gender": demographics.get("gender"),
        "willing_to_donate": demographics.get("willing_to_donate"),
        # Include pattern counts
        "pattern_counts": predictions.get("pattern_counts"),
        # Facilities
        "nearby_facilities": predictions.get("nearby_facilities", []),
        "blood_centers": predictions.get("blood_centers", []),
        "hospitals_db": predictions.get("hospitals_db", []),
        "laboratories_db": predictions.get("laboratories_db", []),
        "diabetes_doctors_db": predictions.get("diabetes_doctors_db", []),
    }


@router.post(
    "/{session_id}/generate-pdf", response=PDFGenerateResponse, tags=["Workflow"]
)
def generate_pdf_report(request, session_id: str):
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)
    if not session:
        return JsonResponse({"error": "Invalid or expired session"}, status=404)
    if not session.get("completed"):
        return JsonResponse({"error": "Analysis not completed yet"}, status=400)
    predictions = session["predictions"]
    demographics = session["demographics"]
    patient_data = {
        **demographics,
        "pattern_arc": predictions["pattern_counts"]["arc"],
        "pattern_whorl": predictions["pattern_counts"]["whorl"],
        "pattern_loop": predictions["pattern_counts"]["loop"],
        "risk_score": predictions["diabetes_risk"],
        "risk_level": predictions["risk_level"],
        "blood_group": predictions.get("blood_group", "Not analyzed"),
    }
    pdf_gen = get_pdf_generator()
    pdf_bytes = pdf_gen.generate_report(patient_data, predictions["explanation"])
    storage = get_storage()
    filename = f"report_{session_id}.pdf"
    pdf_url = storage.save_file(pdf_bytes, filename, folder="reports")

    # Use PROXY URL for QR code (consistent branding)
    public_base = _get_public_base_url(request)
    proxy_url = f"{public_base}/api/session/{session_id}/download-pdf"
    
    qr_bytes = pdf_gen.generate_qr_code(proxy_url)
    qr_filename = f"qr_{session_id}.png"
    qr_url = storage.save_file(qr_bytes, qr_filename, folder="qr_codes")
    
    # Store PDF URL in session for later retrieval
    session["pdf_url"] = pdf_url
    session_mgr._save_sessions()
    
    return {
        "success": True,
        "pdf_url": pdf_url,
        "qr_code_url": qr_url,
        "message": "PDF generated",
    }


@router.get("/{session_id}/download-pdf", auth=None, tags=["Workflow"])
def download_pdf_report(request, session_id: str):
    """Public PDF download endpoint (no API key required).
    
    Security:
    - Session ID acts as a secret token (UUID format, hard to guess)
    - Supabase URLs are signed with 24-hour expiration
    - File lookup prevents unauthorized access to non-existent files
    
    Streams the PDF through the backend to maintain custom domain in browser URL.
    """
    import re
    import requests
    from django.http import StreamingHttpResponse
    
    # Basic validation: session_id should be UUID format
    # This prevents path traversal attacks
    if not re.match(r'^[a-f0-9-]{36}$', session_id):
        return JsonResponse({"error": "Invalid session ID"}, status=400)
    
    storage = get_storage()
    filename = f"report_{session_id}.pdf"

    # LocalStorage writes into MEDIA_ROOT/<folder>/<filename>
    storage_type = type(storage).__name__
    if storage_type == "LocalStorage":
        file_path = Path(settings.MEDIA_ROOT) / "reports" / filename
        if not file_path.exists():
            return JsonResponse({"error": "PDF not found"}, status=404)

        response = FileResponse(open(file_path, "rb"), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="health_report_{session_id}.pdf"'
        )
        return response

    # Supabase: Stream the file through backend (keeps custom domain in URL)
    try:
        pdf_url = storage.get_file_url(filename, folder="reports")
        
        # Fetch file from Supabase
        file_response = requests.get(pdf_url, stream=True)
        
        if file_response.status_code != 200:
            return JsonResponse({"error": "PDF not found"}, status=404)
        
        # Stream the file through Django
        response = StreamingHttpResponse(
            file_response.iter_content(chunk_size=8192),
            content_type="application/pdf"
        )
        response["Content-Disposition"] = (
            f'attachment; filename="health_report_{session_id}.pdf"'
        )
        
        # Copy content length if available
        if 'content-length' in file_response.headers:
            response['Content-Length'] = file_response.headers['content-length']
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to stream PDF: {e}")
        return JsonResponse({"error": "PDF not found"}, status=404)
