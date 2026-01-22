"""
Main Kiosk Scanner Application
Flask-based API server with WebSocket support for real-time scanner feedback
"""
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import base64
import logging
import os
import ctypes
import time
from datetime import datetime
import traceback
import requests
from functools import wraps
import threading
import uuid

# Import the working scanner implementation
from scanner_real import (
    dpfpdd, DPFPDD_SUCCESS, capture_fingerprint_image, initialize_sdk
)
from config import HOST, PORT, DEBUG, CORS_ORIGINS, CORS_ALLOW_ALL
import os
from PIL import Image
import numpy as np
import io

# Backend API configuration
BACKEND_BASE_URL = os.getenv("KIOSK_SCANNER_BACKEND_BASE_URL")

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize SocketIO with eventlet for async support
socketio = SocketIO(
    app,
    cors_allowed_origins="*",  # Allow all origins for development
    async_mode='eventlet',
    logger=True,
    engineio_logger=False
)

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

# Enhanced scanner state for WebSocket + REST fallback
SCANNER_STATE = {
    "scan_id": None,
    "finger_name": None,
    "status": "idle",  # idle, waiting, detecting, capturing, success, error, cancelled
    "hint": "",
    "metrics": {},
    "last_preview_frame_b64": None,
    "timestamp": 0
}

# SESSION-BASED tracking (replaces per-finger active_scans)
ACTIVE_SESSION = {
    "session_id": None,
    "participant_id": None,
    "socket_sid": None,
    "finger_queue": [],
    "current_index": 0,
    "captured_fingers": {},
    "device_handle": None,
    "sdk_initialized": False,
    "stop_event": None,
    "thread": None,
    "state": "idle",
    "last_status": None,
    "last_preview_frame": None,
    "grace_period_active": False,
    "disconnected_at": None
}

# Backward compatibility: Keep old per-finger active_scans dict for deprecated start_scan handler
active_scans = {}

state_lock = threading.Lock()

def create_session(socket_sid, participant_id, finger_list):
    """Initialize new session"""
    global ACTIVE_SESSION
    with state_lock:
        session_id = str(uuid.uuid4())
        stop_event = threading.Event()
        
        ACTIVE_SESSION.update({
            "session_id": session_id,
            "participant_id": participant_id,
            "socket_sid": socket_sid,
            "finger_queue": finger_list,
            "current_index": 0,
            "captured_fingers": {},
            "stop_event": stop_event,
            "state": "active",
            "grace_period_active": False,
            "disconnected_at": None
        })
        
        logger.info(f"[SESSION] Created session {session_id} for participant {participant_id}")
        logger.info(f"[SESSION] Finger queue: {finger_list}")
        
        return session_id, stop_event

def cleanup_session():
    """Clean up session state"""
    global ACTIVE_SESSION
    with state_lock:
        session_id = ACTIVE_SESSION["session_id"]
        logger.info(f"[SESSION] Cleaning up session {session_id}")
        
        # Set stop event if exists
        if ACTIVE_SESSION["stop_event"]:
            ACTIVE_SESSION["stop_event"].set()
        
        # Reset to idle state
        ACTIVE_SESSION.update({
            "session_id": None,
            "participant_id": None,
            "socket_sid": None,
            "finger_queue": [],
            "current_index": 0,
            "captured_fingers": {},
            "device_handle": None,
            "sdk_initialized": False,
            "stop_event": None,
            "thread": None,
            "state": "idle",
            "last_status": None,
            "last_preview_frame": None,
            "grace_period_active": False,
            "disconnected_at": None
        })

def get_session_state():
    """Return current session info"""
    with state_lock:
        return {
            "session_id": ACTIVE_SESSION["session_id"],
            "state": ACTIVE_SESSION["state"],
            "current_finger": ACTIVE_SESSION["finger_queue"][ACTIVE_SESSION["current_index"]] if ACTIVE_SESSION["current_index"] < len(ACTIVE_SESSION["finger_queue"]) else None,
            "progress": {
                "current": ACTIVE_SESSION["current_index"],
                "total": len(ACTIVE_SESSION["finger_queue"])
            },
            "captured_count": len(ACTIVE_SESSION["captured_fingers"])
        }

