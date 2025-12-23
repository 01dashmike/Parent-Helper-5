"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { generateMealPlan } from "@/lib/wellness/actions";
import type {
  Audience,
  MealPlan,
  MealPlanInputs,
  CookingTime,
  UKSupermarket,
  DietGoal,
  BudgetPreference,
  FamilySize,
  ActivityLevel,
  ProteinTarget,
  WeeklyWeightLossTarget,
  BiologicalSexForCalc,
  GoalSpecificData,
  MuscleGainData,
  WeightLossData,
  HeartHealthData,
} from "@/lib/wellness/types";

const cookingTimes: { value: CookingTime; label: string }[] = [
  { value: "15min", label: "15 minutes" },
  { value: "30min", label: "30 minutes" },
  { value: "1hr", label: "1 hour" },
  { value: "1hr+", label: "1+ hours" },
];

const supermarkets: UKSupermarket[] = [
  "Tesco",
  "Sainsbury's",
  "Aldi",
  "Lidl",
  "M&S",
  "Waitrose",
  "Asda",
  "Morrisons",
];

const goals: { value: DietGoal; label: string }[] = [
  { value: "weight-loss", label: "Weight Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "energy", label: "More Energy" },
  { value: "heart-health", label: "Heart Health" },
  { value: "cholesterol-control", label: "Cholesterol Control" },
  { value: "diabetic-friendly", label: "Diabetic Friendly" },
  { value: "gut-health", label: "Gut Health" },
  { value: "general-wellness", label: "General Wellness" },
];

const budgetOptions: { value: BudgetPreference; label: string }[] = [
  { value: "budget-friendly", label: "Budget-Friendly" },
  { value: "moderate", label: "Moderate" },
  { value: "premium", label: "Premium" },
];

const activityLevels: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary (little or no exercise)" },
  { value: "lightly-active", label: "Lightly Active (light exercise 1-3 days/week)" },
  { value: "moderately-active", label: "Moderately Active (moderate exercise 3-5 days/week)" },
  { value: "very-active", label: "Very Active (hard exercise 6-7 days/week)" },
];

const proteinTargets: { value: ProteinTarget; label: string }[] = [
  { value: "high", label: "High (1.6-2.0g per kg body weight)" },
  { value: "very-high", label: "Very High (2.0-2.4g per kg body weight)" },
];

const weeklyLossTargets: { value: WeeklyWeightLossTarget; label: string }[] = [
  { value: "0.25kg", label: "0.25 kg per week (slow & steady)" },
  { value: "0.5kg", label: "0.5 kg per week (recommended)" },
  { value: "0.75kg", label: "0.75 kg per week (moderate)" },
  { value: "1kg", label: "1 kg per week (maximum safe rate)" },
];

