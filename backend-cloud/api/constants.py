"""Application constants and configuration values."""

# API Configuration
API_VERSION = "1.0.0"
API_TITLE = "Diabetes Risk Prediction API"
API_DESCRIPTION = "Cloud-hybrid IoT system for diabetes risk assessment"

# Session Configuration
SESSION_TIMEOUT_HOURS = 1
SESSION_CLEANUP_INTERVAL_MINUTES = 30
REQUIRED_FINGERPRINTS_COUNT = 10

# ML Model Configuration
PATTERN_CLASSES = ["Arc", "Loop", "Whorl"]
BLOOD_GROUPS = ["A", "B", "AB", "O"]
PATTERN_IMAGE_SIZE = (224, 224)
FINGERPRINT_IMAGE_SIZE = (224, 224)

# Risk Level Thresholds
RISK_THRESHOLD_LOW = 0.3
RISK_THRESHOLD_MODERATE = 0.6
RISK_THRESHOLD_HIGH = 0.6

# BMI Categories
BMI_UNDERWEIGHT = 18.5
BMI_NORMAL = 24.9
BMI_OVERWEIGHT = 29.9
BMI_OBESE = 30.0

# Model Paths (relative to backend-cloud root)
MODEL_DIR = "shared-models"
DIABETES_MODEL_PATH = f"{MODEL_DIR}/final_no_age_model.pkl"
DIABETES_SCALER_PATH = f"{MODEL_DIR}/final_no_age_scaler.pkl"
DIABETES_IMPUTER_PATH = f"{MODEL_DIR}/final_no_age_imputer.pkl"
PATTERN_CNN_PATH = f"{MODEL_DIR}/improved_pattern_cnn_model_retrained.h5"
BLOOD_GROUP_CNN_PATH = f"{MODEL_DIR}/blood_group_improved_cnn.h5"
GENDER_ENCODER_PATH = f"{MODEL_DIR}/gender_encoder.pkl"
SUPPORT_SET_DIR = f"{MODEL_DIR}/test"

# Gemini Configuration
GEMINI_MODEL_NAME = "gemini-1.5-flash"
GEMINI_MAX_RETRIES = 3
GEMINI_TIMEOUT_SECONDS = 30
GEMINI_RATE_LIMIT_RPM = 10  # Requests per minute
GEMINI_CACHE_TTL_MINUTES = 120

# Rate Limiting (per minute)
RATE_LIMIT_ANALYZE = 20
RATE_LIMIT_DIAGNOSE = 20
RATE_LIMIT_SESSION_CREATE = 30
RATE_LIMIT_FINGERPRINT_UPLOAD = 100
RATE_LIMIT_DEFAULT = 60

# File Upload Limits
MAX_IMAGE_SIZE_MB = 5
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_FORMATS = ["JPEG", "PNG", "BMP"]

# Database
DB_CONNECTION_MAX_AGE = 600  # seconds
DB_CONN_POOL_SIZE = 10

# Logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
LOG_LEVEL_DEVELOPMENT = "DEBUG"
LOG_LEVEL_PRODUCTION = "INFO"

# Security
PASSWORD_MIN_LENGTH = 12
API_KEY_LENGTH = 32
SESSION_COOKIE_AGE = 3600  # 1 hour
ALLOWED_HOSTS_DEVELOPMENT = ["localhost", "127.0.0.1"]

# CORS
CORS_ALLOWED_ORIGINS_DEVELOPMENT = [
    "http://localhost:3000",
    "http://localhost:8001",
    "http://127.0.0.1:3000",
]

# Storage (Supabase)
STORAGE_BUCKET_REPORTS = "reports"
STORAGE_BUCKET_QR_CODES = "qr_codes"
STORAGE_BUCKET_FINGERPRINTS = "fingerprints"

# PDF Generation
PDF_QR_SIZE_PX = 200
PDF_MARGIN_MM = 10
PDF_FONT_SIZE_TITLE = 16
PDF_FONT_SIZE_BODY = 11
PDF_FONT_SIZE_FOOTER = 8

# Error Messages
ERROR_INVALID_SESSION = "Invalid or expired session"
ERROR_FINGERPRINT_COUNT = "Need 10 fingerprints, only have {count}"
ERROR_ANALYSIS_FAILED = "Analysis failed: {error}"
ERROR_RECORD_NOT_FOUND = "Record not found"
ERROR_NO_VALID_IMAGES = "No valid fingerprint images provided"
ERROR_MODEL_NOT_LOADED = "ML models not loaded"
ERROR_STORAGE_UNAVAILABLE = "Storage service unavailable"

# Success Messages
SUCCESS_SESSION_CREATED = "Session created successfully"
SUCCESS_DEMOGRAPHICS_SAVED = "Demographics saved. Proceed with fingerprint scanning."
SUCCESS_FINGERPRINT_RECEIVED = "Fingerprint received successfully"
SUCCESS_ANALYSIS_COMPLETE = "Analysis completed successfully"
SUCCESS_PDF_GENERATED = "PDF report generated successfully"

# HTTP Status Codes (for clarity)
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_FORBIDDEN = 403
HTTP_NOT_FOUND = 404
HTTP_TOO_MANY_REQUESTS = 429
HTTP_INTERNAL_ERROR = 500
HTTP_SERVICE_UNAVAILABLE = 503
