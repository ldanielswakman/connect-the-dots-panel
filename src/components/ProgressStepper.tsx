
import React from "react";

interface StepProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

interface ProgressStepperProps {
  steps: StepProps[];
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps }) => {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step */}
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center ${
                step.active
                  ? "text-gray-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              {step.number}
              <span className="ml-2">{step.label}</span>
            </div>
          </div>
          
          {/* Separator */}
          {index < steps.length - 1 && (
            <div className="mx-3 text-gray-300">—</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressStepper;
