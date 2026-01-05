"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HandGuide } from "@/components/features/scan/hand-guide";
import FingerprintScanner from "@/components/features/scan/fingerprint-scanner";
import { ScanAssistantSubtitle } from "@/components/features/scan/scan-assistant-subtitle";
import { ScanPreview } from "@/components/scan/scan-preview";
import { FingerprintUpload } from "@/components/scan/fingerprint-upload";
import { FINGER_NAMES } from "@/lib/finger-names";
import { FingerName } from "@/types/fingerprint";
import type { ScanAssistantState } from "@/hooks/use-scan-session";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Fingerprint,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";

type Demographics = {
  age?: number | string;
  gender?: string;
  weight_kg?: number | string;
  height_cm?: number | string;
  blood_type?: string;
  // Backward compat
  weight?: number | string;
  height?: number | string;
  bloodType?: string;
} | null;

type Props = {
  loading: boolean;

  // scan session state
  currentFingerIndex: number;
  fingerFiles: Partial<Record<FingerName, File>>;
  demographics: Demographics;
  countdown: number | null;
  scannerReady: boolean;
  scanningStarted: boolean;
  paused: boolean;

  // derived
  totalFingers: number;
  scannedCount: number;
  currentFinger: FingerName;
  hand: "left" | "right";
  highlight: "thumb" | "index" | "middle" | "ring" | "pinky";
  scanAssistantState: ScanAssistantState;
  firstUnscannedIndex: number;

  // actions
  setScannerReady: (next: boolean) => void;
  onRequestStartScanning: () => void;
  onOpenCancelModal: () => void;
  onOpenResetModal: () => void;
  onCapture: (fingerName: FingerName, file: File) => void;
  onPreviousFinger: () => void;
  onNextFinger: () => void;
  onTogglePaused: () => void;
};

