"use client";

import { useState } from "react";
import { generateMealPlan } from "@/lib/wellness/actions";
import type {
  Audience,
  MealPlan,
  MealPlanInputs,
  CookingTime,
  UKSupermarket,
  DietGoal,
  BudgetPreference,
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

interface MealPlannerWizardProps {
  audience: Audience;
  onComplete: (plan: MealPlan) => void;
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
      };

      const result = await generateMealPlan(inputs);

      if (result.success && result.data) {
        onComplete(result.data);
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
                👨‍👩‍👧‍👦 Family Size
              </h4>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-charcoal">
                  Number of adults
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={familySize.adults}
                  onChange={(e) =>
                    setFamilySize({
                      ...familySize,
                      adults: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
                />
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
          className="w-full rounded-full bg-sage py-3 px-6 font-semibold text-white transition-all hover:bg-sage/90 disabled:opacity-50"
        >
{loading ? "Generating your meal plan..." : "🥗 Generate Meal Plan"}
        </button>

        <p className="text-center text-xs text-charcoal/60">
          This typically takes 10-15 seconds to generate a personalized plan
        </p>
      </form>
    </div>
  );
}
