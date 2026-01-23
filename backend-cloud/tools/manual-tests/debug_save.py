"""Debug script to test the save flow end-to-end"""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import logging

from api.session_manager import get_session_manager
from storage import get_storage

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Simulate what get_results does
def test_save_flow():
    session_mgr = get_session_manager()

    # Get all sessions
    print("=== CHECKING ACTIVE SESSIONS ===")
    # Sessions are stored in memory, so we need to check if there are any

    # Let's create a test session to verify the save logic works
    print("\n=== CREATING TEST SESSION ===")
    session_id = session_mgr.create_session(consent=True)
    print(f"Created session: {session_id}")

    # Add demographics
    session_mgr.update_session(
        session_id,
        {
            "demographics": {
                "age": 25,
                "gender": "Female",
                "weight_kg": 60,
                "height_cm": 165,
                "bmi": 22.0,
                "willing_to_donate": True,
            }
        },
    )

    # Add predictions
    session_mgr.update_session(
        session_id,
        {
            "predictions": {
                "diabetes_risk": 0.45,
                "risk_level": "Moderate",
                "blood_group": "O+",
                "blood_group_confidence": 0.8,
                "pattern_counts": {"arc": 2, "whorl": 5, "loop": 3},
                "explanation": "Test explanation",
            },
            "completed": True,
        },
    )

    # Now try to save
    print("\n=== ATTEMPTING TO SAVE ===")
    session = session_mgr.get_session(session_id)
    print(f"Session consent: {session.get('consent')}")
    print(f"Session completed: {session.get('completed')}")

    if session["consent"]:
        try:
            storage = get_storage()
            print(f"Storage type: {type(storage).__name__}")

            demographics = session["demographics"]
            predictions = session["predictions"]

            record_data = {
                **demographics,
                "pattern_arc": predictions["pattern_counts"]["arc"],
                "pattern_whorl": predictions["pattern_counts"]["whorl"],
                "pattern_loop": predictions["pattern_counts"]["loop"],
                "risk_score": predictions["diabetes_risk"],
                "risk_level": predictions["risk_level"],
                "blood_group": predictions["blood_group"],
                "willing_to_donate": demographics.get("willing_to_donate", False),
            }

            print(f"Record data: {record_data}")
            print("\nCalling save_patient_record...")
            record_id = storage.save_patient_record(record_data)
            print(f"✅ SUCCESS! Record ID: {record_id}")

        except Exception as e:
            print(f"❌ FAILED: {e}")
            import traceback

            traceback.print_exc()
    else:
        print("⚠️ Consent is False, skipping save")


if __name__ == "__main__":
    test_save_flow()
