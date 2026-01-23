"use client";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Fingerprint,
  CheckCircle,
  AlertCircle,
  Activity,
  RefreshCcw,
} from "lucide-react";
import Lottie from "lottie-react";
import { Spinner } from "@/components/ui/spinner";

interface ScanAssistantPanelProps {
  status:
    | "idle"
    | "waiting"
    | "detecting"
    | "capturing"
    | "success"
    | "error"
    | "cancelled";
  hint: string;
  fingerName: string;
  fingerIndex: number;
  totalFingers: number;
  previewFrame?: string | null;
  animationData?: Record<string, unknown>;
  metrics?: {
    coverage?: number;
    centroid_dx?: number;
    centroid_dy?: number;
    contrast?: number;
    sharpness?: number;
  };
}

export function ScanAssistantPanel({
  status,
  hint,
  fingerName,
  fingerIndex,
  totalFingers,
  previewFrame,
  animationData,
  metrics,
}: ScanAssistantPanelProps) {
  const previewSrc = useMemo(() => {
    if (!previewFrame) return null;
    const trimmed = previewFrame.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("data:image/")) return trimmed;
    return `data:image/jpeg;base64,${trimmed}`;
  }, [previewFrame]);

  const primaryMessage = {
    idle: "Ready to Scan",
    waiting: "Place your finger",
    detecting: "Finger detected",
    capturing: "Capturing…",
    success: "✓ Captured",
    error: "Try again",
    cancelled: "Cancelled",
  }[status];

  const statusColors = {
    idle: "text-gray-500",
    waiting: "text-blue-600",
    detecting: "text-yellow-600 animate-pulse",
    capturing: "text-teal-600 animate-pulse",
    success: "text-green-600",
    error: "text-red-600",
    cancelled: "text-gray-500",
  };

  const bgColors = {
    idle: "bg-gray-50",
    waiting: "bg-blue-50",
    detecting: "bg-yellow-50",
    capturing: "bg-teal-50",
    success: "bg-green-50",
    error: "bg-red-50",
    cancelled: "bg-gray-50",
  };

  const borderColors = {
    idle: "border-gray-200",
    waiting: "border-blue-200",
    detecting: "border-yellow-200",
    capturing: "border-teal-200",
    success: "border-green-200",
    error: "border-red-200",
    cancelled: "border-gray-200",
  };

  const StatusIcon = {
    idle: Fingerprint,
    waiting: Activity,
    detecting: AlertCircle,
    capturing: Fingerprint,
    success: CheckCircle,
    error: RefreshCcw,
    cancelled: Fingerprint,
  }[status];

  const iconClass =
    status === "capturing" || status === "detecting" ? "animate-spin" : "";

  return (
    <Card
      className={`border-2 rounded-xl ${borderColors[status]} ${bgColors[status]} transition-all duration-300`}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-lg font-bold text-gray-800">
          {fingerName} ({fingerIndex + 1}/{totalFingers})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="flex justify-center mb-4">
          {previewSrc ? (
            <div className="w-64 h-64 bg-white rounded-2xl border-2 border-teal-300 overflow-hidden flex items-center justify-center relative">
              <img
                src={previewSrc}
                alt="Live preview"
                className="w-full h-full object-contain opacity-80"
              />
              <div className="absolute bottom-2 right-2 bg-teal-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                LIVE
              </div>
            </div>
          ) : (
            <div className="motion-safe:block motion-reduce:hidden">
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  loop
                  autoplay
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                  <Fingerprint className="w-32 h-32" />
                </div>
              )}
            </div>
          )}
          {!previewSrc && (
            <div className="motion-reduce:block motion-safe:hidden w-64 h-64 bg-white/80 rounded-2xl border-2 border-teal-300 flex items-center justify-center">
              <Fingerprint className="w-32 h-32 text-teal-400" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {status === "capturing" ? (
              <Spinner
                size="sm"
                label="Capturing"
                trackClassName="border-teal-100"
                indicatorClassName="border-teal-600 border-t-transparent"
              />
            ) : (
              <StatusIcon className={`w-6 h-6 ${statusColors[status]} ${iconClass}`} />
            )}
            <p className={`text-2xl font-bold ${statusColors[status]}`}>
              {primaryMessage}
            </p>
          </div>

          <p className="text-sm text-gray-600 min-h-5">{hint || "\u00A0"}</p>

          {(status === "detecting" || status === "capturing") && (
            <div className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold mt-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              Finger Detected
            </div>
          )}

          {metrics &&
            (Math.abs(metrics.centroid_dx || 0) > 0.1 ||
              Math.abs(metrics.centroid_dy || 0) > 0.1) &&
            status === "detecting" && (
              <div className="mt-3 flex items-center justify-center">
                <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 rounded-full" />

                  <div
                    className="absolute w-6 h-6 bg-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                    style={{
                      left: `${50 + (metrics.centroid_dx || 0) * 100}%`,
                      top: `${50 + (metrics.centroid_dy || 0) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
