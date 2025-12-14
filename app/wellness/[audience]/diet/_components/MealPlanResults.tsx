"use client";

import { useState } from "react";
import ShoppingList from "./ShoppingList";
import type { Audience, MealPlan, DayMealPlan } from "@/lib/wellness/types";
import { getCurrentUserEmail } from "@/lib/wellness/auth";

interface MealPlanResultsProps {
  mealPlan: MealPlan;
  audience: Audience;
  onStartOver: () => void;
}

export default function MealPlanResults({
  mealPlan,
  audience,
  onStartOver,
}: MealPlanResultsProps) {
  const [selectedDay, setSelectedDay] = useState<DayMealPlan | null>(
    mealPlan.weekPlan[0]
  );
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

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
        <div className="flex gap-2">
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
            🖨️ Print Plan
          </button>
          <button
            onClick={onStartOver}
            className="rounded-full bg-charcoal/10 px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/20"
          >
            ↻ Start Over
          </button>
        </div>
      </div>

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
      </div>

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
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              🍳 Breakfast: {selectedDay.breakfast.name}
            </h4>
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
              <span>⏱️ Prep: {selectedDay.breakfast.prepTime}</span>
              <span>🍳 Cook: {selectedDay.breakfast.cookTime}</span>
              <span>👥 Servings: {selectedDay.breakfast.servings}</span>
            </div>
          </div>

          {/* Lunch */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              🥗 Lunch: {selectedDay.lunch.name}
            </h4>
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
              <span>⏱️ Prep: {selectedDay.lunch.prepTime}</span>
              <span>🍳 Cook: {selectedDay.lunch.cookTime}</span>
              <span>👥 Servings: {selectedDay.lunch.servings}</span>
            </div>
          </div>

          {/* Dinner */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              🍽️ Dinner: {selectedDay.dinner.name}
            </h4>
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
              <span>⏱️ Prep: {selectedDay.dinner.prepTime}</span>
              <span>🍳 Cook: {selectedDay.dinner.cookTime}</span>
              <span>👥 Servings: {selectedDay.dinner.servings}</span>
            </div>
          </div>

          {/* Snacks */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              🍪 Snack Options
            </h4>
            <ul className="space-y-2 text-sm text-charcoal/80">
              {selectedDay.snacks.map((snack, i) => (
                <li key={i}>• {snack}</li>
              ))}
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
    </div>
  );
}
