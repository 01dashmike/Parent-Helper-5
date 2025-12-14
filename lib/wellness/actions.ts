/**
 * Wellness Server Actions
 * 
 * Server-side functions for generating wellness plans using AI.
 * These actions are called from client components to generate
 * meal plans, exercise plans, supplement suggestions, and product safety analyses.
 */

"use server";

import { callAI } from "@/lib/ai/client";
import { createSupabaseServerActionClient, createSupabaseServerComponentClient } from "@/lib/supabase";
import {
  buildMealPlanPrompt,
  buildSnackAlternativesPrompt,
  buildExercisePlanPrompt,
  buildSupplementSuggestionsPrompt,
  buildProductSafetyPrompt,
  getSystemPrompt,
} from "./prompts";
import type {
  MealPlanInputs,
  MealPlanResult,
  SnackGeneratorInputs,
  SnackResult,
  ExercisePlanInputs,
  ExercisePlanResult,
  SupplementInputs,
  SupplementSuggestionResult,
  ProductSafetyInputs,
  ProductSafetyAnalysisResult,
  Audience,
  WellnessProfile,
} from "./types";

// ============================================================================
// Meal Plan Generation
// ============================================================================

export async function generateMealPlan(
  inputs: MealPlanInputs
): Promise<MealPlanResult> {
  try {
    // Build prompts
    const systemPrompt = getSystemPrompt("meal planning");
    const userPrompt = buildMealPlanPrompt(inputs);

    // Call AI
    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      metadata: {
        useCase: "wellness-meal-plan",
        context: { audience: inputs.audience },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to generate meal plan",
      };
    }

    // Parse JSON response
    const mealPlan = JSON.parse(response.text);

    return {
      success: true,
      data: mealPlan,
    };
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Snack Alternatives Generation
// ============================================================================

export async function generateSnackAlternatives(
  inputs: SnackGeneratorInputs
): Promise<SnackResult> {
  try {
    const systemPrompt = getSystemPrompt("snack alternatives");
    const userPrompt = buildSnackAlternativesPrompt(inputs);

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 2000,
      temperature: 0.7,
      metadata: {
        useCase: "wellness-snack-alternatives",
        context: { audience: inputs.audience },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to generate snack alternatives",
      };
    }

    const snackAlternatives = JSON.parse(response.text);

    return {
      success: true,
      data: snackAlternatives,
    };
  } catch (error) {
    console.error("Error generating snack alternatives:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Exercise Plan Generation
// ============================================================================

export async function generateExercisePlan(
  inputs: ExercisePlanInputs
): Promise<ExercisePlanResult> {
  try {
    const systemPrompt = getSystemPrompt("exercise planning");
    const userPrompt = buildExercisePlanPrompt(inputs);

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 3000,
      temperature: 0.7,
      metadata: {
        useCase: "wellness-exercise-plan",
        context: { audience: inputs.audience },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to generate exercise plan",
      };
    }

    const exercisePlan = JSON.parse(response.text);

    return {
      success: true,
      data: exercisePlan,
    };
  } catch (error) {
    console.error("Error generating exercise plan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Supplement Suggestions Generation
// ============================================================================

export async function generateSupplementSuggestions(
  inputs: SupplementInputs
): Promise<SupplementSuggestionResult> {
  try {
    const systemPrompt = getSystemPrompt("supplement suggestions");
    const userPrompt = buildSupplementSuggestionsPrompt(inputs);

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 2500,
      temperature: 0.6, // Lower temperature for more conservative suggestions
      metadata: {
        useCase: "wellness-supplement-suggestions",
        context: { audience: inputs.audience },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to generate supplement suggestions",
      };
    }

    const supplementSuggestions = JSON.parse(response.text);

    return {
      success: true,
      data: supplementSuggestions,
    };
  } catch (error) {
    console.error("Error generating supplement suggestions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Product Safety Analysis
// ============================================================================

export async function analyzeProductSafety(
  inputs: ProductSafetyInputs
): Promise<ProductSafetyAnalysisResult> {
  try {
    const systemPrompt = getSystemPrompt("product safety analysis");
    const userPrompt = buildProductSafetyPrompt(inputs);

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 2500,
      temperature: 0.6,
      metadata: {
        useCase: "wellness-product-safety",
        context: { audience: inputs.audience },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to analyze product safety",
      };
    }

    const productSafety = JSON.parse(response.text);

    return {
      success: true,
      data: productSafety,
    };
  } catch (error) {
    console.error("Error analyzing product safety:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Wellness Profile Management
// ============================================================================

/**
 * Save wellness profile preferences for a user
 */
export async function saveWellnessProfile(
  audience: Audience,
  preferences: Partial<WellnessProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("wellness_profiles")
      .upsert({
        user_id: user.id,
        audience,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,audience",
      });

    if (error) {
      console.error("[saveWellnessProfile] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[saveWellnessProfile] Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save preferences" 
    };
  }
}

/**
 * Load wellness profile preferences for a user
 */
export async function loadWellnessProfile(
  audience: Audience
): Promise<{ success: boolean; data?: Partial<WellnessProfile>; error?: string }> {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("wellness_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("audience", audience)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = not found
      console.error("[loadWellnessProfile] Error:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: undefined };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[loadWellnessProfile] Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to load preferences" 
    };
  }
}
