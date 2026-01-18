import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL:
    print("[ERROR] Missing SUPABASE_URL in .env")
    sys.exit(1)

def upload_models():
    # Prefer Service Key for admin privileges (bypasses RLS and some limits)
    key_to_use = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
    key_type = "SERVICE_ROLE" if SUPABASE_SERVICE_KEY else "ANON/PUBLIC"
    
    if not key_to_use:
         print("[ERROR] No SUPABASE_KEY or SUPABASE_SERVICE_KEY found.")
         sys.exit(1)

    print(f"Connecting to Supabase at {SUPABASE_URL}...")
    print(f"Using key type: {key_type}")
    
    supabase: Client = create_client(SUPABASE_URL, key_to_use)
    
    # Bucket name
    BUCKET_NAME = "ml-models"
    
    # Path to models
    SHARED_MODELS_DIR = Path("..") / "shared-models"
    
    files_to_upload = [
        "final_no_age_model.pkl",
        "final_no_age_scaler.pkl",
        "final_no_age_imputer.pkl",
        "improved_pattern_cnn_model_retrained.h5",
        "blood_type_triplet_embedding.h5",
        "blood_support_embeddings.npz"
    ]

    # Verify bucket exists
    try:
        buckets = supabase.storage.list_buckets()
        bucket_exists = any(b.name == BUCKET_NAME for b in buckets)
        if not bucket_exists:
            print(f"[INFO] Creating bucket '{BUCKET_NAME}'...")
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
        else:
            print(f"[INFO] Bucket '{BUCKET_NAME}' exists.")
    except Exception as e:
        print(f"[WARNING] Could not verify/create bucket (might be permissions): {e}")
        # Continue and try to upload anyway
        
    for filename in files_to_upload:
        file_path = SHARED_MODELS_DIR / filename
        
        if not file_path.exists():
            print(f"[ERROR] Local file not found: {file_path}")
            continue
            
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        print(f"Uploading {filename} ({file_size_mb:.2f} MB)...")
        
        try:
            with open(file_path, 'rb') as f:
                # 'upsert': 'true' overwrites if exists
                response = supabase.storage.from_(BUCKET_NAME).upload(
                    path=filename,
                    file=f,
                    file_options={"upsert": "true", "content-type": "application/octet-stream"}
                )
                print(f"✅ Success: {filename}")
        except Exception as e:
            print(f"❌ Failed to upload {filename}: {e}")

if __name__ == "__main__":
    upload_models()
