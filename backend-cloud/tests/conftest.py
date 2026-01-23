"""Test configuration and fixtures."""

import os
import sys

import django
import pytest

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Setup Django
django.setup()


@pytest.fixture
def mock_session_data():
    """Fixture providing mock session data."""
    return {
        "consent": True,
        "created_at": "2025-12-22T10:00:00",
        "expires_at": "2025-12-22T11:00:00",
        "demographics": {
            "age": 45,
            "weight_kg": 75,
            "height_cm": 170,
            "gender": "Male",
            "bmi": 25.95,
        },
        "fingerprints": {f"finger_{i}": f"base64_data_{i}" for i in range(10)},
        "predictions": None,
        "completed": False,
    }


@pytest.fixture
def mock_ml_results():
    """Fixture providing mock ML prediction results."""
    return {
        "diabetes": {
            "risk_score": 0.65,
            "risk_level": "Moderate",
            "confidence": 0.87,
            "pattern_counts": {"Arc": 2, "Whorl": 5, "Loop": 3},
            "bmi": 25.95,
        },
        "blood_group": {"blood_group": "O+", "confidence": 0.92},
    }


@pytest.fixture
def sample_patient_data():
    """Fixture providing sample patient data."""
    return {
        "age": 45,
        "weight_kg": 75,
        "height_cm": 170,
        "gender": "Male",
        "blood_type": "O+",
        "bmi": 25.95,
        "pattern_arc": 2,
        "pattern_whorl": 5,
        "pattern_loop": 3,
        "risk_score": 0.65,
        "risk_level": "Moderate",
    }
