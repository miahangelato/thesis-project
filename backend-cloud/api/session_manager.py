"""Session management with encryption for multi-step workflow - PRIVACY OPTIMIZED.

PRIVACY ENHANCEMENTS:
1. Auto-cleanup on session creation (clears orphaned data)
2. Immediate fingerprint clearing on session completion
3. Cache cleared automatically on expiration
4. Comprehensive audit logging for all privacy events
5. Integration with session-scoped cache service
"""

import json
import logging
import os
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Optional

from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages encrypted sessions for multi-step kiosk workflow."""

    def __init__(self):
        self._lock = threading.Lock()

        base_dir = self._get_base_dir()
        self._key_path = Path(
            os.getenv("SESSION_KEY_PATH", str(base_dir / "session_encryption.key"))
        )
        self._store_path = Path(
            os.getenv("SESSION_STORE_PATH", str(base_dir / "session_store.json"))
        )

        key = self._load_or_create_key()
        self.cipher = Fernet(key)

        self.sessions: dict[str, dict] = {}
        self._load_sessions()

    def _get_base_dir(self) -> Path:
        """Best-effort BASE_DIR resolution without requiring Django settings."""
        try:
            from django.conf import settings  # noqa: PLC0415

            base_dir = getattr(settings, "BASE_DIR", None)
            if base_dir:
                return Path(base_dir)
        except Exception:
            pass

        # Fallback: backend-cloud/api -> backend-cloud
        return Path(__file__).resolve().parent.parent

    def _load_or_create_key(self) -> bytes:
        """Load encryption key from env or disk; create a stable key if missing."""
        env_key = os.getenv("SESSION_ENCRYPTION_KEY")
        if env_key:
            return env_key.encode() if isinstance(env_key, str) else env_key

        try:
            if self._key_path.exists():
                key_bytes = self._key_path.read_bytes().strip()
                if key_bytes:
                    return key_bytes
        except Exception as e:
            logger.warning("Failed reading session key file: %s", e)

        key_bytes = Fernet.generate_key()
        try:
            self._key_path.parent.mkdir(parents=True, exist_ok=True)
            self._key_path.write_bytes(key_bytes)
            logger.info("Created stable SESSION_ENCRYPTION_KEY at %s", self._key_path)
        except Exception as e:
            logger.warning("Could not persist session key to disk: %s", e)

        return key_bytes

    def _load_sessions(self) -> None:
        """Load session store from disk if present."""
        try:
            if not self._store_path.exists():
                return
            raw = self._store_path.read_text(encoding="utf-8")
            if not raw.strip():
                return
            data = json.loads(raw)
            if isinstance(data, dict):
                self.sessions = data
        except Exception as e:
            logger.warning("Failed to load session store: %s", e)

    def _save_sessions(self) -> None:
        """Persist sessions to disk (best-effort)."""
        try:
            self._store_path.parent.mkdir(parents=True, exist_ok=True)
            self._store_path.write_text(
                json.dumps(self.sessions, ensure_ascii=False), encoding="utf-8"
            )
        except Exception as e:
            logger.warning("Failed to persist session store: %s", e)

    def create_session(self, consent: bool) -> str:
        """Create new session with consent flag.
        
        PRIVACY: Auto-cleanup orphaned data before creating new session.
        """
        # PRIVACY CHECKPOINT 1: Clean up expired sessions first
        self.cleanup_expired()
        
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        with self._lock:
            self.sessions[session_id] = {
                "consent": consent,
                "created_at": now.isoformat(),
                "last_activity": now.isoformat(),
                "status": "active",  # active, expired, completed, destroyed
                "demographics": None,
                "fingerprints": {},
                "predictions": None,
                "completed": False,
            }
            self._save_sessions()

        logger.info(f"[PRIVACY] Session created: {session_id[:8]}... (consent={consent}, max_lifetime=30min, inactivity_timeout=10min)")
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve session data.

        Handles expiration logic:
        - Checks absolute duration (30 mins max)
        - Checks inactivity (10 mins max)
        - Updates last_activity if active
        """
        session = self.sessions.get(session_id)

        if not session:
            return None

        # Determine if expired
        now = datetime.now(timezone.utc)
        created_at = datetime.fromisoformat(session["created_at"])
        last_activity = datetime.fromisoformat(session.get("last_activity", session["created_at"]))

        # Limits
        MAX_DURATION = timedelta(minutes=30)
        INACTIVITY_TIMEOUT = timedelta(minutes=10)

        is_expired = False
        if now - created_at > MAX_DURATION:
            is_expired = True
        elif now - last_activity > INACTIVITY_TIMEOUT:
            is_expired = True

        if is_expired and session.get("status") == "active":
            self.expire_session(session_id)
            session = self.sessions.get(session_id)  # Reload

        # Update activity for active sessions
        if session and session.get("status") == "active":
            with self._lock:
                session["last_activity"] = now.isoformat()
                self._save_sessions()

        return session

    def expire_session(self, session_id: str, reason: str = "timeout"):
        """Mark session as expired and clean up sensitive data.
        
        PRIVACY: Immediately clears fingerprints and associated cache.
        """
        with self._lock:
            session = self.sessions.get(session_id)
            if session and session.get("status") == "active":
                fingerprint_count = len(session.get("fingerprints", {}))
                
                # PRIVACY CHECKPOINT 3: Expire session
                session["status"] = "expired"
                session["expired_at"] = datetime.now(timezone.utc).isoformat()
                
                # Clear sensitive raw inputs IMMEDIATELY
                session["fingerprints"] = {}  # Remove raw images
                
                # Keep demographics and predictions for read-only View Results
                self._save_sessions()
                
                logger.info(f"[PRIVACY] Session expired: {session_id[:8]}..., reason={reason}, fingerprints_cleared={fingerprint_count}")
        
        # Clear associated AI cache
        self._clear_session_cache(session_id)

    def update_demographics(self, session_id: str, data: dict):
        """Store demographics in session."""
        session = self.get_session(session_id)
        if session and session.get("status") == "active":
            with self._lock:
                session["demographics"] = data
                self.sessions[session_id] = session
                self._save_sessions()

    def add_fingerprint(self, session_id: str, finger_name: str, image_data: str):
        """Store fingerprint image in session (encrypted)."""
        session = self.get_session(session_id)
        if session and session.get("status") == "active":
            encrypted_data = self.cipher.encrypt(image_data.encode())
            with self._lock:
                session["fingerprints"][finger_name] = encrypted_data.decode()
                self.sessions[session_id] = session
                self._save_sessions()

    def get_fingerprints(self, session_id: str) -> dict[str, str]:
        """Retrieve decrypted fingerprint images."""
        session = self.get_session(session_id)
        if not session:
            return {}

        decrypted = {}
        for finger, encrypted_data in session["fingerprints"].items():
            decrypted_bytes = self.cipher.decrypt(encrypted_data.encode())
            decrypted[finger] = decrypted_bytes.decode()

        return decrypted

    def store_predictions(self, session_id: str, predictions: dict):
        """Store analysis results and mark session as completed.
        
        PRIVACY: Automatically clears raw fingerprints after storing predictions.
        """
        session = self.get_session(session_id)
        if session and session.get("status") == "active":
            fingerprint_count = len(session.get("fingerprints", {}))
            
            with self._lock:
                session["predictions"] = predictions
                session["completed"] = True
                session["status"] = "completed"
                session["completed_at"] = datetime.now(timezone.utc).isoformat()
                
                # PRIVACY CHECKPOINT 2: Clear raw fingerprints after completion
                session["fingerprints"] = {}  # Keep predictions, clear raw data
                
                self.sessions[session_id] = session
                self._save_sessions()
            
            logger.info(f"[PRIVACY] Session completed: {session_id[:8]}..., fingerprints_cleared={fingerprint_count}")
            
            # Note: Cache clearing handled by workflow endpoint after results sent

    def delete_session(self, session_id: str):
        """Delete session permanently - UNRECOVERABLE.
        
        PRIVACY: Clears cache and removes all session data.
        """
        with self._lock:
            if session_id in self.sessions:
                session = self.sessions[session_id]
                status = session.get("status", "unknown")
                
                del self.sessions[session_id]
                self._save_sessions()
                
                logger.info(f"[PRIVACY] Session destroyed: {session_id[:8]}..., status={status}")
        
        # Clear associated AI cache
        self._clear_session_cache(session_id)

    def cleanup_expired(self):
        """Remove sessions that are too old (hard cleanup).
        
        PRIVACY: Comprehensive cleanup with cache clearing.
        """
        now = datetime.now(timezone.utc)
        start_keys = list(self.sessions.keys())
        
        expired_count = 0
        destroyed_count = 0
        
        for sid in start_keys:
            session = self.sessions.get(sid)
            if not session:
                continue
                
            try:
                # Handle both old 'expires_at' and new 'created_at' logic
                if "created_at" in session:
                    created_at = datetime.fromisoformat(session["created_at"])
                    
                    # Hard delete after 2 hours (even read-only results)
                    if now - created_at > timedelta(hours=2):
                        self.delete_session(sid)
                        destroyed_count += 1
                    # Auto-expire active sessions after 30min or 10min inactivity
                    elif session.get("status") == "active":
                        last_activity = datetime.fromisoformat(session.get("last_activity", session["created_at"]))
                        
                        if now - created_at > timedelta(minutes=30):
                            self.expire_session(sid, reason="absolute_timeout")
                            expired_count += 1
                        elif now - last_activity > timedelta(minutes=10):
                            self.expire_session(sid, reason="inactivity")
                            expired_count += 1
                            
                elif "expires_at" in session:
                    # Legacy support
                    expires_at = datetime.fromisoformat(session["expires_at"])
                    if now > expires_at:
                        self.delete_session(sid)
                        destroyed_count += 1
            except Exception as e:
                logger.error(f"Error cleaning up session {sid}: {e}")
                self.delete_session(sid)
                destroyed_count += 1
        
        if expired_count > 0 or destroyed_count > 0:
            logger.info(f"[PRIVACY] Cleanup completed: expired={expired_count}, destroyed={destroyed_count}")
        
        # Clean up orphaned cache entries
        self._cleanup_orphaned_cache()
    
    def _clear_session_cache(self, session_id: str):
        """Clear AI cache for a specific session."""
        try:
            from .cache_service import get_response_cache  # noqa: PLC0415
            cache = get_response_cache()
            cache.clear_session(session_id)
        except Exception as e:
            logger.warning(f"Failed to clear cache for session {session_id}: {e}")
    
    def _cleanup_orphaned_cache(self):
        """Remove cache entries for sessions that no longer exist."""
        try:
            from .cache_service import get_response_cache  # noqa: PLC0415
            cache = get_response_cache()
            active_session_ids = set(self.sessions.keys())
            cache.clear_all_expired(active_session_ids)
        except Exception as e:
            logger.warning(f"Failed to cleanup orphaned cache: {e}")


_session_manager = None


def get_session_manager() -> SessionManager:
    """Singleton pattern for session manager."""
    global _session_manager  # noqa: PLW0603
    if _session_manager is None:
        _session_manager = SessionManager()
        logger.info("[PRIVACY] Session manager initialized with auto-cleanup")
    return _session_manager
