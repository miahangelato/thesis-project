"use client";

import { Fingerprint, Brain, Eye, Shield } from "lucide-react";

export function StaticInfoPanel() {
  return (
    <div className="bg-linear-to-br from-[#e4f7f8] to-white rounded-2xl p-6 border-2 border-[#00c2cb]/20 shadow-sm h-fit">
      <h3 className="text-3xl font-bold text-slate-800 mb-4">What happens next</h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Fingerprint className="h-4 w-4 text-[#00c2cb]" />
          </div>
          <p className="text-base text-slate-700 leading-relaxed">
            Scan your fingerprint (about 1 minute)
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="h-4 w-4 text-[#00c2cb]" />
          </div>
          <p className="text-base text-slate-700 leading-relaxed">
            Fingerprint patterns are analyzed
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Eye className="h-4 w-4 text-[#00c2cb]" />
          </div>
          <p className="text-base text-slate-700 leading-relaxed">
            You'll see your results next
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00c2cb]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="h-4 w-4 text-[#00c2cb]" />
          </div>
          <p className="text-base text-slate-700 leading-relaxed">
            Your data is protected
          </p>
        </div>
      </div>
    </div>
  );
}
