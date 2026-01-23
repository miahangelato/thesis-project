"""
Configuration for Kiosk Scanner Application
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Server Configuration
HOST = os.getenv("KIOSK_SCANNER_HOST", "127.0.0.1")  # Localhost only (secure)
PORT = int(os.getenv("KIOSK_SCANNER_PORT", 5000))  # Non-privileged port
DEBUG = os.getenv("KIOSK_SCANNER_DEBUG", "True").lower() == "true"

# CORS Configuration - Allow frontend to connect
CORS_ORIGINS = os.getenv("KIOSK_SCANNER_CORS_ORIGINS", "").split(",")
CORS_ALLOW_ALL = os.getenv("KIOSK_SCANNER_CORS_ALLOW_ALL", "False").lower() == "true"

# Cloud Backend Configuration (Dev vs Production)
import subprocess
import sys

def get_backend_url():
    """
    Get backend URL based on environment.
    
    DEV: localhost:8000 (same machine during development)
    PROD: Railway Tailscale IP (100.x.x.x:8000)
    """
    # Check if explicitly set in .env
    explicit_url = os.getenv("KIOSK_SCANNER_CLOUD_API_URL")
    if explicit_url:
        print(f"[CONFIG] Using explicit backend URL: {explicit_url}")
        return explicit_url
    
    # Auto-detect: If Tailscale is installed, assume production
    try:
        result = subprocess.run(
            ["tailscale", "status"],
            capture_output=True,
            text=True,
            timeout=5,
            shell=True  # Windows needs shell
        )
        
        if result.returncode == 0:
            # Tailscale is running - production mode
            # Look for Railway backend
            for line in result.stdout.split("\n"):
                if "railway-backend" in line.lower():
                    # Parse IP (first column)
                    parts = line.split()
                    if parts:
                        backend_ip = parts[0]
                        url = f"http://{backend_ip}:8000/api"
                        print(f"[CONFIG] Found Railway backend via Tailscale: {url}")
                        return url
            
            print("[CONFIG] WARNING: Tailscale running but railway-backend not found")
            print("[CONFIG] Falling back to localhost (dev mode)")
            return "http://localhost:8000/api"
        
    except FileNotFoundError:
        # Tailscale not installed - development mode
        print("[CONFIG] Tailscale not installed - using localhost (dev mode)")
    except Exception as e:
        print(f"[CONFIG] Error checking Tailscale: {e}")
    
    # Default: localhost (development)
    return "http://localhost:8000/api"

CLOUD_API_URL = get_backend_url()
BACKEND_BASE_URL = CLOUD_API_URL.replace("/api", "")  # Remove /api suffix

print(f"🌐 Backend URL: {CLOUD_API_URL}")


# Note: Scanner DLLs are auto-detected from System32 or SDK installation paths
# No need for hardcoded fallback paths since scanner_real.py handles DLL loading