"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Activity, Radio, Brain, ClipboardCheck, RefreshCcw, Clock, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description?: string;
  status: "pending" | "current" | "completed";
  icon?: React.ElementType;
}

interface FullScreenLoaderProps {
  isOpen?: boolean;
  title?: string;
  subtitle?: string;
  steps?: Step[];
  footerText?: string;
  useDefaultSteps?: boolean;
  isError?: boolean;
}

const DEFAULT_STEPS: Step[] = [
  {
    label: "Uploading fingerprints",
    description: "Securely transmitting data",
    status: "completed",
    icon: RefreshCcw,
  },
  {
    label: "Running AI analysis",
    description: "Processing patterns & minutiae",
    status: "current",
    icon: Brain,
  },
  {
    label: "Generating results",
    description: "Finalizing your report",
    status: "pending",
    icon: Clock,
  },
];

const CustomStatusIcon = ({ 
  status, 
  Icon 
}: { 
  status: Step["status"]; 
  Icon?: React.ElementType 
}) => {
  const StepIcon = Icon || Activity;

  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
      status === "completed" ? "bg-teal-100 text-teal-600" :
      status === "current" ? "bg-teal-100/60 text-teal-500" :
      "bg-slate-100 text-slate-400"
    )}>
      {status === "current" ? (
        <StepIcon className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} />
      ) : (
        <StepIcon className="w-5 h-5" />
      )}
    </div>
  );
};

export function FullScreenLoader({
  isOpen = true,
  title = "Analyzing Your Fingerprints",
  subtitle = "Please wait while we process your data...",
  steps = [],
  footerText = "Estimated time: 10-15 seconds",
  useDefaultSteps = true,
  isError = false,
}: FullScreenLoaderProps) {
  const loaderSteps = steps.length ? steps : (useDefaultSteps ? DEFAULT_STEPS : []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-10000 flex items-center justify-center bg-white/90 backdrop-blur-md overflow-hidden transition-all duration-500"
        >
          <div className="text-center px-8 w-full max-w-lg">
            <div className="relative mb-12 flex items-center justify-center">
              {isError ? (
                <div className="w-24 h-24 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              ) : (
                <Spinner
                  size="xl"
                  label={title}
                  trackClassName="border-teal-200"
                  indicatorClassName="border-teal-600 border-t-transparent"
                />
              )}
            </div>

            <h2 className={cn(
              "text-3xl font-bold mb-3 tracking-tight",
              isError ? "text-red-900" : "text-slate-900"
            )}>
              {title}
            </h2>
            <p className={cn(
              "mb-10 text-lg",
              isError ? "text-red-700" : "text-slate-700"
            )}>
              {subtitle}
            </p>

            {!isError && loaderSteps.length > 0 && (
              <div className="space-y-3 text-left">
                {loaderSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 border rounded-xl p-4 backdrop-blur-sm transition-all duration-500",
                      step.status === "current" ? "bg-teal-50 border-teal-200 shadow-sm" :
                      step.status === "completed" ? "bg-teal-50/50 border-teal-100" :
                      "bg-slate-50 border-slate-100 opacity-60"
                    )}
                  >
                    <CustomStatusIcon status={step.status} Icon={step.icon} />
                    
                    <div>
                      <p className={cn(
                        "font-medium transition-colors duration-500",
                        step.status === "pending" ? "text-slate-400" : "text-slate-900"
                      )}>
                        {step.label}
                      </p>
                      {step.description && (
                        <p className="text-xs text-slate-600">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {footerText && (
              <p className="text-slate-600 text-sm mt-8 animate-pulse font-medium">
                {footerText}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
