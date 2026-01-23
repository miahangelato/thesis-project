"use client";

import { useEffect, useMemo, useState } from "react";
import { FINGER_ORDER, FingerName } from "@/types/fingerprint";

export type ScanAssistantState =
  | "idle"
  | "waiting"
  | "detecting"
  | "captured"
  | "paused"
  | "error"
  | "completed"
  | "retrying"
  | "countdown";

type StoredDemographics = {
  age?: number | string;
  gender?: string;
  // Stored by demographics step (canonical)
  weight_kg?: number | string;
  height_cm?: number | string;
  blood_type?: string;

  // Backward-compat keys (older builds / other sources)
  weight?: number | string;
  height?: number | string;
  bloodType?: string;
};

export function useScanSession() {
  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [fingerFiles, setFingerFiles] = useState<Partial<Record<FingerName, File>>>(
    () => {
      // Load saved fingerprint images from sessionStorage
      try {
        if (typeof window === "undefined") return {};
        const saved = sessionStorage.getItem("scanned_fingerprints");
        if (saved) {
          const data = JSON.parse(saved);
          const files: Partial<Record<FingerName, File>> = {};

          // Convert base64 back to File objects
          for (const [finger, base64] of Object.entries(data)) {
            if (typeof base64 === "string") {
              // Convert base64 to binary
              const byteString = atob(base64.split(",")[1]);
              const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: mimeString });
              files[finger as FingerName] = new File([blob], `${finger}.png`, {
                type: mimeString,
              });
            }
          }
          return files;
        }
      } catch (error) {
        console.error("Failed to load scanned fingerprints from sessionStorage:", error);
      }
      return {};
    }
  );
  const [demographics] = useState<StoredDemographics | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const storedDemo = sessionStorage.getItem("demographics");
      if (!storedDemo) return null;
      return JSON.parse(storedDemo) as StoredDemographics;
    } catch {
      return null;
    }
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanningStarted, setScanningStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isFirstScan, setIsFirstScan] = useState(true);
  const [rescanningFinger, setRescanningFinger] = useState<{
    finger: FingerName;
    file: File;
  } | null>(null);

  const totalFingers = FINGER_ORDER.length;
  const scannedCount = Object.keys(fingerFiles).length;

  const currentFinger = FINGER_ORDER[currentFingerIndex];

  const firstUnscannedIndex = useMemo(() => {
    const idx = FINGER_ORDER.findIndex((f) => !fingerFiles[f]);
    return idx === -1 ? totalFingers - 1 : idx;
  }, [fingerFiles, totalFingers]);

  const { hand, highlight } = useMemo(() => {
    const [handRaw, fingerRaw] = currentFinger ? currentFinger.split("_") : ["", ""];
    return {
      hand: handRaw as "right" | "left",
      highlight: fingerRaw as "thumb" | "index" | "middle" | "ring" | "pinky",
    };
  }, [currentFinger]);

  // Save fingerFiles to sessionStorage whenever they change
  useEffect(() => {
    const saveFingerprints = async () => {
      try {
        const data: Record<string, string> = {};

        // Convert File objects to base64
        for (const [finger, file] of Object.entries(fingerFiles)) {
          if (file) {
            const reader = new FileReader();
            await new Promise((resolve) => {
              reader.onloadend = () => {
                data[finger] = reader.result as string;
                resolve(null);
              };
              reader.readAsDataURL(file);
            });
          }
        }

        sessionStorage.setItem("scanned_fingerprints", JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save scanned fingerprints to sessionStorage:", error);
      }
    };

    if (Object.keys(fingerFiles).length > 0) {
      saveFingerprints();
    }
  }, [fingerFiles]);

  const scanAssistantState: ScanAssistantState = useMemo(() => {
    if (scannedCount >= totalFingers) return "completed";
    if (!scanningStarted) return "idle";
    if (paused) return "paused";
    if (countdown !== null && countdown > 0) return "countdown";
    // When countdown finishes (null), show waiting - scanner activates
    return "waiting";
  }, [countdown, paused, scannedCount, scanningStarted, totalFingers]);

  // Countdown timer effect - manages countdown and respects paused state
  useEffect(() => {
    // Check if we should ignore
    if (countdown === null || paused) return;

    // Countdown tick
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) return null;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, paused]);

  const handleResetSession = () => {
    setFingerFiles({});
    setCurrentFingerIndex(0);
    setScanningStarted(false);
    setScannerReady(false);
    setPaused(false);
    setIsFirstScan(true);
    setCountdown(null);
    sessionStorage.removeItem("scanned_fingerprints");
  };

  const handleCapture = (fingerName: FingerName, file: File) => {
    // Treat upload like a real scan
    if (!scanningStarted) setScanningStarted(true);

    const updatedFiles = { ...fingerFiles, [fingerName]: file };
    setFingerFiles(updatedFiles);

    // Clear rescanning state when capture is complete
    setRescanningFinger(null);

    setScannerReady(false);
    setIsFirstScan(false);

    // Immediately advance to next unscanned finger
    let nextIndex = currentFingerIndex;
    let foundNext = false;

    for (let i = currentFingerIndex + 1; i < totalFingers; i++) {
      if (!updatedFiles[FINGER_ORDER[i]]) {
        nextIndex = i;
        foundNext = true;
        break;
      }
    }

    if (!foundNext) {
      for (let i = 0; i < currentFingerIndex; i++) {
        if (!updatedFiles[FINGER_ORDER[i]]) {
          nextIndex = i;
          foundNext = true;
          break;
        }
      }
    }

    if (foundNext) {
      setCurrentFingerIndex(nextIndex);
      setCountdown(5);
    } else {
      setCountdown(null);
    }
  };

  const handleNextFinger = () => {
    if (currentFingerIndex < totalFingers - 1) {
      setCurrentFingerIndex(currentFingerIndex + 1);
    }
  };

  const handlePreviousFinger = () => {
    if (currentFingerIndex > 0) {
      setCurrentFingerIndex(currentFingerIndex - 1);
    }
  };

  const togglePaused = () => {
    if (paused) {
      const firstUnscanned = FINGER_ORDER.findIndex((f) => !fingerFiles[f]);
      if (firstUnscanned !== -1) {
        setCurrentFingerIndex(firstUnscanned);
      }
      setPaused(false);
    } else {
      setPaused(true);
    }
  };

  return {
    // state
    currentFingerIndex,
    fingerFiles,
    demographics,
    countdown,
    scannerReady,
    scanningStarted,
    paused,
    isFirstScan,

    // derived
    totalFingers,
    scannedCount,
    currentFinger,
    hand,
    highlight,
    scanAssistantState,
    isScanned: !!fingerFiles[currentFinger],
    firstUnscannedIndex,

    // setters
    setScannerReady,
    setScanningStarted,
    setCurrentFingerIndex,
    setCountdown,

    // actions
    handleResetSession,
    handleCapture,
    handleNextFinger,
    handlePreviousFinger,
    togglePaused,
    handleRescan: () => {
      // Store the original image before removing it
      const originalFile = fingerFiles[currentFinger];
      if (originalFile) {
        setRescanningFinger({ finger: currentFinger, file: originalFile });
      }

      // Remove the current finger from captured files
      const updatedFiles = { ...fingerFiles };
      delete updatedFiles[currentFinger];
      setFingerFiles(updatedFiles);

      // Reset scanner state to trigger a new scan
      setScannerReady(false);
      setCountdown(3);
    },
    rescanningFinger,
  };
}
