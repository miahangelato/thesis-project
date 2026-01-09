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
  | "preparing"
  | "completed"
  | "retrying"
  | "countdown"
  | "initializing";

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
  const [fingerFiles, setFingerFiles] = useState<
    Partial<Record<FingerName, File>>
  >({});
  const [demographics] = useState<StoredDemographics | null>(() => {
    try {
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

  const totalFingers = FINGER_ORDER.length;
  const scannedCount = Object.keys(fingerFiles).length;

  const currentFinger = FINGER_ORDER[currentFingerIndex];

  const firstUnscannedIndex = useMemo(() => {
    const idx = FINGER_ORDER.findIndex((f) => !fingerFiles[f]);
    return idx === -1 ? totalFingers - 1 : idx;
  }, [fingerFiles, totalFingers]);

  const { hand, highlight } = useMemo(() => {
    const [handRaw, fingerRaw] = currentFinger
      ? currentFinger.split("_")
      : ["", ""];
    return {
      hand: handRaw as "right" | "left",
      highlight: fingerRaw as "thumb" | "index" | "middle" | "ring" | "pinky",
    };
  }, [currentFinger]);

  const scanAssistantState: ScanAssistantState = useMemo(() => {
    if (scannedCount >= totalFingers) return "completed";
    if (!scanningStarted) return "idle";
    if (paused) return "paused";
    if (countdown !== null && countdown > 0) return "countdown";
    if (scannerReady) return "waiting";
    if (isFirstScan && scannedCount === 0) return "initializing";
    return "preparing";
  }, [
    countdown,
    isFirstScan,
    paused,
    scannedCount,
    scannerReady,
    scanningStarted,
    totalFingers,
  ]);

  // Log state changes
  useEffect(() => {
    console.log(
      `📊 Scan State: ${
        scanningStarted ? "ACTIVE" : "STOPPED"
      } | Count: ${scannedCount}/${totalFingers}`
    );
  }, [scanningStarted, scannedCount, totalFingers]);

  // Countdown timer effect - manages countdown and respects paused state
  useEffect(() => {
    if (countdown === null || countdown <= 0 || paused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return null;
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
    console.log("🔄 Session Reset Confirmed");
  };

  const handleCapture = (fingerName: FingerName, file: File) => {
    // Treat upload like a real scan
    if (!scanningStarted) setScanningStarted(true);

    console.log("\n🎉 === FINGER CAPTURE COMPLETE ===");
    console.log(`📸 Captured: ${fingerName}`);
    console.log(`📁 File size: ${file.size} bytes`);

    const updatedFiles = { ...fingerFiles, [fingerName]: file };
    setFingerFiles(updatedFiles);

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

    // actions
    handleResetSession,
    handleCapture,
    handleNextFinger,
    handlePreviousFinger,
    togglePaused,
  };
}
