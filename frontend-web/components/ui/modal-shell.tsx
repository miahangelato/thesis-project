"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  labelledById?: string;
  backdropClassName?: string;
  backdropZIndexClassName?: string;
  containerClassName?: string;
  zIndexClassName?: string;
  panelClassName?: string;
  showTopBar?: boolean;
  topBarClassName?: string;
};

export function ModalShell({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = Boolean(onClose),
  closeOnEscape = Boolean(onClose),
  labelledById,
  backdropClassName,
  backdropZIndexClassName,
  containerClassName,
  zIndexClassName,
  panelClassName,
  showTopBar = false,
  topBarClassName,
}: ModalShellProps) {
  React.useEffect(() => {
    if (!isOpen || !onClose || !closeOnEscape) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const effectiveZIndex = zIndexClassName ?? "z-50";
  const effectiveBackdropZIndex = backdropZIndexClassName ?? effectiveZIndex;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 animate-in fade-in duration-300",
          effectiveBackdropZIndex,
          backdropClassName
        )}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center p-6 pointer-events-none",
          effectiveZIndex,
          containerClassName
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledById}
          className={cn(
            "pointer-events-auto select-none bg-white shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300",
            "rounded-4xl border border-teal-100",
            panelClassName
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {showTopBar && (
            <div className={cn("h-3 w-full bg-[#00c2cb] shrink-0", topBarClassName)} />
          )}
          {children}
        </div>
      </div>
    </>
  );
}
