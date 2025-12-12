import React from "react";
import { AlertTriangle } from "lucide-react";

export function WarningHeader() {
  return (
    <div className=" bg-red-50 max-w-[1920px] border  border-red-500 px-6 py-3 flex items-center justify-center space-x-3 z-50 shadow-sm relative">
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <p className="text-red-900 font-medium text-sm md:text-base text-center">
        Printalyzer is a predictive educational tool — <span className="font-bold">not a diagnostic device.</span>
      </p>
    </div>
  );
}
