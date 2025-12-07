"use client";

interface Step {
  step: number;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: Step[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {steps.map((step, index) => (
        <div key={`step-${step.step}-${step.title}`} className="relative">
          {/* Step number */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sage text-title font-bold text-white">
              {step.step}
            </div>
            {index < steps.length - 1 && (
              <div className="hidden h-0.5 flex-1 bg-sage/20 md:block" />
            )}
          </div>

          {/* Content */}
          <h3 className="mb-2 text-title font-semibold text-charcoal">{step.title}</h3>
          <p className="text-small leading-relaxed text-text-tertiary">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

