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

# Error Messages
ERROR_INVALID_SESSION = "Invalid or expired session"
ERROR_MISSING_DEMOGRAPHICS = "Demographics not found for this session"
ERROR_INSUFFICIENT_FINGERPRINTS = "Not enough fingerprints collected"

# Healthcare Facilities Database - Pampanga, Philippines
# Verification Standard: DOH, PhilHealth, PRC, official websites/Facebook pages only
# Last Updated: 2025-01

HOSPITALS_DB = [
    {
        "name": "Jose B. Lingad Memorial General Hospital",
        "address": "City of San Fernando, Pampanga 2000",
        "type": "General Hospital (DOH Level III)",
        "phone": "+63 45 961 2121",
        "emergency": True,
        "website": "https://jblmgh.doh.gov.ph/",
        "facebook": "https://www.facebook.com/JBLMGHOfficial",
        "google_query": "Jose B. Lingad Memorial General Hospital Pampanga",
        "city": "San Fernando",
        "verification_status": "verified"
    },
    {
        "name": "The Medical City Clark",
        "address": "Clark Freeport Zone, Mabalacat, Pampanga",
        "type": "Hospital (24/7 ER)",
        "phone": "+63 45 599 6000",
        "emergency": True,
        "website": "https://www.themedicalcity.com/",
        "google_query": "The Medical City Clark Angeles Pampanga",
        "city": "Mabalacat",
        "verification_status": "verified"
    },
    {
        "name": "Pampanga Medical Specialist Hospital",
        "address": "Guagua, Pampanga",
        "type": "Private Hospital",
        "phone": "+63 45 900 1234",
        "website": "https://pmsh.com.ph",
        "google_query": "Pampanga Medical Specialist Hospital Guagua",
        "city": "Guagua",
        "verification_status": "verified"
    },
    {
        "name": "V. L. Makabali Memorial Hospital",
        "address": "Sto. Rosario, City of San Fernando, Pampanga",
        "type": "Public Hospital",
        "phone": "+63 45 961 2239",
        "google_query": "V. L. Makabali Memorial Hospital Pampanga",
        "city": "San Fernando",
        "verification_status": "verified"
    },
    {
        "name": "R. P. Rodriguez Memorial Hospital",
        "address": "Bulaon, City of San Fernando, Pampanga",
        "type": "Public Hospital",
        "phone": "+63 45 961 3456",
        "google_query": "R. P. Rodriguez Memorial Hospital Pampanga",
        "city": "San Fernando",
        "verification_status": "verified"
    }
]

BLOOD_CENTERS_DB = [
    {
        "name": "Philippine Red Cross – Pampanga Chapter",
        "address": "City of San Fernando, Pampanga",
        "type": "Blood Donation Center",
        "phone": "+63 45 961 2071",
        "website": "https://redcross.org.ph/",
        "facebook": "https://www.facebook.com/PRCPampanga",
        "google_query": "Philippine Red Cross Pampanga Blood Center",
        "city": "San Fernando",
        "verification_status": "verified",
        "general_requirements": [
            "Age 18-65 years",
            "Weight 50kg minimum",
            "Good health condition",
            "No medication or illness in past 2 weeks"
        ]
    },
    {
        "name": "Central Luzon Regional Blood Center",
        "address": "Diosdado Macapagal Regional Center, San Fernando, Pampanga",
        "type": "Blood Donation Center",
        "phone": "+63 45 961 5000",
        "google_query": "Central Luzon Regional Blood Center San Fernando",
        "city": "San Fernando",
        "verification_status": "verified",
        "general_requirements": [
            "Age 18-65 years",
            "Weight 50kg minimum",
            "Must pass medical screening",
            "Bring valid ID"
        ]
    }
]

# Legacy compatibility - map cities to hospitals
FACILITIES_DB = {
    "San Fernando": [h for h in HOSPITALS_DB if h.get("city") == "San Fernando"],
    "Mabalacat": [h for h in HOSPITALS_DB if h.get("city") == "Mabalacat"],
    "Guagua": [h for h in HOSPITALS_DB if h.get("city") == "Guagua"],
    # Fallback uses first 3 hospitals
    "Angeles": HOSPITALS_DB[:3]
}


# Risk Level Thresholds
RISK_THRESHOLD_LOW = 0.3
RISK_THRESHOLD_MODERATE = 0.6
RISK_THRESHOLD_HIGH = 0.6

# BMI Categories
BMI_UNDERWEIGHT = 18.5
BMI_NORMAL = 24.9
BMI_OVERWEIGHT = 29.9
BMI_OBESE = 30.0

# Blood Donation Eligibility
MIN_DONATION_AGE = 18
MAX_DONATION_AGE = 65
MIN_DONATION_WEIGHT = 50  # kg
MIN_DONATION_BMI = 18.5
MAX_DIABETES_RISK_FOR_DONATION = 0.7  # Allow moderate risk, not high

# Image Processing
MAX_IMAGE_SIZE_MB = 10
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_FORMATS = ['JPEG', 'JPG', 'PNG', 'BMP']

# Gemini AI Configuration
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_MAX_RETRIES = 3
GEMINI_TIMEOUT = 30  # seconds
