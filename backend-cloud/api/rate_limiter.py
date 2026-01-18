"""Rate limiter for Gemini API calls."""

import time
from collections import deque
from threading import Lock
from typing import Optional


class RateLimiter:
    def __init__(self, max_requests: int, time_window_seconds: int):
        """
        Args:
            max_requests: Maximum number of requests allowed in the time window
            time_window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window_seconds
        self.requests = deque()
        self.lock = Lock()

    def wait_if_needed(self) -> Optional[float]:
        """
        Check if we need to wait before making another request.
        Returns the wait time in seconds if rate limited, None otherwise.
        """
        with self.lock:
            now = time.time()

            # Remove requests outside the time window
            while self.requests and self.requests[0] < now - self.time_window:
                self.requests.popleft()

            # Check if we're at the limit
            if len(self.requests) >= self.max_requests:
                # Calculate how long to wait
                oldest_request = self.requests[0]
                wait_time = self.time_window - (now - oldest_request)
                if wait_time > 0:
                    return wait_time

            # Record this request
            self.requests.append(now)
            return None


_gemini_rate_limiter = None


def get_gemini_rate_limiter() -> RateLimiter:
    """
    Singleton rate limiter for Gemini API.
    Free tier limits: 15 RPM (requests per minute)
    """
    global _gemini_rate_limiter  # noqa: PLW0603
    if _gemini_rate_limiter is None:
        # Allow 10 requests per minute to stay well under the 15 RPM limit
        _gemini_rate_limiter = RateLimiter(max_requests=10, time_window_seconds=60)
    return _gemini_rate_limiter
