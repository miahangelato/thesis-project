import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Fingerprint, RefreshCcw, Loader2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-300 border-2 border-teal-100 overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-teal-400 to-cyan-400" />
        
        <div className="p-10 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-full flex items-center justify-center shadow-inner border border-teal-100">
              <Fingerprint className="w-12 h-12 text-teal-600" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-teal-100 opacity-50 animate-pulse" />
          </div>

          <h3 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Ready to Finish?</h3>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-sm mx-auto">
            Please confirm you have scanned and reviewed all 10 fingerprints. You can
            still review them if needed.
          </p>

          <ul className="mb-10 space-y-3 text-lg text-slate-700 text-left bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-2xl w-full border border-teal-100">
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" strokeWidth={2.5} />
              All 10 fingers captured
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" strokeWidth={2.5} />
              Images appear clear
            </li>
          </ul>

          <div className="flex flex-row gap-4 w-full">
            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-16 text-lg font-bold rounded-2xl bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700 transition-all cursor-pointer"
            >
              Review Again
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-16 text-lg font-bold rounded-2xl bg-[#00c2cb] hover:bg-[#0099a0] text-white shadow-lg shadow-cyan-100/50 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              Yes, Finish!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AnalysisLoadingOverlayProps {
  isOpen: boolean;
}

export const AnalysisLoadingOverlay = ({ isOpen }: AnalysisLoadingOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center transition-all duration-500">
      <div className="text-center px-8 w-full max-w-lg">
        
        {/* Advanced Loader */}
        {/* Standard Loader Style */}
        <div className="relative mb-12 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Analyzing Fingerprints
        </h2>
        <p className="text-slate-400 mb-10 text-lg">
          Please wait while we process your data...
        </p>

        {/* Progress Steps */}
        <div className="space-y-3 text-left">
          {/* Step 1 */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-forwards" style={{ animationDelay: '100ms' }}>
             <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
             </div>
             <div>
               <p className="text-white font-medium">Uploading fingerprints</p>
               <p className="text-xs text-slate-500">Securely transmitting data</p>
             </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-forwards" style={{ animationDelay: '300ms' }}>
             <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <RefreshCcw className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
             </div>
             <div>
               <p className="text-white font-medium">Running AI analysis</p>
               <p className="text-xs text-slate-500">Processing patterns & minutiae</p>
             </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-forwards" style={{ animationDelay: '500ms' }}>
             <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-teal-400" />
             </div>
             <div>
               <p className="text-white font-medium">Generating results</p>
               <p className="text-xs text-slate-500">Finalizing your report</p>
             </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm mt-8 animate-pulse">
          Estimated time: 10-15 seconds
        </p>
      </div>
    </div>
  );
};
