import React from "react";
import { Spinner } from "@/components/ui/spinner";

interface FullScreenLoaderProps {
  isOpen?: boolean;
  title?: string;
  subtitle?: string;
}

export function FullScreenLoader({
  isOpen = true,
  title = "Loading",
  subtitle = "Please wait a moment…",
}: FullScreenLoaderProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <Spinner
          size="xl"
          label={title}
          trackClassName="border-teal-100"
          indicatorClassName="border-teal-600 border-t-transparent"
        />
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-1">{title}</p>
          <p className="text-base text-gray-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
