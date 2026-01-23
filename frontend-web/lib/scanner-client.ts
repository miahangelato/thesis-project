import { SCANNER_CONFIG } from "./constants";

/**
 * Scanner Client
 *
 * This client runs IN THE BROWSER (on the kiosk).
 * It connects to 'localhost' which resolves to the Kiosk machine itself.
 * This is how the cloud-hosted frontend talks to the local hardware.
 */

export interface ScanResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

class ScannerClient {
  private baseUrl: string;

  constructor() {
    // Always prefer localhost for kiosk operation
    // The Vercel deployment provides the JS, but it executes locally
    this.baseUrl = SCANNER_CONFIG.BASE_URL;
  }

  /**
   * Check if the local scanner service is running
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        mode: "cors", // Important: Cross-Origin Request
      });
      return response.ok;
    } catch (error) {
      console.warn("Scanner health check failed. Is the Edge Node running?", error);
      return false;
    }
  }

  /**
   * Start the fingerprint scanning process
   */
  async startScan(sessionId: string): Promise<ScanResult> {
    try {
      const response = await fetch(`${this.baseUrl}/scan`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Scan failed");
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      console.error("Scan error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to connect to scanner";
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get the WebSocket URL for live preview
   */
  getWebSocketUrl(): string {
    // Convert http://localhost:5000 to ws://localhost:5000
    return this.baseUrl.replace(/^http/, "ws");
  }
}

export const scannerClient = new ScannerClient();
