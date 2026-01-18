"""Supabase implementation of storage interface."""

import logging
import os
from datetime import datetime, timezone

try:
    from supabase import Client, create_client
except ImportError as e:
    raise ImportError("Run: pip install supabase") from e

from api.encryption import get_encryption_manager

from .interface import StorageInterface

logger = logging.getLogger(__name__)


class SupabaseStorage(StorageInterface):
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")

        if not self.url or not self.key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment")

        self.client: Client = create_client(self.url, self.key)
        logger.info("Supabase storage initialized")

    def save_patient_record(self, record: dict) -> str:
        try:
            if "created_at" not in record:
                record["created_at"] = datetime.now(timezone.utc).isoformat()

            # Strategy: We cannot store encrypted strings in Integer/Float columns (Age, Weight).
            # So we will:
            # 1. Encrypt all sensitive fields into a single 'encrypted_data' JSON blob.
            # 2. Anonymize the plaintext columns (Age=0, Gender='Encrypted') to satisfy constraints.

            encryption = get_encryption_manager()

            # 1. Prepare Encrypted Payload
            sensitive_data = {
                "age": record.get("age"),
                "weight_kg": record.get("weight_kg"),
                "height_cm": record.get("height_cm"),
                "gender": record.get("gender"),
                "bmi": record.get("bmi"),
                # Note: blood_group is NOT encrypted, it's stored in plaintext from AI prediction
                "pattern_arc": record.get("pattern_arc"),
                "pattern_whorl": record.get("pattern_whorl"),
                "pattern_loop": record.get("pattern_loop"),
            }

            # Encrypt values individually within the blob (safer than encrypting the whole JSON string)
            encrypted_payload = {}
            for k, v in sensitive_data.items():
                encrypted_payload[k] = encryption.encrypt_value(v)

            # 2. Prepare Record for Insertion
            record_to_save = record.copy()
            record_to_save["encrypted_data"] = encrypted_payload

            # 3. Anonymize Plaintext Fields (to prevent PII leak but satisfy DB Types)
            record_to_save["age"] = -1
            record_to_save["weight_kg"] = -1.0
            record_to_save["height_cm"] = -1.0
            record_to_save["bmi"] = -1.0
            record_to_save["gender"] = "Encrypted"
            # blood_group remains as is (from AI prediction)
            record_to_save["pattern_arc"] = 0
            record_to_save["pattern_whorl"] = 0
            record_to_save["pattern_loop"] = 0

            response = (
                self.client.table("patient_records").insert(record_to_save).execute()
            )

            if response.data and len(response.data) > 0:
                record_id = response.data[0]["id"]
                logger.info(f"Saved record: {record_id}")
                return str(record_id)
            else:
                raise Exception("Insert succeeded but no ID returned")

        except Exception as e:
            logger.error(f"Failed to save record: {e}")
            raise

    def get_patient_record(self, record_id: str) -> dict | None:
        try:
            response = (
                self.client.table("patient_records")
                .select("*")
                .eq("id", record_id)
                .execute()
            )

            if response.data and len(response.data) > 0:
                record = response.data[0]

                # Check if we have an encrypted blob
                if record.get("encrypted_data"):
                    encryption = get_encryption_manager()
                    enc_data = record["encrypted_data"]

                    # Decrypt and overlay onto the record
                    # This restores the "Real" values for the application
                    for k, v in enc_data.items():
                        try:
                            decrypted = encryption.decrypt_value(v)
                            # Convert types back if needed (basic strings currently)
                            # Ideally we handle type conversion here if we want strict types back
                            record[k] = decrypted
                        except Exception:
                            pass

                return record
            else:
                logger.warning(f"Record not found: {record_id}")
                return None

        except Exception as e:
            logger.error(f"Failed to get record: {e}")
            return None

    def save_file(
        self, file_data: bytes, filename: str, folder: str = "reports"
    ) -> str:
        try:
            # Determine content type based on file extension or folder
            if folder == "qr_codes" or filename.endswith(".png"):
                content_type = "image/png"
            elif filename.endswith(".pdf"):
                content_type = "application/pdf"
            else:
                content_type = "application/octet-stream"
            
            # Upload with appropriate metadata
            self.client.storage.from_(folder).upload(
                filename,
                file_data,
                file_options={
                    "content-type": content_type,
                    "cache-control": "3600",
                }
            )

            # Use signed URL with 24-hour expiry
            # For QR codes, allow inline display; for PDFs, force download
            sign_options = {}
            if content_type == "application/pdf":
                sign_options["download"] = True  # Forces Content-Disposition: attachment
            
            response = self.client.storage.from_(folder).create_signed_url(
                filename,
                86400,
                options=sign_options
            )

            # Helper to extract URL from response (it might differ based on supabase-py version)
            public_url = (
                response["signedURL"]
                if isinstance(response, dict) and "signedURL" in response
                else str(response)
            )

            logger.info(f"Uploaded file (signed): {public_url[:50]}...")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            raise

    def get_file_url(self, filename: str, folder: str = "reports") -> str:
        # Use signed URL for retrieval with 24-hour expiry
        try:
            # For PDFs force download, for images allow inline display
            sign_options = {}
            if folder == "reports" or filename.endswith(".pdf"):
                sign_options["download"] = True
            
            response = self.client.storage.from_(folder).create_signed_url(
                filename,
                86400,
                options=sign_options
            )
            return (
                response["signedURL"]
                if isinstance(response, dict) and "signedURL" in response
                else str(response)
            )
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            raise

    def list_records(self, limit: int = 100, offset: int = 0) -> list[dict]:
        try:
            response = (
                self.client.table("patient_records")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )

            records = response.data if response.data else []

            encryption = get_encryption_manager()

            for record in records:
                if record.get("encrypted_data"):
                    enc_data = record["encrypted_data"]
                    # For list view, maybe only restore minimal fields?
                    # Or restore all.
                    for k, v in enc_data.items():
                        try:
                            decrypted = encryption.decrypt_value(v)
                            record[k] = decrypted
                        except Exception:
                            pass

            return records

        except Exception as e:
            logger.error(f"Failed to list records: {e}")
            return []

    def health_check(self) -> bool:
        try:
            self.client.table("patient_records").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
