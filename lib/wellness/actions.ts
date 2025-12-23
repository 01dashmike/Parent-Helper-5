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
  NutritionStage,
} from "./types";
import {
  getAvailableExercises,
  formatExercisesForPrompt,
  getExerciseDetail,
  type ExerciseDBExerciseSummary,
} from "./exercisedb-exercises";

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

    // Call AI with increased token limit for full 7-day plan
    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 8000,
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

    // Parse JSON response - handle potential markdown wrapping
    let jsonText = response.text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    try {
      const mealPlan = JSON.parse(jsonText);
      return {
        success: true,
        data: mealPlan,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response (first 500 chars):", jsonText.substring(0, 500));
      return {
        success: false,
        error: "Failed to parse meal plan response. Please try again.",
      };
    }
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

/**
 * Enrich an exercise with ExerciseDB data (GIF, instructions, etc.)
 */
async function enrichExerciseWithExerciseDB(
  exercise: { name: string; [key: string]: unknown },
  availableExercises: ExerciseDBExerciseSummary[]
): Promise<{ name: string; [key: string]: unknown }> {
  // Try exact match first
  const exactMatch = availableExercises.find(
    (ex) => ex.name.toLowerCase() === exercise.name.toLowerCase()
  );

  if (exactMatch) {
    const detail = await getExerciseDetail(exactMatch.id);
    if (detail) {
      return {
        ...exercise,
        exerciseDbId: detail.id,
        imageUrl: detail.gifUrl,
        gymFitInstructions: detail.instructions, // Keep same property name for UI compatibility
        targetMuscles: [detail.target, ...detail.secondaryMuscles].filter(Boolean),
      };
    }
    // Even without detail, use the summary GIF URL
    return {
      ...exercise,
      exerciseDbId: exactMatch.id,
      imageUrl: exactMatch.gifUrl,
      targetMuscles: [exactMatch.target].filter(Boolean),
    };
  }

  // Try fuzzy match (partial name match)
  const normalizedName = exercise.name.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const fuzzyMatch = availableExercises.find((ex) => {
    const normalizedEx = ex.name.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    return normalizedEx.includes(normalizedName) || normalizedName.includes(normalizedEx);
  });

  if (fuzzyMatch) {
    const detail = await getExerciseDetail(fuzzyMatch.id);
    if (detail) {
      return {
        ...exercise,
        exerciseDbId: detail.id,
        imageUrl: detail.gifUrl,
        gymFitInstructions: detail.instructions,
        targetMuscles: [detail.target, ...detail.secondaryMuscles].filter(Boolean),
      };
    }
    // Even without detail, use the summary GIF URL
    return {
      ...exercise,
      exerciseDbId: fuzzyMatch.id,
      imageUrl: fuzzyMatch.gifUrl,
      targetMuscles: [fuzzyMatch.target].filter(Boolean),
    };
  }

  // Try word-based matching for better results
  const words = normalizedName.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    const wordMatch = availableExercises.find((ex) => {
      const exName = ex.name.toLowerCase();
      return words.some(word => exName.includes(word));
    });
    
    if (wordMatch) {
      return {
        ...exercise,
        exerciseDbId: wordMatch.id,
        imageUrl: wordMatch.gifUrl,
        targetMuscles: [wordMatch.target].filter(Boolean),
      };
    }
  }

  // No match found, return original exercise
  return exercise;
}

/**
 * Enrich all exercises in a workout session
 */
