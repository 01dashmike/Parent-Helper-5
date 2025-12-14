"use client";

import { useState } from "react";
import { generateExercisePlan } from "@/lib/wellness/actions";
import { Info } from "lucide-react";
import type {
  Audience,
  ExercisePlan,
  ExercisePlanInputs,
  ExerciseLocation,
  FitnessLevel,
  ExerciseGoal,
  ExerciseTime,
} from "@/lib/wellness/types";

const locations: { value: ExerciseLocation; label: string }[] = [
  { value: "home-bodyweight", label: "Home (bodyweight only)" },
  { value: "home-with-equipment", label: "Home (with equipment)" },
  { value: "gym", label: "Gym" },
];

const fitnessLevels: { value: FitnessLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const goals: { value: ExerciseGoal; label: string; info?: string }[] = [
  { value: "strength", label: "Build Strength" },
  { value: "weight-loss", label: "Weight Loss" },
  { 
    value: "recomposition", 
    label: "Recomposition",
    info: "Body recomposition means simultaneously losing fat whilst building muscle, changing your body composition rather than just losing weight. This requires a combination of strength training and appropriate nutrition."
  },
  { value: "flexibility", label: "Flexibility" },
  { value: "energy", label: "More Energy" },
  { value: "stress-relief", label: "Stress Relief" },
  { value: "postnatal-recovery", label: "Postnatal Recovery" },
  { value: "general-fitness", label: "General Fitness" },
];

const times: { value: ExerciseTime; label: string }[] = [
  { value: "15min", label: "15 minutes" },
  { value: "30min", label: "30 minutes" },
  { value: "45min", label: "45 minutes" },
  { value: "1hr", label: "1 hour" },
];

const commonEquipment = [
  "Dumbbells",
  "Resistance bands",
  "Yoga mat",
  "Exercise ball",
  "Kettlebell",
  "Pull-up bar",
  "Jump rope",
  "Foam roller",
];

interface ExerciseWizardProps {
  audience: Audience;
  onComplete: (plan: ExercisePlan) => void;
}

export default function ExerciseWizard({
  audience,
  onComplete,
}: ExerciseWizardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ExercisePlanInputs>>({
    audience,
    location: "home-bodyweight",
    equipment: [],
    fitnessLevel: "beginner",
    goals: ["general-fitness"],
    timePerSession: "30min",
    daysPerWeek: 3,
    injuries: [],
  });

  const [injuriesInput, setInjuriesInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const injuries = injuriesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const inputs: ExercisePlanInputs = {
        audience,
        location: formData.location as ExerciseLocation,
        equipment: formData.equipment || [],
        fitnessLevel: formData.fitnessLevel as FitnessLevel,
        goals: formData.goals as ExerciseGoal[],
        timePerSession: formData.timePerSession as ExerciseTime,
        daysPerWeek: formData.daysPerWeek || 3,
        injuries,
      };

      const result = await generateExercisePlan(inputs);

      if (result.success && result.data) {
        onComplete(result.data);
      } else {
        setError(result.error || "Failed to generate exercise plan");
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
            Your Exercise Preferences
          </h3>

          {/* Location */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Where will you exercise?
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value as ExerciseLocation })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment (if home-with-equipment or gym) */}
          {(formData.location === "home-with-equipment" || formData.location === "gym") && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-charcoal">
                Available equipment (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {commonEquipment.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-sage/30 p-2 hover:bg-sage/5"
                  >
                    <input
                      type="checkbox"
                      checked={formData.equipment?.includes(item)}
                      onChange={(e) => {
                        const current = formData.equipment || [];
                        const updated = e.target.checked
                          ? [...current, item]
                          : current.filter((i) => i !== item);
                        setFormData({ ...formData, equipment: updated });
                      }}
                      className="text-sage focus:ring-sage"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fitness Level */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Current fitness level
            </label>
            <select
              value={formData.fitnessLevel}
              onChange={(e) =>
                setFormData({ ...formData, fitnessLevel: e.target.value as FitnessLevel })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {fitnessLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Goals */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Your fitness goals (select multiple)
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
                  {goal.info && (
                    <div className="group relative">
                      <Info className="h-4 w-4 text-sage/60 cursor-help" />
                      <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-64 rounded-lg bg-charcoal p-3 text-xs text-white shadow-lg">
                        {goal.info}
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Time per session */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Time per session
            </label>
            <select
              value={formData.timePerSession}
              onChange={(e) =>
                setFormData({ ...formData, timePerSession: e.target.value as ExerciseTime })
              }
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            >
              {times.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          {/* Days per week */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Days per week: {formData.daysPerWeek}
            </label>
            <input
              type="range"
              min="2"
              max="7"
              value={formData.daysPerWeek}
              onChange={(e) =>
                setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-charcoal/60">
              <span>2 days</span>
              <span>7 days</span>
            </div>
          </div>

          {/* Injuries */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Any injuries or limitations? (comma-separated)
            </label>
            <input
              type="text"
              value={injuriesInput}
              onChange={(e) => setInjuriesInput(e.target.value)}
              placeholder="e.g., knee pain, lower back, shoulder"
              className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
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
{loading ? "Creating your workout plan..." : "💪 Generate Exercise Plan"}
        </button>

        <p className="text-center text-xs text-charcoal/60">
          Always consult your GP before starting a new exercise program, especially if you have health concerns
        </p>
      </form>
    </div>
  );
}
