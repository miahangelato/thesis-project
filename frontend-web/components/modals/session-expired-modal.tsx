"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";
import { useSession } from "@/contexts/session-context";
import { PRIVACY_MESSAGES } from "@/lib/privacy";

export function SessionExpiredModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { expirationReason } = useSession();
  // Derived state (avoid useEffect for simple boolean logic)
  const isVisible = searchParams?.get("expired") === "true" || !!expirationReason;

  if (!isVisible) {
    return null;
  }

  const handleStartNew = () => {
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border-2 border-emerald-500/20">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Session Ended
          </h2>

          {/* Message */}
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              {expirationReason || PRIVACY_MESSAGES.SESSION_EXPIRED_GENERIC}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {PRIVACY_MESSAGES.START_NEW_SESSION}
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 w-full">
            <div className="flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-200">
                <strong>Privacy protected:</strong> All your data has been cleared from
                this device. We assume shared or public devices.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartNew}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Start New Screening
          </button>
        </div>
      </div>
    </div>
  );
}
