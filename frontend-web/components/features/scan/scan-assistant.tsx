"use client";

import {
  Fingerprint,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ScannerState =
  | "idle"
  | "waiting"
  | "detecting"
  | "captured"
  | "paused"
  | "error"
  | "preparing"
  | "completed"
  | "retrying";

interface ScanAssistantProps {
  scannerState: ScannerState;
  currentFinger: string;
  countdown?: number | null;
  errorMessage?: string;
  onRescan?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStartScanning?: () => void;
  isPaused?: boolean;
  currentFingerIndex?: number;
  totalFingers?: number;
  scannedCount?: number;
  handGuideElement?: React.ReactNode;
}

export function ScanAssistant({
  scannerState,
  currentFinger,
  countdown,
  errorMessage,
  onRescan,
  onPause,
  onResume,
  onStartScanning,
  isPaused = false,
  currentFingerIndex: _currentFingerIndex = 0,
  totalFingers: _totalFingers = 10,
  scannedCount: _scannedCount = 0,
}: ScanAssistantProps) {
  const stateConfig = {
    idle: {
      icon: Fingerprint,
      iconClass: "text-teal-500 w-20 h-20",
      bgClass: "bg-gradient-to-br from-teal-50 to-cyan-50",
      borderClass: "border-teal-300",
      textClass: "text-teal-900",
      subtextClass: "text-teal-700",
      title: "Ready when you are! 👋",
      subtitle: "Let's capture your fingerprints together. Click below to begin!",
    },
    preparing: {
      icon: Fingerprint,
      iconClass: "text-purple-600 w-16 h-16",
      bgClass: "bg-gradient-to-br from-purple-50 to-pink-50",
      borderClass: "border-purple-200",
      textClass: "text-purple-900",
      subtextClass: "text-purple-700",
      title: "Preparing scanner...",
      subtitle: "Please wait while the scanner initializes",
    },
    waiting: {
      icon: Fingerprint,
      iconClass: "text-blue-600 w-16 h-16 animate-pulse",
      bgClass: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderClass: "border-blue-200",
      textClass: "text-blue-900",
      subtextClass: "text-blue-700",
      title: "Perfect! Now place your finger 👆",
      subtitle: `Ready for your ${currentFinger}. Take your time and press gently!`,
    },
    detecting: {
      icon: Fingerprint,
      iconClass: "text-teal-600 w-16 h-16",
      bgClass: "bg-gradient-to-br from-teal-50 to-cyan-50",
      borderClass: "border-teal-200",
      textClass: "text-teal-900",
      subtextClass: "text-teal-700",
      title: "Hold still...",
      subtitle: "Capturing your fingerprint",
    },
    captured: {
      icon: CheckCircle,
      iconClass: "text-green-600 w-16 h-16",
      bgClass: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderClass: "border-green-500",
      textClass: "text-green-900",
      subtextClass: "text-green-700",
      title: "Awesome! Got it! 🎉",
      subtitle:
        countdown && !isPaused
          ? `Next finger ready in ${countdown}s...`
          : isPaused
            ? "Paused - take your time!"
            : "Great job! Moving to next finger...",
    },
    paused: {
      icon: Pause,
      iconClass: "text-amber-600 w-16 h-16",
      bgClass: "bg-gradient-to-br from-amber-50 to-yellow-50",
      borderClass: "border-amber-200",
      textClass: "text-amber-900",
      subtextClass: "text-amber-700",
      title: "Scan paused",
      subtitle: "Click Resume to continue",
    },
    completed: {
      icon: CheckCircle,
      iconClass: "text-purple-600 w-20 h-20",
      bgClass: "bg-gradient-to-br from-purple-50 to-pink-50",
      borderClass: "border-purple-500",
      textClass: "text-purple-900",
      subtextClass: "text-purple-700",
      title: "All done! You're amazing! 🌟",
      subtitle: "Successfully captured all your fingerprints!",
    },
    retrying: {
      icon: Fingerprint,
      iconClass: "text-orange-600 w-16 h-16",
      bgClass: "bg-gradient-to-br from-orange-50 to-amber-50",
      borderClass: "border-orange-200",
      textClass: "text-orange-900",
      subtextClass: "text-orange-700",
      title: "Oops! Let's try that again 🔄",
      subtitle: "Don't worry - retrying the scan now. Just place your finger!",
    },
    error: {
      icon: AlertCircle,
      iconClass: "text-red-600 w-16 h-16",
      bgClass: "bg-gradient-to-br from-red-50 to-rose-50",
      borderClass: "border-red-200",
      textClass: "text-red-900",
      subtextClass: "text-red-700",
      title: errorMessage?.includes("after 3 attempts")
        ? "No finger detected"
        : "Scan unsuccessful",
      subtitle: errorMessage || "Please try again",
    },
  };

  const config = stateConfig[scannerState];
  const Icon = config.icon;
  const showActions = scannerState !== "idle";
  const isClickable = scannerState === "idle" && onStartScanning;
  const showSpinner =
    scannerState === "preparing" ||
    scannerState === "detecting" ||
    scannerState === "retrying";

  const spinnerClasses =
    scannerState === "preparing"
      ? {
          trackClassName: "border-purple-200",
          indicatorClassName: "border-purple-600 border-t-transparent",
        }
      : scannerState === "retrying"
        ? {
            trackClassName: "border-orange-200",
            indicatorClassName: "border-orange-600 border-t-transparent",
          }
        : {
            trackClassName: "border-teal-200",
            indicatorClassName: "border-teal-600 border-t-transparent",
          };

  return (
    <div
      className={`${config.bgClass} ${config.borderClass} border-3 rounded-3xl p-8 shadow-lg transition-all duration-300 relative h-[480px] flex flex-col justify-between ${
        isClickable
          ? "cursor-pointer hover:shadow-xl hover:scale-[1.02] animate-pulse"
          : ""
      }`}
      onClick={isClickable ? onStartScanning : undefined}
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          {showSpinner ? (
            <Spinner
              size="lg"
              className="w-16 h-16"
              label={config.title}
              trackClassName={spinnerClasses.trackClassName}
              indicatorClassName={spinnerClasses.indicatorClassName}
            />
          ) : (
            <Icon className={config.iconClass} strokeWidth={2.5} />
          )}
          {scannerState === "captured" && (
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-green-200 opacity-20 animate-ping" />
          )}
        </div>
      </div>

      <h3
        className={`${config.textClass} text-3xl font-extrabold text-center mb-3 leading-tight`}
      >
        {config.title}
      </h3>

      <p
        className={`${config.subtextClass} text-lg text-center font-medium leading-relaxed`}
      >
        {config.subtitle}
      </p>

      {showActions && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            {(scannerState === "captured" || scannerState === "error") && onRescan && (
              <Button
                onClick={onRescan}
                variant="outline"
                className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rescan This Finger
              </Button>
            )}

            {((scannerState === "captured" && countdown !== null) ||
              scannerState === "paused") && (
              <Button
                onClick={isPaused ? onResume : onPause}
                className={`w-full font-semibold ${
                  isPaused
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Auto-Advance
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Auto-Advance
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {scannerState === "waiting" && (
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="text-sm text-blue-800 font-medium">
                Clean and dry your finger
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="text-sm text-blue-800 font-medium">
                Press firmly on the scanner
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                3
              </div>
              <p className="text-sm text-blue-800 font-medium">
                Hold still until captured
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
