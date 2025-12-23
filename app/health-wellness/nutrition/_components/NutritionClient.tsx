"use client";

import { useState } from "react";
import NutritionWizard, { type NutritionPlanResult, type NutritionWizardInputs } from "./NutritionWizard";
import NutritionResults from "./NutritionResults";

interface NutritionData {
  result: NutritionPlanResult;
  inputs: NutritionWizardInputs;
}

export default function NutritionClient() {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  const handleComplete = (result: NutritionPlanResult, inputs: NutritionWizardInputs) => {
    setNutritionData({ result, inputs });
  };

  const handleStartOver = () => {
    setNutritionData(null);
  };

  if (nutritionData) {
    return (
      <NutritionResults
        result={nutritionData.result}
        inputs={nutritionData.inputs}
        onStartOver={handleStartOver}
      />
    );
  }

  return <NutritionWizard onComplete={handleComplete} />;
}

