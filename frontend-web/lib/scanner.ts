const SCANNER_BASE_URL = process.env.NEXT_PUBLIC_SCANNER_URL
  ? `${process.env.NEXT_PUBLIC_SCANNER_URL}/api/scanner`
  : "http://localhost:5000/api/scanner";
const API_KEY = process.env.NEXT_PUBLIC_KIOSK_API_KEY || "";

export interface ScannerStatus {
  scanner_available: boolean;
  status: string;
  platform: string;
  device_count?: number;
  admin_required?: boolean;
  message: string;
}

export interface ScanResult {
  success: boolean;
  image?: string;
  finger?: string;
  width?: number;
  height?: number;
  quality?: number;
  error?: string;
  debug_info?: string;
}

export async function checkScannerStatus(): Promise<ScannerStatus> {
  try {
    const response = await fetch(`${SCANNER_BASE_URL}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error(`Scanner status check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      scanner_available: false,
      status: "error",
      platform: "unknown",
      message: error instanceof Error ? error.message : "Failed to connect to scanner",
    };
  }
}

export async function captureFinger(fingerName: string): Promise<ScanResult> {
  try {
    const response = await fetch(`${SCANNER_BASE_URL}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        finger_name: fingerName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Capture failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.message || "Scan failed",
        debug_info: data.error,
      };
    }

    return {
      success: true,
      image: data.data.image_data,
      finger: data.data.finger,
      width: data.data.width,
      height: data.data.height,
      quality: data.data.quality,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to capture fingerprint",
    };
  }
}

export function base64ToFile(base64: string, filename: string): File {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: "image/png" });
  return new File([blob], filename, { type: "image/png" });
}
