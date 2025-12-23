"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { generateNutritionPlan } from "@/lib/wellness/actions";

// Types for the nutrition wizard
export type NutritionJourneyStage = "prenatal" | "baby-feeding";
export type FeedingMethod = "breastfeeding" | "formula" | "combination";
export type WeaningStage = "not-started" | "early-weaning" | "established" | "toddler-meals";
export type Trimester = "first" | "second" | "third";

export interface NutritionWizardInputs {
  journeyStage: NutritionJourneyStage;
  // Prenatal specific
  dueDate?: string;
  trimester?: Trimester;
  prenatalConcerns?: string[];
  // Baby feeding specific
  babyDob?: string;
  babyAgeMonths?: number;
  feedingMethod?: FeedingMethod;
  weaningStage?: WeaningStage;
  // Common fields
  allergies: string[];
  dietaryRestrictions: string[];
  healthConditions: string[];
  foodPreferences: string[];
  foodDislikes: string[];
  cookingTime: "15min" | "30min" | "1hr" | "1hr+";
  budgetPreference: "budget-friendly" | "moderate" | "premium";
}

export interface NutritionPlanResult {
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
}

interface NutritionWizardProps {
  onComplete: (result: NutritionPlanResult, inputs: NutritionWizardInputs) => void;
}

const prenatalConcernOptions = [
  { value: "morning-sickness", label: "Morning sickness / nausea" },
  { value: "fatigue", label: "Fatigue & low energy" },
  { value: "heartburn", label: "Heartburn / acid reflux" },
  { value: "constipation", label: "Constipation" },
  { value: "gestational-diabetes", label: "Gestational diabetes" },
  { value: "iron-deficiency", label: "Iron deficiency / anaemia" },
  { value: "food-aversions", label: "Strong food aversions" },
  { value: "weight-management", label: "Weight management" },
];

const commonAllergens = [
  "Dairy",
  "Eggs",
  "Peanuts",
  "Tree nuts",
  "Soy",
  "Wheat/Gluten",
  "Fish",
  "Shellfish",
  "Sesame",
];

const dietaryRestrictionOptions = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "low-sodium", label: "Low sodium" },
  { value: "low-sugar", label: "Low sugar" },
];

const cookingTimeOptions = [
  { value: "15min", label: "15 minutes or less" },
  { value: "30min", label: "30 minutes" },
  { value: "1hr", label: "Up to 1 hour" },
  { value: "1hr+", label: "Happy to batch cook" },
];