const biologicalSexOptions: { value: BiologicalSexForCalc; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

interface MealPlannerWizardProps {
  audience: Audience;
  onComplete: (plan: MealPlan, familySize: FamilySize | undefined, goals: DietGoal[]) => void;
}

export default function MealPlannerWizard({
  audience,
  onComplete,
}: MealPlannerWizardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<MealPlanInputs>>({
    audience,
    likes: [],
    dislikes: [],
    cookingTime: "30min",
    preferredShops: ["Tesco", "Sainsbury's"],
    goals: ["general-wellness"],
    allergies: [],
    healthConditions: [],
    budgetPreference: "moderate",
  });

  const [likesInput, setLikesInput] = useState("");
  const [dislikesInput, setDislikesInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  
  // Family size state
  const [familySize, setFamilySize] = useState({
    adults: 2,
    childrenAges: {
      babies: 0,
      toddlers: 0,
      preschool: 0,
      schoolAge: 0,
    },
  });

  // Goal-specific data state
  const [muscleGainData, setMuscleGainData] = useState<MuscleGainData>({
    currentWeight: 70,
    targetWeight: undefined,
    activityLevel: "moderately-active",
    proteinTarget: "high",
    biologicalSex: "male",
  });

  const [weightLossData, setWeightLossData] = useState<WeightLossData>({
    currentWeight: 80,
    age: 35,
    height: 170,
    activityLevel: "moderately-active",
    targetWeeklyLoss: "0.5kg",
    biologicalSex: "female",
  });

  const [heartHealthData, setHeartHealthData] = useState<HeartHealthData>({
    currentCholesterol: "",
    familyHistoryHeartDisease: false,
  });

  // Helper to check if specific goals are selected
  const hasMuscleGainGoal = formData.goals?.includes("muscle-gain") || false;
  const hasWeightLossGoal = formData.goals?.includes("weight-loss") || false;
  const hasHeartHealthGoal = formData.goals?.includes("heart-health") || formData.goals?.includes("cholesterol-control") || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert comma-separated strings to arrays
      const likes = likesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const dislikes = dislikesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const allergies = allergiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Build goal-specific data based on selected goals
      const goalSpecificData: GoalSpecificData = {};
      if (hasMuscleGainGoal) {
        goalSpecificData.muscleGain = muscleGainData;
      }
      if (hasWeightLossGoal) {
        goalSpecificData.weightLoss = weightLossData;
      }
      if (hasHeartHealthGoal) {
        goalSpecificData.heartHealth = heartHealthData;
      }

      const inputs: MealPlanInputs = {
        audience,
        likes,
        dislikes,
        cookingTime: formData.cookingTime as CookingTime,
        preferredShops: formData.preferredShops as UKSupermarket[],
        goals: formData.goals as DietGoal[],
        allergies,
        healthConditions: formData.healthConditions,
        budgetPreference: formData.budgetPreference as BudgetPreference,
        familySize: audience === "family" || audience === "couples" ? familySize : undefined,
        goalSpecificData: Object.keys(goalSpecificData).length > 0 ? goalSpecificData : undefined,
      };

      const result = await generateMealPlan(inputs);

      if (result.success && result.data) {
        const effectiveFamilySize = audience === "family" || audience === "couples" ? familySize : undefined;
        onComplete(result.data, effectiveFamilySize, formData.goals as DietGoal[]);
      } else {
        setError(result.error || "Failed to generate meal plan");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl bg-white p-8 shadow-soft">
        <div>
          <h3 className="mb-6 text-2xl font-semibold text-charcoal">
            Your Meal Plan Preferences
          </h3>

          {/* Family Size (for family and couples audiences) */}
          {(audience === "family" || audience === "couples") && (
            <div className="mb-6 rounded-lg bg-sage/10 p-4">
              <h4 className="mb-4 font-medium text-charcoal">
                Family Size
              </h4>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-charcoal">
                  Number of adults
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={familySize.adults}
                  onChange={(e) =>
                    setFamilySize({
                      ...familySize,
                      adults: parseInt(e.target.value) || 1,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
                />
                <p className="mt-1 text-xs text-charcoal/50">Type a number or use ↑↓ arrows to adjust</p>
              </div>

              {audience === "family" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-charcoal">
                    Number of children by age
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">
                        Babies (0-1 years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={familySize.childrenAges.babies}
                        onChange={(e) =>
                          setFamilySize({
                            ...familySize,
                            childrenAges: {
                              ...familySize.childrenAges,
                              babies: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-full rounded-lg border border-sage/30 px-3 py-2 text-sm focus:border-sage focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">
                        Toddlers (1-3 years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={familySize.childrenAges.toddlers}
                        onChange={(e) =>
                          setFamilySize({
                            ...familySize,
                            childrenAges: {
                              ...familySize.childrenAges,
                              toddlers: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-full rounded-lg border border-sage/30 px-3 py-2 text-sm focus:border-sage focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">
                        Preschool (3-5 years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={familySize.childrenAges.preschool}
                        onChange={(e) =>
                          setFamilySize({
                            ...familySize,
                            childrenAges: {
                              ...familySize.childrenAges,
                              preschool: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-full rounded-lg border border-sage/30 px-3 py-2 text-sm focus:border-sage focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">
                        School Age (5+ years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={familySize.childrenAges.schoolAge}
                        onChange={(e) =>
                          setFamilySize({
                            ...familySize,
                            childrenAges: {
                              ...familySize.childrenAges,
                              schoolAge: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        className="w-full rounded-lg border border-sage/30 px-3 py-2 text-sm focus:border-sage focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Likes */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Foods you love (comma-separated)
            </label>
            <input
              type="text"
              value={likesInput}
              onChange={(e) => setLikesInput(e.target.value)}
              placeholder="e.g., pasta, chicken, broccoli, berries"
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
          </div>

          {/* Dislikes */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Foods you dislike (comma-separated)
            </label>
            <input
              type="text"
              value={dislikesInput}
              onChange={(e) => setDislikesInput(e.target.value)}
              placeholder="e.g., mushrooms, fish, spicy food"
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
          </div>

          {/* Cooking Time */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Available cooking time per meal
            </label>
            <select
              value={formData.cookingTime}
              onChange={(e) =>
                setFormData({ ...formData, cookingTime: e.target.value as CookingTime })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {cookingTimes.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          {/* Supermarkets */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Preferred supermarkets (select multiple)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {supermarkets.map((shop) => (
                <label
                  key={shop}
                  className="flex items-center gap-2 rounded-lg border border-sage/30 p-2 hover:bg-sage/5"
                >
                  <input
                    type="checkbox"
                    checked={formData.preferredShops?.includes(shop)}
                    onChange={(e) => {
                      const current = formData.preferredShops || [];
                      const updated = e.target.checked
                        ? [...current, shop]
                        : current.filter((s) => s !== shop);
                      setFormData({ ...formData, preferredShops: updated });
                    }}
                    className="text-sage focus:ring-sage"
                  />
                  <span className="text-sm">{shop}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Your health goals (select multiple)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((goal) => (
                <label
                  key={goal.value}
                  className="flex items-center gap-2 rounded-lg border border-sage/30 p-2 hover:bg-sage/5"
                >
                  <input
                    type="checkbox"
                    checked={formData.goals?.includes(goal.value)}
                    onChange={(e) => {
                      const current = formData.goals || [];
                      const updated = e.target.checked
                        ? [...current, goal.value]
                        : current.filter((g) => g !== goal.value);
                      setFormData({ ...formData, goals: updated });
                    }}
                    className="text-sage focus:ring-sage"
                  />
                  <span className="text-sm">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Muscle Gain Goal-Specific Questions */}
          {hasMuscleGainGoal && (
            <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h4 className="mb-4 font-medium text-charcoal flex items-center gap-2">
                Muscle Gain Details
                <span className="text-xs font-normal text-charcoal/60">(helps us calculate your protein needs)</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Biological sex
                  </label>
                  <select
                    value={muscleGainData.biologicalSex}
                    onChange={(e) => setMuscleGainData({
                      ...muscleGainData,
                      biologicalSex: e.target.value as BiologicalSexForCalc,
                    })}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {biologicalSexOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Current weight (kg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    value={muscleGainData.currentWeight}
                    onChange={(e) => setMuscleGainData({
                      ...muscleGainData,
                      currentWeight: parseFloat(e.target.value) || 70,
                    })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Target weight (kg) <span className="text-charcoal/50">optional</span>
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    value={muscleGainData.targetWeight || ""}
                    onChange={(e) => setMuscleGainData({
                      ...muscleGainData,
                      targetWeight: e.target.value ? parseFloat(e.target.value) : undefined,
                    })}
                    onFocus={(e) => e.target.select()}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Activity level
                  </label>
                  <select
                    value={muscleGainData.activityLevel}
                    onChange={(e) => setMuscleGainData({
                      ...muscleGainData,
                      activityLevel: e.target.value as ActivityLevel,
                    })}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Protein target
                  </label>
                  <select
                    value={muscleGainData.proteinTarget}
                    onChange={(e) => setMuscleGainData({
                      ...muscleGainData,
                      proteinTarget: e.target.value as ProteinTarget,
                    })}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {proteinTargets.map((target) => (
                      <option key={target.value} value={target.value}>{target.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="mt-3 text-xs text-blue-700">
                Based on your weight of {muscleGainData.currentWeight}kg and protein target, 
                we&apos;ll aim for approximately {Math.round(muscleGainData.currentWeight * (muscleGainData.proteinTarget === "high" ? 1.8 : 2.2))}g of protein per day.
              </p>
            </div>
          )}

          {/* Weight Loss Goal-Specific Questions */}
          {hasWeightLossGoal && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
              <h4 className="mb-4 font-medium text-charcoal flex items-center gap-2">
                Weight Loss Details
                <span className="text-xs font-normal text-charcoal/60">(helps us calculate your calorie needs)</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Biological sex
                  </label>
                  <select
                    value={weightLossData.biologicalSex}
                    onChange={(e) => setWeightLossData({
                      ...weightLossData,
                      biologicalSex: e.target.value as BiologicalSexForCalc,
                    })}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                  >
                    {biologicalSexOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    step="1"
                    value={weightLossData.age}
                    onChange={(e) => setWeightLossData({
                      ...weightLossData,
                      age: parseInt(e.target.value) || 35,
                    })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    step="1"
                    value={weightLossData.height}
                    onChange={(e) => setWeightLossData({
                      ...weightLossData,
                      height: parseInt(e.target.value) || 170,
                    })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Current weight (kg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    value={weightLossData.currentWeight}
                    onChange={(e) => setWeightLossData({
                      ...weightLossData,
                      currentWeight: parseFloat(e.target.value) || 80,
                    })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Activity level
                  </label>
                  <select
                    value={weightLossData.activityLevel}
                    onChange={(e) => setWeightLossData({
                      ...weightLossData,
                      activityLevel: e.target.value as ActivityLevel,
                    })}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                  >
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Target weekly weight loss
                  </label>
                  <select
                    value={weightLossData.targetWeeklyLoss}
                    onChange={(e) => setWeightLossData({
                      ...weightLossData,
                      targetWeeklyLoss: e.target.value as WeeklyWeightLossTarget,
                    })}
                    className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                  >
                    {weeklyLossTargets.map((target) => (
                      <option key={target.value} value={target.value}>{target.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="mt-3 text-xs text-green-700">
                We&apos;ll calculate your personalised daily calorie target based on your details to help you achieve safe, sustainable weight loss.
              </p>
            </div>
          )}

          {/* Heart Health / Cholesterol Goal-Specific Questions */}
          {hasHeartHealthGoal && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <h4 className="mb-4 font-medium text-charcoal flex items-center gap-2">
                Heart Health Details
                <span className="text-xs font-normal text-charcoal/60">(helps us optimise your plan)</span>
              </h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Current cholesterol level <span className="text-charcoal/50">optional</span>
                  </label>
                  <input
                    type="text"
                    value={heartHealthData.currentCholesterol || ""}
                    onChange={(e) => setHeartHealthData({
                      ...heartHealthData,
                      currentCholesterol: e.target.value || undefined,
                    })}
                    placeholder="e.g., 5.2 mmol/L"
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-charcoal/50">Found on recent blood test results</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Family history of heart disease?
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="familyHistory"
                        checked={heartHealthData.familyHistoryHeartDisease === true}
                        onChange={() => setHeartHealthData({
                          ...heartHealthData,
                          familyHistoryHeartDisease: true,
                        })}
                        className="text-red-500 focus:ring-red-400"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="familyHistory"
                        checked={heartHealthData.familyHistoryHeartDisease === false}
                        onChange={() => setHeartHealthData({
                          ...heartHealthData,
                          familyHistoryHeartDisease: false,
                        })}
                        className="text-red-500 focus:ring-red-400"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-red-700">
                Your meal plan will include saturated fat and cholesterol information for each meal, plus a heart health score (1-10) to help you make informed choices.
              </p>
            </div>
          )}

          {/* Allergies */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Allergies or restrictions (comma-separated)
            </label>
            <input
              type="text"
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              placeholder="e.g., dairy, gluten, nuts"
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
          </div>

          {/* Budget */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Budget preference
            </label>
            <select
              value={formData.budgetPreference}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  budgetPreference: e.target.value as BudgetPreference,
                })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-sage py-3 px-6 font-semibold text-white transition-all hover:bg-sage/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating your meal plan...
            </>
          ) : (
            "Generate Meal Plan"
          )}
        </button>

        <p className="text-center text-xs text-charcoal/60">
          This typically takes approximately 1 minute to generate a personalized plan
        </p>
      </form>
    </div>
  );
}

