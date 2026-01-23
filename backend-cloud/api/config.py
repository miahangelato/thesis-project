"""
Configuration management for different environments.
Handles localhost (dev) and production (Railway + Tailscale).
"""

import os
import subprocess
from typing import Optional

# ============================================================================
# ENVIRONMENT DETECTION
# ============================================================================

IS_RAILWAY = os.getenv("RAILWAY_ENVIRONMENT") is not None
IS_DEVELOPMENT = os.getenv("DJANGO_ENV") == "development" or not IS_RAILWAY

# ============================================================================
# EDGE NODE CONNECTION (Dev vs Production)
# ============================================================================

def get_edge_node_url() -> str:
    """
    Get edge node URL based on environment.
    
    DEV: localhost:5000 (same machine)
    PROD: Tailscale private IP (100.x.x.x:5000)
    """
    if IS_DEVELOPMENT:
        # Development: Use localhost
        return "http://localhost:5000"
    
    # Production: Use Tailscale IP
    edge_node_ip = get_tailscale_peer_ip("kiosk-scanner")
    
    if not edge_node_ip:
        # Fallback: Try environment variable
        edge_node_ip = os.getenv("EDGE_NODE_TAILSCALE_IP")
    
    if not edge_node_ip:
        raise ValueError(
            "Edge node not found on Tailscale network. "
            "Ensure kiosk is connected and hostname is 'kiosk-scanner'"
        )
    
    return f"http://{edge_node_ip}:5000"


def get_tailscale_peer_ip(hostname: str) -> Optional[str]:
    """Get Tailscale IP of a peer by hostname."""
    try:
        result = subprocess.run(
            ["tailscale", "status", "--json"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            print(f"Tailscale not running: {result.stderr}")
            return None
        
        import json
        status = json.loads(result.stdout)
        
        # Search for peer by hostname
        for peer in status.get("Peer", {}).values():
            peer_hostname = peer.get("HostName", "")
            if peer_hostname == hostname:
                tailscale_ips = peer.get("TailscaleIPs", [])
                if tailscale_ips:
                    return tailscale_ips[0]  # Return first IPv4
        
        print(f"Tailscale peer '{hostname}' not found")
        return None
        
    except Exception as e:
        print(f"Error getting Tailscale IP: {e}")
        return None


# ============================================================================
# CONFIGURATION VALUES
# ============================================================================

# Edge Node URL
EDGE_NODE_URL = get_edge_node_url()

# API Key (required in production)
SCANNER_SECRET = os.getenv("SCANNER_SECRET")

if IS_RAILWAY and not SCANNER_SECRET:
    raise ValueError("SCANNER_SECRET must be set in Railway environment")

# Frontend Origins (CORS)
if IS_DEVELOPMENT:
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
else:
    # Production: Vercel domains
    ALLOWED_ORIGINS = [
        os.getenv("FRONTEND_URL", "https://your-app.vercel.app"),
        "https://your-app-*.vercel.app",  # Preview deployments
    ]

# Public URL (for QR codes, etc.)
if IS_RAILWAY:
    # Railway provides this automatically
    PUBLIC_URL = os.getenv("RAILWAY_PUBLIC_DOMAIN", "https://your-app.railway.app")
else:
    PUBLIC_URL = "http://localhost:8000"

print(f"🌐 Environment: {'PRODUCTION' if IS_RAILWAY else 'DEVELOPMENT'}")
print(f"🔗 Edge Node URL: {EDGE_NODE_URL}")
print(f"🌍 Public URL: {PUBLIC_URL}")
print(f"🔐 CORS Origins: {ALLOWED_ORIGINS}")