async function enrichWorkoutSession(
  session: {
    warmup: Array<{ name: string; [key: string]: unknown }>;
    mainWorkout: Array<{ name: string; [key: string]: unknown }>;
    cooldown: Array<{ name: string; [key: string]: unknown }>;
    [key: string]: unknown;
  },
  availableExercises: ExerciseDBExerciseSummary[]
): Promise<typeof session> {
  const [enrichedWarmup, enrichedMain, enrichedCooldown] = await Promise.all([
    Promise.all(
      session.warmup.map((ex) => enrichExerciseWithExerciseDB(ex, availableExercises))
    ),
    Promise.all(
      session.mainWorkout.map((ex) => enrichExerciseWithExerciseDB(ex, availableExercises))
    ),
    Promise.all(
      session.cooldown.map((ex) => enrichExerciseWithExerciseDB(ex, availableExercises))
    ),
  ]);

  return {
    ...session,
    warmup: enrichedWarmup,
    mainWorkout: enrichedMain,
    cooldown: enrichedCooldown,
  };
}

export async function generateExercisePlan(
  inputs: ExercisePlanInputs
): Promise<ExercisePlanResult> {
  try {
    // Fetch available exercises from ExerciseDB API
    const availableExercises = await getAvailableExercises();
    console.log(`[ExercisePlan] Loaded ${availableExercises.length} exercises from ExerciseDB`);

    // Format exercises for the prompt (only if we have exercises with images)
    let exerciseListForPrompt: string | undefined;
    if (availableExercises.length > 0) {
      exerciseListForPrompt = await formatExercisesForPrompt();
    }

    const systemPrompt = getSystemPrompt("exercise planning");
    const userPrompt = buildExercisePlanPrompt(inputs, exerciseListForPrompt);

    // Calculate token limit based on workout complexity
    // A 7-day, 1-hour workout plan with 10-12 exercises per day needs ~12000+ tokens
    const daysMultiplier = inputs.daysPerWeek;
    const timeMultiplier = inputs.timePerSession === "1hr" ? 3 : 
                           inputs.timePerSession === "45min" ? 2.5 : 
                           inputs.timePerSession === "30min" ? 2 : 1.5;
    const baseTokens = 4000;
    const calculatedTokens = Math.min(16000, Math.round(baseTokens * timeMultiplier * (daysMultiplier / 3)));
    
    console.log(`[ExercisePlan] Using ${calculatedTokens} max tokens for ${inputs.daysPerWeek}-day, ${inputs.timePerSession} plan`);

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: calculatedTokens,
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

    // Parse JSON response - handle potential markdown wrapping
    let jsonText = response.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    // Check for truncated response (common with large plans)
    let exercisePlan;
    try {
      exercisePlan = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response length:", jsonText.length);
      console.error("Response ends with:", jsonText.slice(-100));
      
      // If the response was truncated, provide a helpful error
      if (jsonText.length > 10000 && !jsonText.endsWith("}")) {
        return {
          success: false,
          error: "The workout plan was too complex to generate completely. Please try reducing the number of days or session time.",
        };
      }
      
      return {
        success: false,
        error: "Failed to parse exercise plan. Please try again.",
      };
    }

    // Enrich exercises with ExerciseDB data (GIFs, detailed instructions)
    if (availableExercises.length > 0 && exercisePlan.weekPlan) {
      const enrichedWeekPlan = await Promise.all(
        exercisePlan.weekPlan.map((session: any) =>
          enrichWorkoutSession(session, availableExercises)
        )
      );
      exercisePlan.weekPlan = enrichedWeekPlan;
      
      // Log enrichment stats
      let totalExercises = 0;
      let enrichedCount = 0;
      for (const session of enrichedWeekPlan) {
        for (const ex of [...session.warmup, ...session.mainWorkout, ...session.cooldown]) {
          totalExercises++;
          if (ex.imageUrl) enrichedCount++;
        }
      }
      console.log(`[ExercisePlan] Enriched ${enrichedCount}/${totalExercises} exercises with ExerciseDB data`);
    }

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

// ============================================================================
// Nutrition Recipe Finder
// ============================================================================

export interface NutritionRecipe {
  name: string;
  description: string;
  ingredients: string[];
  method: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  suitableFor: NutritionStage[];
  safetyNotes?: string[];
  nutritionHighlights?: string[];
}

export interface NutritionRecipeResult {
  success: boolean;
  data?: {
    recipes: NutritionRecipe[];
    tips: string[];
  };
  error?: string;
}

/**
 * Generate recipes suitable for a specific nutrition stage
 */
export async function generateNutritionRecipes(
  stage: NutritionStage,
  ingredients?: string,
  preferences?: string
): Promise<NutritionRecipeResult> {
  try {
    const stageContext: Record<NutritionStage, string> = {
      pregnancy: `The user is pregnant. Focus on:
- Foods rich in folate, iron, calcium, and protein
- Avoiding raw/undercooked eggs, meat, fish
- Avoiding high-mercury fish (shark, swordfish, marlin)
- Limiting caffeine
- Avoiding alcohol
- Avoiding soft cheeses with white rind (brie, camembert)
- Avoiding pâté
- Ensuring food is thoroughly cooked`,
      breastfeeding: `The user is breastfeeding. Focus on:
- Nutrient-dense foods to support milk production
- Staying hydrated
- Including omega-3 rich foods
- Foods that may help milk supply (oats, fennel)
- Avoiding excessive caffeine (passes to baby)
- Avoiding excessive alcohol`,
      "bottle-feeding": `The user is bottle-feeding a baby. Focus on:
- Recipes for the parent (not formula recipes)
- Quick, one-handed meal ideas
- Batch cooking for busy feeding schedules
- Nutritious meals that can be eaten cold or reheated quickly`,
      weaning: `The user is weaning a baby (6+ months). Focus on:
- Baby-appropriate textures (purées, soft finger foods)
- Age-appropriate portion sizes
- NO added salt or sugar
- NO honey (botulism risk under 12 months)
- Introducing allergens safely (one at a time)
- Avoiding choking hazards (whole grapes, whole nuts, popcorn)
- Iron-rich first foods
- Soft, mashable textures`,
    };

    const systemPrompt = `You are a UK-based nutrition expert specialising in pregnancy and baby nutrition.
You provide practical, NHS-aligned advice. Your tone is warm, supportive, and never preachy.
Always prioritise safety and include relevant warnings.
Respond in valid JSON format only.`;

    const userPrompt = `Generate 3 recipes suitable for someone in the "${stage}" stage.

${stageContext[stage]}

${ingredients ? `The user has these ingredients available: ${ingredients}` : ""}
${preferences ? `Additional preferences: ${preferences}` : ""}

Respond with a JSON object in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description of the dish",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "method": ["Step 1", "Step 2"],
      "prepTime": "10 mins",
      "cookTime": "20 mins",
      "servings": 2,
      "suitableFor": ["${stage}"],
      "safetyNotes": ["Any safety considerations"],
      "nutritionHighlights": ["Key nutrients this provides"]
    }
  ],
  "tips": ["General tips for this stage"]
}

Important:
- All recipes must be safe for the ${stage} stage
- Include clear safety notes where relevant
- Use UK measurements and terminology
- Keep recipes practical and achievable
- For weaning, specify if suitable for 6+, 9+, or 12+ months`;

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 3000,
      temperature: 0.7,
      metadata: {
        useCase: "nutrition-recipe-finder",
        context: { stage },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to generate recipes",
      };
    }

    // Parse JSON response - handle potential markdown wrapping
    let jsonText = response.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    try {
      const recipes = JSON.parse(jsonText);
      return {
        success: true,
        data: recipes,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        success: false,
        error: "Failed to parse recipe response. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error generating nutrition recipes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// ============================================================================
// Nutrition Plan Generation (Wizard-based)
// ============================================================================

export interface NutritionPlanInputs {
  journeyStage: "prenatal" | "baby-feeding";
  dueDate?: string;
  trimester?: "first" | "second" | "third";
  prenatalConcerns?: string[];
  babyDob?: string;
  babyAgeMonths?: number;
  feedingMethod?: "breastfeeding" | "formula" | "combination";
  weaningStage?: "not-started" | "early-weaning" | "established" | "toddler-meals";
  allergies: string[];
  dietaryRestrictions: string[];
  healthConditions: string[];
  foodPreferences: string[];
  foodDislikes: string[];
  cookingTime: "15min" | "30min" | "1hr" | "1hr+";
  budgetPreference: "budget-friendly" | "moderate" | "premium";
}

export interface NutritionPlanResult {
  success: boolean;
  data?: {
    stage: string;
    overview: string;
    keyNutrients: Array<{
      name: string;
      importance: string;
      dailyTarget?: string;
      foodSources: string[];
    }>;
    mealIdeas: Array<{
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      name: string;
      description: string;
      prepTime: string;
      nutrients: string[];
      safetyNotes?: string[];
    }>;
    foodsToEnjoy: Array<{
      name: string;
      benefit: string;
    }>;
    foodsToAvoid: Array<{
      name: string;
      reason: string;
    }>;
    tips: string[];
    safetyReminders: Array<{
      reminder: string;
      why: string;
    }>;
  };
  error?: string;
}

/**
 * Generate a comprehensive nutrition plan based on user inputs
 */
export async function generateNutritionPlan(
  inputs: NutritionPlanInputs
): Promise<NutritionPlanResult> {
  try {
    // Build context based on journey stage
    let stageContext = "";
    let stageLabel = "";

    if (inputs.journeyStage === "prenatal") {
      const trimesterInfo: Record<string, string> = {
        first: "First trimester (weeks 1-12): Focus on folate, managing nausea, small frequent meals",
        second: "Second trimester (weeks 13-27): Baby is growing rapidly, increased calorie and protein needs",
        third: "Third trimester (weeks 28-40): Baby gaining weight, focus on iron, calcium, and energy",
      };
      
      stageLabel = inputs.trimester ? `Pregnancy - ${inputs.trimester} trimester` : "Pregnancy";
      stageContext = `The user is pregnant.
${inputs.trimester ? trimesterInfo[inputs.trimester] : ""}
${inputs.dueDate ? `Due date: ${inputs.dueDate}` : ""}
${inputs.prenatalConcerns?.length ? `Concerns: ${inputs.prenatalConcerns.join(", ")}` : ""}

Key pregnancy nutrition rules:
- Avoid raw/undercooked eggs, meat, fish
- Avoid high-mercury fish (shark, swordfish, marlin, king mackerel)
- Limit caffeine to 200mg/day
- Avoid alcohol completely
- Avoid soft cheeses with white rind (brie, camembert) unless cooked
- Avoid pâté and liver products (too much vitamin A)
- Ensure all food is thoroughly cooked
- Focus on folate, iron, calcium, protein, omega-3s`;
    } else {
      // Baby feeding stage
      const feedingInfo: Record<string, string> = {
        breastfeeding: "Focus on nutrient-dense foods to support milk production, hydration, omega-3s",
        formula: "Focus on quick, nutritious meals for the parent during busy feeding schedules",
        combination: "Combination feeding - support both breastfeeding nutrition and practical meal ideas",
      };

      const weaningInfo: Record<string, string> = {
        "not-started": "Baby under 6 months - focus on parent nutrition for breastfeeding/formula feeding",
        "early-weaning": "Early weaning (6-9 months) - introducing first foods, purées, soft finger foods",
        "established": "Established weaning (9-12 months) - wider variety, lumpier textures, family foods",
        "toddler-meals": "Toddler meals (12+ months) - eating with family, balanced nutrition, independence",
      };

      stageLabel = inputs.weaningStage && inputs.weaningStage !== "not-started" 
        ? `Baby feeding - ${inputs.weaningStage.replace("-", " ")}`
        : `Baby feeding - ${inputs.feedingMethod || "general"}`;

      stageContext = `The user has a baby.
${inputs.babyAgeMonths !== undefined ? `Baby age: ${inputs.babyAgeMonths} months` : ""}
${inputs.feedingMethod ? feedingInfo[inputs.feedingMethod] : ""}
${inputs.weaningStage ? weaningInfo[inputs.weaningStage] : ""}

Key baby feeding safety rules:
- NO honey under 12 months (botulism risk)
- NO added salt or sugar for babies
- NO whole nuts (choking hazard)
- Cut grapes lengthways
- Avoid choking hazards (popcorn, whole cherry tomatoes, raw carrots)
- Introduce allergens one at a time, 3 days apart
- Iron-rich foods are important from 6 months`;
    }

    const systemPrompt = `You are a UK-based nutrition expert specialising in pregnancy and baby nutrition.
You provide practical, NHS-aligned advice. Your tone is warm, supportive, and never preachy.
Always prioritise safety and include relevant warnings.
Respond in valid JSON format only.`;

    const userPrompt = `Generate a comprehensive nutrition plan for this user:

STAGE: ${stageLabel}
${stageContext}

USER PROFILE:
- Allergies: ${inputs.allergies.length ? inputs.allergies.join(", ") : "None specified"}
- Dietary restrictions: ${inputs.dietaryRestrictions.length ? inputs.dietaryRestrictions.join(", ") : "None"}
- Health conditions: ${inputs.healthConditions.length ? inputs.healthConditions.join(", ") : "None specified"}
- Foods they enjoy: ${inputs.foodPreferences.length ? inputs.foodPreferences.join(", ") : "Not specified"}
- Foods they dislike: ${inputs.foodDislikes.length ? inputs.foodDislikes.join(", ") : "None"}
- Available cooking time: ${inputs.cookingTime}
- Budget: ${inputs.budgetPreference}

Respond with a JSON object in this exact format:
{
  "stage": "${stageLabel}",
  "overview": "A warm, encouraging 2-3 sentence overview of nutrition priorities for this stage",
  "keyNutrients": [
    {
      "name": "Nutrient name",
      "importance": "Why this nutrient matters at this stage",
      "dailyTarget": "Recommended daily amount (if applicable)",
      "foodSources": ["food 1", "food 2", "food 3"]
    }
  ],
  "mealIdeas": [
    {
      "mealType": "breakfast|lunch|dinner|snack",
      "name": "Meal name",
      "description": "Brief description",
      "prepTime": "X mins",
      "nutrients": ["key nutrient 1", "key nutrient 2"],
      "safetyNotes": ["Any safety notes for this meal"]
    }
  ],
  "foodsToEnjoy": [
    {
      "name": "Food name",
      "benefit": "Why it's good at this stage"
    }
  ],
  "foodsToAvoid": [
    {
      "name": "Food name",
      "reason": "Why to avoid it"
    }
  ],
  "tips": ["Practical tip 1", "Practical tip 2"],
  "safetyReminders": [
    {
      "reminder": "The safety reminder",
      "why": "A brief explanation of why this matters for mum and/or baby"
    }
  ]
}

Requirements:
- Include 5-6 key nutrients most important for this stage
- Provide 6-8 meal ideas (2 breakfast, 2 lunch, 2 dinner, 2 snacks)
- List 8-10 foods to enjoy and 5-8 foods to avoid
- Include 5-6 practical tips
- Include 4-6 safety reminders with clear "why" explanations
- Respect all allergies and dietary restrictions
- Keep meal ideas within the specified cooking time
- Use UK measurements and terminology
- Be encouraging and supportive in tone`;

    const response = await callAI({
      model: "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      metadata: {
        useCase: "nutrition-plan-wizard",
        context: { stage: inputs.journeyStage },
      },
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        error: response.error || "Failed to generate nutrition plan",
      };
    }

    // Parse JSON response - handle potential markdown wrapping
    let jsonText = response.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    try {
      const nutritionPlan = JSON.parse(jsonText);
      return {
        success: true,
        data: nutritionPlan,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response (first 500 chars):", jsonText.substring(0, 500));
      return {
        success: false,
        error: "Failed to parse nutrition plan response. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error generating nutrition plan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
