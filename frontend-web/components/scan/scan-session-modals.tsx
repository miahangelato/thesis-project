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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border-2 border-teal-100 overflow-hidden">
            {/* Decorative Top Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-teal-400 to-cyan-400" />
            
            <div className="p-10 flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-inner">
                  <Shield className="w-12 h-12 text-red-600" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-red-100 opacity-50 animate-pulse" />
              </div>
              
              <h3 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Cancel Scanning?
              </h3>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-sm mx-auto">
                Are you sure you want to cancel? All progress for this session will be
                lost and you will have to start over.
              </p>
              
              <div className="flex flex-col gap-4 w-full">
                <Button
                  className="w-full h-16 text-xl font-bold rounded-2xl bg-[#00c2cb] hover:bg-[#0099a0] text-white shadow-lg shadow-cyan-100/50 transition-all transform hover:scale-[1.02] cursor-pointer"
                  onClick={onCloseCancel}
                >
                  Continue Scanning
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-14 text-lg font-semibold rounded-2xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                  onClick={onConfirmCancel}
                >
                  Yes, Cancel Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restart Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border-2 border-teal-100 overflow-hidden">
            {/* Decorative Top Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-teal-400 to-cyan-400" />
            
            <div className="p-10 flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center shadow-inner">
                  <RefreshCcw className="w-12 h-12 text-amber-600" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-100 opacity-50 animate-pulse" />
              </div>

              <h3 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Restart Session?
              </h3>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-sm mx-auto">
                This will clear all 10 scanned fingerprints and you will have to start
                over. This action cannot be undone.
              </p>
              
              <div className="flex flex-col gap-4 w-full">
                <Button
                  className="w-full h-16 text-xl font-bold rounded-2xl bg-[#00c2cb] hover:bg-[#0099a0] text-white shadow-lg shadow-cyan-100/50 transition-all transform hover:scale-[1.02] cursor-pointer"
                  onClick={onCloseReset}
                >
                  No, Keep My Progress
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-14 text-lg font-semibold rounded-2xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                  onClick={onConfirmReset}
                >
                  Yes, Restart Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
