import React from 'react'

interface Step {
  label: string
  completed: boolean
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              step.completed
                ? 'bg-gray-900 text-white'
                : currentStep === index
                ? 'bg-coral-pink text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {step.completed ? (
              <span className="text-sm font-bold">✓</span>
            ) : (
              <div className="w-2 h-2 rounded-full bg-current" />
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 transition-all duration-300 ${
                step.completed ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
