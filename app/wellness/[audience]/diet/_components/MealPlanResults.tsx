"use client";

import { useState, useEffect, useMemo } from "react";
import ShoppingList from "./ShoppingList";
import NutritionBreakdownComponent from "./NutritionBreakdown";
import type { Audience, MealPlan, DayMealPlan, FamilySize, DietGoal, NutritionBreakdown, Recipe, SnackInfo } from "@/lib/wellness/types";
import { calculateFamilyNutrition, calculateSingleAdultNutrition } from "@/lib/wellness/nutrition";
import { getCurrentUserEmail } from "@/lib/wellness/auth";

// Helper component for displaying nutrition info with heart health score
function NutritionBadges({ recipe, showHeartHealth }: { recipe: Recipe; showHeartHealth: boolean }) {
  if (!recipe.nutritionInfo) return null;
  
  const { calories, protein, saturatedFat, cholesterol } = recipe.nutritionInfo;
  
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {calories && (
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
          {calories}
        </span>
      )}
      {protein && (
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {protein} protein
        </span>
      )}
      {showHeartHealth && saturatedFat && (
        <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
          🧈 {saturatedFat} sat. fat
        </span>
      )}
      {showHeartHealth && cholesterol && (
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
          🥚 {cholesterol} cholesterol
        </span>
      )}
      {showHeartHealth && recipe.heartHealthScore && (
        <HeartHealthScoreBadge score={recipe.heartHealthScore} />
      )}
    </div>
  );
}

// Heart health score badge with colour coding
function HeartHealthScoreBadge({ score }: { score: number }) {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let label = "Heart Score";
  
  if (score >= 9) {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    label = "Excellent";
  } else if (score >= 7) {
    bgColor = "bg-lime-100";
    textColor = "text-lime-800";
    label = "Very Good";
  } else if (score >= 5) {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-800";
    label = "Good";
  } else if (score >= 3) {
    bgColor = "bg-orange-100";
    textColor = "text-orange-800";
    label = "Fair";
  } else {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    label = "Limit";
  }
  
  return (
    <span className={`rounded-full ${bgColor} px-2 py-1 text-xs font-medium ${textColor}`}>
      {score}/10 ({label})
    </span>
  );
}

// Helper to check if snacks are SnackInfo objects or simple strings
function isSnackInfo(snack: string | SnackInfo): snack is SnackInfo {
  return typeof snack === "object" && snack !== null && "name" in snack;
}

interface MealPlanResultsProps {
  mealPlan: MealPlan;
  audience: Audience;
  familySize?: FamilySize;
  goals: DietGoal[];
  onStartOver: () => void;
}

