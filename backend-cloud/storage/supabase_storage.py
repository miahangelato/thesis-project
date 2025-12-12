"""Supabase implementation of storage interface."""

import os
from typing import Dict, List, Optional
from datetime import datetime
import logging

try:
    from supabase import create_client, Client
except ImportError:
    raise ImportError("Run: pip install supabase")

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
    
    def save_patient_record(self, record: Dict) -> str:
        try:
            if "created_at" not in record:
                record["created_at"] = datetime.utcnow().isoformat()
            
            response = self.client.table('patient_records').insert(record).execute()
            
            if response.data and len(response.data) > 0:
                record_id = response.data[0]['id']
                logger.info(f"Saved record: {record_id}")
                return str(record_id)
            else:
                raise Exception("Insert succeeded but no ID returned")
                
        except Exception as e:
            logger.error(f"Failed to save record: {e}")
            raise
    
    def get_patient_record(self, record_id: str) -> Optional[Dict]:
        try:
            response = self.client.table('patient_records') \
                .select("*") \
                .eq('id', record_id) \
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            else:
                logger.warning(f"Record not found: {record_id}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get record: {e}")
            return None
    
    def save_file(self, file_data: bytes, filename: str, folder: str = "reports") -> str:
        try:
            response = self.client.storage \
                .from_(folder) \
                .upload(filename, file_data)
            
            public_url = self.client.storage \
                .from_(folder) \
                .get_public_url(filename)
            
            logger.info(f"Uploaded file: {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            raise
    
    def get_file_url(self, filename: str, folder: str = "reports") -> str:
        return self.client.storage \
            .from_(folder) \
            .get_public_url(filename)
    
    def list_records(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        try:
            response = self.client.table('patient_records') \
                .select("*") \
                .order('created_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to list records: {e}")
            return []
    
    def health_check(self) -> bool:
        try:
            self.client.table('patient_records').select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
