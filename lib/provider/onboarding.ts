/**
 * Provider Onboarding Wizard Helper Module
 * 
 * Provides utilities for managing provider onboarding state and progress.
 * This module works alongside lib/gamification/onboarding.ts without breaking it.
 */

import { createClient } from "@/lib/supabase/server";

export type WizardStepId =
  | "step-1-account"
  | "step-2-business"
  | "step-3-class"
  | "step-4-media"
  | "step-5-preview"
  | "step-6-publish"
  | "complete";

export const WIZARD_STEPS: WizardStepId[] = [
  "step-1-account",
  "step-2-business",
  "step-3-class",
  "step-4-media",
  "step-5-preview",
  "step-6-publish",
];

export interface OnboardingState {
  providerId: number;
  isComplete: boolean;
  currentStep: WizardStepId | null;
  completedSteps: WizardStepId[];
  progress: number;
  savedData: Record<string, unknown>;
  updatedAt: string;
}

/**
 * Get onboarding state for a provider
 * Creates onboarding record if it doesn't exist
 * 
 * Note: provider_onboarding.provider_id may be UUID in database, but we receive integer providerId.
 * This function handles both cases by trying the query and handling errors gracefully.
 */
export async function getOnboardingState(providerId: number): Promise<OnboardingState> {
  const supabase = await createClient();

  // Try querying with integer provider_id first
  const { data, error } = await supabase
    .from("provider_onboarding")
    .select("*")
    .eq("provider_id", providerId)
    .maybeSingle();

  // If error suggests type mismatch (UUID vs integer), log it but continue
  if (error) {
    console.error("[getOnboardingState] Error querying provider_onboarding:", {
      error: error.message,
      code: error.code,
      providerId,
      providerIdType: typeof providerId,
    });
    
    // If it's a type mismatch error, try to initialize with the correct type
    // For now, we'll still try to initialize, which may fail, but at least we'll see the error
    if (error.code === "42804" || error.message?.includes("type")) {
      console.warn("[getOnboardingState] Type mismatch detected - provider_onboarding.provider_id may be UUID");
    }
  }

  if (error || !data) {
    // No record exists, initialize it
    // Note: This may fail if provider_id types don't match
    return await initOnboarding(providerId);
  }

  return {
    providerId: typeof data.provider_id === "number" ? data.provider_id : providerId,
    isComplete: data.is_complete ?? false,
    currentStep: (data.current_step as WizardStepId) || "step-1-account",
    completedSteps: (data.completed_steps as WizardStepId[]) || [],
    progress: data.progress ?? 0,
    savedData: (data.saved_data as Record<string, unknown>) || {},
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}

/**
 * Initialize onboarding record for a provider
 * 
 * Note: If provider_onboarding.provider_id is UUID in database, this will fail.
 * The error will be logged and we'll return a default state.
 */
export async function initOnboarding(providerId: number): Promise<OnboardingState> {
  const supabase = await createClient();

  const initialState: OnboardingState = {
    providerId,
    isComplete: false,
    currentStep: "step-1-account",
    completedSteps: [],
    progress: 0,
    savedData: {},
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("provider_onboarding")
    .insert({
      provider_id: providerId,
      is_complete: false,
      completed_steps: [],
      progress: 0,
      current_step: "step-1-account",
      saved_data: {},
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[initOnboarding] Error inserting provider_onboarding:", {
      error: error.message,
      code: error.code,
      providerId,
      providerIdType: typeof providerId,
    });
    
    // If it's a type mismatch, return the initial state anyway
    // The user will need to fix the database schema or we need to use UUID
    if (error.code === "42804" || error.message?.includes("type")) {
      console.warn("[initOnboarding] Type mismatch - cannot insert integer into UUID column");
      return initialState;
    }
    
    // If insert fails for other reasons (e.g., record already exists), try to get it
    const existing = await getOnboardingState(providerId);
    return existing;
  }

  if (!data) {
    // No data returned, return initial state
    return initialState;
  }

  return {
    providerId: typeof data.provider_id === "number" ? data.provider_id : providerId,
    isComplete: data.is_complete ?? false,
    currentStep: (data.current_step as WizardStepId) || "step-1-account",
    completedSteps: (data.completed_steps as WizardStepId[]) || [],
    progress: data.progress ?? 0,
    savedData: (data.saved_data as Record<string, unknown>) || {},
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}

/**
 * Update current step for a provider
 */
export async function updateCurrentStep(
  providerId: number,
  step: WizardStepId
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("provider_onboarding")
    .update({
      current_step: step,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_id", providerId);

  if (error) {
    console.error("[updateCurrentStep] Error updating provider_onboarding:", {
      error: error.message,
      code: error.code,
      providerId,
    });
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Save step data to saved_data JSONB field
 */
export async function saveStepData(
  providerId: number,
  step: WizardStepId,
  data: unknown
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current saved_data
  const { data: current, error: selectError } = await supabase
    .from("provider_onboarding")
    .select("saved_data")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (selectError) {
    console.error("[saveStepData] Error reading provider_onboarding:", {
      error: selectError.message,
      code: selectError.code,
      providerId,
    });
    return { success: false, error: selectError.message };
  }

  const savedData = (current?.saved_data as Record<string, unknown>) || {};
  savedData[step] = data;

  const { error } = await supabase
    .from("provider_onboarding")
    .update({
      saved_data: savedData,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_id", providerId);

  if (error) {
    console.error("[saveStepData] Error updating provider_onboarding:", {
      error: error.message,
      code: error.code,
      providerId,
    });
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark a step as complete and advance to next step
 */
export async function markStepComplete(
  providerId: number,
  step: WizardStepId
): Promise<{ success: boolean; nextStep: WizardStepId | null; error?: string }> {
  const supabase = await createClient();

  // Get current state
  const state = await getOnboardingState(providerId);

  // Add step to completed if not already there
  const completedSteps = state.completedSteps.includes(step)
    ? state.completedSteps
    : [...state.completedSteps, step];

  // Calculate progress
  const progress = Math.round((completedSteps.length / WIZARD_STEPS.length) * 100);

  // Determine next step
  const currentIndex = WIZARD_STEPS.indexOf(step);
  const nextStep =
    currentIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[currentIndex + 1] : null;

  // Update record
  const { error } = await supabase
    .from("provider_onboarding")
    .update({
      completed_steps: completedSteps,
      progress,
      current_step: nextStep || "complete",
      updated_at: new Date().toISOString(),
    })
    .eq("provider_id", providerId);

  if (error) {
    console.error("[markStepComplete] Error updating provider_onboarding:", {
      error: error.message,
      code: error.code,
      providerId,
    });
    return { success: false, nextStep: null, error: error.message };
  }

  return { success: true, nextStep };
}

/**
 * Get next step for a provider
 */
export async function getNextStep(providerId: number): Promise<WizardStepId | null> {
  const state = await getOnboardingState(providerId);

  if (state.isComplete) {
    return null;
  }

  return state.currentStep || "step-1-account";
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(providerId: number): Promise<boolean> {
  const state = await getOnboardingState(providerId);
  return state.isComplete;
}

/**
 * Get saved data for a specific step
 */
export async function getStepData(
  providerId: number,
  step: WizardStepId
): Promise<unknown | null> {
  const state = await getOnboardingState(providerId);
  return state.savedData[step] || null;
}




