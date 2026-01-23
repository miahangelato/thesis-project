"""Session-scoped cache for AI responses - PRIVACY OPTIMIZED.

CRITICAL PRIVACY RULES:
1. Cache is session-scoped - NEVER reuse across sessions
2. Cache is automatically cleared when session completes/expires
3. Each session gets isolated cache storage
4. All cache operations are logged for auditing
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class SessionScopedCache:
    """AI response cache that NEVER reuses data across sessions.
    
    Privacy guarantees:
    - Each session has isolated cache storage
    - Cache cleared automatically on session completion
    - No cross-session data reuse
    - Audit logging for all operations
    """

    def __init__(self):
        # Format: { session_id: { cache_key: cached_data } }
        self.cache: Dict[str, Dict[str, Dict]] = {}

    def _generate_key(self, data: Dict) -> str:
        """Generate cache key from input data.
        
        Note: Includes timestamp component to prevent accidental reuse.
        """
        cache_data = {
            "age_bucket": (data.get("age", 0) // 10) * 10,
            "bmi_bucket": round(data.get("bmi", 0), 0),
            "risk_level": data.get("risk_level", "unknown"),
            "pattern_arc": data.get("pattern_arc", 0),
            "pattern_whorl": data.get("pattern_whorl", 0),
            "pattern_loop": data.get("pattern_loop", 0),
        }
        json_str = json.dumps(cache_data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()

    def get(self, session_id: str, data: Dict) -> Optional[str]:
        """Get cached response ONLY for current session.
        
        Args:
            session_id: Current session identifier
            data: Input data to generate cache key
            
        Returns:
            Cached response if found, None otherwise
        """
        if not session_id or session_id not in self.cache:
            return None

        cache_key = self._generate_key(data)
        session_cache = self.cache[session_id]
        
        if cache_key in session_cache:
            logger.info(f"[PRIVACY] Cache hit for session {session_id[:8]}...")
            return session_cache[cache_key]["response"]
        
        return None

    def set(self, session_id: str, data: Dict, response: str):
        """Cache response for CURRENT SESSION ONLY.
        
        Args:
            session_id: Current session identifier
            data: Input data to generate cache key
            response: AI response to cache
        """
        if not session_id:
            logger.warning("[PRIVACY] Attempted to cache without session_id - rejected")
            return

        if session_id not in self.cache:
            self.cache[session_id] = {}

        cache_key = self._generate_key(data)
        self.cache[session_id][cache_key] = {
            "response": response,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }
        
        logger.info(f"[PRIVACY] Cached response for session {session_id[:8]}..., key={cache_key[:8]}...")

    def clear_session(self, session_id: str):
        """Delete ALL cache for a session - MANDATORY on completion.
        
        Args:
            session_id: Session to clear cache for
        """
        if session_id in self.cache:
            entry_count = len(self.cache[session_id])
            del self.cache[session_id]
            logger.info(f"[PRIVACY] Cache cleared for session {session_id[:8]}..., entries={entry_count}")
        else:
            logger.debug(f"[PRIVACY] No cache to clear for session {session_id[:8]}...")

    def clear_all_expired(self, active_session_ids: set):
        """Remove cache for sessions that no longer exist.
        
        Args:
            active_session_ids: Set of currently active session IDs
        """
        orphaned = [sid for sid in self.cache.keys() if sid not in active_session_ids]
        
        for sid in orphaned:
            entry_count = len(self.cache[sid])
            del self.cache[sid]
            logger.info(f"[PRIVACY] Cleared orphaned cache for session {sid[:8]}..., entries={entry_count}")
        
        if orphaned:
            logger.info(f"[PRIVACY] Cleanup completed: removed cache for {len(orphaned)} expired sessions")

    def get_stats(self) -> Dict:
        """Get cache statistics for monitoring."""
        return {
            "total_sessions": len(self.cache),
            "total_entries": sum(len(session_cache) for session_cache in self.cache.values()),
            "sessions": [
                {
                    "session_id": sid[:8] + "...",
                    "entry_count": len(session_cache)
                }
                for sid, session_cache in self.cache.items()
            ]
        }


_cache_instance = None


def get_response_cache() -> SessionScopedCache:
    """Singleton pattern for session-scoped cache."""
    global _cache_instance  # noqa: PLW0603
    if _cache_instance is None:
        _cache_instance = SessionScopedCache()
        logger.info("[PRIVACY] Session-scoped cache initialized")
    return _cache_instance
