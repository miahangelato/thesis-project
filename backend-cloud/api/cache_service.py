"""Simple in-memory cache for Gemini responses."""

import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional


class ResponseCache:
    def __init__(self, ttl_minutes: int = 60):
        self.cache = {}
        self.ttl = timedelta(minutes=ttl_minutes)

    def _generate_key(self, data: Dict) -> str:
        """Generate cache key from patient data."""
        # Only use risk-relevant fields for caching
        cache_data = {
            "age_bucket": (data["age"] // 10) * 10,  # Group by decade
            "bmi_bucket": round(data["bmi"], 0),  # Round to nearest integer
            "risk_level": data["risk_level"],
            "pattern_arc": data.get("pattern_arc", 0),
            "pattern_whorl": data.get("pattern_whorl", 0),
            "pattern_loop": data.get("pattern_loop", 0),
        }
        json_str = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(json_str.encode()).hexdigest()

    def get(self, data: Dict) -> Optional[str]:
        """Get cached response if available and not expired."""
        key = self._generate_key(data)
        if key in self.cache:
            cached_item = self.cache[key]
            if datetime.now(timezone.utc) - cached_item["timestamp"] < self.ttl:
                return cached_item["response"]
            else:
                # Expired, remove from cache
                del self.cache[key]
        return None

    def set(self, data: Dict, response: str):
        """Store response in cache."""
        key = self._generate_key(data)
        self.cache[key] = {
            "response": response,
            "timestamp": datetime.now(timezone.utc),
        }

    def clear_expired(self):
        """Remove expired entries."""
        now = datetime.now(timezone.utc)
        expired_keys = [
            k for k, v in self.cache.items() if now - v["timestamp"] >= self.ttl
        ]
        for k in expired_keys:
            del self.cache[k]


_cache_instance = None


def get_response_cache() -> ResponseCache:
    """Singleton pattern for response cache."""
    global _cache_instance  # noqa: PLW0603
    if _cache_instance is None:
        _cache_instance = ResponseCache(ttl_minutes=120)  # 2 hour cache
    return _cache_instance
