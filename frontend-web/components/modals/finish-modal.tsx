import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Fingerprint, RefreshCcw } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border-2 border-teal-100 select-none">
        <div className="flex items-center mb-4">
          <Fingerprint className="w-10 h-10 text-teal-600 mr-3" />
          <h3 className="text-3xl font-bold text-teal-500">
            {loading ? "Processing..." : "Ready to Finish?"}
          </h3>
        </div>
        <p className="text-gray-700 mb-4 text-xl leading-relaxed">
          Please confirm you have scanned and reviewed all fingerprints. You can
          still go back and rescan any finger if needed.
        </p>
        <ul className="mb-5 space-y-2 text-xl text-gray-600 list-disc list-inside">
          <li>All 10 fingers captured</li>
          <li>Images look clear and not blurry</li>
          <li>No missing or wrong-hand selections</li>
        </ul>
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center border-2 border-gray-300 hover:bg-gray-50 h-14 px-6 text-base font-bold cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className="w-6 h-6" />
            Review Again
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 h-14 rounded-xl bg-[#00c2cb] hover:bg-[#00a8b0] text-white font-bold text-xl shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full inline-block mr-2" />
                Analyzing...
              </>
            ) : (
              "Yes, Finish & Analyze!"
            )}
          </Button>
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
    <div className="fixed inset-0 z-60 bg-linear-to-br from-teal-500 via-cyan-500 to-blue-500 flex items-center justify-center">
      <div className="text-center px-8">
        {/* Animated Fingerprint Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-8 border-white/30 rounded-full animate-ping"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 border-8 border-white/20 rounded-full animate-pulse"></div>
          </div>
          <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
            <div
              className="absolute inset-0 bg-white/10 rounded-full animate-spin"
              style={{ animationDuration: "3s" }}
            ></div>
            <Fingerprint
              className="w-24 h-24 text-white animate-pulse"
              strokeWidth={1.5}
            />
          </div>
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
