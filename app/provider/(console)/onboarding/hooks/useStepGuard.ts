"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { WizardStepId } from "@/lib/provider/onboarding";

const STEP_ORDER: Record<WizardStepId, number> = {
  "step-1-account": 1,
  "step-2-business": 2,
  "step-3-class": 3,
  "step-4-media": 4,
  "step-5-preview": 5,
  "step-6-publish": 6,
  "complete": 7,
};

/**
 * Hook to guard step access and prevent skipping ahead
 * Receives onboarding state from server component
 */
export function useStepGuard(
  currentStepId: WizardStepId,
  serverCurrentStep: WizardStepId | null,
  isComplete: boolean
) {
  const router = useRouter();

  useEffect(() => {
    if (isComplete) {
      router.push("/provider");
      return;
    }

    if (!serverCurrentStep) return;

    const currentStepOrder = STEP_ORDER[serverCurrentStep];
    const requestedStepOrder = STEP_ORDER[currentStepId];

    if (requestedStepOrder > currentStepOrder) {
      // User trying to skip ahead - redirect to current step
      router.push(`/provider/onboarding/wizard/${serverCurrentStep}`);
    }
  }, [currentStepId, serverCurrentStep, isComplete, router]);
}

