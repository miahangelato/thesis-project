import ctypes
import os
import time
import sys # For sys.exit

# Try to import Pillow. If not found, print a message but allow the script to run without image display.
try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    print("\nWarning: Pillow library not found. Install with 'pip install Pillow' to view/save images as PNG.")
    PIL_AVAILABLE = False

# --- Configuration ---
DP_SDK_ROOT = r"C:\Program Files\DigitalPersona\U.are.U SDK"

# Common subdirectories where DLLs might be found
SDK_DLL_DIRS = [
    os.path.join(DP_SDK_ROOT, r"Bin"),
    os.path.join(DP_SDK_ROOT, r"Lib"),
    os.path.join(DP_SDK_ROOT, r"Redist"),
    os.path.join(os.environ.get('WINDIR', ''), 'System32'),
]

# Function to find DLL in common paths
def find_dll(dll_name):
    for sdk_dir in SDK_DLL_DIRS:
        dll_path = os.path.join(sdk_dir, dll_name)
        if os.path.exists(dll_path):
            print(f"Found {dll_name} at: {dll_path}")
            return dll_path
    print(f"Warning: {dll_name} not found in configured SDK paths. Attempting to load by name only (relies on system PATH).")
    return dll_name

DPFPDD_DLL_PATH = find_dll("dpfpdd.dll")
DPFJ_DLL_PATH = find_dll("dpfj.dll")

# --- ctypes Definitions for dpfpdd.dll ---

try:
    dpfpdd = ctypes.WinDLL(DPFPDD_DLL_PATH)
except OSError as e:
    print(f"Failed to load {DPFPDD_DLL_PATH}: {e}")
    print("Ensure the SDK is installed and its DLLs are accessible or in system PATH.")
    print(f"Attempted DPFPDD_DLL_PATH: {DPFPDD_DLL_PATH}")
    sys.exit(1)

# Define common types
DPFPDD_STATUS = ctypes.c_int
DPFPDD_DEV = ctypes.c_void_p

_DP_FACILITY = 0x05BA
def DPERROR(err_code):
    return (ctypes.c_int(err_code).value | (_DP_FACILITY << 16))

DPFPDD_SUCCESS = 0
DPFPDD_E_NOT_IMPLEMENTED = DPERROR(0x0a)
DPFPDD_E_FAILURE = DPERROR(0x0b)
DPFPDD_E_NO_DATA = DPERROR(0x0c)
DPFPDD_E_MORE_DATA = DPERROR(0x0d)
DPFPDD_E_INVALID_PARAMETER = DPERROR(0x14)
DPFPDD_E_INVALID_DEVICE = DPERROR(0x15)
DPFPDD_E_DEVICE_BUSY = DPERROR(0x1e)
DPFPDD_E_DEVICE_FAILURE = DPERROR(0x1f)
DPFPDD_E_PAD_LIBRARY = DPERROR(0x21)
DPFPDD_E_PAD_DATA = DPERROR(0x22)
DPFPDD_E_PAD_LICENSE = DPERROR(0x23)
DPFPDD_E_PAD_FAILURE = DPERROR(0x24)


DPFPDD_IMG_FMT_PIXEL_BUFFER = 0
DPFPDD_IMG_PROC_DEFAULT = 0

DPFPDD_TIMEOUT_INFINITE = 0xFFFFFFFF

# --- SDK Structures ---

MAX_STR_LENGTH = 128
MAX_DEVICE_NAME_LENGTH = 1024

class DPFPDD_VER_INFO(ctypes.Structure):
    _fields_ = [
        ("major", ctypes.c_int),
        ("minor", ctypes.c_int),
        ("maintenance", ctypes.c_int),
    ]

class DPFPDD_HW_DESCR(ctypes.Structure):
    _fields_ = [
        ("vendor_name", ctypes.c_char * MAX_STR_LENGTH),
        ("product_name", ctypes.c_char * MAX_STR_LENGTH),
        ("serial_num", ctypes.c_char * MAX_STR_LENGTH),
    ]