export function ScanAssistantCard({
  loading,
  currentFingerIndex,
  fingerFiles,
  demographics,
  countdown,
  scannerReady,
  scanningStarted,
  paused,
  totalFingers,
  scannedCount,
  currentFinger,
  hand,
  highlight,
  scanAssistantState,
  firstUnscannedIndex,
  setScannerReady,
  onRequestStartScanning,
  onOpenCancelModal,
  onOpenResetModal,
  onCapture,
  onPreviousFinger,
  onNextFinger,
  onTogglePaused,
}: Props) {
  const preview = useMemo(() => {
    const currentFile = fingerFiles[currentFinger];
    const capturedKeys = Object.keys(fingerFiles);
    const lastKey =
      capturedKeys.length > 0
        ? (capturedKeys[capturedKeys.length - 1] as FingerName)
        : null;
    const fallbackFile = lastKey ? fingerFiles[lastKey] : null;

    const fileToShow = currentFile || fallbackFile;
    const isCurrent = !!currentFile;
    const fingerNameToShow = isCurrent
      ? FINGER_NAMES[currentFinger]
      : lastKey
      ? FINGER_NAMES[lastKey]
      : "";

    return { fileToShow, isCurrent, fingerNameToShow, lastKey };
  }, [currentFinger, fingerFiles]);

  return (
    <Card className="border-2 border-gray-300 rounded-xl shadow-lg">
      <CardHeader className="pb-3 px-5 py-4 bg-linear-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-800 flex items-center">
            <Fingerprint className="w-7 h-7 mr-3 text-teal-600" />
            Scan Assistant
          </CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-base text-gray-600 font-semibold">
              {scannedCount}/{totalFingers} Scanned
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-linear-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${(scannedCount / totalFingers) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-teal-600">
              {scannedCount}/{totalFingers}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Header Section - Moved outside grid for alignment */}
        <div className="text-center mb-6">
          <p className="text-lgtext-gray-600">
            Follow the instructions to scan your fingerprints
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-2">
          {/* Left Col: Hand Guide */}
          <div className="flex flex-col items-center">
            {/* Hand Label - Top of Column */}
            <span
              className={`text-lg font-bold mb-3 px-6 py-1.5 rounded-full shadow-sm ${
                hand === "left"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {FINGER_NAMES[currentFinger]}
            </span>

            <div className="w-56 h-56 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border-3 border-dashed border-blue-300 flex items-center justify-center mb-3 shadow-inner relative">
              <HandGuide
                hand={hand}
                highlightFinger={highlight}
                className="w-48 h-48"
              />
            </div>

            {/* Scan Assistant Status */}
            <div className="w-full">
              <ScanAssistantSubtitle
                scannerState={scanAssistantState}
                currentFinger={FINGER_NAMES[currentFinger]}
                countdown={countdown}
                onStartScanning={onRequestStartScanning}
                isPaused={paused}
              />
            </div>

            {/* Hidden Scanner Component */}
            {scanningStarted && scannedCount < totalFingers && (
              <div className="hidden">
                <FingerprintScanner
                  onScanComplete={onCapture}
                  currentFinger={currentFinger}
                  participantData={demographics}
                  autoStart={scanningStarted && countdown === null}
                  paused={paused}
                  onScannerReady={() => setScannerReady(true)}
                />
              </div>
            )}
          </div>

          {/* Right Col: Scan Result */}
          <div className="flex flex-col items-center">
            {/* Result Label - Top of Column (Aligned with Hand Label) */}
            <span className="text-lg font-bold mb-3 px-6 py-1.5 rounded-full bg-gray-100 text-gray-700 shadow-sm">
              Scan Result
            </span>

            <div className="w-56 h-56 bg-gray-100 rounded-2xl border-3 border-gray-300 flex items-center justify-center mb-3 overflow-hidden relative shadow-lg">
              {preview.fileToShow ? (
                <>
                  <div className="relative w-full h-full">
                    <ScanPreview
                      file={preview.fileToShow}
                      alt={`Captured ${preview.fingerNameToShow}`}
                      className="object-cover"
                    />
                  </div>

                  <div
                    className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg ${
                      preview.isCurrent
                        ? "bg-green-600 text-white"
                        : "bg-gray-800 text-white backdrop-blur-sm"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {preview.isCurrent ? "Already Done" : "Latest Scan"}
                  </div>

                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                      {preview.fingerNameToShow}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <div className="text-lg font-semibold text-gray-500">
                    Awaiting Scan
                  </div>
                </div>
              )}
            </div>

            <div className="w-56">
              <FingerprintUpload
                disabled={loading}
                label={FINGER_NAMES[currentFinger]}
                onFileSelected={(file) => onCapture(currentFinger, file)}
              />
            </div>
          </div>
        </div>

        {/* Control Bar Separator */}
        <hr className="border-t-2 border-dashed border-gray-100 my-4" />

        {/* Dedicated Control Bar - Dynamic Buttons */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* State 1: Not Started - Show Start Button */}
          {!scanningStarted ? (
            <Button
              onClick={onRequestStartScanning}
              size="lg"
              className="min-w-[200px] h-12 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-md transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Scanning
            </Button>
          ) : scannedCount < totalFingers ? (
            /* State 2: Scanning - Show Pause/Resume, Restart, Cancel */
            <>
              {/* Pause/Resume Button */}
              <Button
                onClick={onTogglePaused}
                variant={paused ? "default" : "outline"}
                className={`min-w-[140px] font-semibold h-11 cursor-pointer ${
                  paused
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-amber-500 text-amber-700 hover:bg-amber-50"
                }`}
              >
                {paused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Scan
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Scan
                  </>
                )}
              </Button>

              {/* Restart Finger (Rescan) */}
              {scannerReady && (
                <Button
                  onClick={() => {
                    setScannerReady(false);
                    setTimeout(() => setScannerReady(true), 500);
                  }}
                  variant="outline"
                  className="min-w-[140px] h-11 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rescan Finger
                </Button>
              )}

              {/* Cancel Session Button - Red */}
              <Button
                onClick={onOpenCancelModal}
                variant="ghost"
                className="text-red-500 hover:bg-red-50 hover:text-red-700 font-semibold h-11 px-4 cursor-pointer"
              >
                Cancel
              </Button>
            </>
          ) : (
            /* State 3: Completed (10/10) - Show Restart Button */
            <Button
              onClick={onOpenResetModal}
              variant="outline"
              className="min-w-[200px] h-12 border-2 cursor-pointer border-dashed border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 font-bold text-lg shadow-sm transition-all"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Restart Session
            </Button>
          )}
        </div>

        {/* Bottom Navigation Bar - Full Width */}
        <div className="flex gap-4 items-center pt-2 border-t border-gray-100 mt-2">
          <Button
            onClick={onPreviousFinger}
            disabled={
              currentFingerIndex === 0 ||
              (scanningStarted && !paused && scannedCount < totalFingers)
            }
            variant="ghost"
            size="lg"
            className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>
          <Button
            onClick={onNextFinger}
            disabled={
              currentFingerIndex === totalFingers - 1 ||
              (scanningStarted && !paused && scannedCount < totalFingers) ||
              // Prevent going forward if the current finger hasn't been scanned AND we aren't done yet
              (scannedCount < totalFingers &&
                currentFingerIndex >= firstUnscannedIndex)
            }
            variant="ghost"
            size="lg"
            className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            Next Finger
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
