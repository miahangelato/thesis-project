"use client";
import { useEffect, useRef } from "react";
import { Delete, Check } from "lucide-react";

interface InlineNumericKeypadProps {
  isVisible: boolean;
  allowDecimal?: boolean;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onConfirm?: () => void;
  onDismiss: () => void;
}

export function InlineNumericKeypad({
  isVisible,
  allowDecimal = false,
  onKeyPress,
  onBackspace,
  onConfirm,
  onDismiss,
}: InlineNumericKeypadProps) {
  const keypadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (keypadRef.current && !keypadRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onDismiss]);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && onConfirm) {
        event.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onConfirm]);

  const handleConfirmClick = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-40 animate-in fade-in duration-200"
          onClick={onDismiss}
        />
      )}

      <div
        ref={keypadRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-[#00c2cb] shadow-2xl transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-2xl mx-auto p-4 pb-6">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onKeyPress(num)}
                className="h-16 text-2xl font-bold text-slate-700 bg-white hover:bg-[#e4f7f8] active:bg-[#00c2cb]/20 rounded-xl border-2 border-slate-200 hover:border-[#00c2cb] transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {allowDecimal ? (
              <button
                type="button"
                onClick={() => onKeyPress(".")}
                className="h-16 text-2xl font-bold text-slate-700 bg-white hover:bg-amber-50 active:bg-amber-100 rounded-xl border-2 border-amber-200 hover:border-amber-400 transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
              >
                •
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => onKeyPress("0")}
              className="h-16 text-2xl font-bold text-slate-700 bg-white hover:bg-[#e4f7f8] active:bg-[#00c2cb]/20 rounded-xl border-2 border-slate-200 hover:border-[#00c2cb] transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              onClick={onBackspace}
              className="h-16 bg-slate-100 hover:bg-red-100 active:bg-red-200 text-slate-600 hover:text-red-600 rounded-xl border-2 border-slate-200 hover:border-red-300 transition-all duration-150 active:scale-95 flex items-center justify-center shadow-sm hover:shadow-md cursor-pointer"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>

          {onConfirm && (
            <button
              type="button"
              onClick={handleConfirmClick}
              className="mt-3 w-full h-14 bg-[#00c2cb] hover:bg-[#00adb5] active:bg-[#008A92] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Check className="h-5 w-5" />
              <span>OK</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
