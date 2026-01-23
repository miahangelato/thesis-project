import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, Fingerprint, RefreshCcw } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { Spinner } from "@/components/ui/spinner";

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

  // Create steps for the unified loader
  const analysisSteps = [
    {
      label: "Diagnostic Uplink",
      description: "Securely transmitting biometric data",
      status: "completed" as const,
      icon: Radio,
    },
    {
      label: "AI Neural Analysis",
      description: "Processing patterns & minutiae",
      status: "current" as const,
      icon: Brain,
    },
    {
      label: "Clinical Synthesis",
      description: "Finalizing your medical report",
      status: "pending" as const,
      icon: ClipboardCheck,
    },
  ];

  if (isError) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Analysis Failed</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {errorMessage || "We encountered a technical issue while processing your data. Please try again."}
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-2xl transition-all"
          >
            Retry Submission
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FullScreenLoader
      isOpen={isOpen}
      title="Intelligence Scanning"
      subtitle="The system is currently running a deep neural analysis of your fingerprint patterns."
      steps={analysisSteps}
    />
  );
};

