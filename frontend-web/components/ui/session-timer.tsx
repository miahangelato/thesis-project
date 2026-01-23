"use client";

import { useEffect, useState } from "react";
import { Clock, Shield } from "lucide-react";
import { getPrivacyCleanupManager, formatTimeRemaining } from "@/lib/privacy";
import { useSession } from "@/contexts/session-context";

interface SessionTimerProps {
  showInHeader?: boolean;
}

export function SessionTimer({ showInHeader = true }: SessionTimerProps) {
  const { sessionActive } = useSession();
  const [timeRemaining, setTimeRemaining] = useState<{
    absolute: number;
    inactivity: number;
  } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!sessionActive) {
      // Don't set state during render, just return early
      return;
    }

    const privacyManager = getPrivacyCleanupManager();
    
    // Guard against SSR or missing manager
    if (!privacyManager) {
      return;
    }

    // Update timer every second
    const intervalId = setInterval(() => {
      const remaining = privacyManager.getTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning if less than 2 minutes on either timer
      if (remaining) {
        const twoMinutes = 2 * 60 * 1000;
        setShowWarning(
          remaining.absolute < twoMinutes || remaining.inactivity < twoMinutes
        );
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sessionActive]);

  if (!sessionActive || !timeRemaining) {
    return null;
  }

  // Use the shorter of the two timeouts
  const effectiveRemaining = Math.min(timeRemaining.absolute, timeRemaining.inactivity);
  const isInactivityShorter = timeRemaining.inactivity < timeRemaining.absolute;

  if (showInHeader) {
    return (
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
          ${
            showWarning
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }
        `}
      >
        <Shield className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isInactivityShorter ? "Active:" : "Session:"}
        </span>
        <span className="font-mono font-bold">
          {formatTimeRemaining(effectiveRemaining)}
        </span>
      </div>
    );
  }

  // Full warning banner
  if (showWarning) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 animate-pulse" />
            <p className="font-medium">
              Your session will end in{" "}
              <span className="font-bold font-mono">
                {formatTimeRemaining(effectiveRemaining)}
              </span>{" "}
              for privacy.
              {isInactivityShorter && (
                <span className="ml-2 text-sm opacity-90">
                  (Tap anywhere to stay active)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