def advance_to_next_finger():
    """Move to next finger in queue"""
    global ACTIVE_SESSION
    with state_lock:
        ACTIVE_SESSION["current_index"] += 1
        current_idx = ACTIVE_SESSION["current_index"]
        total = len(ACTIVE_SESSION["finger_queue"])
        
        if current_idx < total:
            next_finger = ACTIVE_SESSION["finger_queue"][current_idx]
            logger.info(f"[SESSION] Advanced to finger {current_idx + 1}/{total}: {next_finger}")
            return next_finger
        else:
            logger.info(f"[SESSION] All fingers completed ({total}/{total})")
            return None

def grace_period_cleanup():
    """Background thread for grace period"""
    grace_seconds = 30
    logger.info(f"[GRACE] Starting {grace_seconds}s grace period...")
    time.sleep(grace_seconds)
    
    global ACTIVE_SESSION
    with state_lock:
        if ACTIVE_SESSION["grace_period_active"]:
            elapsed = time.time() - ACTIVE_SESSION["disconnected_at"]
            if elapsed >= grace_seconds:
                logger.info("[GRACE] Grace period expired, cleaning up session")
                if ACTIVE_SESSION["stop_event"]:
                    ACTIVE_SESSION["stop_event"].set()
                cleanup_session()
            else:
                logger.info("[GRACE] Client reconnected, grace period cancelled")

def update_scanner_state(scan_id=None, finger_name=None, status=None, hint=None, metrics=None, preview_frame=None):
    """Thread-safe update of global scanner state"""
    global SCANNER_STATE
    with state_lock:
        if scan_id is not None:
            SCANNER_STATE["scan_id"] = scan_id
        if finger_name is not None:
            SCANNER_STATE["finger_name"] = finger_name
        if status is not None:
            SCANNER_STATE["status"] = status
        if hint is not None:
            SCANNER_STATE["hint"] = hint
        if metrics is not None:
            SCANNER_STATE["metrics"] = metrics
        if preview_frame is not None:
            SCANNER_STATE["last_preview_frame_b64"] = preview_frame
        SCANNER_STATE["timestamp"] = datetime.now().timestamp()
        logger.debug(f"Scanner state updated: {status} - {hint}")

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    global ACTIVE_SESSION
    logger.info(f"Client connected: {request.sid}")
    
    # Check if there's an active session
    with state_lock:
        if ACTIVE_SESSION["session_id"]:
            # Cancel grace period if active
            if ACTIVE_SESSION["grace_period_active"]:
                logger.info("[GRACE] Client reconnected, cancelling grace period")
                ACTIVE_SESSION["grace_period_active"] = False
            
            # Update socket ID
            ACTIVE_SESSION["socket_sid"] = request.sid
            
            # Resend current session state
            current_idx = ACTIVE_SESSION["current_index"]
            finger_queue = ACTIVE_SESSION["finger_queue"]
            
            if current_idx < len(finger_queue):
                emit('session_started', {
                    'session_id': ACTIVE_SESSION["session_id"],
                    'finger_queue': finger_queue,
                    'total_fingers': len(finger_queue)
                })
                
                emit('next_finger', {
                    'session_id': ACTIVE_SESSION["session_id"],
                    'finger_name': finger_queue[current_idx],
                    'finger_index': current_idx,
                    'total_fingers': len(finger_queue)
                })
                
                # Resend last status if available
                if ACTIVE_SESSION["last_status"]:
                    emit('scanner_status', ACTIVE_SESSION["last_status"])
                
                # Resend last preview if available
                if ACTIVE_SESSION["last_preview_frame"]:
                    emit('preview_frame', ACTIVE_SESSION["last_preview_frame"])
        else:
            # No active session, send idle status
            emit('scanner_status', {
                'session_id': None,
                'finger_name': None,
                'status': 'idle',
                'hint': '',
                'metrics': {}
            })

@socketio.on('disconnect')
def handle_disconnect():
    global ACTIVE_SESSION
    logger.info(f"Client disconnected: {request.sid}")
    
    with state_lock:
        if ACTIVE_SESSION["session_id"] and ACTIVE_SESSION["socket_sid"] == request.sid:
            logger.info(f"[DISCONNECT] Active session detected, starting grace period")
            ACTIVE_SESSION["grace_period_active"] = True
            ACTIVE_SESSION["disconnected_at"] = time.time()
            
            # Start grace period thread
            threading.Thread(target=grace_period_cleanup, daemon=True).start()
        else:
            logger.info(f"[DISCONNECT] No active session for this client")

