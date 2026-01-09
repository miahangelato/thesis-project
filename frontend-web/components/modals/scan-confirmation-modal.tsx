"use client";

import { Button } from "@/components/ui/button";
import { Fingerprint, AlertCircle, CheckCircle } from "lucide-react";

interface ScanConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScanConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
}: ScanConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-9">
            {/* Header */}
            <div className="flex items-center gap-5 mb-7">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Start Automatic Scanning
                </h2>
                <p className="text-base text-gray-600">
                  10 fingers will be scanned
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-5 mb-7">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-base font-semibold text-blue-900 mb-1">
                      Automatic Process
                    </p>
                    <p className="text-base text-blue-800">
                      The scanner will automatically capture each finger and
                      move to the next one after 5 seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-base font-semibold text-amber-900 mb-1">
                      If Scanning Fails
                    </p>
                    <p className="text-base text-amber-800">
                      Don&apos;t worry! You can easily rescan any finger that
                      fails. Just click the &quot;Rescan This Finger&quot;
                      button.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <p className="text-base text-gray-700">
                  <strong className="text-gray-900">
                    Tips for best results:
                  </strong>
                  <br />
                  • Clean and dry your fingers
                  <br />
                  • Press firmly on the scanner
                  <br />• Keep your finger still during capture
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold cursor-pointer"
              >
                <Fingerprint className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
