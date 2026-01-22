"""Simple test to check if consent is being set properly"""

import os
import sys

import django

# Add the backend-cloud directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from api.session_manager import get_session_manager

# Test the session flow
session_mgr = get_session_manager()

print("=== Testing Session Flow ===\n")

# 1. Create session with consent=True
session_id = session_mgr.create_session(consent=True)
print(f"1. Created session: {session_id}")

# 2. Get the session and check consent
session = session_mgr.get_session(session_id)
print(f"2. Session consent value: {session.get('consent')}")
print(f"   Session keys: {list(session.keys())}")

# 3. Update with demographics
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

# 4. Update with predictions
session_mgr.update_session(
    session_id,
    {
        "predictions": {
            "diabetes_risk": 0.45,
            "risk_level": "Moderate",
            "blood_group": "O+",
            "blood_group_confidence": 0.8,
            "pattern_counts": {"arc": 2, "whorl": 5, "loop": 3},
            "explanation": "Test",
        },
        "completed": True,
    },
)

# 5. Get the session again
session = session_mgr.get_session(session_id)
print("\n3. After updates:")
print(f"   consent: {session.get('consent')}")
print(f"   completed: {session.get('completed')}")
print(f"   has demographics: {bool(session.get('demographics'))}")
print(f"   has predictions: {bool(session.get('predictions'))}")

# 6. Test the save logic
print("\n4. Testing save logic:")
if session["consent"]:
    print("   ✓ Consent is TRUE - save would proceed")
    from storage import get_storage

    storage = get_storage()

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
    }

    print(f"   Record data prepared with keys: {list(record_data.keys())}")

    try:
        record_id = storage.save_patient_record(record_data)
        print(f"   ✓ SAVE SUCCESSFUL! Record ID: {record_id}")
    except Exception as e:
        print(f"   ✗ SAVE FAILED: {e}")
        import traceback

        traceback.print_exc()
else:
    print(f"   ✗ Consent is {session.get('consent')} - save would be SKIPPED")
