"""PDF generation functions (imported by workflow_api.py)"""

from storage import get_storage

from .pdf_service import get_pdf_generator
from .session_manager import get_session_manager


def generate_pdf_report_handler(request, session_id: str):
    """Step 6: Generate PDF report with QR code for download."""
    session_mgr = get_session_manager()
    session = session_mgr.get_session(session_id)

    if not session:
        return {"error": "Invalid or expired session"}, 404

    if not session.get("completed"):
        return {"error": "Analysis not completed yet"}, 400

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

    qr_bytes = pdf_gen.generate_qr_code(pdf_url)
    qr_filename = f"qr_{session_id}.png"
    qr_url = storage.save_file(qr_bytes, qr_filename, folder="qr_codes")

    return {
        "success": True,
        "pdf_url": pdf_url,
        "qr_code_url": qr_url,
        "message": "PDF report and QR code generated successfully",
    }


def download_pdf_handler(request, session_id: str):
    """Direct PDF download endpoint."""
    storage = get_storage()
    filename = f"report_{session_id}.pdf"

    try:
        pdf_url = storage.get_file_url(filename, folder="reports")
        return {"download_url": pdf_url}
    except Exception:
        return {"error": "PDF not found"}, 404
