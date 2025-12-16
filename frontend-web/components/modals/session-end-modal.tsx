"use client";

import { ArrowRight, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionEndModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionEndModal({
  isOpen,
  onConfirm,
  onCancel,
}: SessionEndModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-linear-to-br from-teal-900/30 via-cyan-900/30 to-teal-900/30 backdrop-blur-md z-50 animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-xl w-full pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border-2 border-teal-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative header gradient */}
          <div className="h-2 bg-linear-to-r from-teal-500 via-cyan-500 to-teal-500" />

          <div className="p-10">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-linear-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle
                    className="h-12 w-12 text-teal-600"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-2xl border-4 border-teal-200 opacity-20 animate-ping" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold text-center mb-4 bg-linear-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
              You're Almost Done!
            </h2>

            {/* Description */}
            <p className="text-gray-700 text-center mb-8 leading-relaxed text-lg font-medium">
              You've made great progress. Leaving now will erase everything
              you've entered, and you'll need to start over from the beginning.
            </p>

            {/* Warning box */}
            <div className="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative">
                <p className="text-xl font-extrabold text-amber-900 mb-4 text-center tracking-wider">
                  ⚠️You Will Lose:
                </p>

                <ul className="space-y-3 text-lg text-amber-800">
                  <li className="flex items-start">
                    <span className="mt-2 mr-3 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                    All personal information you've entered
                  </li>
                  <li className="flex items-start">
                    <span className="mt-2 mr-3 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                    Your fingerprint scans and progress
                  </li>
                  <li className="flex items-start">
                    <span className="mt-2 mr-3 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                    Your analysis results
                  </li>
                </ul>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4">
              {/* Primary */}
              <Button
                onClick={onCancel}
                autoFocus
                className="w-full h-20 text-xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white transition-all duration-200 rounded-2xl shadow-lg hover:shadow-xl relative overflow-hidden group cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 mr-3" />
                  Continue My Session
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
              </Button>

              {/* Secondary */}
              <Button
                onClick={onConfirm}
                variant="ghost"
                className="w-full h-14 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 mr-2" />
                End Session Anyway
              </Button>
            </div>

            {/* Footer hint */}
            <p className="text-sm text-center text-gray-400 mt-6">
              💡 Takes less than 2 minutes to complete
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
