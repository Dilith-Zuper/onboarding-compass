'use client';

const STEP_NAMES = ['Welcome', 'Questions', 'Your flow', 'Account', 'Review'];

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const pct = Math.round((currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-[#E5E2DC] h-14 flex items-center px-4 sm:px-6">
      <div className="w-full max-w-[760px] mx-auto flex items-center justify-between gap-4">

        {/* Step dots + connectors — desktop shows labels, mobile shows dots only */}
        <div className="flex items-center">
          {STEP_NAMES.map((name, i) => {
            const isDone   = i < currentStep;
            const isActive = i === currentStep;
            const isLast   = i === STEP_NAMES.length - 1;

            return (
              <div key={i} className="flex items-center">
                {/* Dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`rounded-full flex items-center justify-center transition-all ${
                      isDone   ? 'bg-orange-500 w-6 h-6 sm:w-7 sm:h-7' :
                      isActive ? 'bg-white border-2 border-orange-500 w-6 h-6 sm:w-7 sm:h-7' :
                                 'bg-white border-2 border-gray-200 w-5 h-5 sm:w-6 sm:h-6'
                    }`}
                  >
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className={`text-[9px] font-bold hidden sm:block ${isActive ? 'text-orange-500' : 'text-gray-300'}`}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {/* Label — hidden on small screens */}
                  <span className={`hidden sm:block text-[9px] font-semibold whitespace-nowrap mt-1 ${
                    isActive ? 'text-orange-500' : isDone ? 'text-gray-400' : 'text-gray-300'
                  }`}>
                    {name}
                  </span>
                </div>
                {/* Connector */}
                {!isLast && (
                  <div
                    className={`h-px mx-1 transition-all duration-500 ${
                      i < currentStep ? 'bg-orange-400' : 'bg-gray-200'
                    } w-4 sm:w-6 mb-0 sm:mb-4`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar + percent */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-2.5 bg-[#E5E2DC] rounded-full overflow-hidden w-16 sm:w-24">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-orange-500 w-8 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
