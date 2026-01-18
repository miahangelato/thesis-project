import os
import sys

from dotenv import load_dotenv
from supabase import Client, create_client

# Load env
load_dotenv()

# Setup Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing SUPABASE_URL or SUPABASE_KEY")
    sys.exit(1)

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"[ERROR] Connection Failed: {e}")
    sys.exit(1)

# Import Encryption Manager
try:
    from api.encryption import get_encryption_manager
except ImportError:
    # Fix path if running as script
    import sys

    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from api.encryption import get_encryption_manager


def check_database():
    print("[INFO] Connecting to Supabase...")

    # 1. Fetch Raw Data (to show it's anonymized/encrypted)
    # We select ALL columns to show the difference
    response = (
        supabase.table("patient_records")
        .select("*")
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    records = response.data

    if not records:
        print("[WARN] No records found in database.")
        return

    print(f"[INFO] Found {len(records)} recent records.\n")

    for i, record in enumerate(records):
        print(f"Record #{i + 1} (ID: {record['id']})")
        print(f"   [PUBLIC] Age:    {record.get('age')} (Expect -1)")
        print(f"   [PUBLIC] Gender: {record.get('gender')} (Expect 'Encrypted')")
        print(f"   [PUBLIC] Weight: {record.get('weight_kg')} (Expect -1.0)")

        # Show Encrypted Blob
        if record.get("encrypted_data"):
            print("[KEY] [ENCRYPTED DATA] (JSON Blob Found):")
            # print(f"   {str(record['encrypted_data'])[:100]}... (Truncated)")

            # Decrypt validation
            print("[UNLOCK] [DECRYPTED CHECK - REAL VALUES]:")
            enc_mgr = get_encryption_manager()
            try:
                real_age = enc_mgr.decrypt_value(record["encrypted_data"].get("age"))
                real_gender = enc_mgr.decrypt_value(
                    record["encrypted_data"].get("gender")
                )
                real_weight = enc_mgr.decrypt_value(
                    record["encrypted_data"].get("weight_kg")
                )
                print(f"   -> Real Age:    {real_age}")
                print(f"   -> Real Gender: {real_gender}")
                print(f"   -> Real Weight: {real_weight}")
            except Exception as e:
                print(f"   [ERROR] Decryption Error: {e}")
        else:
            print("[WARN]  [NO ENCRYPTED DATA FOUND] - This record is NOT secured.")

        print("-" * 50 + "\n")


if __name__ == "__main__":
    check_database()
