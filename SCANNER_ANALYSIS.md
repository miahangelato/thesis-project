# Scanner Analysis: Working Implementation vs Current Implementation

## Key Differences Found

### 1. **NO PIXEL INVERSION** in Working Code
The working scanner (`m:\thesis-with-scanner\server\ml_prediction\scanner.py`) does **NOT** invert pixels at all. It uses the raw data directly from the scanner.

### 2. **Simple Capture Flow**
Working code:
```python
# Line 389 - Direct capture call
status = dpfpdd.dpfpdd_capture(
    dev,
    ctypes.byref(capture_param),
    timeout_ms,
    ctypes.byref(capture_result),
    ctypes.byref(actual_image_size),
    image_buffer
)

# Line 430 - Direct use of raw bytes, NO INVERSION
image_data_bytes = bytes(image_buffer[:expected_pixel_data_size])
```

### 3. **Device Selection**
Working code doesn't have complex device prioritization - it just uses the first available device.

### 4. **Image Info Structure**
Working code properly initializes `DPFPDD_IMAGE_INFO`:
```python
capture_result.info.size = ctypes.sizeof(DPFPDD_IMAGE_INFO)
```

## The Problem in Current Implementation

1. **Line 571** in `scanner_real.py`: `np_image = 255 - np_image` ← This is **WRONG**
2. **Line 86** in `app.py`: `np_image = 255 - np_image` ← This is **WRONG**

The U.are.U scanner **ALREADY provides correct pixel data** (dark ridges on light background).
By inverting (`255 - np_image`), we're making it white/blank!

## Solution

**REMOVE ALL PIXEL INVERSIONS** - the scanner provides correct data already.

