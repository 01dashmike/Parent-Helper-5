"use client";

import { useState } from "react";
import type { Audience, ExercisePlan, WorkoutSession, Exercise } from "@/lib/wellness/types";
import ExerciseMediaDisplay from "./ExerciseMediaDisplay";

/**
 * Component to display exercise image - uses ExerciseDB GIF if available,
 * falls back to ExerciseMediaDisplay for API matching
 * 
 * @param size - "small", "medium", or "large"
 */
function ExerciseImage({ exercise, size = "medium" }: { exercise: Exercise; size?: "small" | "medium" | "large" }) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Size classes mapping - using max dimensions to allow flexible aspect ratios
  const sizeClasses = {
    small: "max-w-[120px] max-h-[100px]",    // warmup/cooldown
    medium: "max-w-[150px] max-h-[120px]",   // medium
    large: "max-w-[180px] max-h-[140px]",    // main workout exercises
  };

  // Use ExerciseDB GIF directly if available
  if (exercise.imageUrl && !imageError) {
    const imageSize = sizeClasses[size];
    
    return (
      <div className="relative flex-shrink-0 order-last ml-4 group">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`${imageSize} overflow-hidden rounded-xl bg-white hover:ring-2 hover:ring-sage transition-all shadow-md border border-gray-100 p-2 relative`}
        >
          <img
            src={exercise.imageUrl}
            alt={`${exercise.name} demonstration`}
            className="w-full h-full object-contain transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          {/* Expand icon and label - always visible */}
          <div className="absolute bottom-1 right-1 bg-sage/80 hover:bg-sage text-white rounded-md px-1.5 py-0.5 flex items-center gap-1 text-xs transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>Click to enlarge</span>
          </div>
        </button>
        
        {/* Expanded view */}
        {expanded && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setExpanded(false)}
          >
            <div className="relative max-w-lg max-h-[80vh] overflow-auto bg-white rounded-2xl p-4 shadow-2xl">
              <img
                src={exercise.imageUrl}
                alt={`${exercise.name} demonstration`}
                className="w-full rounded-lg"
                onError={() => setImageError(true)}
              />
              <h4 className="mt-3 text-lg font-semibold text-charcoal">{exercise.name}</h4>
              {exercise.gymFitInstructions && exercise.gymFitInstructions.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-charcoal">Step-by-step instructions:</h5>
                  <ol className="mt-2 space-y-2 text-sm text-charcoal/80 list-decimal list-inside">
                    {exercise.gymFitInstructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
              {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-charcoal/60">Target muscles: </span>
                  <span className="text-xs text-charcoal/80">{exercise.targetMuscles.join(", ")}</span>
                </div>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="mt-4 w-full rounded-lg bg-sage px-4 py-2 text-white hover:bg-sage/90"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback to ExerciseMediaDisplay for API-based matching (no image available)
  return <ExerciseMediaDisplay exerciseName={exercise.name} compact={size === "small"} />;
}

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
              Estimated time: {selectedDay.estimatedTime}
            </p>
          </div>

          {/* Warmup */}
          {selectedDay.warmup && selectedDay.warmup.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                Warmup
              </h4>
              <div className="space-y-4">
                {selectedDay.warmup.map((exercise, i) => (
                  <div key={i} className="border-l-4 border-sage/30 pl-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="mb-1 font-medium text-charcoal">
                          {exercise.name}
                          {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-charcoal/50">
                              ({exercise.targetMuscles.slice(0, 2).join(", ")})
                            </span>
                          )}
                        </div>
                        {exercise.duration && (
                          <div className="text-sm text-charcoal/60">
                            {exercise.duration}
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
                      <ExerciseImage exercise={exercise} size="medium" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Workout */}
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              Main Workout
            </h4>
            <div className="space-y-6">
              {selectedDay.mainWorkout.map((exercise, i) => (
                <div key={i} className="border-l-4 border-sage pl-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-medium text-charcoal">
                          {exercise.name}
                          {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-charcoal/50">
                              ({exercise.targetMuscles.slice(0, 2).join(", ")})
                            </span>
                          )}
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
                      {/* Show exercise variations if available */}
                      {exercise.variations && exercise.variations.length > 0 && (
                        <div className="mt-2 text-xs text-charcoal/60">
                          <span className="font-medium">See also: </span>
                          {exercise.variations.slice(0, 3).map((v: any) => typeof v === 'string' ? v : v.name).join(", ")}
                        </div>
                      )}
                    </div>
                    <ExerciseImage exercise={exercise} size="large" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          {selectedDay.cooldown && selectedDay.cooldown.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <h4 className="mb-4 text-xl font-semibold text-charcoal">
                Cooldown
              </h4>
              <div className="space-y-4">
                {selectedDay.cooldown.map((exercise, i) => (
                  <div key={i} className="border-l-4 border-sage/30 pl-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="mb-1 font-medium text-charcoal">
                          {exercise.name}
                          {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-charcoal/50">
                              ({exercise.targetMuscles.slice(0, 2).join(", ")})
                            </span>
                          )}
                        </div>
                        {exercise.duration && (
                          <div className="text-sm text-charcoal/60">
                            {exercise.duration}
                          </div>
                        )}
                        <div className="mt-2 text-sm text-charcoal/80">
                          {exercise.description}
                        </div>
                      </div>
                      <ExerciseImage exercise={exercise} size="medium" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedDay.notes && selectedDay.notes.length > 0 && (
            <div className="rounded-2xl bg-sage/10 p-4">
              <h5 className="mb-2 text-sm font-medium text-charcoal">Notes:</h5>
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
            Progression Tips
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
            Safety Reminders
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
