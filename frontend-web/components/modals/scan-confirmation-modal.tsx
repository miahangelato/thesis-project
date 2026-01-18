"use client";

import { Button } from "@/components/ui/button";
import { Fingerprint, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import * as React from "react";

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
  const titleId = React.useId();

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      labelledById={titleId}
      backdropClassName="bg-teal-950/40 backdrop-blur-md"
      panelClassName="max-w-2xl rounded-[2rem] border border-teal-100"
      showTopBar
      topBarClassName="bg-gradient-to-r from-teal-400 to-cyan-400"
    >
      <div className="p-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-6 mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl flex items-center justify-center shadow-sm border border-teal-100">
            <Fingerprint className="w-12 h-12 text-teal-600" />
          </div>
          <div>
            <h2
              id={titleId}
              className="text-4xl font-bold text-gray-900 mb-3 tracking-tight"
            >
              Start Automatic Scanning
            </h2>
            <p className="text-xl text-gray-500 font-medium">
              10 fingers will be scanned sequentially
            </p>
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 mb-10">
          {/* Automatic Process - Hero Block */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
                <Sparkles className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-teal-900 mb-2">Automatic Process</p>
                <p className="text-lg text-teal-800/80 leading-relaxed">
                  The scanner will automatically capture each finger and move to the next
                  one after <span className="font-bold">5 seconds</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Failure Handling */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <p className="text-lg font-bold text-amber-900">If Scanning Fails</p>
              </div>
              <p className="text-base text-amber-800/90 leading-relaxed font-medium">
                Don&apos;t worry! You can review and retake any finger after the scanning
                process is complete.
              </p>
            </div>

            {/* Quick Tips */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-gray-600" />
                <p className="text-lg font-bold text-gray-900">Best Results</p>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-base text-gray-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Clean & dry fingers
                </li>
                <li className="flex items-center gap-2 text-base text-gray-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Press firmly
                </li>
                <li className="flex items-center gap-2 text-base text-gray-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Keep still
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-16 text-lg font-bold border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 rounded-xl transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-[2] h-16 bg-[#00c2cb] hover:bg-[#00adb5] text-white text-xl font-bold rounded-xl shadow-lg shadow-teal-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Fingerprint className="w-6 h-6 mr-3" />
            Start Scanning
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
