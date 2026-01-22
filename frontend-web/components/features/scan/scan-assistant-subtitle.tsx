"use client";

type ScannerState =
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

interface ScanAssistantSubtitleProps {
  scannerState: ScannerState;
  currentFinger: string;
  countdown?: number | null;
  errorMessage?: string;
  onStartScanning?: () => void;
  isPaused?: boolean;
}

export function ScanAssistantSubtitle({
  scannerState,
  currentFinger,
  countdown,
  errorMessage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStartScanning: _onStartScanning,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPaused: _isPaused = false,
}: ScanAssistantSubtitleProps) {
  // State configuration - simplified for subtitle display
  const stateConfig = {
    idle: {
      text: "Click 'Start Scanning' below to begin",
      textClass: "text-blue-800",
    },
    initializing: {
      text: "Preparing the scanner...",
      textClass: "text-blue-600",
    },
    preparing: {
      text: "Preparing scanner...",
      textClass: "text-blue-700",
    },
    waiting: {
      text: `Place your ${currentFinger}`,
      textClass: "text-teal-600 animate-pulse",
    },
    detecting: {
      text: `Place your ${currentFinger}`,
      textClass: "text-teal-600",
    },
    captured: {
      text: "Captured",
      textClass: "text-green-600",
    },
    countdown: {
      text: `Prepare your next finger... (Next in ${countdown})`,
      textClass: "text-blue-700",
    },
    paused: {
      text: "Scan paused - Click Resume to continue",
      textClass: "text-amber-600",
    },
    completed: {
      text: "All done! You're amazing!",
      textClass: "text-green-600",
    },
    retrying: {
      text: "Let's try that again - place your finger!",
      textClass: "text-orange-600",
    },
    error: {
      text: errorMessage || "Scan unsuccessful - please try again",
      textClass: "text-red-600",
    },
  };

  const config = stateConfig[scannerState];

  /* logic to override countdown text dynamically */
  let displayText = config.text;
  if (scannerState === "countdown" && countdown !== undefined && countdown !== null) {
    if (countdown > 3) {
      displayText = `Prepare your ${currentFinger}...`;
    } else {
      displayText = `${currentFinger} in ${countdown}s...`;
    }
  }

  return (
    <div className="text-center mt-1">
      {/* Instruction Text */}
      <p className={`text-2xl font-bold ${config.textClass} leading-relaxed whitespace-nowrap`}>
        {displayText}
      </p>
    </div>
  );
}
