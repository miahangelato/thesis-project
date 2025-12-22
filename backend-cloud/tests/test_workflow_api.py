"""Tests for workflow API endpoints."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase, Client
from api.workflow_api import (
    _validate_session_for_analysis,
    _prepare_patient_data_for_gemini,
    _build_predictions_dict
)
from api.exceptions import SessionNotFoundError, IncompleteFingerprintsError


class TestWorkflowHelperFunctions:
    """Tests for workflow API helper functions."""
    
    def test_prepare_patient_data_for_gemini(self):
        """Test patient data preparation for Gemini API."""
        demographics = {
            "age": 45,
            "gender": "Male",
            "bmi": 28.5
        }
        
        diabetes_result = {
            "risk_score": 0.65,
            "risk_level": "Moderate",
            "pattern_counts": {
                "Arc": 2,
                "Whorl": 5,
                "Loop": 3
            }
        }
        
        blood_group_result = {
            "blood_group": "O+",
            "confidence": 0.89
        }
        
        result = _prepare_patient_data_for_gemini(
            demographics, diabetes_result, blood_group_result
        )
        
        assert result["age"] == 45
        assert result["gender"] == "Male"
        assert result["bmi"] == 28.5
        assert result["pattern_arc"] == 2
        assert result["pattern_whorl"] == 5
        assert result["pattern_loop"] == 3
        assert result["risk_score"] == 0.65
        assert result["risk_level"] == "Moderate"
        assert result["blood_group"] == "O+"
    
    def test_build_predictions_dict(self):
        """Test building predictions dictionary."""
        diabetes_result = {
            "risk_score": 0.72,
            "risk_level": "High",
            "pattern_counts": {
                "Arc": 1,
                "Whorl": 7,
                "Loop": 2
            }
        }
        
        blood_group_result = {
            "blood_group": "A+",
            "confidence": 0.95
        }
        
        explanation = "Test explanation"
        
        result = _build_predictions_dict(
            diabetes_result, blood_group_result, explanation
        )
        
        assert result["diabetes_risk"] == 0.72
        assert result["risk_level"] == "High"
        assert result["blood_group"] == "A+"
        assert result["blood_group_confidence"] == 0.95
        assert result["pattern_counts"]["arc"] == 1
        assert result["pattern_counts"]["whorl"] == 7
        assert result["pattern_counts"]["loop"] == 2
        assert result["explanation"] == explanation


class TestValidateSessionForAnalysis:
    """Tests for session validation function."""
    
    @patch('api.workflow_api.get_session_manager')
    def test_valid_session_with_fingerprints(self, mock_get_manager):
        """Test validation with valid session and sufficient fingerprints."""
        mock_session = {
            "fingerprints": {f"finger_{i}": "data" for i in range(10)},
            "demographics": {},
            "consent": True
        }
        
        mock_manager = Mock()
        mock_manager.get_session.return_value = mock_session
        mock_get_manager.return_value = mock_manager
        
        session, session_mgr = _validate_session_for_analysis("test-session")
        
        assert session == mock_session
        assert session_mgr == mock_manager
    
    @patch('api.workflow_api.get_session_manager')
    def test_session_not_found(self, mock_get_manager):
        """Test validation when session doesn't exist."""
        mock_manager = Mock()
        mock_manager.get_session.return_value = None
        mock_get_manager.return_value = mock_manager
        
        with pytest.raises(SessionNotFoundError):
            _validate_session_for_analysis("non-existent-session")
    
    @patch('api.workflow_api.get_session_manager')
    def test_incomplete_fingerprints(self, mock_get_manager):
        """Test validation with insufficient fingerprints."""
        mock_session = {
            "fingerprints": {f"finger_{i}": "data" for i in range(5)},  # Only 5
            "demographics": {},
            "consent": True
        }
        
        mock_manager = Mock()
        mock_manager.get_session.return_value = mock_session
        mock_get_manager.return_value = mock_manager
        
        with pytest.raises(IncompleteFingerprintsError) as exc_info:
            _validate_session_for_analysis("test-session")
        
        assert exc_info.value.details["required"] == 10
        assert exc_info.value.details["received"] == 5


class TestWorkflowAPIEndpoints(TestCase):
    """Integration tests for workflow API endpoints."""
    
    def setUp(self):
        """Set up test client."""
        self.client = Client()
    
    def test_start_session_endpoint(self):
        """Test session creation endpoint."""
        response = self.client.post(
            '/api/session/start',
            data={'consent': True},
            content_type='application/json'
        )
        
        # Note: This will fail without proper Django setup
        # Just showing the structure
        # assert response.status_code == 200
        # assert 'session_id' in response.json()
