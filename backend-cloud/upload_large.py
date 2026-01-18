import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

# Load env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL:
    print("[ERROR] Missing SUPABASE_URL")
    sys.exit(1)

def upload_large():
    # Prefer Service Key
    key = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
    if not key:
        print("[ERROR] No key found")
        sys.exit(1)

    print(f"Connecting to {SUPABASE_URL}...")
    
    # Create client with custom options if supported, or just rely on library defaults
    # storage-py doesn't expose timeout easily in higher level client, 
    # but we can try to rely on the underlying library's robustness.
    
    supabase: Client = create_client(
        SUPABASE_URL, 
        key,
        options=ClientOptions(
            postgrest_client_timeout=300, # 5 mins
            storage_client_timeout=300
        )
    )
    
    BUCKET_NAME = "ml-models"
    filename = "improved_pattern_cnn_model_retrained.h5"
    file_path = Path("..") / "shared-models" / filename
    
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return

    size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"Uploading {filename} ({size_mb:.2f} MB)... This may take a few minutes.")

    try:
        with open(file_path, 'rb') as f:
            res = supabase.storage.from_(BUCKET_NAME).upload(
                path=filename,
                file=f,
                file_options={"upsert": "true", "content-type": "application/octet-stream"}
            )
            print(f"Response: {res}")
            print("✅ Upload Completed!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    upload_large()
