"use client";

import { useState } from "react";
import MealPlannerWizard from "./MealPlannerWizard";
import SnackGenerator from "./SnackGenerator";
import MealPlanResults from "./MealPlanResults";
import type { Audience, MealPlan, SnackGeneratorResult, FamilySize, DietGoal } from "@/lib/wellness/types";

interface MealPlannerClientProps {
  audience: Audience;
}

interface MealPlanData {
  plan: MealPlan;
  familySize?: FamilySize;
  goals: DietGoal[];
}

export default function MealPlannerClient({ audience }: MealPlannerClientProps) {
  const [activeTab, setActiveTab] = useState<"meal-plan" | "snacks">("meal-plan");
  const [mealPlanData, setMealPlanData] = useState<MealPlanData | null>(null);
  const [snackResult, setSnackResult] = useState<SnackGeneratorResult | null>(null);

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab("meal-plan")}
          className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
            activeTab === "meal-plan"
              ? "bg-sage text-white shadow-md"
              : "bg-white text-charcoal hover:bg-sage/10"
          }`}
        >
          Meal Planner
        </button>
        <button
          onClick={() => setActiveTab("snacks")}
          className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
            activeTab === "snacks"
              ? "bg-sage text-white shadow-md"
              : "bg-white text-charcoal hover:bg-sage/10"
          }`}
        >
          🍪 Snack Generator
        </button>
      </div>

      {/* Content */}
      {activeTab === "meal-plan" && (
        <div>
          {!mealPlanData ? (
            <MealPlannerWizard
              audience={audience}
              onComplete={(plan, familySize, goals) => setMealPlanData({ plan, familySize, goals })}
            />
          ) : (
            <MealPlanResults
              mealPlan={mealPlanData.plan}
              audience={audience}
              familySize={mealPlanData.familySize}
              goals={mealPlanData.goals}
              onStartOver={() => setMealPlanData(null)}
            />
          )}
        </div>
      )}

      {activeTab === "snacks" && (
        <SnackGenerator
          audience={audience}
          onComplete={(result) => setSnackResult(result)}
          result={snackResult}
        />
      )}
    </div>
  );
}

