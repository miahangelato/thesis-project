"""
Configuration for Kiosk Scanner Application
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Server Configuration
HOST = os.getenv("KIOSK_SCANNER_HOST", "0.0.0.0")
PORT = int(os.getenv("KIOSK_SCANNER_PORT", 80))
DEBUG = os.getenv("KIOSK_SCANNER_DEBUG", "True").lower() == "true"

# CORS Configuration - Allow frontend to connect
CORS_ORIGINS = os.getenv("KIOSK_SCANNER_CORS_ORIGINS", "").split(",")
CORS_ALLOW_ALL = os.getenv("KIOSK_SCANNER_CORS_ALLOW_ALL", "True").lower() == "true"

# Cloud Backend Configuration
CLOUD_API_URL = os.getenv("KIOSK_SCANNER_CLOUD_API_URL")

# Scanner Configuration
SCANNER_TIMEOUT = int(os.getenv("KIOSK_SCANNER_TIMEOUT", 30))
SCANNER_RETRY_ATTEMPTS = int(os.getenv("KIOSK_SCANNER_RETRY_ATTEMPTS", 3))

# Security
API_KEY = os.getenv("KIOSK_SCANNER_API_KEY")

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SDK_DIR = os.path.join(BASE_DIR, "sdk")

# Scanner SDK paths
SDK_INSTALLED_PATH = os.getenv(
    "KIOSK_SCANNER_SDK_INSTALLED_PATH",
    r"C:\Program Files\DigitalPersona\U.are.U SDK\Windows\Lib"
)
SCANNER_DLLS = {
    "dpfpdd": os.path.join(SDK_INSTALLED_PATH, "x64", "dpfpdd.dll"),
    "dpfj": os.path.join(SDK_INSTALLED_PATH, "x64", "dpfj.dll")
}

BACKEND_BASE_URL = os.getenv("KIOSK_SCANNER_BACKEND_BASE_URL")


# Fallback paths
SCANNER_DLLS_FALLBACK = {
    "dpfpdd": os.path.join(SDK_DIR, "x64", "dpfpdd.dll"),
    "dpfj": os.path.join(SDK_DIR, "x64", "dpfj.dll")
}

# SDK Runtime Environment paths
SDK_RTE_X64 = os.path.join(SDK_DIR, "RTE", "x64")
SDK_RTE_X86 = os.path.join(SDK_DIR, "RTE", "x86")