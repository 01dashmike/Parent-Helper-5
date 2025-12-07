"use client";

import { useState, useTransition, memo, useCallback } from "react";
import { CheckCircle2, Circle, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import Link from "next/link";
import { completeStepAction, recalculateProgressAction } from "./actions";
import type { OnboardingStepId } from "@/lib/gamification/onboarding";
import { ONBOARDING_STEPS } from "@/lib/gamification/onboarding";

interface OnboardingStatus {
  isComplete: boolean;
  completedSteps: OnboardingStepId[];
  progress: number;
  steps: Array<{
    id: OnboardingStepId;
    title: string;
    description: string;
    actionLabel: string;
    route?: string;
    completed: boolean;
  }>;
}

interface OnboardingClientProps {
  providerId: number;
  initialStatus: OnboardingStatus;
}

const ProgressRing = memo(({ progress }: { progress: number }) => (
  <div className="mb-8 flex items-center justify-center">
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90 transform">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-sage/20"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 56}`}
          strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
          className="text-sage transition-all duration-500"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-charcoal">{progress}%</div>
          <div className="text-small text-charcoal/60">Complete</div>
        </div>
      </div>
    </div>
  </div>
));

ProgressRing.displayName = "ProgressRing";

export function OnboardingClient({ providerId, initialStatus }: OnboardingClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleRecalculate = useCallback(() => {
    startTransition(async () => {
      await recalculateProgressAction(providerId);
      // Note: recalculateProgressAction is a dev stub that returns void
      // In production, this would return progress data
      // For now, we just revalidate the path and let the page refresh
    });
  }, [providerId]);

  const handleCompleteStep = useCallback(async (stepId: OnboardingStepId) => {
    startTransition(async () => {
      await completeStepAction(new FormData());
      // Note: completeStepAction is a dev stub that returns void
      // In production, this would return success/progress data
      // For now, we just update local state optimistically
      setStatus((prevStatus) => ({
        ...prevStatus,
        completedSteps: [...prevStatus.completedSteps, stepId],
        steps: prevStatus.steps.map((step) =>
          step.id === stepId ? { ...step, completed: true } : step
        ),
      }));
    });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-sage" />
          <h1 className="text-3xl font-bold text-charcoal">Success Path</h1>
        </div>
        <p className="text-charcoal/70">
          Complete these steps to optimize your provider profile and start attracting more families.
        </p>
      </div>

      {/* Progress Ring */}
      <ProgressRing progress={status.progress} />

      {/* Checklist */}
      <div className="space-y-4">
        {status.steps.map((step, index) => (
          <div
            key={step.id}
            className={`rounded-lg border-2 p-4 transition-all ${
              step.completed
                ? "border-sage/30 bg-sage/5"
                : "border-charcoal/10 bg-white hover:border-sage/30"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {step.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-sage" />
                ) : (
                  <Circle className="h-6 w-6 text-charcoal/30" />
                )}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="font-semibold text-charcoal">{step.title}</h2>
                  <span className="text-small text-charcoal/50">Step {index + 1}</span>
                </div>
                <p className="mb-3 text-sm text-charcoal/70">{step.description}</p>
                <div className="flex items-center gap-2">
                  {step.route ? (
                    <Link
                      href={step.route}
                      className="inline-flex items-center gap-1 rounded-md bg-sage px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sage/90"
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCompleteStep(step.id)}
                      disabled={isPending || step.completed}
                      className="inline-flex items-center gap-1 rounded-md bg-sage px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sage/90 disabled:opacity-50"
                    >
                      {step.completed ? "Completed" : step.actionLabel}
                    </button>
                  )}
                  <button
                    className="rounded p-1 text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal"
                    title="Get help with this step"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recalculate Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleRecalculate}
          disabled={isPending}
          className="rounded-md border border-charcoal/20 px-4 py-2 text-sm text-charcoal/70 transition hover:bg-charcoal/5 disabled:opacity-50"
        >
          {isPending ? "Syncing..." : "Sync Progress"}
        </button>
      </div>

      {status.isComplete && (
        <div className="mt-8 rounded-lg bg-sage/10 border-2 border-sage/30 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-sage" />
          <h2 className="mb-2 text-xl font-semibold text-charcoal">Congratulations!</h2>
          <p className="text-charcoal/70">
            You&apos;ve completed all onboarding steps. Your profile is now optimized for success!
          </p>
        </div>
      )}
    </div>
  );
}

