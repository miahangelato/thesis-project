import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  title?: string;
  subtitle?: string;
  accentColor?: string;
  onEndSession?: () => void;
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  steps = ["Consent", "Personal Info", "Fingerprint", "Results"],
  title,
  subtitle,
  accentColor = "#00c2cb",
  onEndSession,
}: ProgressHeaderProps) {
  const router = useRouter();
  const progress = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    if (onEndSession) {
      onEndSession();
    } else {
      router.back();
    }
  };

  return (
    <div className="w-full mb-6 mt-2 select-none">
      <div className="flex justify-between items-center mb-2">
        <div>
          {title && <h1 className="text-5xl font-bold text-gray-800 mt-1">{title}</h1>}
          {subtitle && <p className="text-gray-600 text-2xl mt-3">{subtitle}</p>}
        </div>
        <div className="flex flex-row items-end gap-4">
          <div className="flex flex-col">
            <div className="text-lg font-medium" style={{ color: accentColor }}>
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-lg text-gray-500 hidden md:block">
              {steps[currentStep - 1]}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2 h-14 px-6 rounded-xl border-2 border-red-300 text-red-700 font-semibold hover:bg-red-50 cursor-pointer text-lg"
          >
            <X size={18} />
            End Session
          </Button>
        </div>
      </div>

      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-in-out rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`text-base transition-colors duration-200 ${
              index + 1 <= currentStep ? "font-medium" : "text-gray-400"
            }`}
            style={{
              color: index + 1 <= currentStep ? accentColor : "",
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgressHeader;
