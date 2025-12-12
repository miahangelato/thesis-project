"use client";

import { useEffect } from "react";
import { Delete, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NumericKeypadProps {
  isOpen?: boolean;
  value?: string;
  error?: string | null; // Error message to display
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onDone: () => void;
  onClose?: () => void;
  allowDecimal?: boolean;
  variant?: "modal" | "inline";
  title?: string;
  placeholder?: string;
}

export function NumericKeypad({
  isOpen = true,
  value = "",
  error = null,
  onKeyPress,
  onBackspace,
  onDone,
  onClose,
  allowDecimal = false,
  variant = "modal",
  title = "Numeric Keypad",
  placeholder = "Enter value...",
}: NumericKeypadProps) {
  // For modal mode, handle scrolling
  useEffect(() => {
    if (variant === "modal" && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, variant]);

  if (!isOpen) return null;

  const numberButtons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  const KeypadContent = (
    <div className={`
      ${variant === "modal" 
        ? "bg-white border-t-4 border-teal-500 shadow-2xl fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300" 
        : "bg-gradient-to-br from-white via-slate-50/30 to-white rounded-2xl shadow-lg border-2 border-slate-200 h-full flex flex-col overflow-hidden"}
    `}>
      {/* Header */}
      <div className={`
        flex items-center justify-between px-6 py-4 border-b border-slate-200
        ${variant === "modal" ? "bg-white" : "bg-slate-50/50"}
      `}>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-700">{title}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Message - Minimal */}
      {error && (
        <div className="px-6 pt-3 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="text-xs font-semibold text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Number Pad - Two-Row Keyboard Style */}
      <div className={`px-6 pb-5 pt-3 flex-1 flex flex-col justify-center gap-3`}>
        {/* First Row: 1-5 */}
        <div className="grid grid-cols-5 gap-3">
          {["1", "2", "3", "4", "5"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onKeyPress(num)}
              className="
                text-2xl font-bold text-slate-700
                bg-white hover:bg-teal-50 active:bg-teal-100
                rounded-xl
                border-2 border-slate-200 hover:border-teal-400 active:border-teal-500
                transition-all duration-150 active:scale-95
                h-16 
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1
                shadow-sm hover:shadow-md
              "
            >
              {num}
            </button>
          ))}
        </div>

        {/* Second Row: 6-0 */}
        <div className="grid grid-cols-5 gap-3">
          {["6", "7", "8", "9", "0"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onKeyPress(num)}
              className="
                text-2xl font-bold text-slate-700
                bg-white hover:bg-teal-50 active:bg-teal-100
                rounded-xl
                border-2 border-slate-200 hover:border-teal-400 active:border-teal-500
                transition-all duration-150 active:scale-95
                h-16
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1
                shadow-sm hover:shadow-md
              "
            >
              {num}
            </button>
          ))}
        </div>

        {/* Third Row: Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {/* Decimal Button */}
          {allowDecimal ? (
            <button
              type="button"
              onClick={() => onKeyPress(".")}
              className="
                bg-white hover:bg-amber-50 active:bg-amber-100
                text-slate-700 font-bold text-2xl
                rounded-xl
                border-2 border-amber-200 hover:border-amber-400 active:border-amber-500
                transition-all duration-150 active:scale-95
                h-14
                focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
                shadow-sm hover:shadow-md
              "
            >
              •
            </button>
          ) : (
            <div />
          )}

          {/* Backspace */}
          <button
            type="button"
            onClick={onBackspace}
            className="
              bg-slate-100 hover:bg-red-100 active:bg-red-200
              text-slate-600 hover:text-red-600
              rounded-xl
              border-2 border-slate-200 hover:border-red-300 active:border-red-400
              transition-all duration-150 active:scale-95
              h-14
              flex items-center justify-center
              focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
              shadow-sm hover:shadow-md
            "
          >
            <Delete className="h-6 w-6" />
          </button>

          {/* Done */}
          <button
            type="button"
            onClick={onDone}
            className="
              bg-teal-500 hover:bg-teal-600 active:bg-teal-700
              text-white
              rounded-xl
              transition-all duration-150 active:scale-95
              h-14
              flex items-center justify-center
              font-bold text-lg
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2
              shadow-md hover:shadow-lg
            "
          >
            <Check className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Bottom Safe Area for Modal */}
      {variant === "modal" && (
        <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500" />
      )}
    </div>
  );

  if (variant === "inline") {
    return KeypadContent;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      {KeypadContent}
    </>
  );
}
