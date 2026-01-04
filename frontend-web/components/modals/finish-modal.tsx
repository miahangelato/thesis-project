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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
               <Fingerprint className="w-6 h-6 text-teal-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Finish?</h3>
            <p className="text-gray-600 mb-6">
              Please confirm you have scanned and reviewed all 10 fingerprints. You can still review them if needed.
            </p>
            
            <ul className="mb-6 space-y-2 text-sm text-gray-500 text-left bg-gray-50 p-4 rounded-lg">
               <li className="flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                 All 10 fingers captured
               </li>
               <li className="flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                 Images appear clear
               </li>
            </ul>

            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 h-12 text-base"
              >
                Review Again
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 h-12 text-base bg-teal-600 hover:bg-teal-700 text-white font-bold"
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

export const AnalysisLoadingOverlay = ({
  isOpen,
}: AnalysisLoadingOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center">
      <div className="text-center px-8">
        {/* Simple Loader Icon */}
        <div className="relative mb-8 flex justify-center">
          <Loader2 className="w-20 h-20 text-white animate-spin" strokeWidth={1.5} />
        </div>

        {/* Loading Text */}
        <h2 className="text-4xl font-bold text-white mb-4 animate-pulse select-none">
          Analyzing Your Fingerprints
        </h2>
        <p className="text-xl text-white/90 mb-8 select-none">
          Please wait while we process your data...
        </p>

        {/* Progress Steps */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-in slide-in-from-left duration-700 select-none">
            <div className="shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-500" />
            </div>
            <span className="text-white font-semibold text-lg">
              Uploading fingerprints...
            </span>
          </div>

          <div
            className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-in slide-in-from-left duration-700 select-none"
            style={{ animationDelay: "200ms" }}
          >
            <div className="shrink-0 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center animate-spin">
              <RefreshCcw className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">
              Running AI analysis...
            </span>
          </div>

          <div
            className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-in slide-in-from-left duration-700 select-none"
            style={{ animationDelay: "400ms" }}
          >
            <div className="shrink-0 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-white/70" />
            </div>
            <span className="text-white/70 font-semibold text-lg">
              Generating your results...
            </span>
          </div>
        </div>

        {/* Estimated Time */}
        <p className="text-white/60 text-sm mt-8 select-none">
          This usually takes 10-15 seconds
        </p>
      </div>
    </div>
  );
};
