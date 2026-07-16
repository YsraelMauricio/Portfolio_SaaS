interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Quote wizard progress" className="mb-10">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.number}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    text-sm font-semibold border-2 transition-colors duration-200
                    ${isCompleted
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-gray-300 text-gray-400 bg-white'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-600' : 'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4 mt-[-1.75rem]
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
