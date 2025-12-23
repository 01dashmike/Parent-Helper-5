"use client";

import { useState } from "react";
import ExerciseWizard from "./ExerciseWizard";
import ExercisePlanResults from "./ExercisePlanResults";
import type { Audience, ExercisePlan } from "@/lib/wellness/types";

interface ExercisePlannerClientProps {
  audience: Audience;
}

export default function ExercisePlannerClient({ audience }: ExercisePlannerClientProps) {
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);

  return (
    <div className="space-y-8">
      {!exercisePlan ? (
        <ExerciseWizard
          audience={audience}
          onComplete={(plan) => setExercisePlan(plan)}
        />
      ) : (
        <ExercisePlanResults
          exercisePlan={exercisePlan}
          audience={audience}
          onStartOver={() => setExercisePlan(null)}
        />
      )}
    </div>
  );
}
