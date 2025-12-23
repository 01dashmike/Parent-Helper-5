"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { generateSupplementSuggestions } from "@/lib/wellness/actions";
import type {
  Audience,
  SupplementResult,
  SupplementInputs,
  AgeRange,
  BiologicalSex,
  SupplementGoal,
  DietType,
  BudgetPreference,
} from "@/lib/wellness/types";

const ageRanges: { value: AgeRange; label: string }[] = [
  { value: "18-30", label: "18-30 years" },
  { value: "31-45", label: "31-45 years" },
  { value: "46-60", label: "46-60 years" },
  { value: "60+", label: "60+ years" },
];

const sexOptions: { value: BiologicalSex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const goals: { value: SupplementGoal; label: string }[] = [
  { value: "energy", label: "More Energy" },
  { value: "sleep", label: "Better Sleep" },
  { value: "immunity", label: "Immune Support" },
  { value: "joint-health", label: "Joint Health" },
  { value: "mental-clarity", label: "Mental Clarity" },
  { value: "stress-management", label: "Stress Management" },
  { value: "prenatal", label: "Prenatal Support" },
  { value: "postnatal", label: "Postnatal Support" },
  { value: "bone-health", label: "Bone Health" },
  { value: "heart-health", label: "Heart Health" },
];

const dietTypes: { value: DietType; label: string }[] = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
];

const budgetOptions: { value: BudgetPreference; label: string }[] = [
  { value: "budget-friendly", label: "Budget-Friendly" },
  { value: "moderate", label: "Moderate" },
  { value: "premium", label: "Premium" },
];

interface SupplementWizardProps {
  audience: Audience;
  onComplete: (result: SupplementResult) => void;
}

export default function SupplementWizard({
  audience,
  onComplete,
}: SupplementWizardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SupplementInputs>>({
    audience,
    ageRange: "31-45",
    biologicalSex: "prefer-not-to-say",
    goals: [],
    healthConditions: [],
    currentMedications: [],
    dietType: "omnivore",
    budgetPreference: "moderate",
  });

  const [healthConditionsInput, setHealthConditionsInput] = useState("");
  const [medicationsInput, setMedicationsInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const healthConditions = healthConditionsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const currentMedications = medicationsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const inputs: SupplementInputs = {
        audience,
        ageRange: formData.ageRange as AgeRange,
        biologicalSex: formData.biologicalSex as BiologicalSex,
        goals: formData.goals as SupplementGoal[],
        healthConditions,
        currentMedications,
        dietType: formData.dietType as DietType,
        budgetPreference: formData.budgetPreference as BudgetPreference,
      };

      const result = await generateSupplementSuggestions(inputs);

      if (result.success && result.data) {
        onComplete(result.data);
      } else {
        setError(result.error || "Failed to generate supplement suggestions");
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
            Your Health Profile
          </h3>

          {/* Age Range */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Age range
            </label>
            <select
              value={formData.ageRange}
              onChange={(e) =>
                setFormData({ ...formData, ageRange: e.target.value as AgeRange })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {ageRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Biological Sex */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Biological sex
            </label>
            <select
              value={formData.biologicalSex}
              onChange={(e) =>
                setFormData({ ...formData, biologicalSex: e.target.value as BiologicalSex })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {sexOptions.map((sex) => (
                <option key={sex.value} value={sex.value}>
                  {sex.label}
                </option>
              ))}
            </select>
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

          {/* Health Conditions */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Any health conditions? (comma-separated, optional)
            </label>
            <input
              type="text"
              value={healthConditionsInput}
              onChange={(e) => setHealthConditionsInput(e.target.value)}
              placeholder="e.g., diabetes, high blood pressure"
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
          </div>

          {/* Current Medications */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Current medications? (comma-separated, optional)
            </label>
            <input
              type="text"
              value={medicationsInput}
              onChange={(e) => setMedicationsInput(e.target.value)}
              placeholder="e.g., statins, blood thinners"
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
            <p className="mt-1 text-xs text-charcoal/60">
              We'll check for potential interactions
            </p>
          </div>

          {/* Diet Type */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Diet type
            </label>
            <select
              value={formData.dietType}
              onChange={(e) =>
                setFormData({ ...formData, dietType: e.target.value as DietType })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {dietTypes.map((diet) => (
                <option key={diet.value} value={diet.value}>
                  {diet.label}
                </option>
              ))}
            </select>
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

        <div className="rounded-lg bg-terracotta/10 p-4 text-sm text-charcoal/90">
          <strong>Reminder:</strong> Consult your GP before starting any new supplements
        </div>

        <button
          type="submit"
          disabled={loading || (formData.goals?.length || 0) === 0}
          className="w-full rounded-full bg-sage py-3 px-6 font-semibold text-white transition-all hover:bg-sage/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating suggestions...
            </>
          ) : (
            "💊 Get Supplement Suggestions"
          )}
        </button>
      </form>
    </div>
  );
}

