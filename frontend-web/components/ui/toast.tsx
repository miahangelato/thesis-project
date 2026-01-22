"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  onClose: () => void;
};

export function Toast({
  open,
  message,
  variant = "info",
  durationMs = 4000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onClose(), durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  const tone =
    variant === "error"
      ? {
          shell: "border-red-200 bg-white",
          bar: "bg-red-500",
          text: "text-red-900",
          subtext: "text-red-700",
        }
      : variant === "success"
        ? {
            shell: "border-emerald-200 bg-white",
            bar: "bg-emerald-500",
            text: "text-emerald-900",
            subtext: "text-emerald-700",
          }
        : {
            shell: "border-teal-200 bg-white",
            bar: "bg-teal-500",
            text: "text-slate-900",
            subtext: "text-slate-700",
          };

  return (
    <div className="fixed bottom-6 right-6 z-200">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "relative w-[360px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border shadow-xl",
          tone.shell
        )}
      >
        <div className={cn("absolute left-0 top-0 h-full w-1.5", tone.bar)} />
        <div className="pl-5 pr-10 py-4">
          <div className={cn("text-sm font-semibold", tone.text)}>
            {variant === "error"
              ? "Something went wrong"
              : variant === "success"
                ? "Success"
                : "Notice"}
          </div>
          <div className={cn("text-sm", tone.subtext)}>{message}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-2 rounded-lg hover:bg-slate-50 text-slate-500"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
