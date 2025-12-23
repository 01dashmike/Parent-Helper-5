/**
 * Nutrition Calculator
 * 
 * Calculates calorie and macro needs for family members based on age, 
 * activity level, and goals. Uses NHS/WHO guidelines for children.
 */

import type {
  FamilySize,
  DietGoal,
  ActivityLevel,
  PersonType,
  PersonNutrition,
  MacroBreakdown,
  NutritionBreakdown,
  NutritionInputs,
  WeightLossData,
  MuscleGainData,
  BiologicalSexForCalc,
  ProteinTarget,
  WeeklyWeightLossTarget,
} from "./types";

// ============================================================================
// Constants - Based on NHS/WHO Guidelines
// ============================================================================

// Average daily calorie needs by age group (NHS guidelines)
const CHILD_CALORIE_GUIDELINES = {
  baby: { min: 600, max: 900 }, // 0-1 years (mostly from milk/formula)
  toddler: { min: 1000, max: 1300 }, // 1-3 years
  preschool: { min: 1200, max: 1500 }, // 3-5 years
  schoolAge: { min: 1400, max: 1800 }, // 5-10 years (average)
};

// Adult base calorie needs (average sedentary)
const ADULT_BASE_CALORIES = {
  male: 2000,
  female: 1800,
};

// Activity level multipliers
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.0,
  "lightly-active": 1.15,
  "moderately-active": 1.3,
  "very-active": 1.5,
};

// Goal adjustments (percentage change)
const GOAL_ADJUSTMENTS: Partial<Record<DietGoal, number>> = {
  "weight-loss": -0.15, // -15% calories
  "muscle-gain": 0.1, // +10% calories
  energy: 0.05, // +5% calories
  "general-wellness": 0, // no change
};

// Macro ratios by goal (protein%, carbs%, fat%)
const MACRO_RATIOS: Record<string, { protein: number; carbs: number; fat: number }> = {
  default: { protein: 0.20, carbs: 0.50, fat: 0.30 },
  "weight-loss": { protein: 0.30, carbs: 0.40, fat: 0.30 },
  "muscle-gain": { protein: 0.30, carbs: 0.45, fat: 0.25 },
  "heart-health": { protein: 0.20, carbs: 0.50, fat: 0.30 },
  "diabetic-friendly": { protein: 0.25, carbs: 0.40, fat: 0.35 },
};

// Meal distribution (% of daily calories)
const MEAL_DISTRIBUTION = {
  breakfast: 0.25, // 25%
  lunch: 0.30, // 30%
  dinner: 0.35, // 35%
  snacks: 0.10, // 10%
};

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate macros from calories
 */
function calculateMacros(
  calories: number,
  goals: DietGoal[]
): MacroBreakdown {
  // Determine which macro ratio to use based on primary goal
  let ratioKey = "default";
  for (const goal of goals) {
    if (MACRO_RATIOS[goal]) {
      ratioKey = goal;
      break;
    }
  }
  
  const ratio = MACRO_RATIOS[ratioKey];
  
  // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
  const proteinCals = calories * ratio.protein;
  const carbsCals = calories * ratio.carbs;
  const fatCals = calories * ratio.fat;
  
  return {
    protein: Math.round(proteinCals / 4),
    carbs: Math.round(carbsCals / 4),
    fat: Math.round(fatCals / 9),
    proteinPercent: Math.round(ratio.protein * 100),
    carbsPercent: Math.round(ratio.carbs * 100),
    fatPercent: Math.round(ratio.fat * 100),
  };
}

/**
 * Calculate meal distribution from daily calories
 */
function calculateMealCalories(dailyCalories: number): PersonNutrition["mealCalories"] {
  return {
    breakfast: Math.round(dailyCalories * MEAL_DISTRIBUTION.breakfast),
    lunch: Math.round(dailyCalories * MEAL_DISTRIBUTION.lunch),
    dinner: Math.round(dailyCalories * MEAL_DISTRIBUTION.dinner),
    snacks: Math.round(dailyCalories * MEAL_DISTRIBUTION.snacks),
  };
}

/**
 * Calculate adult calorie needs
 */
function calculateAdultCalories(
  isMale: boolean,
  activityLevel: ActivityLevel,
  goals: DietGoal[]
): number {
  const baseCalories = isMale ? ADULT_BASE_CALORIES.male : ADULT_BASE_CALORIES.female;
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  
  // Apply activity multiplier
  let calories = baseCalories * activityMultiplier;
  
  // Apply goal adjustment
  for (const goal of goals) {
    const adjustment = GOAL_ADJUSTMENTS[goal];
    if (adjustment !== undefined) {
      calories = calories * (1 + adjustment);
      break; // Only apply first matching goal adjustment
    }
  }
  
  return Math.round(calories);
}

/**
 * Calculate child calorie needs based on age category
 */
function calculateChildCalories(
  childType: "baby" | "toddler" | "preschool" | "schoolAge"
): number {
  const guidelines = CHILD_CALORIE_GUIDELINES[childType];
  // Return average of min/max
  return Math.round((guidelines.min + guidelines.max) / 2);
}

