"""Session management with encryption for multi-step workflow."""

import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Optional
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages encrypted sessions for multi-step kiosk workflow."""
    
    def __init__(self):
        key = os.getenv("SESSION_ENCRYPTION_KEY")
        if not key:
            key = Fernet.generate_key()
            logger.warning("No SESSION_ENCRYPTION_KEY found, using temporary key")
        
        self.cipher = Fernet(key if isinstance(key, bytes) else key.encode())
        self.sessions = {}
    
    def create_session(self, consent: bool) -> str:
        """Create new session with consent flag."""
        session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = {
            "consent": consent,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "demographics": None,
            "fingerprints": {},
            "predictions": None,
            "completed": False
        }
        
        logger.info(f"Session created: {session_id} (consent={consent})")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve session data."""
        session = self.sessions.get(session_id)
        
        if not session:
            return None
        
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.utcnow() > expires_at:
            self.delete_session(session_id)
            return None
        
        return session
    
    def update_demographics(self, session_id: str, data: Dict):
        """Store demographics in session."""
        session = self.get_session(session_id)
        if session:
            session["demographics"] = data
    
    def add_fingerprint(self, session_id: str, finger_name: str, image_data: str):
        """Store fingerprint image in session (encrypted)."""
        session = self.get_session(session_id)
        if session:
            encrypted_data = self.cipher.encrypt(image_data.encode())
            session["fingerprints"][finger_name] = encrypted_data.decode()
    
    def get_fingerprints(self, session_id: str) -> Dict[str, str]:
        """Retrieve decrypted fingerprint images."""
        session = self.get_session(session_id)
        if not session:
            return {}
        
        decrypted = {}
        for finger, encrypted_data in session["fingerprints"].items():
            decrypted_bytes = self.cipher.decrypt(encrypted_data.encode())
            decrypted[finger] = decrypted_bytes.decode()
        
        return decrypted
    
    def store_predictions(self, session_id: str, predictions: Dict):
        """Store analysis results."""
        session = self.get_session(session_id)
        if session:
            session["predictions"] = predictions
            session["completed"] = True
    
    def delete_session(self, session_id: str):
        """Delete session (for non-consent or after completion)."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Session deleted: {session_id}")
    
    def cleanup_expired(self):
        """Remove expired sessions."""
        now = datetime.utcnow()
        expired = [
            sid for sid, session in self.sessions.items()
            if datetime.fromisoformat(session["expires_at"]) < now
        ]
        
        for sid in expired:
            self.delete_session(sid)


_session_manager = None

def get_session_manager() -> SessionManager:
    """Singleton pattern for session manager."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
