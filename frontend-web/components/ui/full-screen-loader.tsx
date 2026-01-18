import React from "react";

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
        <div className="relative">
          <div className="w-20 h-20 border-4 border-cyan-100 border-t-cyan-700 rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-1">{title}</p>
          <p className="text-base text-gray-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