@socketio.on('start_scan')
def handle_start_scan(data):
    """DEPRECATED: Use start_scan_session instead. Kept for backward compatibility."""
    try:
        finger_name = data.get('finger_name', 'unknown')
        scan_id = str(uuid.uuid4())
        
        logger.info(f"[handle_start_scan] ========== START SCAN REQUEST ==========")
        logger.info(f"[handle_start_scan] Finger: {finger_name}")
        logger.info(f"[handle_start_scan] Scan ID: {scan_id}")
        logger.info(f"[handle_start_scan] Client SID: {request.sid}")
        logger.info(f"[handle_start_scan] Request data: {data}")
        
        # Check if there's already an active scan
        with state_lock:
            if len(active_scans) > 0:
                logger.warning(f"[handle_start_scan] Scan already in progress. Active scans: {list(active_scans.keys())}")
                emit('scanner_status', {
                    'scan_id': scan_id,
                    'finger_name': finger_name,
                    'status': 'error',
                    'hint': 'Another scan is already in progress',
                    'metrics': {}
                })
                return
            else:
                logger.info(f"[handle_start_scan] No active scans, proceeding...")
        
        # Create stop event for this scan
        stop_event = threading.Event()
        logger.info(f"[handle_start_scan] Created stop event for scan {scan_id}")
        
        # Create WebSocket emit callback
        socket_sid = request.sid  # Capture SID before thread starts
        logger.info(f"[handle_start_scan] Captured socket SID: {socket_sid}")
        def ws_emit(event_name, event_data):
            """Callback for scanner loop to emit events"""
            try:
                logger.info(f"[ws_emit] Emitting event: {event_name}")
                logger.debug(f"[ws_emit] Event data: {event_data}")
                
                # Use socketio.emit with namespace and room (works outside request context)
                socketio.emit(event_name, event_data, room=socket_sid, namespace='/')
                logger.debug(f"[ws_emit] Event emitted to room {socket_sid}")
                
                # Also update global state for fallback API
                if event_name == 'scanner_status':
                    update_scanner_state(
                        scan_id=event_data.get('scan_id'),
                        finger_name=event_data.get('finger_name'),
                        status=event_data.get('status'),
                        hint=event_data.get('hint'),
                        metrics=event_data.get('metrics')
                    )
                    logger.debug(f"[ws_emit] Updated scanner state with status: {event_data.get('status')}")
                elif event_name == 'preview_frame':
                    frame_b64_len = len(event_data.get('frame_b64', '')) if event_data.get('frame_b64') else 0
                    logger.debug(f"[ws_emit] Preview frame size: {frame_b64_len} chars")
                    update_scanner_state(preview_frame=event_data.get('frame_b64'))
                elif event_name == 'scan_complete':
                    image_b64_len = len(event_data.get('image_b64_full', '')) if event_data.get('image_b64_full') else 0
                    logger.info(f"[ws_emit] Scan complete! Image size: {image_b64_len} chars")
            except Exception as e:
                logger.error(f"[ws_emit] Error emitting WebSocket event: {e}")
        
        # Start scan in background thread
        def run_scan():
            try:
                logger.info(f"[run_scan] Thread started for scan_id: {scan_id}, finger: {finger_name}")
                logger.info(f"[run_scan] Calling scan_finger_loop_with_guidance...")
                
                image_bytes, metrics = scan_finger_loop_with_guidance(
                    emit_callback=ws_emit,
                    scan_id=scan_id,
                    finger_name=finger_name,
                    stop_event=stop_event
                )
                
                logger.info(f"[run_scan] scan_finger_loop_with_guidance completed")
                logger.info(f"[run_scan] Image bytes received: {len(image_bytes) if image_bytes else 0} bytes")
                logger.info(f"[run_scan] Metrics: {metrics}")
                
                # Clean up
                with state_lock:
                    if scan_id in active_scans:
                        del active_scans[scan_id]
                        logger.info(f"[run_scan] Cleaned up scan {scan_id} from active_scans")
                        
            except Exception as e:
                logger.error(f"[run_scan] Error in scan thread: {e}")
                logger.error(f"[run_scan] Traceback: {traceback.format_exc()}")
                ws_emit('scanner_status', {
                    'scan_id': scan_id,
                    'finger_name': finger_name,
                    'status': 'error',
                    'hint': f'Scanner error: {str(e)}',
                    'metrics': {}
                })
                with state_lock:
                    if scan_id in active_scans:
                        del active_scans[scan_id]
        
        # Store scan info and start thread
        scan_thread = threading.Thread(target=run_scan, daemon=True)
        logger.info(f"[handle_start_scan] Created scan thread")
        
        with state_lock:
            active_scans[scan_id] = {
                'thread': scan_thread,
                'stop_event': stop_event,
                'socket_sid': request.sid,
                'finger_name': finger_name
            }
            logger.info(f"[handle_start_scan] Registered scan in active_scans. Total active: {len(active_scans)}")
        
        logger.info(f"[handle_start_scan] Starting scan thread...")
        scan_thread.start()
        logger.info(f"[handle_start_scan] Scan thread started successfully")
        
        # Send acknowledgment
        emit('scan_started', {'scan_id': scan_id, 'finger_name': finger_name})
        logger.info(f"[handle_start_scan] Sent scan_started acknowledgment")
        logger.info(f"[handle_start_scan] ========== SCAN REQUEST COMPLETE ==========")
        
    except Exception as e:
        logger.error(f"[handle_start_scan] ERROR starting scan: {e}")
        logger.error(f"[handle_start_scan] Traceback: {traceback.format_exc()}")
        emit('scanner_status', {
            'scan_id': None,
            'finger_name': finger_name,
            'status': 'error',
            'hint': f'Failed to start scan: {str(e)}',
            'metrics': {}
        })

