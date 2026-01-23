"use client";
import React from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  isSubmit?: boolean;
  loading?: boolean;
  isNextDisabled?: boolean;
  leftAdornment?: React.ReactNode;
  className?: string;
  form?: string;
}

export function StepNavigation({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  isSubmit = false,
  loading = false,
  isNextDisabled = false,
  leftAdornment,
  className,
  form,
}: StepNavigationProps) {
  return (
    <div
      className={cn("flex justify-between items-center w-full select-none", className)}
    >
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 h-16 px-8 text-xl font-bold text-slate-700 cursor-pointer rounded-xl transition-all"
          >
            <ArrowLeft size={24} className="stroke-[2.5]" />
            {backLabel}
          </Button>
        )}
        {leftAdornment}
      </div>

      <Button
        type={isSubmit ? "submit" : "button"}
        form={form}
        onClick={isSubmit ? undefined : onNext}
        disabled={isNextDisabled || loading}
        className={cn(
          "h-16 px-16 text-2xl font-extrabold rounded-2xl flex items-center gap-3 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
          !isNextDisabled && !loading
            ? "bg-[#00c2cb] hover:bg-[#00b2ba] text-white"
            : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
        )}
      >
        {loading ? (
          <>
            <Spinner
              size="sm"
              className="mr-2"
              label="Processing"
              trackClassName="border-slate-300"
              indicatorClassName="border-slate-500 border-t-transparent"
            />
            Processing...
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={24} className="stroke-3" />
          </>
        )}
      </Button>
    </div>
  );
}
