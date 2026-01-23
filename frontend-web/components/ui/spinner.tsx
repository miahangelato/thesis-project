"use client";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<SpinnerSize, { box: string; border: string }> = {
  sm: { box: "w-5 h-5", border: "border-2" },
  md: { box: "w-8 h-8", border: "border-3" },
  lg: { box: "w-12 h-12", border: "border-4" },
  xl: { box: "w-20 h-20", border: "border-4" },
};

export type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  label?: string;
};

export function Spinner({
  size = "md",
  className,
  trackClassName,
  indicatorClassName,
  label = "Loading",
}: SpinnerProps) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClasses.box,
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full",
          sizeClasses.border,
          trackClassName ?? "border-teal-100"
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full animate-spin",
          sizeClasses.border,
          indicatorClassName ?? "border-teal-600 border-t-transparent"
        )}
      />
    </div>
  );
}
