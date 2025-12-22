"""
Main Kiosk Scanner Application
Flask-based API server for local scanner operations
"""
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import base64
import logging
import os
import ctypes
from datetime import datetime
import traceback
import requests
from functools import wraps

# Import the working scanner implementation
from scanner_real import FingerprintScanner, dpfpdd, DPFPDD_SUCCESS, capture_fingerprint_image
from config import HOST, PORT, DEBUG, CORS_ORIGINS, CORS_ALLOW_ALL
import os
from PIL import Image
import numpy as np
import io

# Backend API configuration
# Configuration - Switch between local and production
BACKEND_BASE_URL = os.getenv("KIOSK_SCANNER_BACKEND_BASE_URL")
# Railway backend URL (commented for local testing)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# Create Flask app
app = Flask(__name__)

# Configure CORS with comprehensive settings
if CORS_ALLOW_ALL:
    CORS(app, 
         origins="*",
         methods=['GET', 'POST', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'X-Frontend-Callback-URL'],
         expose_headers=['*'])
else:
    CORS(app, 
         origins=CORS_ORIGINS,
         methods=['GET', 'POST', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'X-Frontend-Callback-URL'],
         expose_headers=['*'])

# Add explicit OPTIONS handler for preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Global scanner instance
scanner = None

def scan_finger(finger_name: str = "index"):
    """Core fingerprint scanning function - using the working capture_fingerprint_image"""
    try:
        # Use the working capture function from scanner_real.py
        image_bytes, img_info, quality_flags = capture_fingerprint_image()
        
        if image_bytes and img_info:
            # Convert raw pixel data to PNG format
            width = img_info['width']
            height = img_info['height']
            bpp = img_info['bpp']
            
            if bpp == 8:  # 8-bit grayscale
                print(f"🔄 Converting raw image data: {len(image_bytes)} bytes, {width}x{height}")
                
                # Convert raw bytes to numpy array
                np_image = np.frombuffer(image_bytes, dtype=np.uint8).reshape((height, width))
                print(f"✅ NumPy array created: shape={np_image.shape}, dtype={np_image.dtype}")
                print(f"📊 Pixel statistics: min={np_image.min()}, max={np_image.max()}, mean={np_image.mean():.2f}")
                
                # Check if image is blank
                if np_image.max() == 0:
                    print("⚠️ WARNING: Image is completely black (all zeros)!")
                    print("🔍 This might indicate a problem with the scanner buffer or data extraction")
                
                # Create PIL Image from numpy array
                img = Image.fromarray(np_image, 'L')
                print(f"✅ PIL Image created: size={img.size}, mode={img.mode}")
                
                # Convert to PNG bytes
                png_buffer = io.BytesIO()
                img.save(png_buffer, format='PNG')
                png_bytes = png_buffer.getvalue()
                print(f"✅ PNG conversion complete: {len(png_bytes)} bytes")
                
                # Convert PNG to base64 for JSON transport
                base64_image = base64.b64encode(png_bytes).decode('utf-8')
                print(f"✅ Base64 encoding complete: {len(base64_image)} characters")
                
                return {
                    "success": True,
                    "image": base64_image,
                    "finger": finger_name,
                    "width": width,
                    "height": height,
                    "quality": quality_flags if quality_flags else 0
                }
            else:
                return {
                    "success": False,
                    "error": f"Unsupported image format: {bpp} BPP. Only 8-bit grayscale is supported.",
                    "debug_info": f"Image info: {img_info}"
                }
        else:
            return {
                "success": False,
                "error": "Fingerprint scanning failed. Please try the following tips:\n" +
                        "• Clean your finger and the scanner surface\n" +
                        "• Press your finger firmly but gently on the scanner\n" +
                        "• Keep your finger still during scanning\n" +
                        "• Make sure your finger is centered on the scanner\n" +
                        "• If your finger is too dry, lightly moisten it",
                "debug_info": "No image data returned from capture_fingerprint_image"
            }
    except Exception as e:
        return {
            "success": False,
            "error": "An error occurred while scanning. Please try again.",
            "debug_info": str(e)
        }

