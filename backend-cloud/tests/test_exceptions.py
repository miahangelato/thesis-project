"""Tests for custom exceptions."""

from api.exceptions import (
    BaseAPIException,
    IncompleteFingerprintsError,
    InvalidImageError,
    ModelNotLoadedError,
    NoValidImagesError,
    SessionExpiredError,
    SessionNotFoundError,
)


class TestSessionExceptions:
    """Tests for session-related exceptions."""

    def test_session_not_found_error(self):
        """Test SessionNotFoundError."""
        session_id = "test-session-123"
        error = SessionNotFoundError(session_id)

        assert error.status_code == 404
        assert session_id in error.message
        assert error.details["session_id"] == session_id

    def test_session_expired_error(self):
        """Test SessionExpiredError."""
        session_id = "expired-session-456"
        error = SessionExpiredError(session_id)

        assert error.status_code == 401
        assert "expired" in error.message.lower()
        assert error.details["session_id"] == session_id

    def test_incomplete_fingerprints_error(self):
        """Test IncompleteFingerprintsError."""
        error = IncompleteFingerprintsError(required=10, received=5)

        assert error.status_code == 400
        assert "10" in error.message
        assert "5" in error.message
        assert error.details["required"] == 10
        assert error.details["received"] == 5


class TestMLExceptions:
    """Tests for ML-related exceptions."""

    def test_model_not_loaded_error(self):
        """Test ModelNotLoadedError."""
        model_name = "diabetes_model"
        error = ModelNotLoadedError(model_name)

        assert error.status_code == 503
        assert model_name in error.message
        assert error.details["model_name"] == model_name


class TestImageExceptions:
    """Tests for image processing exceptions."""

    def test_invalid_image_error(self):
        """Test InvalidImageError."""
        reason = "Corrupted image data"
        error = InvalidImageError(reason)

        assert error.status_code == 400
        assert reason in error.message
        assert error.details["reason"] == reason

    def test_no_valid_images_error(self):
        """Test NoValidImagesError."""
        error = NoValidImagesError()

        assert error.status_code == 400
        assert "no valid" in error.message.lower()


class TestBaseAPIException:
    """Tests for base exception class."""

    def test_base_exception_attributes(self):
        """Test BaseAPIException has required attributes."""
        error = BaseAPIException(
            message="Test error", status_code=418, details={"foo": "bar"}
        )

        assert error.message == "Test error"
        assert error.status_code == 418
        assert error.details == {"foo": "bar"}
        assert str(error) == "Test error"
