"use client";

import { useState } from "react";
import type { Audience, ExercisePlan, WorkoutSession } from "@/lib/wellness/types";

interface ExercisePlanResultsProps {
  exercisePlan: ExercisePlan;
  audience: Audience;
  onStartOver: () => void;
}

export default function ExercisePlanResults({
  exercisePlan,
  audience,
  onStartOver,
}: ExercisePlanResultsProps) {
  const [selectedDay, setSelectedDay] = useState<WorkoutSession | null>(
    exercisePlan.weekPlan[0]
  );
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleEmailPlan = async () => {
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
          planType: "exercise",
          audience,
          planData: exercisePlan,
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
            Your Personalised Exercise Plan
          </h3>
          <p className="mt-1 text-sm text-charcoal/70">
            {exercisePlan.weekPlan.length}-day workout plan
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
            Email Your Exercise Plan
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
          {exercisePlan.weekPlan.map((day) => (
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

      {/* Selected Day Workout */}
      {selectedDay && (
        <div className="space-y-6">
          {/* Workout Info */}
          <div className="rounded-2xl bg-sage/10 p-6">
            <h4 className="mb-2 text-xl font-semibold text-charcoal">
              {selectedDay.day} - {selectedDay.focus}
            </h4>
            <p className="text-sm text-charcoal/70">
              ⏱️ Estimated time: {selectedDay.estimatedTime}
            </p>
          </div>

          {/* Warmup */}
          {selectedDay.warmup && selectedDay.warmup.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                🔥 Warmup
              </h4>
              <div className="space-y-4">
                {selectedDay.warmup.map((exercise, i) => (
                  <div key={i} className="border-l-4 border-sage/30 pl-4">
                    <div className="mb-1 font-medium text-charcoal">
                      {exercise.name}
                    </div>
                    {exercise.duration && (
                      <div className="text-sm text-charcoal/60">
                        ⏱️ {exercise.duration}
                      </div>
                    )}
                    <div className="mt-2 text-sm text-charcoal/80">
                      {exercise.description}
                    </div>
                    {exercise.formTips && exercise.formTips.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-charcoal/70">
                        {exercise.formTips.map((tip, j) => (
                          <li key={j}>• {tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Workout */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              💪 Main Workout
            </h4>
            <div className="space-y-6">
              {selectedDay.mainWorkout.map((exercise, i) => (
                <div key={i} className="border-l-4 border-sage pl-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-medium text-charcoal">
                      {exercise.name}
                    </div>
                    <div className="text-sm text-charcoal/60">
                      {exercise.sets && exercise.reps && (
                        <span>{exercise.sets} × {exercise.reps}</span>
                      )}
                      {exercise.duration && <span>{exercise.duration}</span>}
                    </div>
                  </div>
                  {exercise.restTime && (
                    <div className="mb-2 text-xs text-charcoal/60">
                      Rest: {exercise.restTime}
                    </div>
                  )}
                  <div className="mb-2 text-sm text-charcoal/80">
                    {exercise.description}
                  </div>
                  {exercise.formTips && exercise.formTips.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-charcoal/80">Form Tips:</div>
                      <ul className="mt-1 space-y-1 text-xs text-charcoal/70">
                        {exercise.formTips.map((tip, j) => (
                          <li key={j}>✓ {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exercise.modifications && (
                    <div className="mt-2 rounded-lg bg-sage/5 p-2 text-xs text-charcoal/80">
                      {exercise.modifications.easier && (
                        <div>
                          <span className="font-medium">Easier:</span> {exercise.modifications.easier}
                        </div>
                      )}
                      {exercise.modifications.harder && (
                        <div>
                          <span className="font-medium">Harder:</span> {exercise.modifications.harder}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          {selectedDay.cooldown && selectedDay.cooldown.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                ❄️ Cooldown
              </h4>
              <div className="space-y-4">
                {selectedDay.cooldown.map((exercise, i) => (
                  <div key={i} className="border-l-4 border-sage/30 pl-4">
                    <div className="mb-1 font-medium text-charcoal">
                      {exercise.name}
                    </div>
                    {exercise.duration && (
                      <div className="text-sm text-charcoal/60">
                        ⏱️ {exercise.duration}
                      </div>
                    )}
                    <div className="mt-2 text-sm text-charcoal/80">
                      {exercise.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedDay.notes && selectedDay.notes.length > 0 && (
            <div className="rounded-2xl bg-sage/10 p-4">
              <h5 className="mb-2 text-sm font-medium text-charcoal">📝 Notes:</h5>
              <ul className="space-y-1 text-sm text-charcoal/80">
                {selectedDay.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Progression Tips */}
      {exercisePlan.progressionTips && exercisePlan.progressionTips.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            📈 Progression Tips
          </h4>
          <ul className="space-y-2 text-sm text-charcoal/80">
            {exercisePlan.progressionTips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Reminders */}
      {exercisePlan.safetyReminders && exercisePlan.safetyReminders.length > 0 && (
        <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-6">
          <h4 className="mb-3 text-lg font-semibold text-charcoal">
            ⚠️ Safety Reminders
          </h4>
          <ul className="space-y-2 text-sm text-charcoal/80">
            {exercisePlan.safetyReminders.map((reminder, i) => (
              <li key={i}>• {reminder}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