class DPFPDD_HW_ID(ctypes.Structure):
    _fields_ = [
        ("vendor_id", ctypes.c_ushort),
        ("product_id", ctypes.c_ushort),
    ]

class DPFPDD_HW_VERSION(ctypes.Structure):
    _fields_ = [
        ("hw_ver", DPFPDD_VER_INFO),
        ("fw_ver", DPFPDD_VER_INFO),
        ("bcd_rev", ctypes.c_ushort),
    ]

class DPFPDD_DEV_INFO(ctypes.Structure):
    _fields_ = [
        ("size", ctypes.c_uint),
        ("name", ctypes.c_char * MAX_DEVICE_NAME_LENGTH),
        ("descr", DPFPDD_HW_DESCR),
        ("id", DPFPDD_HW_ID),
        ("ver", DPFPDD_VER_INFO), # Corrected from DPFPDD_HW_VERSION to DPFPDD_VER_INFO based on typical DigitalPersona SDKs
        ("modality", ctypes.c_uint),
        ("technology", ctypes.c_uint),
    ]
# Re-checking DPFPDD_DEV_INFO. The earlier definition has "ver" as DPFPDD_HW_VERSION,
# but your `dpfpdd.h` screenshot for `DPFPDD_HW_VERSION` (from the previous problem)
# indicates it has `hw_ver` and `fw_ver` *inside* it, which are themselves `DPFPDD_VER_INFO`.
# Some SDKs use a direct `DPFPDD_VER_INFO` for `ver`, others nest it.
# Let's revert to the previous correct one (DPFPDD_HW_VERSION) if that worked.
# It was likely correct as you were successfully listing devices.

# Reverting DPFPDD_DEV_INFO.ver back to DPFPDD_HW_VERSION as that was working previously.
class DPFPDD_DEV_INFO(ctypes.Structure):
    _fields_ = [
        ("size", ctypes.c_uint),
        ("name", ctypes.c_char * MAX_DEVICE_NAME_LENGTH),
        ("descr", DPFPDD_HW_DESCR),
        ("id", DPFPDD_HW_ID),
        ("ver", DPFPDD_HW_VERSION), # Corrected back to DPFPDD_HW_VERSION
        ("modality", ctypes.c_uint),
        ("technology", ctypes.c_uint),
    ]

class DPFPDD_CAPTURE_PARAM(ctypes.Structure):
    _fields_ = [
        ("size", ctypes.c_uint),
        ("image_fmt", ctypes.c_uint),
        ("image_proc", ctypes.c_uint),
        ("image_res", ctypes.c_uint),
    ]

class DPFPDD_IMAGE_INFO(ctypes.Structure):
    _fields_ = [
        ("size", ctypes.c_uint),
        ("width", ctypes.c_uint),
        ("height", ctypes.c_uint),
        ("res", ctypes.c_uint),
        ("bpp", ctypes.c_uint),
    ]

class DPFPDD_CAPTURE_RESULT(ctypes.Structure):
    _fields_ = [
        ("size", ctypes.c_uint),
        ("success", ctypes.c_int),
        ("quality", ctypes.c_uint),
        ("score", ctypes.c_uint),
        ("info", DPFPDD_IMAGE_INFO),
    ]

class DPFPDD_DEV_CAPS_MIN(ctypes.Structure):
    _fields_ = [
        ("size", ctypes.c_uint),
        ("can_capture_image", ctypes.c_int),
        ("can_stream_image", ctypes.c_int),
        ("can_extract_features", ctypes.c_int),
        ("can_match", ctypes.c_int),
        ("can_identify", ctypes.c_int),
        ("has_fp_storage", ctypes.c_int),
        ("indicator_type", ctypes.c_uint),
        ("has_pwr_mgmt", ctypes.c_int),
        ("has_calibration", ctypes.c_int),
        ("piv_compliant", ctypes.c_int),
        ("resolution_cnt", ctypes.c_uint),
        ("resolutions", ctypes.c_uint * 1),
    ]

