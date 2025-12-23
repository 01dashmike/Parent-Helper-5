"use client";

import { useState } from "react";
import Link from "next/link";
import type { NutritionPlanResult, NutritionWizardInputs } from "./NutritionWizard";

interface NutritionResultsProps {
  result: NutritionPlanResult;
  inputs: NutritionWizardInputs;
  onStartOver: () => void;
}

export default function NutritionResults({
  result,
  inputs,
  onStartOver,
}: NutritionResultsProps) {
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "meals" | "foods" | "tips">("overview");

  const getStageLabel = () => {
    if (inputs.journeyStage === "prenatal") {
      const trimesterLabels = {
        first: "First Trimester",
        second: "Second Trimester",
        third: "Third Trimester",
      };
      return inputs.trimester ? trimesterLabels[inputs.trimester] : "Pregnancy";
    }
    
    if (inputs.feedingMethod === "breastfeeding") return "Breastfeeding";
    if (inputs.feedingMethod === "formula") return "Formula Feeding";
    if (inputs.feedingMethod === "combination") return "Combination Feeding";
    
    const weaningLabels = {
      "not-started": "Pre-Weaning",
      "early-weaning": "Early Weaning (6-9 months)",
      "established": "Established Weaning (9-12 months)",
      "toddler-meals": "Toddler Meals (12+ months)",
    };
    return inputs.weaningStage ? weaningLabels[inputs.weaningStage] : "Baby Feeding";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-sage to-sage/80 p-6 text-white shadow-soft md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium mb-2">
              {getStageLabel()}
            </span>
            <h2 className="text-2xl font-bold md:text-3xl">
              Your Personalised Nutrition Plan
            </h2>
            <p className="mt-2 text-white/90">
              {result.overview}
            </p>
          </div>
          <button
            onClick={onStartOver}
            className="shrink-0 rounded-full border-2 border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: "overview", label: "Key Nutrients", icon: "🥗" },
          { id: "meals", label: "Meal Ideas", icon: "🍽️" },
          { id: "foods", label: "Food Guide", icon: "📋" },
          { id: "tips", label: "Tips & Safety", icon: "💡" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-sage text-white shadow-md"
                : "bg-white text-charcoal hover:bg-sage/10"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-white p-6 shadow-soft md:p-8">
        {/* Key Nutrients Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-charcoal">
              Key Nutrients for {getStageLabel()}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {result.keyNutrients.map((nutrient, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-sage/20 bg-sage/5 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-charcoal">{nutrient.name}</h4>
                    {nutrient.dailyTarget && (
                      <span className="shrink-0 rounded-full bg-sage/20 px-2 py-1 text-xs font-medium text-sage">
                        {nutrient.dailyTarget}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal/70 mb-3">{nutrient.importance}</p>
                  <div>
                    <p className="text-xs font-medium text-charcoal/60 mb-1">Good sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {nutrient.foodSources.map((source, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-white px-2 py-1 text-xs text-charcoal/80"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meal Ideas Tab */}
        {activeTab === "meals" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-charcoal">
              Meal Ideas for You
            </h3>
            
            {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
              const mealsOfType = result.mealIdeas.filter((m) => m.mealType === mealType);
              if (mealsOfType.length === 0) return null;
              
              return (
                <div key={mealType} className="space-y-3">
                  <h4 className="font-medium text-charcoal capitalize flex items-center gap-2">
                    {mealType === "breakfast" && "🌅"}
                    {mealType === "lunch" && "☀️"}
                    {mealType === "dinner" && "🌙"}
                    {mealType === "snack" && "🍎"}
                    {mealType}
                  </h4>
                  
                  <div className="space-y-3">
                    {mealsOfType.map((meal, index) => {
                      const globalIndex = result.mealIdeas.indexOf(meal);
                      const isExpanded = expandedMeal === globalIndex;
                      
                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-sage/20 overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedMeal(isExpanded ? null : globalIndex)}
                            className="w-full p-4 text-left hover:bg-sage/5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h5 className="font-semibold text-charcoal">{meal.name}</h5>
                                <p className="mt-1 text-sm text-charcoal/70">{meal.description}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="rounded-full bg-sage/10 px-2 py-1 text-xs text-sage">
                                    ⏱️ {meal.prepTime}
                                  </span>
                                  {meal.nutrients.slice(0, 3).map((nutrient, i) => (
                                    <span
                                      key={i}
                                      className="rounded-full bg-terracotta/10 px-2 py-1 text-xs text-terracotta"
                                    >
                                      {nutrient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span
                                className={`text-sage transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              >
                                ▼
                              </span>
                            </div>
                          </button>
                          
                          {isExpanded && meal.safetyNotes && meal.safetyNotes.length > 0 && (
                            <div className="border-t border-sage/10 bg-amber-50 p-4">
                              <p className="text-xs font-medium text-amber-800 mb-2">⚠️ Safety Notes</p>
                              <ul className="text-xs text-amber-700 space-y-1">
                                {meal.safetyNotes.map((note, i) => (
                                  <li key={i}>• {note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Food Guide Tab */}
        {activeTab === "foods" && (
          <div className="space-y-8">
            {/* Foods to Enjoy */}
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Foods to Enjoy
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.foodsToEnjoy.map((food, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-green-200 bg-green-50 p-3"
                  >
                    <h4 className="font-medium text-charcoal">{food.name}</h4>
                    <p className="text-sm text-charcoal/70 mt-1">{food.benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Foods to Avoid */}
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                <span className="text-red-500">✗</span>
                Foods to Avoid or Limit
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.foodsToAvoid.map((food, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <h4 className="font-medium text-charcoal">{food.name}</h4>
                    <p className="text-sm text-charcoal/70 mt-1">{food.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips & Safety Tab */}
        {activeTab === "tips" && (
          <div className="space-y-8">
            {/* Tips */}
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-4">
                💡 Helpful Tips
              </h3>
              <div className="space-y-3">
                {result.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg bg-sage/5 p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-charcoal/80">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Reminders */}
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-4">
                ⚠️ Important Safety Reminders
              </h3>
              <div className="space-y-3">
                {result.safetyReminders.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-terracotta mt-0.5 text-lg">⚠️</span>
                      <div>
                        <p className="font-medium text-charcoal">{item.reminder}</p>
                        <p className="mt-2 text-sm text-charcoal/70 bg-white/50 rounded-lg p-3">
                          <span className="font-medium text-terracotta">Why? </span>
                          {item.why}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User's Inputs Summary */}
      <div className="rounded-2xl bg-sage/5 p-6">
        <h3 className="font-semibold text-charcoal mb-4">Your Profile Summary</h3>
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-charcoal/60">Stage:</span>
            <span className="ml-2 font-medium">{getStageLabel()}</span>
          </div>
          {inputs.allergies.length > 0 && (
            <div>
              <span className="text-charcoal/60">Allergies:</span>
              <span className="ml-2 font-medium">{inputs.allergies.join(", ")}</span>
            </div>
          )}
          {inputs.dietaryRestrictions.length > 0 && (
            <div>
              <span className="text-charcoal/60">Diet:</span>
              <span className="ml-2 font-medium">{inputs.dietaryRestrictions.join(", ")}</span>
            </div>
          )}
          <div>
            <span className="text-charcoal/60">Cooking time:</span>
            <span className="ml-2 font-medium">{inputs.cookingTime}</span>
          </div>
          <div>
            <span className="text-charcoal/60">Budget:</span>
            <span className="ml-2 font-medium capitalize">{inputs.budgetPreference.replace("-", " ")}</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-sage/30 bg-sage/5 p-6">
        <h3 className="mb-2 font-semibold text-charcoal">
          Health Information Disclaimer
        </h3>
        <p className="text-sm leading-relaxed text-charcoal/70">
          This nutrition plan is for general guidance only and should not replace professional medical advice. 
          Always consult your midwife, health visitor, GP, or a registered dietitian before making significant 
          changes to your diet or your baby&apos;s feeding routine. If you have any concerns about your health 
          or your baby&apos;s health, seek medical advice promptly.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <button
          onClick={() => window.print()}
          className="rounded-full border border-sage px-6 py-2 font-medium text-sage hover:bg-sage/10"
        >
          🖨️ Print Plan
        </button>
        <button
          onClick={onStartOver}
          className="rounded-full bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90"
        >
          Generate New Plan
        </button>
        <Link
          href="/wellness"
          className="rounded-full bg-charcoal/10 px-6 py-2 font-medium text-charcoal hover:bg-charcoal/20"
        >
          ← Back to Wellness
        </Link>
      </div>
    </div>
  );
}

