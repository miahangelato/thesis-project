"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";

import { Fingerprint, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

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
    >
      <div className="p-10">
        <div className="flex flex-col items-center text-center gap-6 mb-10">
          <div className="relative">
            <div className="w-24 h-24 bg-linear-to-br from-teal-50 to-cyan-50 rounded-3xl flex items-center justify-center shadow-sm border border-teal-100">
              <Fingerprint className="w-12 h-12 text-[#00c2cb]" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-3xl border-4 border-teal-100 opacity-50 animate-pulse" />
          </div>
          <div>
            <h2
              id={titleId}
              className="text-4xl font-bold text-slate-900 mb-3 tracking-tight"
            >
              Start Automatic Scanning
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              10 fingers will be scanned sequentially
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="bg-linear-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-2xl p-6 shadow-sm">
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

          <div className="grid grid-cols-2 gap-4">
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

        <div className="flex gap-4">
          <Button
            onClick={onCancel}
            className="flex-1 h-16 text-xl font-bold rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-2 h-16 bg-[#00c2cb] hover:bg-[#00adb5] text-white text-xl font-bold rounded-2xl shadow-lg shadow-teal-100/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Fingerprint className="w-6 h-6 mr-3" />
            Start Scanning
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