/**
 * Map child type to person type
 */
function childTypeToPersonType(childType: "baby" | "toddler" | "preschool" | "schoolAge"): PersonType {
  const mapping: Record<string, PersonType> = {
    baby: "baby",
    toddler: "toddler",
    preschool: "preschool",
    schoolAge: "school-age",
  };
  return mapping[childType];
}

/**
 * Calculate nutrition breakdown for a family
 */
export function calculateFamilyNutrition(inputs: NutritionInputs): NutritionBreakdown {
  const { familySize, activityLevel = "moderately-active", goals } = inputs;
  const people: PersonNutrition[] = [];
  
  // Calculate for adults (assume 50/50 male/female split)
  for (let i = 0; i < familySize.adults; i++) {
    const isMale = i % 2 === 0; // Alternate male/female
    const personType: PersonType = isMale ? "adult-male" : "adult-female";
    const dailyCalories = calculateAdultCalories(isMale, activityLevel, goals);
    
    people.push({
      label: `Adult ${i + 1}${isMale ? " (est. male)" : " (est. female)"}`,
      personType,
      dailyCalories,
      macros: calculateMacros(dailyCalories, goals),
      mealCalories: calculateMealCalories(dailyCalories),
    });
  }
  
  // Calculate for children by age group
  const childTypes: Array<{ key: keyof FamilySize["childrenAges"]; label: string }> = [
    { key: "babies", label: "Baby" },
    { key: "toddlers", label: "Toddler" },
    { key: "preschool", label: "Preschooler" },
    { key: "schoolAge", label: "School-age child" },
  ];
  
  for (const childType of childTypes) {
    const count = familySize.childrenAges[childType.key];
    for (let i = 0; i < count; i++) {
      const childKey = childType.key === "babies" ? "baby" :
                       childType.key === "toddlers" ? "toddler" :
                       childType.key === "preschool" ? "preschool" : "schoolAge";
      
      const dailyCalories = calculateChildCalories(childKey);
      
      people.push({
        label: count > 1 ? `${childType.label} ${i + 1}` : childType.label,
        personType: childTypeToPersonType(childKey),
        dailyCalories,
        macros: calculateMacros(dailyCalories, ["general-wellness"]), // Children use default macros
        mealCalories: calculateMealCalories(dailyCalories),
      });
    }
  }
  
  // Calculate totals
  const totalDailyCalories = people.reduce((sum, p) => sum + p.dailyCalories, 0);
  const totalMacros: MacroBreakdown = {
    protein: people.reduce((sum, p) => sum + p.macros.protein, 0),
    carbs: people.reduce((sum, p) => sum + p.macros.carbs, 0),
    fat: people.reduce((sum, p) => sum + p.macros.fat, 0),
    proteinPercent: 0,
    carbsPercent: 0,
    fatPercent: 0,
  };
  
  // Calculate percentage from total grams
  const totalProteinCals = totalMacros.protein * 4;
  const totalCarbsCals = totalMacros.carbs * 4;
  const totalFatCals = totalMacros.fat * 9;
  const totalMacroCals = totalProteinCals + totalCarbsCals + totalFatCals;
  
  if (totalMacroCals > 0) {
    totalMacros.proteinPercent = Math.round((totalProteinCals / totalMacroCals) * 100);
    totalMacros.carbsPercent = Math.round((totalCarbsCals / totalMacroCals) * 100);
    totalMacros.fatPercent = Math.round((totalFatCals / totalMacroCals) * 100);
  }
  
  return {
    people,
    totalDailyCalories,
    totalMacros,
    disclaimer: "These are estimated guidelines based on NHS/WHO recommendations. " +
      "Individual needs vary based on height, weight, metabolism, and health conditions. " +
      "Consult a registered dietitian or GP for personalised advice.",
  };
}

/**
 * Quick calculation for a single adult
 */
export function calculateSingleAdultNutrition(
  goals: DietGoal[],
  activityLevel: ActivityLevel = "moderately-active"
): PersonNutrition {
  // Default to female for conservative estimate
  const dailyCalories = calculateAdultCalories(false, activityLevel, goals);
  
  return {
    label: "Your daily needs",
    personType: "adult-female",
    dailyCalories,
    macros: calculateMacros(dailyCalories, goals),
    mealCalories: calculateMealCalories(dailyCalories),
  };
}

// ============================================================================
// Weight Loss Calculation Functions
// ============================================================================

/**
 * Activity level multipliers for TDEE calculation (Harris-Benedict/Mifflin-St Jeor)
 */
const TDEE_ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  "lightly-active": 1.375,
  "moderately-active": 1.55,
  "very-active": 1.725,
};

/**
 * Daily calorie deficit based on weekly weight loss target
 * 1kg of fat ≈ 7700 calories, so 1kg/week = 1100 cal/day deficit
 */
