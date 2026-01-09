"use client";

import { AlertTriangle, Lightbulb, User } from "lucide-react";

type Demographics = {
  age?: number | string;
  gender?: string;
  weight_kg?: number | string;
  height_cm?: number | string;
  blood_type?: string;
  // Backward compat
  weight?: number | string;
  height?: number | string;
  bloodType?: string;
} | null;

type Props = {
  demographics: Demographics;
};

export function ScanInfoPanel({ demographics }: Props) {
  const weight = demographics?.weight_kg ?? demographics?.weight;
  const height = demographics?.height_cm ?? demographics?.height;
  const blood = demographics?.blood_type ?? demographics?.bloodType;
  const bloodLabel = !blood || blood === "unknown" ? "Unknown" : String(blood);

  return (
    <div className="col-span-5 flex flex-col space-y-3">
      {/* Scanning Tips - Static */}
      <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-3 pb-8 scrollbar-thin scrollbar-thumb-gray-200">
        {/* 1️⃣ Session / User Info (Compact Pill) */}
        <div className="bg-linear-to-r from-teal-50 to-cyan-50 rounded-full px-5 py-3 flex items-center gap-3 text-teal-900 shrink-0 w-full border border-teal-200 shadow-sm">
          <User className="w-5 h-5 text-teal-600 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold">
            <span>{demographics?.age || "--"} yrs</span>
            <span className="text-teal-900/60">·</span>
            <span className="capitalize">{demographics?.gender || "--"}</span>
            <span className="text-teal-900/60">·</span>
            <span>{weight ?? "--"} kg</span>
            <span className="text-teal-900/60">·</span>
            <span>{height ?? "--"} cm</span>
            <span className="text-teal-900/60">·</span>
            <span>Blood: {bloodLabel}</span>
          </div>
        </div>

        {/* 2️⃣ Scanning Tips (Passive Help Text) */}
        <div className="bg-linear-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 shrink-0 border border-teal-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <Lightbulb className="w-5 h-5 text-teal-700" />
            <h4 className="font-bold text-teal-900 text-lg">Scanning Tips</h4>
          </div>
          <ul className="text-base text-teal-900/90 space-y-3 font-medium">
            <li className="flex items-start gap-3">
              <span className="text-xl leading-none opacity-80 pt-0.5">🧼</span>
              <span>Clean finger and scanner surface</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl leading-none opacity-80 pt-0.5">👆</span>
              <span>Press firmly but gently</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl leading-none opacity-80 pt-0.5">🎯</span>
              <span>Keep finger centered and still</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl leading-none opacity-80 pt-0.5">💧</span>
              <span>If too dry, lightly moisten finger</span>
            </li>
          </ul>
        </div>

        {/* 4️⃣ Important Warning */}
        <div className="flex items-center gap-3 text-lg font-black text-gray-900 px-2 leading-snug shrink-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <span>This is a screening tool — not a medical diagnosis.</span>
        </div>

        {/* 3️⃣ Legal Disclaimer */}
        <div className="px-2 shrink-0">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-800 leading-relaxed font-bold">
              This tool provides predictive insights based on fingerprint and
              demographic data. It does not replace laboratory tests or medical
              diagnosis. Always consult healthcare professionals.
            </p>
          </div>
        </div>
      </div>
      {/* Right Column - Static Content Area */}
      <div className="space-y-6">{/* TODO: Add static content here */}</div>
    </div>
  );
}
