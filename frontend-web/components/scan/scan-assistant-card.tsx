"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HandGuide } from "@/components/features/scan/hand-guide";
import FingerprintScanner from "@/components/features/scan/fingerprint-scanner";
import { ScanAssistantSubtitle } from "@/components/features/scan/scan-assistant-subtitle";
import { ScanPreview } from "@/components/scan/scan-preview";

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
} from "lucide-react";

type Props = {
  // scan session state
  currentFingerIndex: number;
  fingerFiles: Partial<Record<FingerName, File>>;
  countdown: number | null;
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
  onRequestStartScanning: () => void;
  onOpenCancelModal: () => void;
  onOpenResetModal: () => void;
  onCapture: (fingerName: FingerName, file: File) => void;
  onPreviousFinger: () => void;
  onNextFinger: () => void;
  onTogglePaused: () => void;
  onRescan: () => void;
  rescanningFinger: { finger: FingerName; file: File } | null;
};

export function ScanAssistantCard({
  currentFingerIndex,
  fingerFiles,
  countdown,
  scanningStarted,
  paused,
  totalFingers,
  scannedCount,
  currentFinger,
  hand,
  highlight,
  scanAssistantState,
  firstUnscannedIndex,
  onRequestStartScanning,
  onOpenCancelModal,
  onOpenResetModal,
  onCapture,
  onPreviousFinger,
  onNextFinger,
  onTogglePaused,
  onRescan,
  rescanningFinger,
}: Props) {
  const preview = useMemo(() => {
    const currentFile = fingerFiles[currentFinger];
    const capturedKeys = Object.keys(fingerFiles);
    const lastKey =
      capturedKeys.length > 0
        ? (capturedKeys[capturedKeys.length - 1] as FingerName)
        : null;
    const fallbackFile = lastKey ? fingerFiles[lastKey] : null;

    // Check if we're rescanning this finger
    const isRescanning =
      rescanningFinger && rescanningFinger.finger === currentFinger && !currentFile;
    const fileToShow =
      currentFile || (isRescanning ? rescanningFinger.file : fallbackFile);
    const isCurrent = !!currentFile;
    const fingerNameToShow = isCurrent
      ? FINGER_NAMES[currentFinger]
      : isRescanning
        ? FINGER_NAMES[currentFinger]
        : lastKey
          ? FINGER_NAMES[lastKey]
          : "";

    return { fileToShow, isCurrent, fingerNameToShow, lastKey, isRescanning };
  }, [currentFinger, fingerFiles, rescanningFinger]);

  return (
    <Card className="border-2 border-gray-300 rounded-xl shadow-lg">
      <CardHeader className="pb-3 px-5 py-4 bg-linear-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-teal-800 flex items-center">
            <Fingerprint className="w-7 h-7 mr-3 text-teal-600" />
            Scan Assistant
          </CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-lg text-gray-600 font-semibold">
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
        <div className="text-center mb-2">
          <p className="text-2xl text-gray-600">
            Follow the instructions to scan your fingerprints
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-1">
          {/* Left Col: Hand Guide */}
          <div className="flex flex-col items-center">
            {/* Header Container with fixed height - Top Aligned for perfect title alignment */}
            <div className="h-16 flex flex-col items-center justify-start mb-3 pt-1">
              <span
                className={`text-2xl font-bold px-6 py-1.5 rounded-full shadow-sm ${
                  hand === "left"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {FINGER_NAMES[currentFinger]}
              </span>
            </div>

            <div className="w-50 h-50 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border-3 border-dashed border-blue-300 flex items-center justify-center mb-3 shadow-inner relative">
              <HandGuide hand={hand} highlightFinger={highlight} className="w-42 h-42" />
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
              <div className="w-full mt-2">
                <FingerprintScanner
                  onScanComplete={onCapture}
                  currentFinger={currentFinger}
                  autoStart={scanningStarted && countdown === null}
                  paused={paused}
                />
              </div>
            )}
          </div>

          {/* Right Col: Scan Result */}
          <div className="flex flex-col items-center">
            {/* Header Container - Same fixed height and top alignment */}
            <div className="h-16 flex flex-col items-center justify-start mb-3 pt-1">
              <span className="text-2xl font-bold px-6 py-1.5 rounded-full bg-gray-100 text-gray-700 shadow-sm">
                Scanned Result
              </span>
              {preview.fileToShow && preview.fingerNameToShow && (
                <span className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  {preview.fingerNameToShow}
                </span>
              )}
            </div>

            <div className="w-50 h-50 bg-gray-100 rounded-2xl border-3 border-gray-300 flex items-center justify-center overflow-hidden relative shadow-lg">
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
                    className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg ${
                      preview.isCurrent
                        ? "bg-green-600 text-white"
                        : preview.isRescanning
                          ? "bg-amber-600 text-white animate-pulse"
                          : "bg-gray-800 text-white backdrop-blur-sm"
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {preview.isCurrent
                      ? "Done"
                      : preview.isRescanning
                        ? "Rescanning"
                        : "Latest"}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <div className="text-lg font-semibold text-gray-500">Awaiting Scan</div>
                </div>
              )}
            </div>
            {/* 
            <div className="w-50 mt-2">
              <FingerprintUpload
                disabled={loading}
                label={FINGER_NAMES[currentFinger]}
                onFileSelected={(file) => onCapture(currentFinger, file)}
              />
            </div> */}

            {/* Retake Button - Only visible when session is complete */}
            {preview.isCurrent && scannedCount === totalFingers && (
              <Button
                onClick={onRescan}
                variant="outline"
                size="lg"
                className="w-50 h-12 mt-3 text-red-600 border-2 border-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-600 font-bold text-lg cursor-pointer transition-all shadow-sm"
              >
                Retake this Finger
              </Button>
            )}
          </div>
        </div>

        {/* Control Bar Separator */}
        <hr className="border-t-2 border-dashed border-gray-100 my-2" />

        {/* Dedicated Control Bar - Dynamic Buttons */}
        <div className="flex items-center justify-center gap-4 mb-2">
          {/* State 1: Not Started - Show Start Button */}
          {!scanningStarted ? (
            <Button
              onClick={onRequestStartScanning}
              size="lg"
              className="min-w-[200px] h-14 cursor-pointer bg-[#00c2cb] hover:bg-[#0099a0] text-white font-bold text-xl shadow-md transition-all transform hover:scale-105"
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
                className={`min-w-44 font-bold h-16 text-xl cursor-pointer ${
                  paused
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-amber-500 text-amber-700 hover:bg-amber-50"
                }`}
              >
                {paused ? (
                  <>
                    <Play className="w-5 h-5 mr-3" />
                    Resume Scan
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 mr-3" />
                    Pause Scan
                  </>
                )}
              </Button>

              {/* Cancel Session Button - Red */}
              <Button
                onClick={onOpenCancelModal}
                variant="ghost"
                className="text-red-500 hover:bg-red-50 hover:text-red-700 font-bold text-xl h-16 px-8 cursor-pointer"
              >
                Cancel
              </Button>
            </>
          ) : (
            /* State 3: Completed (10/10) - Show Restart Button */
            <Button
              onClick={onOpenResetModal}
              variant="outline"
              className="min-w-[200px] h-14 border-2 cursor-pointer border-dashed border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 font-bold text-lg shadow-sm transition-all"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Restart Session
            </Button>
          )}
        </div>

        {/* Bottom Navigation Bar - Full Width */}
        <div className="flex gap-4 items-center pt-2 border-t border-gray-100 mt-1">
          <Button
            onClick={onPreviousFinger}
            disabled={
              currentFingerIndex === 0 ||
              (scanningStarted && !paused && scannedCount < totalFingers)
            }
            variant="ghost"
            size="lg"
            className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-2xl h-16 font-bold"
          >
            <ChevronLeft className="w-8 h-8 mr-2" />
            Previous
          </Button>
          <Button
            onClick={onNextFinger}
            disabled={
              currentFingerIndex === totalFingers - 1 ||
              (scanningStarted && !paused && scannedCount < totalFingers) ||
              // Prevent going forward if the current finger hasn't been scanned AND we aren't done yet
              (scannedCount < totalFingers && currentFingerIndex >= firstUnscannedIndex)
            }
            variant="ghost"
            size="lg"
            className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-2xl h-16 font-bold"
          >
            Next Finger
            <ChevronRight className="w-8 h-8 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
