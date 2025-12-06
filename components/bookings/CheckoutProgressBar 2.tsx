"use client";

import { Check } from "lucide-react";

type CheckoutStep = "select_session" | "upsells" | "details" | "review" | "payment" | "complete";

type CheckoutProgressBarProps = {
  currentStep: CheckoutStep;
};

const steps: Array<{ id: CheckoutStep; label: string }> = [
  { id: "select_session", label: "Select Session" },
  { id: "upsells", label: "Add-ons" },
  { id: "details", label: "Your Details" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Payment" },
];

export default function CheckoutProgressBar({ currentStep }: CheckoutProgressBarProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? "bg-sage border-sage text-white"
                      : isCurrent
                        ? "border-sage bg-white text-sage"
                        : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center ${
                    isCurrent ? "font-semibold text-sage" : isCompleted ? "text-charcoal" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    isCompleted ? "bg-sage" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

