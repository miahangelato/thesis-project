"use client";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function Stepper({ currentStep, totalSteps, steps }: StepperProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div
              key={idx}
              className={`flex-1 text-center transition-all ${
                idx < steps.length - 1 ? "mr-2" : ""
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-primary/60"
                      : "text-muted-foreground"
                }`}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