const WEEKLY_LOSS_DEFICIT: Record<WeeklyWeightLossTarget, number> = {
  "0.25kg": 275,
  "0.5kg": 550,
  "0.75kg": 825,
  "1kg": 1100,
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Most accurate for modern populations
 */
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number, // years
  biologicalSex: BiologicalSexForCalc
): number {
  if (biologicalSex === "male") {
    // Men: BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    // Women: BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  return Math.round(bmr * TDEE_ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculate weight loss calorie target
 * Returns daily calories for safe, sustainable weight loss
 */
export function calculateWeightLossCalories(data: WeightLossData): {
  bmr: number;
  tdee: number;
  dailyTarget: number;
  weeklyDeficit: number;
  estimatedWeeklyLoss: string;
} {
  const bmr = calculateBMR(
    data.currentWeight,
    data.height,
    data.age,
    data.biologicalSex
  );
  
  const tdee = calculateTDEE(bmr, data.activityLevel);
  const deficit = WEEKLY_LOSS_DEFICIT[data.targetWeeklyLoss];
  
  // Ensure minimum safe calorie intake
  const minCalories = data.biologicalSex === "male" ? 1500 : 1200;
  const dailyTarget = Math.max(minCalories, tdee - deficit);
  
  return {
    bmr: Math.round(bmr),
    tdee,
    dailyTarget,
    weeklyDeficit: deficit * 7,
    estimatedWeeklyLoss: data.targetWeeklyLoss,
  };
}

// ============================================================================
// Muscle Gain Calculation Functions
// ============================================================================

/**
 * Protein target multipliers (g per kg body weight)
 */
const PROTEIN_MULTIPLIERS: Record<ProteinTarget, number> = {
  high: 1.8, // 1.6-2.0g/kg
  "very-high": 2.2, // 2.0-2.4g/kg
};

/**
 * Calculate muscle gain protein target
 */
export function calculateMuscleGainProtein(data: MuscleGainData): {
  dailyProtein: number;
  proteinPerMeal: number;
  dailyCalorieTarget: number;
  caloriesSurplus: number;
} {
  const proteinMultiplier = PROTEIN_MULTIPLIERS[data.proteinTarget];
  const dailyProtein = Math.round(data.currentWeight * proteinMultiplier);
  
  // Aim for 4 meals/snacks for even protein distribution
  const proteinPerMeal = Math.round(dailyProtein / 4);
  
  // Calculate calorie target for muscle gain
  // Use simplified estimate: 15-17 cal/lb for muscle gain
  const weightInLbs = data.currentWeight * 2.205;
  const baseCalories = data.biologicalSex === "male" ? 16 : 15;
  
  // Apply activity multiplier
  const activityBonus: Record<ActivityLevel, number> = {
    sedentary: 0,
    "lightly-active": 0.05,
    "moderately-active": 0.1,
    "very-active": 0.15,
  };
  
  const dailyCalorieTarget = Math.round(
    weightInLbs * baseCalories * (1 + activityBonus[data.activityLevel])
  );
  
  // Surplus should be 250-500 calories above maintenance
  const maintenanceEstimate = Math.round(dailyCalorieTarget * 0.85);
  const caloriesSurplus = dailyCalorieTarget - maintenanceEstimate;
  
  return {
    dailyProtein,
    proteinPerMeal,
    dailyCalorieTarget,
    caloriesSurplus,
  };
}

/**
 * Calculate personalised nutrition based on goal-specific data
 */
export function calculatePersonalisedNutrition(
  goals: DietGoal[],
  weightLossData?: WeightLossData,
  muscleGainData?: MuscleGainData,
  activityLevel: ActivityLevel = "moderately-active"
): PersonNutrition & {
  weightLossInfo?: ReturnType<typeof calculateWeightLossCalories>;
  muscleGainInfo?: ReturnType<typeof calculateMuscleGainProtein>;
} {
  let dailyCalories: number;
  let weightLossInfo: ReturnType<typeof calculateWeightLossCalories> | undefined;
  let muscleGainInfo: ReturnType<typeof calculateMuscleGainProtein> | undefined;
  let biologicalSex: BiologicalSexForCalc = "female";
  let isMale = false;
  
  // Use weight loss data if available
  if (goals.includes("weight-loss") && weightLossData) {
    weightLossInfo = calculateWeightLossCalories(weightLossData);
    dailyCalories = weightLossInfo.dailyTarget;
    biologicalSex = weightLossData.biologicalSex;
    isMale = biologicalSex === "male";
  }
  // Use muscle gain data if available
  else if (goals.includes("muscle-gain") && muscleGainData) {
    muscleGainInfo = calculateMuscleGainProtein(muscleGainData);
    dailyCalories = muscleGainInfo.dailyCalorieTarget;
    biologicalSex = muscleGainData.biologicalSex;
    isMale = biologicalSex === "male";
  }
  // Default calculation (use female as conservative default)
  else {
    dailyCalories = calculateAdultCalories(false, activityLevel, goals);
    isMale = false;
  }
  
  const personType: PersonType = isMale ? "adult-male" : "adult-female";
  
  return {
    label: "Your personalised daily needs",
    personType,
    dailyCalories,
    macros: calculateMacros(dailyCalories, goals),
    mealCalories: calculateMealCalories(dailyCalories),
    weightLossInfo,
    muscleGainInfo,
  };
}
