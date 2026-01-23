"""
Edge Node Security Configuration
Implements multi-layer protection for localhost scanner endpoint
"""

import os
from functools import wraps
from flask import request, jsonify

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

# Allowed origins (CORS)
ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_URL", "https://your-app.vercel.app"),
    "https://your-app-*.vercel.app",  # Preview deployments
    "http://localhost:3000",  # Development only
]

# Bind to localhost only (not 0.0.0.0)
BIND_HOST = "127.0.0.1"  # ✅ Localhost only, not accessible from network
BIND_PORT = 5000

# ============================================================================
# SECURITY MIDDLEWARE
# ============================================================================

def verify_origin(f):
    """
    Decorator to verify request origin.
    Prevents malicious sites from accessing scanner.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        origin = request.headers.get('Origin')
        referer = request.headers.get('Referer')
        
        # Allow requests without Origin (direct browser navigation)
        if not origin and not referer:
            # Could be initial page load or direct API call
            # In production, you might want to be stricter
            pass
        
        # Check origin
        if origin:
            if not any(origin.startswith(allowed.replace('*', '')) for allowed in ALLOWED_ORIGINS):
                return jsonify({
                    "error": "Unauthorized origin",
                    "origin": origin
                }), 403
        
        # Check referer as backup
        if referer:
            if not any(referer.startswith(allowed.replace('*', '')) for allowed in ALLOWED_ORIGINS):
                return jsonify({
                    "error": "Unauthorized referer",
                    "referer": referer
                }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def verify_session_token(f):
    """
    Optional: Verify that request includes valid session token.
    Adds second layer of authentication.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get session ID from request
        session_id = request.json.get('session_id') if request.is_json else request.args.get('session_id')
        
        if not session_id:
            return jsonify({"error": "Missing session_id"}), 401
        
        # Verify session exists and is active
        # (This check would use your ACTIVE_SESSION global)
        from app import ACTIVE_SESSION  # Import from main app
        
        if ACTIVE_SESSION.get("session_id") != session_id:
            return jsonify({"error": "Invalid or expired session"}), 401
        
        if ACTIVE_SESSION.get("state") != "active":
            return jsonify({"error": "Session not active"}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

# ============================================================================
# FLASK APP SECURITY CONFIG
# ============================================================================

def configure_security(app):
    """
    Apply security configurations to Flask app.
    Call this in app.py after creating the Flask app.
    """
    from flask_cors import CORS
    
    # CORS Configuration
    CORS(app, resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False  # No cookies needed
        }
    })
    
    # Security headers
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Don't cache sensitive scanner data
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    
    print(f"🔒 Security configured:")
    print(f"   - CORS origins: {ALLOWED_ORIGINS}")
    print(f"   - Bind address: {BIND_HOST}:{BIND_PORT}")
    print(f"   - Security headers: Enabled")

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

"""
In app.py:

from security_config import configure_security, verify_origin, verify_session_token, BIND_HOST, BIND_PORT

app = Flask(__name__)
socketio = SocketIO(app)

# Apply security config
configure_security(app)

# Protect endpoints
@app.route('/scan', methods=['POST'])
@verify_origin  # Check origin
@verify_session_token  # Check session (optional)
def start_scan():
    # Your scan logic
    pass

# Run with secure bind
if __name__ == '__main__':
    socketio.run(app, host=BIND_HOST, port=BIND_PORT)
"""
