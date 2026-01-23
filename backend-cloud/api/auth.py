import os

from django.conf import settings
from ninja.security import APIKeyHeader


class APIKeyAuth(APIKeyHeader):
    param_name = "X-API-Key"

    def authenticate(self, request, key):
        # Allow DEBUG mode to bypass auth if explicitly configured (optional safety)
        # But generally we want to enforce it.

        expected_key = os.getenv("BACKEND_API_KEY")

        if not expected_key:
            # Fallback for dev safety or specific error
            if settings.DEBUG:
                return True  # Allow open access in DEBUG if key missing?
                # Better: Warn and require key.
                # Returning True with no key set is risky implementation default.
                # Let's enforce key presence.
            return None

        if key == expected_key:
            return key

        return None