# --- Define function prototypes for dpfpdd.dll ---

dpfpdd.dpfpdd_init.argtypes = []
dpfpdd.dpfpdd_init.restype = DPFPDD_STATUS

dpfpdd.dpfpdd_exit.argtypes = []
dpfpdd.dpfpdd_exit.restype = DPFPDD_STATUS

dpfpdd.dpfpdd_query_devices.argtypes = [
    ctypes.POINTER(ctypes.c_uint),
    ctypes.POINTER(DPFPDD_DEV_INFO)
]
dpfpdd.dpfpdd_query_devices.restype = DPFPDD_STATUS

dpfpdd.dpfpdd_open.argtypes = [
    ctypes.c_char_p,
    ctypes.POINTER(DPFPDD_DEV)
]
dpfpdd.dpfpdd_open.restype = DPFPDD_STATUS

dpfpdd.dpfpdd_close.argtypes = [DPFPDD_DEV]
dpfpdd.dpfpdd_close.restype = DPFPDD_STATUS

dpfpdd.dpfpdd_get_device_capabilities.argtypes = [
    DPFPDD_DEV,
    ctypes.POINTER(DPFPDD_DEV_CAPS_MIN)
]
dpfpdd.dpfpdd_get_device_capabilities.restype = DPFPDD_STATUS


dpfpdd.dpfpdd_capture.argtypes = [
    DPFPDD_DEV,
    ctypes.POINTER(DPFPDD_CAPTURE_PARAM),
    ctypes.c_uint,
    ctypes.POINTER(DPFPDD_CAPTURE_RESULT),
    ctypes.POINTER(ctypes.c_uint),
    ctypes.POINTER(ctypes.c_ubyte)
]
dpfpdd.dpfpdd_capture.restype = DPFPDD_STATUS

dpfpdd.dpfpdd_cancel.argtypes = [DPFPDD_DEV]
dpfpdd.dpfpdd_cancel.restype = DPFPDD_STATUS


# --- Helper Functions ---

def check_status(status, func_name):
    """Helper to check SDK function return status."""
    if status == DPFPDD_SUCCESS:
        return True
    else:
        error_messages = {
            DPFPDD_E_NOT_IMPLEMENTED: "API call not implemented",
            DPFPDD_E_FAILURE: "Unspecified failure",
            DPFPDD_E_NO_DATA: "No data available",
            DPFPDD_E_MORE_DATA: "Memory buffer too small (more data needed)",
            DPFPDD_E_INVALID_PARAMETER: "One or more parameters are invalid",
            DPFPDD_E_INVALID_DEVICE: "Reader handle is not valid",
            DPFPDD_E_DEVICE_BUSY: "Another operation is in progress",
            DPFPDD_E_DEVICE_FAILURE: "Reader not working properly / Failed to open/close/start",
            DPFPDD_E_PAD_LIBRARY: "Spoof detection library not found or can't be loaded",
            DPFPDD_E_PAD_DATA: "Spoof detection database/classifier not found or can't be loaded",
            DPFPDD_E_PAD_LICENSE: "Spoof detection license not found or invalid",
            DPFPDD_E_PAD_FAILURE: "Failure to perform spoof detection",
        }
        msg = error_messages.get(status, "Unknown error code")
        print(f"Error in {func_name}: Status = {hex(status)} ({msg})")
        return False

