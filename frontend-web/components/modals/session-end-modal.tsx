"use client";

import { ArrowRight, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionEndModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionEndModal({ isOpen, onConfirm, onCancel }: SessionEndModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-linear-to-br from-teal-900/30 via-cyan-900/30 to-teal-900/30 backdrop-blur-md z-50 animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none select-none">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-xl w-full pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border-2 border-teal-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative header gradient */}
          <div className="h-2 bg-linear-to-r from-teal-700 via-teal-600 to-teal-700" />

          <div className="p-10">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-linear-to-br from-teal-200 to-teal-50 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-12 w-12 text-teal-700" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-2xl border-4 border-teal-300 opacity-20 animate-ping" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold text-center mb-4 text-teal-900">
              You&apos;re Almost Done!
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-center mb-8 leading-relaxed text-xl">
              You&apos;ve made great progress. Leaving now will erase everything
              you&apos;ve entered, and you&apos;ll need to start over from the beginning.
            </p>

            {/* Warning box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
              <p className="text-xl font-bold text-amber-800 mb-4 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">⚠️</span> You Will Lose:
              </p>

              <ul className="space-y-3 text-lg text-amber-800/90 pl-4">
                <li className="flex items-start">
                  <span className="mt-2 mr-3 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  All personal information you&apos;ve entered
                </li>
                <li className="flex items-start">
                  <span className="mt-2 mr-3 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  Your fingerprint scans and progress
                </li>
                <li className="flex items-start">
                  <span className="mt-2 mr-3 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  Your analysis results
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4">
              {/* Primary */}
              <Button
                onClick={onCancel}
                autoFocus
                className="w-full h-16 text-xl font-bold rounded-2xl bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-100/50 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                Continue My Session
              </Button>

              {/* Secondary */}
              <Button
                onClick={onConfirm}
                variant="ghost"
                className="w-full h-14 text-xl font-semibold rounded-2xl text-teal-700 hover:text-teal-800 hover:bg-teal-50 transition-all cursor-pointer"
              >
                End Session Anyway
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