export default function NutritionWizard({ onComplete }: NutritionWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<NutritionWizardInputs>>({
    journeyStage: undefined,
    allergies: [],
    dietaryRestrictions: [],
    healthConditions: [],
    foodPreferences: [],
    foodDislikes: [],
    cookingTime: "30min",
    budgetPreference: "moderate",
    prenatalConcerns: [],
  });

  // Input states for comma-separated fields
  const [foodPreferencesInput, setFoodPreferencesInput] = useState("");
  const [foodDislikesInput, setFoodDislikesInput] = useState("");
  const [healthConditionsInput, setHealthConditionsInput] = useState("");

  // Calculate baby age from DOB
  const calculateBabyAgeMonths = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                   (today.getMonth() - birthDate.getMonth());
    return Math.max(0, months);
  };

  // Calculate trimester from due date
  const calculateTrimester = (dueDate: string): Trimester => {
    const due = new Date(dueDate);
    const today = new Date();
    const weeksPregnant = 40 - Math.ceil((due.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeksPregnant <= 12) return "first";
    if (weeksPregnant <= 27) return "second";
    return "third";
  };

  // Suggest weaning stage based on baby age
  const suggestWeaningStage = (ageMonths: number): WeaningStage => {
    if (ageMonths < 6) return "not-started";
    if (ageMonths < 9) return "early-weaning";
    if (ageMonths < 12) return "established";
    return "toddler-meals";
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parse comma-separated inputs
      const foodPreferences = foodPreferencesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const foodDislikes = foodDislikesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const healthConditions = healthConditionsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const inputs: NutritionWizardInputs = {
        journeyStage: formData.journeyStage!,
        dueDate: formData.dueDate,
        trimester: formData.trimester,
        prenatalConcerns: formData.prenatalConcerns,
        babyDob: formData.babyDob,
        babyAgeMonths: formData.babyAgeMonths,
        feedingMethod: formData.feedingMethod,
        weaningStage: formData.weaningStage,
        allergies: formData.allergies || [],
        dietaryRestrictions: formData.dietaryRestrictions || [],
        healthConditions,
        foodPreferences,
        foodDislikes,
        cookingTime: formData.cookingTime as "15min" | "30min" | "1hr" | "1hr+",
        budgetPreference: formData.budgetPreference as "budget-friendly" | "moderate" | "premium",
      };

      const result = await generateNutritionPlan(inputs);

      if (result.success && result.data) {
        onComplete(result.data, inputs);
      } else {
        setError(result.error || "Failed to generate nutrition plan");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.journeyStage;
      case 2:
        if (formData.journeyStage === "prenatal") {
          return !!formData.dueDate;
        }
        return !!formData.babyDob && !!formData.feedingMethod;
      case 3:
        return true; // Allergies are optional
      case 4:
        return true; // Preferences are optional
      default:
        return false;
    }
  };

  const totalSteps = 4;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
                s === step
                  ? "bg-sage text-white shadow-md"
                  : s < step
                  ? "bg-sage/30 text-sage"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage transition-all duration-300"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-soft">
        {/* Step 1: Journey Stage Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-charcoal mb-2">
                Where are you on your journey?
              </h3>
              <p className="text-charcoal/70">
                Select your current stage so we can provide the most relevant nutrition guidance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, journeyStage: "prenatal" })}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  formData.journeyStage === "prenatal"
                    ? "border-sage bg-sage/10 shadow-md"
                    : "border-gray-200 hover:border-sage/50 hover:bg-sage/5"
                }`}
              >
                <span className="text-4xl mb-3 block">🤰</span>
                <h4 className="font-semibold text-charcoal text-lg">Pregnancy</h4>
                <p className="text-sm text-charcoal/70 mt-1">
                  I&apos;m currently pregnant and want nutrition guidance for a healthy pregnancy.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, journeyStage: "baby-feeding" })}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  formData.journeyStage === "baby-feeding"
                    ? "border-sage bg-sage/10 shadow-md"
                    : "border-gray-200 hover:border-sage/50 hover:bg-sage/5"
                }`}
              >
                <span className="text-4xl mb-3 block">👶</span>
                <h4 className="font-semibold text-charcoal text-lg">Baby Feeding</h4>
                <p className="text-sm text-charcoal/70 mt-1">
                  I have a baby and want guidance on feeding, breastfeeding, formula, or weaning.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Stage-specific details */}
        {step === 2 && formData.journeyStage === "prenatal" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-charcoal mb-2">
                Tell us about your pregnancy
              </h3>
              <p className="text-charcoal/70">
                This helps us tailor nutrition advice to your trimester and any concerns.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">
                When is your due date?
              </label>
              <input
                type="date"
                value={formData.dueDate || ""}
                onChange={(e) => {
                  const dueDate = e.target.value;
                  const trimester = dueDate ? calculateTrimester(dueDate) : undefined;
                  setFormData({ ...formData, dueDate, trimester });
                }}
                className="w-full rounded-lg border border-sage/30 px-4 py-3 focus:border-sage focus:outline-none"
              />
              {formData.trimester && (
                <p className="mt-2 text-sm text-sage font-medium">
                  You&apos;re in your {formData.trimester} trimester
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-charcoal">
                Any pregnancy-related concerns? (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {prenatalConcernOptions.map((concern) => (
                  <label
                    key={concern.value}
                    className="flex items-center gap-2 rounded-lg border border-sage/30 p-3 hover:bg-sage/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.prenatalConcerns?.includes(concern.value)}
                      onChange={(e) => {
                        const current = formData.prenatalConcerns || [];
                        const updated = e.target.checked
                          ? [...current, concern.value]
                          : current.filter((c) => c !== concern.value);
                        setFormData({ ...formData, prenatalConcerns: updated });
                      }}
                      className="text-sage focus:ring-sage"
                    />
                    <span className="text-sm">{concern.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && formData.journeyStage === "baby-feeding" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-charcoal mb-2">
                Tell us about your baby
              </h3>
              <p className="text-charcoal/70">
                This helps us provide age-appropriate feeding guidance.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">
                Baby&apos;s date of birth
              </label>
              <input
                type="date"
                value={formData.babyDob || ""}
                onChange={(e) => {
                  const babyDob = e.target.value;
                  const babyAgeMonths = babyDob ? calculateBabyAgeMonths(babyDob) : undefined;
                  const suggestedWeaning = babyAgeMonths !== undefined ? suggestWeaningStage(babyAgeMonths) : undefined;
                  setFormData({ 
                    ...formData, 
                    babyDob, 
                    babyAgeMonths,
                    weaningStage: suggestedWeaning,
                  });
                }}
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-sage/30 px-4 py-3 focus:border-sage focus:outline-none"
              />
              {formData.babyAgeMonths !== undefined && (
                <p className="mt-2 text-sm text-sage font-medium">
                  Your baby is approximately {formData.babyAgeMonths} month{formData.babyAgeMonths !== 1 ? "s" : ""} old
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-charcoal">
                How are you feeding your baby?
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: "breastfeeding", label: "Breastfeeding", icon: "🤱" },
                  { value: "formula", label: "Formula feeding", icon: "🍼" },
                  { value: "combination", label: "Combination", icon: "🤱🍼" },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, feedingMethod: method.value as FeedingMethod })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.feedingMethod === method.value
                        ? "border-sage bg-sage/10 shadow-md"
                        : "border-gray-200 hover:border-sage/50"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.babyAgeMonths !== undefined && formData.babyAgeMonths >= 4 && (
              <div>
                <label className="mb-3 block text-sm font-medium text-charcoal">
                  Weaning stage
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "not-started", label: "Not started yet", desc: "Baby is under 6 months" },
                    { value: "early-weaning", label: "Early weaning", desc: "Just starting solids (6-9 months)" },
                    { value: "established", label: "Established weaning", desc: "Eating a variety of foods (9-12 months)" },
                    { value: "toddler-meals", label: "Toddler meals", desc: "Eating family foods (12+ months)" },
                  ].map((stage) => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, weaningStage: stage.value as WeaningStage })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.weaningStage === stage.value
                          ? "border-sage bg-sage/10"
                          : "border-gray-200 hover:border-sage/50"
                      }`}
                    >
                      <span className="text-sm font-medium block">{stage.label}</span>
                      <span className="text-xs text-charcoal/60">{stage.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Allergies & Restrictions */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-charcoal mb-2">
                Allergies & Dietary Needs
              </h3>
              <p className="text-charcoal/70">
                {formData.journeyStage === "prenatal"
                  ? "Let us know about any allergies or dietary restrictions you have."
                  : "Tell us about any allergies (yours or baby's) and dietary preferences."}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-charcoal">
                Known allergies (select all that apply)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {commonAllergens.map((allergen) => (
                  <label
                    key={allergen}
                    className="flex items-center gap-2 rounded-lg border border-sage/30 p-2 hover:bg-sage/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.allergies?.includes(allergen)}
                      onChange={(e) => {
                        const current = formData.allergies || [];
                        const updated = e.target.checked
                          ? [...current, allergen]
                          : current.filter((a) => a !== allergen);
                        setFormData({ ...formData, allergies: updated });
                      }}
                      className="text-sage focus:ring-sage"
                    />
                    <span className="text-sm">{allergen}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-charcoal">
                Dietary restrictions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dietaryRestrictionOptions.map((restriction) => (
                  <label
                    key={restriction.value}
                    className="flex items-center gap-2 rounded-lg border border-sage/30 p-2 hover:bg-sage/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dietaryRestrictions?.includes(restriction.value)}
                      onChange={(e) => {
                        const current = formData.dietaryRestrictions || [];
                        const updated = e.target.checked
                          ? [...current, restriction.value]
                          : current.filter((r) => r !== restriction.value);
                        setFormData({ ...formData, dietaryRestrictions: updated });
                      }}
                      className="text-sage focus:ring-sage"
                    />
                    <span className="text-sm">{restriction.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">
                Other health conditions (comma-separated)
              </label>
              <input
                type="text"
                value={healthConditionsInput}
                onChange={(e) => setHealthConditionsInput(e.target.value)}
                placeholder="e.g., diabetes, high blood pressure, thyroid issues"
                className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Preferences & Cooking */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-charcoal mb-2">
                Your Preferences
              </h3>
              <p className="text-charcoal/70">
                Help us personalise your meal ideas and nutrition plan.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">
                Foods you enjoy (comma-separated)
              </label>
              <input
                type="text"
                value={foodPreferencesInput}
                onChange={(e) => setFoodPreferencesInput(e.target.value)}
                placeholder="e.g., salmon, avocado, berries, oats"
                className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">
                Foods you dislike (comma-separated)
              </label>
              <input
                type="text"
                value={foodDislikesInput}
                onChange={(e) => setFoodDislikesInput(e.target.value)}
                placeholder="e.g., liver, brussels sprouts, blue cheese"
                className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-charcoal">
                Available cooking time per meal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cookingTimeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, cookingTime: option.value as "15min" | "30min" | "1hr" | "1hr+" })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.cookingTime === option.value
                        ? "border-sage bg-sage/10"
                        : "border-gray-200 hover:border-sage/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-charcoal">
                Budget preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "budget-friendly", label: "Budget-friendly" },
                  { value: "moderate", label: "Moderate" },
                  { value: "premium", label: "Premium" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, budgetPreference: option.value as "budget-friendly" | "moderate" | "premium" })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.budgetPreference === option.value
                        ? "border-sage bg-sage/10"
                        : "border-gray-200 hover:border-sage/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-full border border-sage/30 px-6 py-2 text-charcoal hover:bg-sage/10"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="rounded-full bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-full bg-sage px-8 py-3 font-semibold text-white hover:bg-sage/90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating your plan...
                </>
              ) : (
                "Get My Nutrition Plan"
              )}
            </button>
          )}
        </div>

        {step === totalSteps && (
          <p className="mt-4 text-center text-xs text-charcoal/60">
            This typically takes about 30 seconds to generate a personalised plan
          </p>
        )}
      </div>
    </div>
  );
}