def list_devices():
    """Lists available DigitalPersona fingerprint devices."""
    MAX_DEVICES = 10
    
    while True:
        dev_infos_array = (DPFPDD_DEV_INFO * MAX_DEVICES)()
        for i in range(MAX_DEVICES):
            dev_infos_array[i].size = ctypes.sizeof(DPFPDD_DEV_INFO)

        count = ctypes.c_uint(MAX_DEVICES)
        
        status = dpfpdd.dpfpdd_query_devices(ctypes.byref(count), dev_infos_array)
        
        if status == DPFPDD_SUCCESS:
            devices = []
            for i in range(count.value):
                dev_info = dev_infos_array[i]
                devices.append({
                    "name": dev_info.name.decode('utf-8'),
                    "vendor_name": dev_info.descr.vendor_name.decode('utf-8'),
                    "product_name": dev_info.descr.product_name.decode('utf-8'),
                    "serial_num": dev_info.descr.serial_num.decode('utf-8'),
                    "vendor_id": dev_info.id.vendor_id,
                    "product_id": dev_info.id.product_id,
                })
            return devices
        elif status == DPFPDD_E_MORE_DATA:
            print(f"More devices found ({count.value}) than allocated space ({MAX_DEVICES}). Resizing buffer.")
            MAX_DEVICES = count.value
            if MAX_DEVICES == 0:
                print("Warning: SDK returned 0 devices after DPFPDD_E_MORE_DATA. Exiting device query loop.")
                return []
            continue
        else:
            check_status(status, "dpfpdd_query_devices")
            return []


# --- SDK Lifecycle Management ---

def initialize_sdk():
    """Initializes the DP SDK. Should be called once at application startup."""
    if not dpfpdd:
        return False
    status = dpfpdd.dpfpdd_init()
    if not check_status(status, "dpfpdd_init"):
        return False
    return True

def finalize_sdk():
    """Releases the DP SDK. Should be called at application exit."""
    if dpfpdd:
        dpfpdd.dpfpdd_exit()