def send_to_backend(participant_data, fingerprint_data, finger_name, frontend_callback_url=None):
    """Send participant data and fingerprint to backend for processing"""
    try:
        print("🔄 Forwarding data to backend...")
        
        # Prepare payload for backend
        payload = {
            "participant_data": participant_data,
            "fingerprint_data": {
                "finger_name": finger_name,
                "image": fingerprint_data["image"],  # Changed from image_base64 to image
                "width": fingerprint_data["width"],
                "height": fingerprint_data["height"],
                "quality": fingerprint_data["quality"]
            },
            "timestamp": datetime.now().isoformat(),
            "frontend_callback_url": frontend_callback_url  # Include callback URL
        }
        
        # Send to backend API
        response = requests.post(
            f"{BACKEND_BASE_URL}/api/core/process-fingerprint/",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            backend_result = response.json()
            print("✅ Backend processing successful")
            return {
                "success": True,
                "backend_response": backend_result
            }
        else:
            print(f"❌ Backend error: {response.status_code}")
            return {
                "success": False,
                "error": f"Backend returned status {response.status_code}",
                "backend_response": response.text
            }
            
    except requests.exceptions.Timeout:
        print("⏰ Backend request timeout")
        return {
            "success": False,
            "error": "Backend request timeout"
        }
    except requests.exceptions.ConnectionError:
        print("🔌 Backend connection error")
        return {
            "success": False,
            "error": "Could not connect to backend"
        }
    except Exception as e:
        print(f"🚨 Backend communication error: {e}")
        return {
            "success": False,
            "error": f"Backend communication failed: {str(e)}"
        }

# Flask Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "kiosk-scanner",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/scanner/status', methods=['GET'])
def scanner_status():
    """Get scanner status"""
    try:
        # Quick DLL check first
        if not dpfpdd:
            return jsonify({
                "scanner_available": False,
                "status": "unavailable",
                "platform": "windows",
                "message": "Scanner DLLs not loaded"
            })
        
        # Try basic initialization (this usually works)
        status = dpfpdd.dpfpdd_init()
        if status == DPFPDD_SUCCESS:
            # Quick device count check
            device_count = ctypes.c_uint(0)
            query_status = dpfpdd.dpfpdd_query_devices(ctypes.byref(device_count), None)
            dpfpdd.dpfpdd_exit()  # Cleanup
            
            # Check admin status
            is_admin = ctypes.windll.shell32.IsUserAnAdmin()
            
            if device_count.value > 0:
                return jsonify({
                    "scanner_available": True,
                    "status": "ready",
                    "platform": "windows", 
                    "device_count": device_count.value,
                    "admin_required": not is_admin,
                    "message": f"Found {device_count.value} device(s). " + 
                              ("Ready to scan." if is_admin else "Run as Administrator for full functionality.")
                })
            else:
                return jsonify({
                    "scanner_available": False,
                    "status": "no_devices",
                    "platform": "windows",
                    "message": "No fingerprint devices detected"
                })
        else:
            return jsonify({
                "scanner_available": False,
                "status": "init_failed",
                "platform": "windows",
                "message": f"Scanner initialization failed: 0x{status:x}"
            })
            
    except Exception as e:
        return jsonify({
            "scanner_available": False,
            "status": "error",
            "platform": "windows",
            "message": f"Error checking scanner: {str(e)}"
        })

@app.route('/api/scanner/capture', methods=['POST', 'OPTIONS'])
def capture_fingerprint_endpoint():
    """Capture fingerprint and forward everything to backend for processing"""
    
    # Handle OPTIONS request (CORS preflight)
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response
    
    try:
        print("🔍 CAPTURE ENDPOINT - Received request")
        print(f"🔍 Request method: {request.method}")
        print(f"🔍 Request headers: {dict(request.headers)}")
        print(f"🔍 Request content type: {request.content_type}")
        
        # Get data from request
        raw_data = request.get_data()
        print(f"🔍 Raw request data: {raw_data}")
        
        data = request.get_json() or {}
        print(f"🔍 Parsed JSON data: {data}")
        
        finger_name = data.get('finger_name', 'index')
        print(f"🔍 Finger name: {finger_name}")
        
        # Extract participant data if provided
        participant_data = data.get('participant_data', {})
        print(f"🔍 Participant data present: {bool(participant_data)}")
        
        # Print participant data for debugging/logging
        if participant_data:
            print("=" * 60)
            print("📋 PARTICIPANT DATA RECEIVED:")
            print("=" * 60)
            print(f"👤 Age: {participant_data.get('age', 'N/A')}")
            print(f"📏 Height: {participant_data.get('height', 'N/A')} cm")
            print(f"⚖️  Weight: {participant_data.get('weight', 'N/A')} kg")
            print(f"👥 Gender: {participant_data.get('gender', 'N/A')}")
            print(f"🩸 Blood Type: {participant_data.get('blood_type', 'N/A')}")
            print(f"❤️  Willing to Donate: {participant_data.get('willing_to_donate', 'N/A')}")
            print(f"😴 Sleep Hours: {participant_data.get('sleep_hours', 'N/A')}")
            print(f"🍺 Had Alcohol (24h): {participant_data.get('had_alcohol_last_24h', 'N/A')}")
            print(f"🍽️  Ate Before Donation: {participant_data.get('ate_before_donation', 'N/A')}")
            print(f"🍟 Ate Fatty Food: {participant_data.get('ate_fatty_food', 'N/A')}")
            print(f"🔖 Recent Tattoo/Piercing: {participant_data.get('recent_tattoo_or_piercing', 'N/A')}")
            print(f"🏥 Has Chronic Condition: {participant_data.get('has_chronic_condition', 'N/A')}")
            print(f"💊 Condition Controlled: {participant_data.get('condition_controlled', 'N/A')}")
            print(f"📅 Last Donation Date: {participant_data.get('last_donation_date', 'N/A')}")
            print(f"📋 Consent Given: {participant_data.get('consent', 'N/A')}")
            print(f"🆔 Participant ID: {participant_data.get('participant_id', 'N/A')}")
            print("=" * 60)
            print(f"👆 Scanning finger: {finger_name}")
            print("=" * 60)
        else:
            print(f"👆 Scanning finger: {finger_name} (No participant data provided)")
        
        # Capture fingerprint using existing scan_finger function
        scan_result = scan_finger(finger_name)
        
        if not scan_result['success']:
            print(f"❌ Fingerprint capture failed for {finger_name}: {scan_result['error']}")
            return jsonify({
                "success": False,
                "message": scan_result['error'],
                "error": scan_result.get('debug_info', '')
            }), 400
        
        print(f"✅ Fingerprint captured successfully for {finger_name}")
        
        # If participant data is provided, send everything to backend for processing
        if participant_data:
            print("🔄 Sending data to backend for processing...")
            
            # Include frontend callback URL so backend can respond directly to frontend
            frontend_callback_url = request.headers.get('X-Frontend-Callback-URL', 'http://localhost:3000/api/process-callback')
            
            backend_result = send_to_backend(participant_data, scan_result, finger_name, frontend_callback_url)
            
            if backend_result['success']:
                print("✅ Data sent to backend successfully - backend will respond directly to frontend")
                return jsonify({
                    "success": True,
                    "message": "Fingerprint captured and sent to backend for processing",
                    "data": {
                        "image_data": scan_result['image'],
                        "finger": scan_result['finger'],
                        "timestamp": datetime.now().isoformat(),
                        "participant_data": participant_data,
                        "processing_status": "sent_to_backend",
                        "note": "Backend will send results directly to frontend"
                    }
                })
            else:
                print("⚠️ Failed to send to backend, returning fingerprint only")
                return jsonify({
                    "success": True,
                    "message": "Fingerprint captured but backend communication failed",
                    "data": {
                        "image_data": scan_result['image'],
                        "finger": scan_result['finger'],
                        "timestamp": datetime.now().isoformat(),
                        "participant_data": participant_data,
                        "backend_error": backend_result['error']
                    }
                })
        else:
            # No participant data, just return fingerprint
            return jsonify({
                "success": True,
                "message": "Fingerprint captured successfully",
                "data": {
                    "image_data": scan_result['image'],
                    "finger": scan_result['finger'],
                    "timestamp": datetime.now().isoformat()
                }
            })
            
    except Exception as e:
        print(f"🚨 ERROR in capture endpoint: {e}")
        print(f"🚨 Traceback: {traceback.format_exc()}")
        return jsonify({
            "success": False,
            "message": "Internal server error", 
            "error": str(e)
        }), 500

@app.route('/api/participant/data', methods=['POST'])
def receive_participant_data():
    """Endpoint to receive and display participant data without scanning"""
    try:
        data = request.get_json() or {}
        participant_data = data.get('participant_data', data)  # Support both nested and direct structure
        
        print("=" * 60)
        print("📋 PARTICIPANT DATA RECEIVED (Data Only):")
        print("=" * 60)
        print(f"👤 Age: {participant_data.get('age', 'N/A')}")
        print(f"📏 Height: {participant_data.get('height', 'N/A')} cm")
        print(f"⚖️  Weight: {participant_data.get('weight', 'N/A')} kg")
        print(f"👥 Gender: {participant_data.get('gender', 'N/A')}")
        print(f"🩸 Blood Type: {participant_data.get('blood_type', 'N/A')}")
        print(f"❤️  Willing to Donate: {participant_data.get('willing_to_donate', 'N/A')}")
        print(f"😴 Sleep Hours: {participant_data.get('sleep_hours', 'N/A')}")
        print(f"🍺 Had Alcohol (24h): {participant_data.get('had_alcohol_last_24h', 'N/A')}")
        print(f"🍽️  Ate Before Donation: {participant_data.get('ate_before_donation', 'N/A')}")
        print(f"🍟 Ate Fatty Food: {participant_data.get('ate_fatty_food', 'N/A')}")
        print(f"🔖 Recent Tattoo/Piercing: {participant_data.get('recent_tattoo_or_piercing', 'N/A')}")
        print(f"🏥 Has Chronic Condition: {participant_data.get('has_chronic_condition', 'N/A')}")
        print(f"💊 Condition Controlled: {participant_data.get('condition_controlled', 'N/A')}")
        print(f"📅 Last Donation Date: {participant_data.get('last_donation_date', 'N/A')}")
        print(f"📋 Consent Given: {participant_data.get('consent', 'N/A')}")
        print(f"🆔 Participant ID: {participant_data.get('participant_id', 'N/A')}")
        print("=" * 60)
        
        return jsonify({
            "success": True,
            "message": "Participant data received successfully",
            "participant_data": participant_data,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"🚨 ERROR in participant data endpoint: {e}")
        print(f"🚨 Traceback: {traceback.format_exc()}")
        return jsonify({
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Kiosk Scanner API...")
    print(f"📡 Server will run on http://{HOST}:{PORT}")
    
    # Check admin status
    try:
        import ctypes
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
        if not is_admin:
            print("⚠️ Not running as Administrator - some scanner functions may fail")
            print("💡 For full functionality, run PowerShell as Administrator")
    except:
        pass
    
    # Initialize scanner on startup (don't fail if it doesn't work)
    try:
        # Just check if DLLs are available
        if dpfpdd:
            print("✅ Scanner DLLs loaded successfully")
        else:
            print("⚠️ Scanner DLLs not available")
    except Exception as e:
        print(f"⚠️ Scanner check: {e}")
    
    print("🔍 Scanner support: Windows")
    print("=" * 50)
    
    # Check if we should run with HTTPS (for production deployment compatibility)
    use_https = os.environ.get('USE_HTTPS', 'false').lower() == 'true'
    
    if use_https:
        # Check if SSL certificate files exist
        cert_path = os.path.join(os.path.dirname(__file__), 'certs', 'cert.pem')
        key_path = os.path.join(os.path.dirname(__file__), 'certs', 'key.pem')
        
        if os.path.exists(cert_path) and os.path.exists(key_path):
            print("🔒 Starting Flask server with HTTPS (custom SSL certificate)")
            print(f"📡 Server URL: https://{HOST}:{PORT}")
            print("⚠️ Browser will show security warning - click 'Advanced' -> 'Proceed to unsafe'")
            print("📄 Using SSL certificates from certs/ directory")
            # Use custom SSL certificates
            app.run(host=HOST, port=PORT, debug=DEBUG, ssl_context=(cert_path, key_path))
        else:
            print("🔒 Starting Flask server with HTTPS (adhoc certificate)")
            print(f"📡 Server URL: https://{HOST}:{PORT}")
            print("⚠️ Browser will show security warning - click 'Advanced' -> 'Proceed to unsafe'")
            print("⚠️ SSL certificate files not found, using adhoc SSL context")
            # Fallback to adhoc SSL context
            app.run(host=HOST, port=PORT, debug=DEBUG, ssl_context='adhoc')
    else:
        print("🌐 Starting Flask server with HTTP")
        print(f"📡 Server URL: http://{HOST}:{PORT}")
        app.run(host=HOST, port=PORT, debug=DEBUG)
