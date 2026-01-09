"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw, Shield } from "lucide-react";

type Props = {
  showCancelModal: boolean;
  onCloseCancel: () => void;
  onConfirmCancel: () => void;

  showResetConfirmModal: boolean;
  onCloseReset: () => void;
  onConfirmReset: () => void;
};

export function ScanSessionModals({
  showCancelModal,
  onCloseCancel,
  onConfirmCancel,
  showResetConfirmModal,
  onCloseReset,
  onConfirmReset,
}: Props) {
  return (
    <>
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Cancel Scanning?
              </h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to cancel? All progress for this session
                will be lost and you will have to start over.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-base cursor-pointer"
                  onClick={onCloseCancel}
                >
                  Continue Scanning
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700 cursor-pointer"
                  onClick={onConfirmCancel}
                >
                  Yes, Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCcw className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Restart Session?
              </h3>
              <p className="text-gray-600 mb-8">
                This will clear all 10 scanned fingerprints and you will have to
                start over. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-base cursor-pointer"
                  onClick={onCloseReset}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700 cursor-pointer"
                  onClick={onConfirmReset}
                >
                  Yes, Restart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