def capture_fingerprint_image(device_name=None):
    """
    Captures a single fingerprint image using dpfpdd_capture.
    Expects SDK to be already initialized.
    Returns (image_data_bytes, image_info_dict, quality_flags) or (None, None, None) on failure.
    """
    dev = DPFPDD_DEV(None)
    
    # Init removed (handled globally)
    # status = dpfpdd.dpfpdd_init()
    
    try:
        if device_name is None:
            # Note: list_devices requires SDK init
            devices = list_devices()
            if not devices:
                print("No DigitalPersona fingerprint devices found.")
                return None, None, None
            
            # Selection logic...
            selected_device = None
            for d in devices:
                product_name = d['product_name'].lower()
                if 'u.are.u' in product_name and '4500' in product_name:
                    selected_device = d
                    break
            
            if not selected_device:
                selected_device = devices[0]
            
            device_name = selected_device["name"]

        status = dpfpdd.dpfpdd_open(device_name.encode('utf-8'), ctypes.byref(dev))
        if not check_status(status, "dpfpdd_open"):
            return None, None, None

        print("Device opened. Place your finger on the scanner...")

        # ... Device Caps Logic (Shortened for brevity in thought, but must retain in replacement) ...
        # (Using minimal caps for speed/robustness if full caps fail)
        
        dev_caps_min = DPFPDD_DEV_CAPS_MIN()
        dev_caps_min.size = ctypes.sizeof(DPFPDD_DEV_CAPS_MIN)
        status = dpfpdd.dpfpdd_get_device_capabilities(dev, ctypes.byref(dev_caps_min))
        
        preferred_resolution = 500 # Default fallback
        if status == DPFPDD_SUCCESS and dev_caps_min.resolution_cnt > 0:
             preferred_resolution = dev_caps_min.resolutions[0]
        # Ignore dynamic resizing logic for now to simplify - 500dpi is standard for U.are.U 4500
        
        capture_parm = DPFPDD_CAPTURE_PARAM()
        capture_parm.size = ctypes.sizeof(DPFPDD_CAPTURE_PARAM)
        capture_parm.image_fmt = DPFPDD_IMG_FMT_PIXEL_BUFFER
        capture_parm.image_proc = DPFPDD_IMG_PROC_DEFAULT
        capture_parm.image_res = preferred_resolution

        capture_result = DPFPDD_CAPTURE_RESULT()
        capture_result.size = ctypes.sizeof(DPFPDD_CAPTURE_RESULT)

        INITIAL_IMAGE_BUFFER_SIZE = 500 * 500
        image_buffer = ctypes.create_string_buffer(INITIAL_IMAGE_BUFFER_SIZE)
        image_buffer_ptr = ctypes.cast(image_buffer, ctypes.POINTER(ctypes.c_ubyte))
        actual_image_size = ctypes.c_uint(INITIAL_IMAGE_BUFFER_SIZE)

        # 5 second timeout (5000 ms) to allow "blinking" behavior and prevent lockups
        CAPTURE_TIMEOUT_MS = 5000 

        while True:
            status = dpfpdd.dpfpdd_capture(
                dev,
                ctypes.byref(capture_parm),
                CAPTURE_TIMEOUT_MS, # Use finite timeout
                ctypes.byref(capture_result),
                ctypes.byref(actual_image_size),
                image_buffer_ptr
            )

            if status == DPFPDD_SUCCESS:
                break
            elif status == DPFPDD_E_MORE_DATA:
                required_size = actual_image_size.value
                print(f"Image buffer too small. Re-allocating for {required_size} bytes.")
                image_buffer = ctypes.create_string_buffer(required_size)
                image_buffer_ptr = ctypes.cast(image_buffer, ctypes.POINTER(ctypes.c_ubyte))
                actual_image_size.value = required_size
            else:
                # Handle timeout explicitly if possible, or just generic check
                if status == 0x14: # DPFPDD_E_INVALID_PARAMETER (sometimes returned on weird timeouts?)
                     pass
                # Just return None on timeout/error to allow retry
                # DPERROR(0x0c) is NO_DATA? 
                check_status(status, "dpfpdd_capture")
                return None, None, None

        if capture_result.success == 0:
            print(f"Capture operation reported failure. Quality: {hex(capture_result.quality)}")
            return None, None, None

        # Data extraction logic
        width = capture_result.info.width
        height = capture_result.info.height
        bpp = capture_result.info.bpp
        
        expected_size = width * height * (bpp // 8)
        image_data_bytes = bytes(image_buffer[:expected_size])
        
        image_info_dict = {
            "width": width, 
            "height": height, 
            "resolution": capture_result.info.res, 
            "bpp": bpp
        }
        
        return image_data_bytes, image_info_dict, capture_result.quality

    finally:
        if dev and dev.value:
            dpfpdd.dpfpdd_close(dev)
            # Remove exit() call

# --- Main Execution ---
if __name__ == "__main__":
    print("Attempting to capture fingerprint...")
    image_bytes, img_info, quality_flags = capture_fingerprint_image()

    if image_bytes:
        print(f"Captured {len(image_bytes)} bytes of pixel data.") # Changed message
        if img_info:
            raw_filename = f"captured_fingerprint_raw_{img_info['width']}x{img_info['height']}.raw"
            try:
                with open(raw_filename, "wb") as f:
                    f.write(image_bytes)
                print(f"Raw fingerprint image saved to {raw_filename}")
            except Exception as e:
                print(f"Could not save raw image: {e}")

            if PIL_AVAILABLE:
                try:
                    width = img_info['width']
                    height = img_info['height']
                    bpp = img_info['bpp']

                    if bpp == 8:
                        # The numpy reshape expects (height, width) for image data
                        # Ensure we use the correct dimensions from img_info
                        np_image = np.frombuffer(image_bytes, dtype=np.uint8).reshape((height, width))
                        img = Image.fromarray(np_image, 'L')
                        
                        output_png_filename = f"captured_fingerprint_{width}x{height}.png"
                        img.save(output_png_filename)
                        print(f"PNG image saved to {output_png_filename}")
                        
                        # Don't show image when running as API (server environment)
                        # img.show()
                        
                    else:
                        print(f"Cannot automatically display/convert image with {bpp} BPP. Only 8-bit grayscale is supported for automatic display.")
                except Exception as e:
                    print(f"Error during image conversion/display with Pillow: {e}")
            else:
                print("\nPillow is not installed. To view the image, use a raw image viewer and specify:")
                print(f"  Width={img_info['width']}, Height={img_info['height']}, BitsPerPixel={img_info['bpp']}")
    else:
        print("Fingerprint capture failed.")