@socketio.on('stop_scan')
def handle_stop_scan(data):
    """Cancel an active scan"""
    scan_id = data.get('scan_id')
    logger.info(f"Stop scan requested for {scan_id}")
    
    with state_lock:
        if scan_id and scan_id in active_scans:
            active_scans[scan_id]['stop_event'].set()
            logger.info(f"Set stop flag for scan {scan_id}")
        else:
            logger.warning(f"No active scan found for {scan_id}")


@socketio.on('start_scan_session')
def handle_start_scan_session(data):
    """
    Start a SESSION-BASED multi-finger scan using ACTIVE_SESSION global state.
    Scanner stays open, automatically moves to next finger.
    
    Expects: { 
        finger_names: ['left_thumb', 'left_index', ...],
        participant_id: 'optional_participant_id'
    }
    """
    try:
        finger_queue = data.get('finger_names', [])
        participant_id = data.get('participant_id', 'unknown')
        
        if not finger_queue:
            logger.error("[SESSION] No fingers specified")
            emit('scanner_status', {
                'session_id': None,
                'finger_name': None,
                'status': 'error',
                'hint': 'No fingers specified',
                'metrics': {}
            })
            return
        
        # Check if session already active
        with state_lock:
            if ACTIVE_SESSION["session_id"] is not None:
                logger.warning(f"[SESSION] Session already active: {ACTIVE_SESSION['session_id']}")
                emit('scanner_status', {
                    'session_id': ACTIVE_SESSION["session_id"],
                    'finger_name': None,
                    'status': 'error',
                    'hint': 'Another scan session is already in progress',
                    'metrics': {}
                })
                return
        
        # Capture socket ID in local scope (before thread starts)
        socket_sid = request.sid
        
        # Create new session
        session_id = create_session(socket_sid, participant_id, finger_queue)
        logger.info(f"[SESSION] ========== NEW SCAN SESSION STARTED ==========")
        logger.info(f"[SESSION] Session ID: {session_id}")
        logger.info(f"[SESSION] Client SID: {socket_sid}")
        logger.info(f"[SESSION] Finger queue: {finger_queue}")
        logger.info(f"[SESSION] Participant: {participant_id}")
        
        def _sanitize_for_json(obj):
            """Recursively convert objects to JSON-safe types."""
            import numpy as _np
            import threading as _threading

            if isinstance(obj, dict):
                return {k: _sanitize_for_json(v) for k, v in obj.items()}
            if isinstance(obj, (list, tuple)):
                return [_sanitize_for_json(v) for v in obj]
            if isinstance(obj, _np.generic):
                return obj.item()
            if isinstance(obj, bytes):
                return obj.decode('utf-8', errors='ignore')
            if isinstance(obj, _threading.Event):
                return str(obj)
            return obj

        # WebSocket emit callback for scanner (runs in background thread)
        def ws_emit(event_name, event_data):
            """Callback for session scanner to emit events"""
            try:
                logger.debug(f"[SESSION ws_emit] Event: {event_name}")

                safe_data = _sanitize_for_json(event_data)

                # Emit to specific socket room (no request context needed)
                socketio.emit(event_name, safe_data, room=socket_sid, namespace='/')

                # Update global state for fallback API (thread-safe, no request context)
                with state_lock:
                    if event_name == 'scanner_status':
                        SCANNER_STATE["scan_id"] = safe_data.get('session_id')
                        SCANNER_STATE["finger_name"] = safe_data.get('finger_name')
                        SCANNER_STATE["status"] = safe_data.get('status')
                        SCANNER_STATE["hint"] = safe_data.get('hint')
                        SCANNER_STATE["metrics"] = safe_data.get('metrics', {})
                        SCANNER_STATE["timestamp"] = time.time()
                    elif event_name == 'preview_frame':
                        SCANNER_STATE["last_preview_frame_b64"] = safe_data.get('frame_b64')
                        SCANNER_STATE["timestamp"] = time.time()

            except Exception as e:
                logger.error(f"[SESSION ws_emit] Error: {e}")
                import traceback
                logger.error(traceback.format_exc())
        
        # Background thread that runs the session
        def run_session():
            try:
                logger.info(f"[SESSION THREAD] Started for session {session_id}")
                logger.info(f"[SESSION THREAD] Calling scan_finger_session...")
                
                with state_lock:
                    stop_event = ACTIVE_SESSION["stop_event"]
                
                results = scan_finger_session(
                    emit_callback=ws_emit,
                    session_id=session_id,
                    finger_queue=finger_queue,
                    stop_event=stop_event
                )
                
                logger.info(f"[SESSION THREAD] Completed. Results: {len(results)} fingers")
                
                # Store results in session
                with state_lock:
                    if ACTIVE_SESSION["session_id"] == session_id:
                        ACTIVE_SESSION["captured_fingers"] = results
                        ACTIVE_SESSION["status"] = "completed"
                        ACTIVE_SESSION["end_time"] = time.time()
                
                # Emit session_complete
                ws_emit('session_complete', {
                    'session_id': session_id,
                    'total_captured': len(results),
                    'finger_names': list(results.keys())
                })
                
                # Schedule cleanup after brief delay
                def delayed_cleanup():
                    time.sleep(5)
                    cleanup_session()
                
                cleanup_thread = threading.Thread(target=delayed_cleanup, daemon=True)
                cleanup_thread.start()
                
            except Exception as e:
                logger.error(f"[SESSION THREAD] Error: {e}")
                logger.error(f"[SESSION THREAD] Traceback: {traceback.format_exc()}")
                
                with state_lock:
                    if ACTIVE_SESSION["session_id"] == session_id:
                        ACTIVE_SESSION["status"] = "error"
                        ACTIVE_SESSION["error"] = str(e)
                
                ws_emit('scanner_status', {
                    'session_id': session_id,
                    'finger_name': None,
                    'status': 'error',
                    'hint': f'Scanner error: {str(e)}',
                    'metrics': {}
                })
                
                # Cleanup on error
                cleanup_session()
        
        # Start session thread
        session_thread = threading.Thread(target=run_session, daemon=True)
        
        with state_lock:
            ACTIVE_SESSION["thread"] = session_thread
        
        session_thread.start()
        logger.info(f"[SESSION] Thread started")
        
        # Send acknowledgment
        emit('session_started', {
            'session_id': session_id,
            'finger_queue': finger_queue,
            'total_fingers': len(finger_queue),
            'current_index': 0
        })
        logger.info(f"[SESSION] Sent session_started acknowledgment")
        
    except Exception as e:
        logger.error(f"[SESSION] ERROR starting session: {e}")
        logger.error(f"[SESSION] Traceback: {traceback.format_exc()}")
        emit('scanner_status', {
            'session_id': None,
            'finger_name': None,
            'status': 'error',
            'hint': f'Failed to start session: {str(e)}',
            'metrics': {}
        })


