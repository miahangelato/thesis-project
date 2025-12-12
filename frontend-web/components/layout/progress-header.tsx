import React from 'react';

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  title?: string;
  subtitle?: string;
  accentColor?: string;
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  steps = ['Consent', 'Personal Info', 'Fingerprint', 'Results'],
  title,
  subtitle,
  accentColor = '#00c2cb'
}: ProgressHeaderProps) {
  // Calculate progress percentage
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full mb-6">
      {/* Step indicator text */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-base font-medium" style={{ color: accentColor }}>
            Step {currentStep} of {totalSteps}
          </div>
          {title && <h1 className="text-3xl font-bold text-gray-800 mt-1">{title}</h1>}
          {subtitle && <p className="text-gray-600 text-lg max-w-2xl mt-1">{subtitle}</p>}
        </div>
        
        <div className="text-sm text-gray-500 hidden md:block">
          {steps[currentStep - 1]}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-300 ease-in-out rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: accentColor
          }}
        />
      </div>
      
      {/* Step labels */}
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`text-xs transition-colors duration-200 ${
              index + 1 <= currentStep ? 'font-medium' : 'text-gray-400'
            }`}
            style={{ 
              color: index + 1 <= currentStep ? accentColor : '',
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
