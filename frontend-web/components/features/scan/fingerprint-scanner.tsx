"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FingerName } from "@/types/fingerprint";
import { WifiOff, Fingerprint, X } from "lucide-react";

interface FingerprintScannerProps {
  onScanComplete: (fingerName: FingerName, file: File) => void;
  currentFinger: FingerName;
  autoStart?: boolean;
  paused?: boolean;
  onScannerReady?: () => void; // NEW: Callback when scanner is ready
}

const SCANNER_BASE_URL = process.env.NEXT_PUBLIC_SCANNER_URL || "http://localhost:5000";

export default function FingerprintScanner({
  onScanComplete,
  currentFinger,
  autoStart = false,
  paused = false, // NEW: Default to not paused
  onScannerReady,
}: FingerprintScannerProps) {
  const [phase, setPhase] = useState<"waiting" | "scanning" | "idle">("idle");
  const [waitCountdown, setWaitCountdown] = useState<number | null>(null);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0); // Track retry attempts
  const MAX_RETRIES = 3;

  // Define callback functions FIRST before useEffects
  const startScanFlow = React.useCallback(() => {
    setPhase("scanning"); // Skip countdown, go directly to scanning
    setWaitCountdown(null);
    setError(null);
    setRetryAttempt(0); // Reset retry counter for new scan
  }, [currentFinger]);

  const performScan = React.useCallback(async () => {
    setPhase("scanning");

    try {
      const response = await axios.post(
        `${SCANNER_BASE_URL}/api/scanner/capture`,
        {
          finger_name: currentFinger,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            "X-API-Key": process.env.NEXT_PUBLIC_KIOSK_API_KEY || "",
          },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        let base64Data = response.data.data.image_data;

        if (base64Data.includes(",")) {
          base64Data = base64Data.split(",")[1];
        }

        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          const blob = new Blob([byteArray], { type: "image/png" });
          const file = new File([blob], `${currentFinger}.png`, {
            type: "image/png",
          });

          setPhase("idle");
          onScanComplete(currentFinger, file);
        } catch (conversionError) {
          console.error("❌ Image conversion error:", conversionError);
          setTimeout(() => startScanFlow(), 1000);
        }
      } else {
        // Check if this was a "no finger detected" error
        const isNoFingerError =
          response.data.message &&
          (response.data.message.includes("no finger") ||
            response.data.message.includes("Please try") ||
            response.status === 400);

        if (isNoFingerError && retryAttempt < MAX_RETRIES) {
          // Auto-retry
          const nextAttempt = retryAttempt + 1;
          setRetryAttempt(nextAttempt);

          // Wait 1.5 seconds before retry
          setTimeout(() => {
            // eslint-disable-next-line react-hooks/immutability
            performScan();
          }, 1500);
        } else {
          // Max retries reached or other error
          if (retryAttempt >= MAX_RETRIES) {
            setError({
              type: "NO_FINGER",
              message:
                "No finger detected after 3 attempts. Please ensure your finger is placed on the scanner.",
            });
          } else {
            setError({
              type: "SCAN_FAILED",
              message: response.data.message || "Scan failed. Please try again.",
            });
          }
          setPhase("idle");
          setRetryAttempt(0); // Reset retry counter
        }
      }
    } catch (err: unknown) {
      console.error("❌ Scan error:", err);
      const error = err as {
        code?: string;
        message?: string;
        response?: { data?: { message?: string } };
      };

      // Check if it's a network/connection error
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        setPhase("idle");
        setError({
          type: "network",
          message:
            "Cannot connect to scanner. Please check if the scanner is connected and the scanner app is running.",
        });
        setRetryAttempt(0);
      } else if (retryAttempt < MAX_RETRIES) {
        // Auto-retry for other errors
        const nextAttempt = retryAttempt + 1;
        setRetryAttempt(nextAttempt);
        setTimeout(() => performScan(), 1500);
      } else {
        // Max retries reached
        setPhase("idle");
        setError({
          type: "ERROR",
          message:
            error.response?.data?.message ||
            error.message ||
            "Scanner error. Please try again.",
        });
        setRetryAttempt(0);
      }
    }
  }, [currentFinger, onScanComplete, startScanFlow, retryAttempt]);

  // NOW define useEffects that use the callbacks

  // Reset to idle when finger changes (so auto-start can re-trigger)
  useEffect(() => {
    setPhase("idle");
    setWaitCountdown(null);
    setError(null);
  }, [currentFinger]);

  // Auto-start when autoStart becomes true AND when finger changes
  useEffect(() => {
    if (autoStart && phase === "idle" && !paused) {
      // Directly trigger scan without waiting
      performScan();
    }
  }, [autoStart, currentFinger, phase, paused, performScan]);

  // Countdown effect and scan trigger - REMOVED (countdown handled by parent hook)
  // The countdown is now managed by the parent hook and displayed in the UI
  // When countdown reaches 0, the parent sets autoStart=true which triggers performScan

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Waiting Phase - Place Finger */}
      {phase === "waiting" && waitCountdown !== null && (
        <div
          className={`flex items-center gap-3 px-6 py-4 border-2 rounded-lg ${
            paused ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
          }`}
        >
          <Fingerprint
            className={`w-6 h-6 ${paused ? "text-amber-600" : "text-blue-600 animate-pulse"}`}
          />
          <div className="text-left">
            <div className={`font-bold ${paused ? "text-amber-900" : "text-blue-900"}`}>
              {paused ? "⏸ Scan paused" : "Place your finger now"}
            </div>
            <div className={`text-sm ${paused ? "text-amber-700" : "text-blue-700"}`}>
              {paused
                ? "Will resume when you unpause"
                : `Starting scan in ${waitCountdown} second${waitCountdown !== 1 ? "s" : ""}...`}
            </div>
          </div>
        </div>
      )}

      {/* Network Error Only */}
      {error && error.type === "network" && (
        <div className="fixed w-full max-w-md bg-red-50 border-2 border-red-200 rounded-lg p-4 top-9 right-34 z-1">
          <div className="flex items-start gap-3">
            <WifiOff className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <div className="font-semibold text-red-900 mb-2">Scanner Not Connected</div>
              <p className="text-lg text-red-800 mb-3">{error.message}</p>
              <div className="text-md text-red-700 bg-white/50 rounded p-2">
                <strong>To fix this:</strong>
                <br />• Check scanner USB connection
                <br />• Ensure scanner app is running
                <br />• Restart the scanner if needed
              </div>
            </div>
          </div>
          <X
            className="w-6 h-6 text-red-400 absolute top-3 right-3 cursor-pointer"
            onClick={() => setError(null)}
          />
        </div>
      )}
    </div>
  );
}