@socketio.on('cancel_scan_session')
def handle_cancel_scan_session(data):
    """
    Cancel the currently active scan session.
    
    Expects: { session_id: 'optional_session_id_for_verification' }
    """
    try:
        provided_session_id = data.get('session_id') if data else None
        
        with state_lock:
            active_session_id = ACTIVE_SESSION["session_id"]
            
            if active_session_id is None:
                logger.warning("[SESSION CANCEL] No active session to cancel")
                emit('scanner_status', {
                    'session_id': None,
                    'finger_name': None,
                    'status': 'idle',
                    'hint': 'No active session to cancel',
                    'metrics': {}
                })
                return
            
            # Verify session ID if provided
            if provided_session_id and provided_session_id != active_session_id:
                logger.warning(f"[SESSION CANCEL] Session ID mismatch: {provided_session_id} != {active_session_id}")
                emit('scanner_status', {
                    'session_id': active_session_id,
                    'finger_name': None,
                    'status': 'error',
                    'hint': 'Session ID mismatch',
                    'metrics': {}
                })
                return
            
            logger.info(f"[SESSION CANCEL] Cancelling session {active_session_id}")
            
            # Signal stop event
            if ACTIVE_SESSION["stop_event"]:
                ACTIVE_SESSION["stop_event"].set()
                logger.info("[SESSION CANCEL] Stop event signaled")
            
            # Update status
            ACTIVE_SESSION["status"] = "cancelled"
            ACTIVE_SESSION["end_time"] = time.time()
        
        # Emit cancellation acknowledgment
        emit('session_cancelled', {
            'session_id': active_session_id,
            'reason': 'User requested cancellation'
        })
        
        emit('scanner_status', {
            'session_id': active_session_id,
            'finger_name': None,
            'status': 'cancelled',
            'hint': 'Session cancelled by user',
            'metrics': {}
        })
        
        logger.info(f"[SESSION CANCEL] Session {active_session_id} cancelled successfully")
        
        # Schedule cleanup after brief delay to allow thread to exit gracefully
        def delayed_cleanup():
            time.sleep(2)
            cleanup_session()
        
        cleanup_thread = threading.Thread(target=delayed_cleanup, daemon=True)
        cleanup_thread.start()
        
    except Exception as e:
        logger.error(f"[SESSION CANCEL] Error: {e}")
        logger.error(f"[SESSION CANCEL] Traceback: {traceback.format_exc()}")
        emit('scanner_status', {
            'session_id': None,
            'finger_name': None,
            'status': 'error',
            'hint': f'Error cancelling session: {str(e)}',
            'metrics': {}
        })


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

