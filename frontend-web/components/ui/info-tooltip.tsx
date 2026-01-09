import React from "react";

export function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="relative inline-flex group ml-2 align-middle">
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="More info"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-50 mb-2 w-max max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-xl opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
      >
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-white" />
      </div>
    </div>
  );
}
