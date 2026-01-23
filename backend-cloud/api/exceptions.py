"""Custom exceptions for the application."""


class BaseAPIException(Exception):  # noqa: N818
    """Base exception for all API errors."""

    def __init__(
        self, message: str, status_code: int = 500, details: dict | None = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


# Session Exceptions
class SessionError(BaseAPIException):
    """Base class for session-related errors."""

    pass


class SessionNotFoundError(SessionError):
    """Raised when session ID is invalid or expired."""

    def __init__(self, session_id: str):
        super().__init__(
            message=f"Session not found or expired: {session_id}",
            status_code=404,
            details={"session_id": session_id},
        )


class SessionExpiredError(SessionError):
    """Raised when session has timed out."""

    def __init__(self, session_id: str):
        super().__init__(
            message=f"Session expired: {session_id}",
            status_code=401,
            details={"session_id": session_id},
        )


class IncompleteFingerprintsError(SessionError):
    """Raised when insufficient fingerprints are collected."""

    def __init__(self, required: int, received: int):
        super().__init__(
            message=f"Need {required} fingerprints, only have {received}",
            status_code=400,
            details={"required": required, "received": received},
        )


# ML Model Exceptions
class MLServiceError(BaseAPIException):
    """Base class for ML service errors."""

    pass


class ModelNotLoadedError(MLServiceError):
    """Raised when ML model is not loaded."""

    def __init__(self, model_name: str):
        super().__init__(
            message=f"Model not loaded: {model_name}",
            status_code=503,
            details={"model_name": model_name},
        )


class ModelLoadError(MLServiceError):
    """Raised when model fails to load."""

    def __init__(self, model_path: str, error: str):
        super().__init__(
            message=f"Failed to load model from {model_path}: {error}",
            status_code=500,
            details={"model_path": model_path, "error": error},
        )


class PredictionError(MLServiceError):
    """Raised when model prediction fails."""

    def __init__(self, error: str):
        super().__init__(
            message=f"Prediction failed: {error}",
            status_code=500,
            details={"error": error},
        )


# Image Processing Exceptions
class ImageProcessingError(BaseAPIException):
    """Base class for image processing errors."""

    pass


class InvalidImageError(ImageProcessingError):
    """Raised when image is invalid or corrupted."""

    def __init__(self, reason: str):
        super().__init__(
            message=f"Invalid image: {reason}",
            status_code=400,
            details={"reason": reason},
        )


class ImageSizeLimitError(ImageProcessingError):
    """Raised when image exceeds size limit."""

    def __init__(self, size_mb: float, max_mb: float):
        super().__init__(
            message=f"Image size ({size_mb:.2f}MB) exceeds limit ({max_mb}MB)",
            status_code=413,
            details={"size_mb": size_mb, "max_mb": max_mb},
        )


class NoValidImagesError(ImageProcessingError):
    """Raised when no valid images are provided."""

    def __init__(self):
        super().__init__(
            message="No valid fingerprint images provided", status_code=400
        )


# Storage Exceptions
class StorageError(BaseAPIException):
    """Base class for storage errors."""

    pass


class StorageConnectionError(StorageError):
    """Raised when cannot connect to storage."""

    def __init__(self, error: str):
        super().__init__(
            message=f"Storage connection failed: {error}",
            status_code=503,
            details={"error": error},
        )


class RecordNotFoundError(StorageError):
    """Raised when record does not exist."""

    def __init__(self, record_id: str):
        super().__init__(
            message=f"Record not found: {record_id}",
            status_code=404,
            details={"record_id": record_id},
        )


class StorageSaveError(StorageError):
    """Raised when saving to storage fails."""

    def __init__(self, error: str):
        super().__init__(
            message=f"Failed to save to storage: {error}",
            status_code=500,
            details={"error": error},
        )


# Validation Exceptions
class ValidationError(BaseAPIException):
    """Base class for validation errors."""

    def __init__(self, field: str, message: str):
        super().__init__(
            message=f"Validation error in field '{field}': {message}",
            status_code=400,
            details={"field": field},
        )


class InvalidAgeError(ValidationError):
    """Raised when age is invalid."""

    def __init__(self, age: int):
        super().__init__(
            field="age", message=f"Age must be between 1 and 120. Got: {age}"
        )


class InvalidBMIError(ValidationError):
    """Raised when BMI calculation is invalid."""

    def __init__(self, weight: float, height: float):
        super().__init__(
            field="bmi", message=f"Invalid BMI for weight={weight}kg, height={height}cm"
        )


class InvalidGenderError(ValidationError):
    """Raised when gender value is invalid."""

    def __init__(self, gender: str):
        super().__init__(
            field="gender",
            message=f"Gender must be 'Male' or 'Female'. Got: '{gender}'",
        )


# External Service Exceptions
class ExternalServiceError(BaseAPIException):
    """Base class for external service errors."""

    pass


class GeminiAPIError(ExternalServiceError):
    """Raised when Gemini API fails."""

    def __init__(self, error: str):
        super().__init__(
            message=f"Gemini API error: {error}",
            status_code=503,
            details={"service": "Gemini AI", "error": error},
        )


class QuotaExceededError(ExternalServiceError):
    """Raised when API quota is exceeded."""

    def __init__(self, service: str, retry_after: int | None = None):
        message = f"{service} quota exceeded"
        if retry_after:
            message += f". Retry after {retry_after} seconds"

        super().__init__(
            message=message,
            status_code=429,
            details={"service": service, "retry_after": retry_after},
        )


# Rate Limiting
class RateLimitExceeded(BaseAPIException):
    """Raised when rate limit is exceeded."""

    def __init__(self, limit: int, window: str, retry_after: int | None = None):
        message = f"Rate limit exceeded: {limit} requests per {window}"
        if retry_after:
            message += f". Retry after {retry_after} seconds"

        super().__init__(
            message=message,
            status_code=429,
            details={"limit": limit, "window": window, "retry_after": retry_after},
        )


# Authentication/Authorization (for future)
class AuthenticationError(BaseAPIException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=401)


class AuthorizationError(BaseAPIException):
    """Raised when user lacks permission."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(message=message, status_code=403)
