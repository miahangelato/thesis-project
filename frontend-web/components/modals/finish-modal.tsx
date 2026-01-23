import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ModalShell } from "@/components/ui/modal-shell";

import { AlertTriangle, CheckCircle, Clock, Fingerprint, RefreshCcw } from "lucide-react";

interface FinishConfirmationModalProps {
  isOpen: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FinishConfirmationModal = ({
  isOpen,
  loading,
  onConfirm,
  onCancel,
}: FinishConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={loading ? undefined : onCancel}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      zIndexClassName="z-50"
      backdropClassName="bg-slate-900/60 backdrop-blur-md"
      panelClassName="max-w-lg border-2 border-teal-100"
      showTopBar
    >
      <div className="p-10 flex flex-col items-center text-center">
        <div className="relative mb-10">
          <div className="w-24 h-24 bg-linear-to-br from-teal-50 to-cyan-50 rounded-3xl flex items-center justify-center shadow-sm border border-teal-100">
            <Fingerprint className="w-12 h-12 text-[#00c2cb]" strokeWidth={2.5} />
          </div>
          <div className="absolute inset-0 rounded-3xl border-4 border-teal-100 opacity-50 animate-pulse" />
        </div>

        <h3 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Ready to Finish?
        </h3>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-sm mx-auto font-medium">
          Please confirm you have scanned and reviewed all 10 fingerprints. You can still
          review them if needed.
        </p>

        <ul className="mb-10 space-y-3 text-lg text-slate-700 text-left bg-linear-to-br from-teal-50 to-cyan-50 p-6 rounded-2xl w-full border border-teal-100 font-medium">
          <li className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#00c2cb] shrink-0" strokeWidth={2.5} />
            All 10 fingers captured
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#00c2cb] shrink-0" strokeWidth={2.5} />
            Images appear clear
          </li>
        </ul>

        <div className="flex flex-row gap-4 w-full">
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-16 text-xl font-bold rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            Review Again
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-16 text-xl font-bold rounded-2xl bg-[#00c2cb] hover:bg-[#00adb5] text-white shadow-lg shadow-teal-100/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Yes, Finish!
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Radio, Brain, ClipboardCheck } from "lucide-react";

interface AnalysisLoadingOverlayProps {
  isOpen: boolean;
  state?: "loading" | "error";
  errorMessage?: string;
}

export const AnalysisLoadingOverlay = ({
  isOpen,
  state = "loading",
  errorMessage,
}: AnalysisLoadingOverlayProps) => {
  if (!isOpen) return null;

  const isError = state === "error";

  return (
    <div className="fixed inset-0 z-60 bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all duration-500">
      <div className="text-center px-8 w-full max-w-lg">
        <div className="relative mb-12 flex items-center justify-center">
          {isError ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>
          ) : (
            <Spinner
              size="xl"
              label="Analyzing fingerprints"
              trackClassName="border-teal-200"
              indicatorClassName="border-teal-800 border-t-transparent"
            />
          )}
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          {isError ? "Analyzing Fingerprints Failed" : "Analyzing Fingerprints"}
        </h2>
        <p className="text-slate-700 mb-10 text-lg">
          {isError
            ? errorMessage || "Please try submitting again."
            : "Please wait while we process your data..."}
        </p>

        {!isError && (
          <div className="space-y-3 text-left">
            <div
              className="flex items-center gap-4 bg-teal-50 border border-teal-100 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-forwards"
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-10 h-10 rounded-full bg-teal-100/60 flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              </div>
              <div>
                <p className="text-slate-900 font-medium">Uploading fingerprints</p>
                <p className="text-xs text-slate-600">Securely transmitting data</p>
              </div>
            </div>

            <div
              className="flex items-center gap-4 bg-teal-50 border border-teal-100 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-forwards"
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-10 h-10 rounded-full bg-teal-100/60 flex items-center justify-center shrink-0">
                <RefreshCcw
                  className="w-5 h-5 text-teal-500 animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <div>
                <p className="text-slate-900 font-medium">Running AI analysis</p>
                <p className="text-xs text-slate-600">Processing patterns & minutiae</p>
              </div>
            </div>

            <div
              className="flex items-center gap-4 bg-teal-50 border border-teal-100 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-forwards"
              style={{ animationDelay: "500ms" }}
            >
              <div className="w-10 h-10 rounded-full bg-teal-100/60 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="text-slate-900 font-medium">Generating results</p>
                <p className="text-xs text-slate-600">Finalizing your report</p>
              </div>
            </div>
          </div>
        )}

        {!isError && (
          <p className="text-slate-600 text-sm mt-8 animate-pulse">
            Estimated time: 10-15 seconds
          </p>
        )}
      </div>
    </div>
  );
};

