"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  isOpen: boolean;
  onPrimary: () => void;
  onSecondary: () => void;

  title: string;
  description: React.ReactNode;

  icon: React.ReactNode;
  iconWrapperClassName?: string;
  iconRingClassName?: string;

  primaryLabel: string;
  secondaryLabel: string;
  disableActions?: boolean;

  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;

  /** Visual styling */
  backdropClassName?: string;
  panelClassName?: string;
  topBarClassName?: string;
  zIndexClassName?: string;

  primaryButtonClassName?: string;
  secondaryButtonClassName?: string;
  secondaryVariant?: React.ComponentProps<typeof Button>["variant"];
};

export function ConfirmModal({
  isOpen,
  onPrimary,
  onSecondary,
  title,
  description,
  icon,
  iconWrapperClassName,
  iconRingClassName,
  primaryLabel,
  secondaryLabel,
  disableActions = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  backdropClassName,
  panelClassName,
  topBarClassName,
  zIndexClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  secondaryVariant = "ghost",
}: ConfirmModalProps) {
  const titleId = React.useId();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={disableActions ? undefined : onPrimary}
      labelledById={titleId}
      closeOnBackdrop={!disableActions && closeOnBackdrop}
      closeOnEscape={!disableActions && closeOnEscape}
      zIndexClassName={zIndexClassName}
      backdropClassName={cn("bg-slate-900/60 backdrop-blur-md", backdropClassName)}
      panelClassName={cn("max-w-lg border-2 border-teal-100", panelClassName)}
      showTopBar
      topBarClassName={topBarClassName}
    >
      <div className="p-10 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center shadow-inner",
              iconWrapperClassName
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "absolute inset-0 rounded-full border-4 opacity-50 animate-pulse",
              iconRingClassName
            )}
          />
        </div>

        <h3
          id={titleId}
          className="text-4xl font-bold text-slate-900 mb-4 tracking-tight"
        >
          {title}
        </h3>

        <div className="text-xl text-slate-600 mb-10 leading-relaxed max-w-sm mx-auto">
          {description}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Button
            className={cn(
              "w-full h-16 text-xl font-bold rounded-2xl bg-[#00c2cb] hover:bg-[#00adb5] text-white shadow-lg shadow-teal-100/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
              primaryButtonClassName
            )}
            onClick={onPrimary}
            disabled={disableActions}
          >
            {primaryLabel}
          </Button>

          <Button
            variant={secondaryVariant}
            className={cn(
              "w-full h-16 text-xl font-bold rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer",
              secondaryButtonClassName
            )}
            onClick={onSecondary}
            disabled={disableActions}
          >
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
