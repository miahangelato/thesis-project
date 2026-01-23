"use client";

import { Fingerprint, Brain, Eye, Shield } from "lucide-react";

export function StaticInfoPanel() {
  return (
    <div className="bg-linear-to-br from-[#e4f7f8] to-white rounded-2xl p-6 border-2 border-[#00c2cb]/20 shadow-sm h-fit">
      <h3 className="text-3xl font-bold text-slate-800 mb-4">What happens next</h3>

      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0">
            <Fingerprint className="h-5 w-5 text-[#00c2cb]" />
          </div>
          <p className="text-xl font-medium text-slate-700 whitespace-nowrap">
            Scan your fingerprint (about 1 minute)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-[#00c2cb]" />
          </div>
          <p className="text-xl font-medium text-slate-700 whitespace-nowrap">
            Fingerprint patterns are analyzed
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0">
            <Eye className="h-5 w-5 text-[#00c2cb]" />
          </div>
          <p className="text-xl font-medium text-slate-700 whitespace-nowrap">
            You&apos;ll see your results next
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-[#00c2cb]" />
          </div>
          <p className="text-xl font-medium text-slate-700 whitespace-nowrap">
            Your data is protected
          </p>
        </div>
      </div>
    </div>
  );
}