@app.route('/api/scanner/progress', methods=['GET'])
def scanner_progress():
    """Get real-time scanner progress/status - Enhanced for WebSocket fallback"""
    with state_lock:
        return jsonify({
            "success": True,
            "scan_id": SCANNER_STATE.get("scan_id"),
            "finger_name": SCANNER_STATE.get("finger_name"),
            "status": SCANNER_STATE.get("status", "idle"),
            "hint": SCANNER_STATE.get("hint", ""),
            "metrics": SCANNER_STATE.get("metrics", {}),
            "last_preview_frame_b64": SCANNER_STATE.get("last_preview_frame_b64"),
            "timestamp": SCANNER_STATE.get("timestamp", 0)
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
    print("🚀 Starting Kiosk Scanner API with WebSocket support...")
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
        if dpfpdd:
            print("✅ Scanner DLLs loaded successfully")
            # Initialize the SDK once at startup
            if initialize_sdk():
                print("✅ Scanner SDK initialized successfully")
            else:
                print("⚠️ Scanner SDK initialization failed - device may not be available")
        else:
            print("⚠️ Scanner DLLs not available")
    except Exception as e:
        print(f"⚠️ Scanner initialization error: {e}")
    
    print("🔍 Scanner support: Windows")
    print("🔌 WebSocket: Enabled (real-time guided scan)")
    print("=" * 50)
    
    # Use socketio.run instead of app.run
    socketio.run(
        app,
        host=HOST,
        port=PORT,
        debug=DEBUG,
        allow_unsafe_werkzeug=True  # For development only
    )