export default function MealPlanResults({
  mealPlan,
  audience,
  familySize,
  goals,
  onStartOver,
}: MealPlanResultsProps) {
  const [selectedDay, setSelectedDay] = useState<DayMealPlan | null>(
    mealPlan.weekPlan[0]
  );
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  // Check if heart health goals are selected (for displaying saturated fat, cholesterol, heart scores)
  const showHeartHealth = goals.includes("heart-health") || goals.includes("cholesterol-control");

  // Calculate nutrition breakdown
  const nutritionBreakdown = useMemo<NutritionBreakdown | null>(() => {
    if (familySize) {
      return calculateFamilyNutrition({
        familySize,
        goals,
        activityLevel: "moderately-active",
      });
    }
    // For single person, create a simple breakdown
    const singlePerson = calculateSingleAdultNutrition(goals);
    return {
      people: [singlePerson],
      totalDailyCalories: singlePerson.dailyCalories,
      totalMacros: singlePerson.macros,
      disclaimer: "These are estimated guidelines based on NHS/WHO recommendations. " +
        "Individual needs vary based on height, weight, metabolism, and health conditions. " +
        "Consult a registered dietitian or GP for personalised advice.",
    };
  }, [familySize, goals]);

  // Scroll to top when meal plan results are shown
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleEmailPlan = async () => {
    // Get user email if logged in, otherwise show input
    setShowEmailInput(true);
  };

  const sendEmail = async (email: string) => {
    setEmailStatus("sending");
    
    try {
      const response = await fetch("/api/wellness/email-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          planType: "meal",
          audience,
          planData: mealPlan,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setEmailStatus("success");
      setTimeout(() => {
        setEmailStatus("idle");
        setShowEmailInput(false);
      }, 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput) return;
    await sendEmail(emailInput);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft">
        <div>
          <h3 className="text-2xl font-semibold text-charcoal">
            Your 7-Day Meal Plan
          </h3>
          <p className="mt-1 text-sm text-charcoal/70">
            Estimated weekly cost: £{mealPlan.estimatedCost.min} - £
            {mealPlan.estimatedCost.max}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowNutrition(!showNutrition)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              showNutrition
                ? "bg-terracotta text-white"
                : "bg-terracotta/10 text-terracotta hover:bg-terracotta/20"
            }`}
          >
            {showNutrition ? "📊 Hide Calories" : "📊 Show Calories"}
          </button>
          <button
            onClick={handleEmailPlan}
            disabled={emailStatus === "sending"}
            className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage/90 disabled:opacity-50"
          >
            {emailStatus === "sending" ? "Sending..." : emailStatus === "success" ? "✓ Sent!" : "📧 Email Plan"}
          </button>
          <button
            onClick={handlePrint}
            className="rounded-full bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20"
          >
            Print Plan
          </button>
          <button
            onClick={onStartOver}
            className="rounded-full bg-charcoal/10 px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/20"
          >
            ↻ Start Over
          </button>
        </div>
      </div>

      {/* Nutrition Breakdown (shown when toggled) */}
      {showNutrition && nutritionBreakdown && (
        <NutritionBreakdownComponent nutrition={nutritionBreakdown} />
      )}

      {/* Email Input Modal */}
      {showEmailInput && emailStatus !== "success" && (
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            Email Your Meal Plan
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
            <button
              onClick={handleSendEmail}
              disabled={!emailInput || emailStatus === "sending"}
              className="rounded-lg bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90 disabled:opacity-50"
            >
              {emailStatus === "sending" ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setShowEmailInput(false)}
              className="rounded-lg bg-charcoal/10 px-4 py-2 font-medium text-charcoal hover:bg-charcoal/20"
            >
              Cancel
            </button>
          </div>
          {emailStatus === "error" && (
            <p className="mt-2 text-sm text-red-600">
              Failed to send email. Please try again.
            </p>
          )}
        </div>
      )}

      {/* Day Selector */}
      <div className="hide-on-print overflow-x-auto">
        <div className="flex gap-2">
          {mealPlan.weekPlan.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedDay?.day === day.day
                  ? "bg-sage text-white shadow-md"
                  : "bg-white text-charcoal hover:bg-sage/10"
              }`}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Meals */}
      {selectedDay && (
        <div className="space-y-6">
          {/* Breakfast */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                Breakfast: {selectedDay.breakfast.name}
              </h4>
              {showHeartHealth && selectedDay.breakfast.heartHealthScore && (
                <HeartHealthScoreBadge score={selectedDay.breakfast.heartHealthScore} />
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h5 className="mb-2 font-medium text-charcoal">Ingredients:</h5>
                <ul className="space-y-1 text-sm text-charcoal/80">
                  {selectedDay.breakfast.ingredients.map((ingredient, i) => (
                    <li key={i}>• {ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mb-2 font-medium text-charcoal">Method:</h5>
                <ol className="space-y-1 text-sm text-charcoal/80">
                  {selectedDay.breakfast.method.map((step, i) => (
                    <li key={i}>
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-charcoal/60">
              <span>Prep: {selectedDay.breakfast.prepTime}</span>
              <span>Cook: {selectedDay.breakfast.cookTime}</span>
              <span>Servings: {selectedDay.breakfast.servings}</span>
            </div>
            <NutritionBadges recipe={selectedDay.breakfast} showHeartHealth={showHeartHealth} />
          </div>

          {/* Lunch */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                Lunch: {selectedDay.lunch.name}
              </h4>
              {showHeartHealth && selectedDay.lunch.heartHealthScore && (
                <HeartHealthScoreBadge score={selectedDay.lunch.heartHealthScore} />
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h5 className="mb-2 font-medium text-charcoal">Ingredients:</h5>
                <ul className="space-y-1 text-sm text-charcoal/80">
                  {selectedDay.lunch.ingredients.map((ingredient, i) => (
                    <li key={i}>• {ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mb-2 font-medium text-charcoal">Method:</h5>
                <ol className="space-y-1 text-sm text-charcoal/80">
                  {selectedDay.lunch.method.map((step, i) => (
                    <li key={i}>
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-charcoal/60">
              <span>Prep: {selectedDay.lunch.prepTime}</span>
              <span>Cook: {selectedDay.lunch.cookTime}</span>
              <span>Servings: {selectedDay.lunch.servings}</span>
            </div>
            <NutritionBadges recipe={selectedDay.lunch} showHeartHealth={showHeartHealth} />
          </div>

          {/* Dinner */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                Dinner: {selectedDay.dinner.name}
              </h4>
              {showHeartHealth && selectedDay.dinner.heartHealthScore && (
                <HeartHealthScoreBadge score={selectedDay.dinner.heartHealthScore} />
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h5 className="mb-2 font-medium text-charcoal">Ingredients:</h5>
                <ul className="space-y-1 text-sm text-charcoal/80">
                  {selectedDay.dinner.ingredients.map((ingredient, i) => (
                    <li key={i}>• {ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mb-2 font-medium text-charcoal">Method:</h5>
                <ol className="space-y-1 text-sm text-charcoal/80">
                  {selectedDay.dinner.method.map((step, i) => (
                    <li key={i}>
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-charcoal/60">
              <span>Prep: {selectedDay.dinner.prepTime}</span>
              <span>Cook: {selectedDay.dinner.cookTime}</span>
              <span>Servings: {selectedDay.dinner.servings}</span>
            </div>
            <NutritionBadges recipe={selectedDay.dinner} showHeartHealth={showHeartHealth} />
          </div>

          {/* Snacks */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              🍪 Snack Options
            </h4>
            <ul className="space-y-3">
              {selectedDay.snacks.map((snack, i) => {
                // Handle both string and SnackInfo formats
                if (isSnackInfo(snack)) {
                  return (
                    <li key={i} className="rounded-lg bg-cream/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-charcoal">• {snack.name}</span>
                        {showHeartHealth && snack.heartHealthScore && (
                          <HeartHealthScoreBadge score={snack.heartHealthScore} />
                        )}
                      </div>
                      {snack.nutritionInfo && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {snack.nutritionInfo.calories && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              🔥 {snack.nutritionInfo.calories}
                            </span>
                          )}
                          {snack.nutritionInfo.protein && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              {snack.nutritionInfo.protein}
                            </span>
                          )}
                          {showHeartHealth && snack.nutritionInfo.saturatedFat && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                              🧈 {snack.nutritionInfo.saturatedFat}
                            </span>
                          )}
                          {showHeartHealth && snack.nutritionInfo.cholesterol && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                              🥚 {snack.nutritionInfo.cholesterol}
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                }
                // Simple string format
                return (
                  <li key={i} className="text-sm text-charcoal/80">• {snack}</li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Shopping List */}
      <ShoppingList shoppingList={mealPlan.shoppingList} />

      {/* Tips */}
      {mealPlan.tips && mealPlan.tips.length > 0 && (
        <div className="rounded-2xl bg-sage/10 p-6">
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            💡 Helpful Tips
          </h4>
          <ul className="space-y-2 text-sm text-charcoal/80">
            {mealPlan.tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Nutrition Callout - Show for mums/couples or families with babies */}
      <NutritionCallout audience={audience} familySize={familySize} />
    </div>
  );
}

// Nutrition callout component for pregnancy/baby nutrition guidance
function NutritionCallout({ 
  audience, 
  familySize 
}: { 
  audience: Audience; 
  familySize?: FamilySize;
}) {
  // Show callout if:
  // 1. Audience is mum or couples (may be pregnant/breastfeeding)
  // 2. Family has babies (0-1 years)
  const hasBabies = familySize?.childrenAges?.babies && familySize.childrenAges.babies > 0;
  const hasToddlers = familySize?.childrenAges?.toddlers && familySize.childrenAges.toddlers > 0;
  const isRelevantAudience = audience === "mum" || audience === "couples";

  if (!hasBabies && !hasToddlers && !isRelevantAudience) {
    return null;
  }

  // Determine the most relevant stage to link to
  let suggestedStage = "pregnancy";
  let calloutMessage = "Expecting or feeding a baby?";
  let calloutDescription = "See nutrition guidance for pregnancy, breastfeeding, and weaning.";

  if (hasBabies) {
    suggestedStage = "weaning";
    calloutMessage = "Have a baby?";
    calloutDescription = "Explore first foods, batch cooking tips, and safe weaning guidance.";
  } else if (hasToddlers) {
    suggestedStage = "weaning";
    calloutMessage = "Feeding a toddler?";
    calloutDescription = "Find age-appropriate meal ideas and nutrition tips for your little one.";
  } else if (audience === "mum") {
    suggestedStage = "pregnancy";
    calloutMessage = "Pregnant or breastfeeding?";
    calloutDescription = "Get NHS-aligned nutrition guidance for every stage of your journey.";
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-terracotta/10 via-sage/5 to-cream border border-sage/20 p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <span className="text-3xl" aria-hidden="true">🍼</span>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-charcoal">
            {calloutMessage}
          </h4>
          <p className="mt-1 text-sm text-charcoal/70">
            {calloutDescription}
          </p>
          <a
            href={`/health-wellness/nutrition?stage=${suggestedStage}`}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage/90 transition-colors"
          >
            Explore Nutrition Guide
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
