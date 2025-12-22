"""Simple smoke tests to verify basic functionality."""

import pytest


def test_constants_import():
    """Test that constants module can be imported."""
    from api.constants import REQUIRED_FINGERPRINTS_COUNT, API_VERSION
    assert REQUIRED_FINGERPRINTS_COUNT == 10
    assert API_VERSION == "1.0.0"


def test_exceptions_import():
    """Test that exceptions module can be imported."""
    from api.exceptions import (
        SessionNotFoundError,
        IncompleteFingerprintsError,
        BaseAPIException
    )
    assert SessionNotFoundError
    assert IncompleteFingerprintsError
    assert BaseAPIException


def test_cache_service_import():
    """Test that cache service can be imported."""
    from api.cache_service import get_response_cache
    cache = get_response_cache()
    assert cache is not None


def test_rate_limiter_import():
    """Test that rate limiter can be imported."""
    from api.rate_limiter import get_gemini_rate_limiter
    limiter = get_gemini_rate_limiter()
    assert limiter is not None


def test_exception_creation():
    """Test creating exceptions."""
    from api.exceptions import SessionNotFoundError, IncompleteFingerprintsError
    
    # Test SessionNotFoundError
    error1 = SessionNotFoundError("test-123")
    assert error1.status_code == 404
    assert "test-123" in error1.message
    
    # Test IncompleteFingerprintsError
    error2 = IncompleteFingerprintsError(required=10, received=5)
    assert error2.status_code == 400
    assert error2.details["required"] == 10
    assert error2.details["received"] == 5


def test_cache_basic_operations():
    """Test basic cache operations."""
    from api.cache_service import get_response_cache
    
    cache = get_response_cache()
    
    test_data = {
        "age": 45,
        "bmi": 28.5,
        "risk_level": "Moderate"
    }
    
    # Should return None for new data
    result = cache.get(test_data)
    assert result is None
    
    # Set cache
    cache.set(test_data, "Test response")
    
    # Should return cached value
    result = cache.get(test_data)
    assert result == "Test response"
