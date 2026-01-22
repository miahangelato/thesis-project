import os
import sys

from dotenv import load_dotenv

# Load env
load_dotenv()

# Setup Django standalone

# Configure settings manually if not using manage.py context (simplified)
# Actually, it's better to bypass Django if we just want to test SupabaseStorage directly if possible,
# but SupabaseStorage depends on settings.
# Let's just use the direct supabase client and encryption manager to reproduce the logic
# OR use the actual storage class if we can.

# Let's try to mimic the logic in supabase_storage.py directly to see where it breaks
from supabase import Client, create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
E2E_ENCRYPTION_KEY = os.getenv("E2E_ENCRYPTION_KEY")

print(f"URL: {SUPABASE_URL}")
print(f"KEY (len): {len(SUPABASE_KEY) if SUPABASE_KEY else 0}")
print(f"ENC KEY (len): {len(E2E_ENCRYPTION_KEY) if E2E_ENCRYPTION_KEY else 0}")

try:
    from api.encryption import get_encryption_manager
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from api.encryption import get_encryption_manager


def test_save():
    print("Testing Save...")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    enc_mgr = get_encryption_manager()

    data = {
        "age": 30,
        "gender": "Male",
        "weight_kg": 75.5,
        "height_cm": 180,
        "bmi": 23.3,
        "risk_level": "High",
        "risk_score": 0.85,
        "blood_group": "A+",
        "willing_to_donate": True,
        "pattern_arc": 2,
        "pattern_whorl": 3,
        "pattern_loop": 5,
    }

    # 1. Encrypt Sensitive Data
    encrypted_blob = {
        "age": enc_mgr.encrypt_value(str(data["age"])),
        "weight_kg": enc_mgr.encrypt_value(str(data["weight_kg"])),
        "gender": enc_mgr.encrypt_value(data["gender"]),
    }

    # 2. Prepare Payload with Anonymized Data
    payload = {
        **data,
        "age": -1,  # Anonymized
        "weight_kg": -1.0,  # Anonymized
        "gender": "Encrypted",  # Anonymized
        "encrypted_data": encrypted_blob,  # New Column
    }

    print("Payload prepared. Inserting...")
    try:
        response = supabase.table("patient_records").insert(payload).execute()
        print("Insert successful!")
        print(response.data)
    except Exception as e:
        print("!!! INSERT FAILED !!!")
        if hasattr(e, "message"):
            print(f"Message: {e.message}")
        if hasattr(e, "code"):
            print(f"Code: {e.code}")
        if hasattr(e, "details"):
            print(f"Details: {e.details}")
        if hasattr(e, "hint"):
            print(f"Hint: {e.hint}")
        # Fallback dump
        try:
            print(f"Raw: {e!s}")
        except Exception:
            print("Could not print raw exception")


if __name__ == "__main__":
    test_save()
