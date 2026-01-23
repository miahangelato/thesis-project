"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";

interface SessionEndModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionEndModal({ isOpen, onConfirm, onCancel }: SessionEndModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      containerClassName="select-none"
      backdropClassName="bg-linear-to-br from-teal-900/30 via-cyan-900/30 to-teal-900/30 backdrop-blur-md"
      panelClassName="rounded-3xl max-w-xl border-2 border-teal-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      showTopBar
    >
      <div className="p-10">
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-24 h-24 bg-linear-to-br from-teal-50 to-cyan-50 rounded-3xl flex items-center justify-center shadow-sm border border-teal-100">
              <CheckCircle className="h-12 w-12 text-[#00c2cb]" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-3xl border-4 border-teal-300 opacity-20 animate-ping" />
          </div>
        </div>

        <h2 className="text-4xl font-bold text-center mb-4 text-slate-900 tracking-tight">
          You&apos;re Almost Done!
        </h2>

        <p className="text-slate-600 font-medium text-center mb-10 leading-relaxed text-xl max-w-sm mx-auto">
          You&apos;ve made great progress. Leaving now will erase everything you&apos;ve
          entered, and you&apos;ll need to start over from the beginning.
        </p>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-10 shadow-sm">
          <p className="text-xl font-bold text-amber-900 mb-4 text-center flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span> You Will Lose:
          </p>

          <ul className="space-y-3 text-lg text-amber-800/90 pl-4 font-medium">
            <li className="flex items-start">
              <span className="mt-2 mr-3 h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              All personal information you&apos;ve entered
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

        <div className="flex flex-col gap-4">
          <Button
            onClick={onCancel}
            autoFocus
            className="w-full h-16 text-xl font-bold rounded-2xl bg-[#00c2cb] hover:bg-[#00adb5] text-white shadow-lg shadow-teal-100/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Continue My Session
          </Button>

          <Button
            onClick={onConfirm}
            className="w-full h-16 text-xl font-bold rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            End Session Anyway
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
