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
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-teal-900/30 via-cyan-900/30 to-teal-900/30 backdrop-blur-md z-50 animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border-2 border-teal-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative header gradient */}
          <div className="h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500" />
          
          <div className="p-8">
            {/* Icon with gradient background */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-10 w-10 text-teal-600" strokeWidth={2.5} />
                </div>
                {/* Decorative ring */}
                <div className="absolute inset-0 w-20 h-20 rounded-2xl border-4 border-teal-200 opacity-20 animate-ping" />
              </div>
            </div>

            {/* Title - Positive framing */}
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-3 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
              You're Almost Done!
            </h2>

            {/* Description - Loss aversion */}
            <p className="text-gray-700 text-center mb-6 leading-relaxed text-base font-medium">
              You've made great progress. Going back now will erase all your work and you'll have to start completely over.
            </p>

            {/* Warning box with gradient - emphasize loss */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl -mr-12 -mt-12" />
              <div className="relative">
                <p className="text-sm font-bold text-amber-900 mb-2 text-center">
                  ⚠️ You Will Lose:
                </p>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li className="flex items-center">
                    <span className="text-amber-600 mr-2">•</span>
                    All personal information you've entered
                  </li>
                  <li className="flex items-center">
                    <span className="text-amber-600 mr-2">•</span>
                    Your fingerprint scans and progress
                  </li>
                  <li className="flex items-center">
                    <span className="text-amber-600 mr-2">•</span>
                    Your analysis results
                  </li>
                </ul>
              </div>
            </div>

            {/* Buttons - Primary action on right, more prominent */}
            <div className="flex flex-col gap-3">
              {/* Primary: Continue - Larger, gradient, on top for mobile/visual hierarchy */}
              <Button
                onClick={onCancel}
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Continue My Session
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
              </Button>

              {/* Secondary: Leave - Smaller, less prominent */}
              <Button
                onClick={onConfirm}
                variant="ghost"
                className="w-full h-12 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                No, End Session Anyway
              </Button>
            </div>
            
            {/* Subtle encouragement */}
            <p className="text-xs text-center text-gray-400 mt-4">
              💡 Takes less than 2 minutes to complete
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
