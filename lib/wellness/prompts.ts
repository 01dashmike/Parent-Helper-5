/**
 * Wellness AI Prompts
 * 
 * Prompt templates for all wellness AI features.
 * These prompts are designed to generate helpful, safe, and practical advice.
 */

import type {
  Audience,
  MealPlanInputs,
  SnackGeneratorInputs,
  ExercisePlanInputs,
  SupplementInputs,
  ProductSafetyInputs,
} from "./types";

// ============================================================================
// Common Prompt Components
// ============================================================================

const BRAND_CONTEXT = `
You are an AI wellness assistant for Parent Helper, a UK-based platform helping families with young children.

BRAND VOICE:
- Warm, supportive, knowledgeable
- Like a trusted friend with expertise
- Never condescending or preachy
- Practical and actionable
- Evidence-based but accessible

SAFETY GUIDELINES:
- Never provide medical advice or diagnoses
- Always recommend consulting healthcare professionals for medical concerns
- No guarantees or promises of specific outcomes
- Focus on general wellness and healthy habits
- UK-specific recommendations (NHS guidance, UK brands, UK supermarkets)
`;

const AUDIENCE_CONTEXT: Record<Audience, string> = {
  mum: `
AUDIENCE: Mums (mothers with young children)
CONSIDERATIONS:
- May be dealing with postnatal recovery
- Often juggling childcare and other responsibilities
- Limited time and energy
- Interested in family-friendly options
- May be breastfeeding or pregnant
`,
  dad: `
AUDIENCE: Dads (fathers with young children)
CONSIDERATIONS:
- Active involvement in childcare
- May be balancing work and family
- Interested in efficient, effective solutions
- Looking for ways to bond with children through activities
- Values practical, straightforward advice
`,
  couples: `
AUDIENCE: Couples (partners planning together)
CONSIDERATIONS:
- Planning for two adults with potential dietary differences
- May be expecting or planning for children
- Interested in meal prep and batch cooking
- Looking for couple-friendly activities
- Balancing work schedules and meal timing
`,
  family: `
AUDIENCE: Families (parents planning for whole family)
CONSIDERATIONS:
- Planning for multiple family members including children
- Mix of ages and preferences
- Budget-conscious
- Looking for activities everyone can enjoy
- Balancing different dietary needs across age groups
- Need to adjust portions for different ages
`,
  grandparents: `
AUDIENCE: Grandparents (helping care for grandchildren)
CONSIDERATIONS:
- May have different energy levels
- Want to be helpful and supportive
- Interested in age-appropriate activities
- May have own health considerations
- Value tried-and-tested approaches
`,
};

// ============================================================================
// Meal Planner Prompts
// ============================================================================

export function buildMealPlanPrompt(inputs: MealPlanInputs): string {
  const audienceContext = AUDIENCE_CONTEXT[inputs.audience];
  
  // Build goal-specific sections
  let goalSpecificContext = "";
  let nutritionOutputRequirements = "";
  
  // Muscle Gain specific context
  if (inputs.goalSpecificData?.muscleGain) {
    const mg = inputs.goalSpecificData.muscleGain;
    const proteinMultiplier = mg.proteinTarget === "high" ? 1.8 : 2.2;
    const dailyProteinTarget = Math.round(mg.currentWeight * proteinMultiplier);
    
    goalSpecificContext += `
MUSCLE GAIN DETAILS:
- Current weight: ${mg.currentWeight}kg
- Target weight: ${mg.targetWeight ? `${mg.targetWeight}kg` : "Not specified"}
- Biological sex: ${mg.biologicalSex}
- Activity level: ${mg.activityLevel}
- Protein target: ${mg.proteinTarget} (${proteinMultiplier}g per kg body weight)
- Daily protein goal: approximately ${dailyProteinTarget}g

MUSCLE GAIN MEAL REQUIREMENTS:
- Each meal should be HIGH PROTEIN focused
- Include protein amounts in nutritionInfo for every meal
- Aim for 25-40g protein per main meal
- Include protein-rich snacks (20-30g protein each)
- Favour lean meats, fish, eggs, Greek yoghurt, legumes, cottage cheese
- Include post-workout meal suggestions
`;
  }
  
  // Weight Loss specific context
  if (inputs.goalSpecificData?.weightLoss) {
    const wl = inputs.goalSpecificData.weightLoss;
    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (wl.biologicalSex === "male") {
      bmr = (10 * wl.currentWeight) + (6.25 * wl.height) - (5 * wl.age) + 5;
    } else {
      bmr = (10 * wl.currentWeight) + (6.25 * wl.height) - (5 * wl.age) - 161;
    }
    
    // Apply activity multiplier
    const activityMultipliers: Record<string, number> = {
      "sedentary": 1.2,
      "lightly-active": 1.375,
      "moderately-active": 1.55,
      "very-active": 1.725,
    };
    const tdee = Math.round(bmr * (activityMultipliers[wl.activityLevel] || 1.55));
    
    // Calculate deficit based on target weekly loss
    const deficitPerDay: Record<string, number> = {
      "0.25kg": 275,
      "0.5kg": 550,
      "0.75kg": 825,
      "1kg": 1100,
    };
    const dailyCalorieTarget = Math.max(1200, tdee - (deficitPerDay[wl.targetWeeklyLoss] || 550));
    
    goalSpecificContext += `
WEIGHT LOSS DETAILS:
- Current weight: ${wl.currentWeight}kg
- Age: ${wl.age} years
- Height: ${wl.height}cm
- Biological sex: ${wl.biologicalSex}
- Activity level: ${wl.activityLevel}
- Target weekly loss: ${wl.targetWeeklyLoss}
- Estimated TDEE: ${tdee} calories
- DAILY CALORIE TARGET: ${dailyCalorieTarget} calories

WEIGHT LOSS MEAL REQUIREMENTS:
- STRICTLY adhere to approximately ${dailyCalorieTarget} calories per day
- Include calorie counts in nutritionInfo for EVERY meal and snack
- Aim for calorie distribution: Breakfast 300-400cal, Lunch 400-500cal, Dinner 400-500cal, Snacks 150-200cal
- Focus on high-volume, low-calorie foods (vegetables, lean proteins)
- Include plenty of fibre for satiety
- Avoid calorie-dense oils and sauces
`;
  }
  
  // Heart Health / Cholesterol specific context
  const hasHeartGoal = inputs.goals.includes("heart-health") || inputs.goals.includes("cholesterol-control");
  if (hasHeartGoal) {
    const hh = inputs.goalSpecificData?.heartHealth;
    
    goalSpecificContext += `
HEART HEALTH / CHOLESTEROL DETAILS:
${hh?.currentCholesterol ? `- Current cholesterol: ${hh.currentCholesterol}` : "- Cholesterol level: Not specified"}
- Family history of heart disease: ${hh?.familyHistoryHeartDisease ? "Yes" : "No"}

HEART HEALTH MEAL REQUIREMENTS:
- Limit saturated fat to <20g per day total
- Include saturatedFat in nutritionInfo for EVERY meal (in grams)
- Include cholesterol in nutritionInfo for EVERY meal (in mg)
- Add heartHealthScore (1-10) to EVERY meal and snack
- Favour oily fish (salmon, mackerel), nuts, olive oil, oats
- Avoid red meat, full-fat dairy, fried foods
- Include soluble fibre (oats, beans, lentils)
- Minimise processed foods and sodium
`;

    // Update nutrition output requirements for heart health
    nutritionOutputRequirements = `
HEART HEALTH NUTRITION REQUIREMENTS:
- Include saturatedFat and cholesterol in nutritionInfo for every meal
- Add heartHealthScore (1-10) to every recipe
- Score Guide: 9-10=Excellent, 7-8=Very Good, 5-6=Acceptable, 3-4=Occasional, 1-2=Avoid
`;
  }
  
  const prompt = `${BRAND_CONTEXT}
${audienceContext}

TASK: Create a personalized 7-day meal plan

USER PREFERENCES:
- Likes: ${inputs.likes.join(", ") || "None specified"}
- Dislikes: ${inputs.dislikes.join(", ") || "None specified"}
- Available cooking time per meal: ${inputs.cookingTime}
- Preferred supermarkets: ${inputs.preferredShops.join(", ")}
- Goals: ${inputs.goals.join(", ")}
- Allergies/restrictions: ${inputs.allergies?.join(", ") || "None"}
- Health conditions: ${inputs.healthConditions?.join(", ") || "None"}
- Budget preference: ${inputs.budgetPreference}
${inputs.familySize ? `- Family size: ${inputs.familySize.adults} adults, ${inputs.familySize.childrenAges.babies} babies (0-1yr), ${inputs.familySize.childrenAges.toddlers} toddlers (1-3yr), ${inputs.familySize.childrenAges.preschool} preschool (3-5yr), ${inputs.familySize.childrenAges.schoolAge} school-age (5+yr)` : ""}
${goalSpecificContext}

REQUIREMENTS:
1. Create a complete 7-day meal plan (Monday-Sunday)
2. Include breakfast, lunch, dinner, and 2 snack options per day
3. All recipes must be:
   - Realistic for the specified cooking time
   - Available at UK supermarkets
   - Appropriate for families with young children
   - Balanced and nutritious
4. Provide detailed recipes with ingredients and method
5. Include a consolidated shopping list organised by supermarket sections
6. Estimate weekly cost range (£min - £max)
7. Consider the audience's specific needs
8. If family size is provided, adjust recipe quantities and serving sizes accordingly
9. Use UK English spelling throughout (e.g., "organised" not "organized", "favourites" not "favorites")
10. ${inputs.goalSpecificData?.muscleGain ? "Include protein content (in grams) in nutritionInfo for EVERY meal" : ""}
11. ${inputs.goalSpecificData?.weightLoss ? "Include calorie count in nutritionInfo for EVERY meal and snack" : ""}

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "weekPlan": [
    {
      "day": "Monday",
      "breakfast": {
        "name": "Recipe name",
        "ingredients": ["ingredient 1", "ingredient 2"],
        "method": ["step 1", "step 2"],
        "prepTime": "10 mins",
        "cookTime": "15 mins",
        "servings": 4,
        "nutritionInfo": {
          "calories": "350 kcal",
          "protein": "25g",
          "carbs": "40g",
          "fat": "12g"
        }
      },
      "lunch": { "name": "...", "ingredients": [...], "method": [...], "prepTime": "...", "cookTime": "...", "servings": 4, "nutritionInfo": {...} },
      "dinner": { "name": "...", "ingredients": [...], "method": [...], "prepTime": "...", "cookTime": "...", "servings": 4, "nutritionInfo": {...} },
      "snacks": ["Snack option 1", "Snack option 2"]
    }
  ],
  "shoppingList": [
    { "category": "Fresh Produce", "items": ["item 1", "item 2"] }
  ],
  "estimatedCost": { "min": 45, "max": 65, "currency": "GBP" },
  "tips": ["Quick prep tip", "Storage tip"]
}

${hasHeartGoal ? `FOR HEART HEALTH: Add "saturatedFat" and "cholesterol" to each nutritionInfo, and add "heartHealthScore" (1-10) to each recipe.` : ""}
${nutritionOutputRequirements}

IMPORTANT:
- Make meals kid-friendly when relevant
- Include make-ahead options
- Suggest batch cooking where possible
- Keep it realistic and achievable
- Provide variety throughout the week
${inputs.goalSpecificData?.muscleGain ? "- PRIORITISE HIGH PROTEIN in every meal for muscle gain" : ""}
${inputs.goalSpecificData?.weightLoss ? "- STRICTLY ADHERE to the calorie targets for weight loss" : ""}
${hasHeartGoal ? "- ALWAYS include saturatedFat, cholesterol, and heartHealthScore for heart health goals" : ""}`;

  return prompt;
}

export function buildSnackAlternativesPrompt(inputs: SnackGeneratorInputs): string {
  const audienceContext = AUDIENCE_CONTEXT[inputs.audience];
  
  const prompt = `${BRAND_CONTEXT}
${audienceContext}

TASK: Suggest healthier alternatives to unhealthy snacks

CURRENT SNACKS USER LOVES:
${inputs.currentSnacks.join(", ")}

GOALS: ${inputs.goals?.join(", ") || "General health"}

REQUIREMENTS:
1. For each unhealthy snack, suggest a healthier alternative
2. Match the taste profile (sweet, salty, crunchy, creamy, etc.)
3. Explain why the alternative is better
4. Suggest where to buy (UK supermarkets)
5. Make alternatives realistic and appealing
6. Consider busy parents who need convenient options

OUTPUT FORMAT (JSON):
{
  "alternatives": [
    {
      "unhealthySnack": "Crisps",
      "healthyAlternative": "Popcorn (air-popped or lightly salted)",
      "reason": "Lower in fat and calories, whole grain, more filling",
      "tasteProfile": "Salty, crunchy",
      "where": "Tesco, Sainsbury's"
    }
  ],
  "generalTips": [
    "Keep healthy snacks visible and accessible",
    "Pre-portion snacks to avoid overeating"
  ]
}

IMPORTANT:
- Be realistic - suggest actual products people will enjoy
- Don't be too restrictive
- Focus on "better" not "perfect"
- Make it practical for busy families`;

  return prompt;
}

// ============================================================================
// Exercise Planner Prompts
// ============================================================================

/**
 * Get the recommended exercise counts based on session duration
 */
function getExerciseCountsForDuration(time: string): { warmup: string; main: string; cooldown: string } {
  switch (time) {
    case "15min":
      return { warmup: "2-3", main: "3-4", cooldown: "1-2" };
    case "30min":
      return { warmup: "3-4", main: "5-6", cooldown: "2-3" };
    case "45min":
      return { warmup: "4-5", main: "7-8", cooldown: "3-4" };
    case "1hr":
      return { warmup: "5-6", main: "10-12", cooldown: "4-5" };
    default:
      return { warmup: "3-4", main: "5-6", cooldown: "2-3" };
  }
}

/**
 * Build exercise plan prompt with optional Gym-Fit exercise constraints.
 * When availableExercises is provided, the AI must select only from that list.
 */
export function buildExercisePlanPrompt(
  inputs: ExercisePlanInputs,
  availableExercises?: string
): string {
  const audienceContext = AUDIENCE_CONTEXT[inputs.audience];
  const exerciseCounts = getExerciseCountsForDuration(inputs.timePerSession);
  
  // Build exercise constraint section if available
  const exerciseConstraint = availableExercises
    ? `
EXERCISE LIBRARY:
You MUST select exercises from the following list only. Use the EXACT names as shown.
If you cannot find a suitable exercise for a body part, pick the closest match from the list.

${availableExercises}

IMPORTANT: The exercise names you output MUST match the names above exactly.
`
    : "";

  const prompt = `${BRAND_CONTEXT}
${audienceContext}

TASK: Create a personalized weekly exercise plan

USER DETAILS:
- Exercise location: ${inputs.location}
- Available equipment: ${inputs.equipment.join(", ") || "None (bodyweight only)"}
- Fitness level: ${inputs.fitnessLevel}
- Goals: ${inputs.goals.join(", ")}
- Time per session: ${inputs.timePerSession}
- Days per week: ${inputs.daysPerWeek}
- Injuries/limitations: ${inputs.injuries.join(", ") || "None"}
- Additional notes: ${inputs.limitations?.join(", ") || "None"}
${exerciseConstraint}
EXERCISE COUNTS (CRITICAL - for ${inputs.timePerSession} session):
- Warmup: Include ${exerciseCounts.warmup} different exercises
- Main Workout: Include ${exerciseCounts.main} different exercises (each with multiple sets)
- Cooldown: Include ${exerciseCounts.cooldown} different exercises/stretches

You MUST include enough exercises to fill the full ${inputs.timePerSession} session. Do NOT provide just 1-2 exercises.

REQUIREMENTS:
1. Create a ${inputs.daysPerWeek}-day workout plan
2. Each session MUST fill the full ${inputs.timePerSession} with the exercise counts specified above
3. Include warmup, main workout, and cooldown sections with the correct number of exercises
4. ${availableExercises ? "Use ONLY exercises from the EXERCISE LIBRARY above with exact names" : "Provide clear exercise descriptions with form tips"}
5. Offer modifications (easier/harder versions)
6. Focus on safety and gradual progression
7. Make it family-friendly where relevant

OUTPUT FORMAT (JSON):
{
  "weekPlan": [
    {
      "day": "Monday",
      "focus": "Upper body strength",
      "warmup": [
        {
          "name": "Arm Circles",
          "duration": "30 seconds",
          "description": "Stand with arms extended, make small circles",
          "formTips": ["Keep shoulders relaxed", "Gradually increase circle size"]
        }
      ],
      "mainWorkout": [
        {
          "name": "Push Up",
          "sets": 3,
          "reps": "8-12",
          "description": "...",
          "formTips": ["Keep core tight", "Full range of motion"],
          "modifications": {
            "easier": "Knee Push Up",
            "harder": "Diamond Push Up"
          }
        }
      ],
      "cooldown": [...],
      "estimatedTime": "30 minutes",
      "notes": ["Rest 60 seconds between sets"]
    }
  ],
  "progressionTips": [
    "Increase reps by 1-2 each week",
    "Add weight when exercises feel easy"
  ],
  "safetyReminders": [
    "Stop if you feel pain",
    "Stay hydrated",
    "Consult GP before starting if you have health concerns"
  ]
}

SPECIAL CONSIDERATIONS:
${inputs.audience === "mum" ? "- Include postnatal-safe exercises\n- Mention pelvic floor awareness" : ""}
${inputs.audience === "grandparents" ? "- Focus on low-impact options\n- Emphasize joint-friendly movements" : ""}
- Make it realistic and sustainable
- Include rest days
- Progress gradually`;

  return prompt;
}

// ============================================================================
// Supplement Suggester Prompts
// ============================================================================

export function buildSupplementSuggestionsPrompt(inputs: SupplementInputs): string {
  const audienceContext = AUDIENCE_CONTEXT[inputs.audience];
  
  const prompt = `${BRAND_CONTEXT}
${audienceContext}

TASK: Suggest appropriate supplements based on user needs

USER PROFILE:
- Age range: ${inputs.ageRange}
- Biological sex: ${inputs.biologicalSex}
- Goals: ${inputs.goals.join(", ")}
- Health conditions: ${inputs.healthConditions.join(", ") || "None reported"}
- Current medications: ${inputs.currentMedications.join(", ") || "None reported"}
- Diet type: ${inputs.dietType}
- Budget preference: ${inputs.budgetPreference}

CRITICAL SAFETY GUIDELINES:
1. Always emphasize consulting a GP before starting supplements
2. Highlight potential interactions with medications
3. Never make medical claims or guarantees
4. Focus on general wellness support
5. Recommend evidence-based supplements
6. Mention NHS and NICE guidance where relevant

REQUIREMENTS:
1. Suggest 3-5 supplements maximum
2. Explain WHY each is suggested
3. Provide general dosage guidance (with GP consultation caveat)
4. List quality markers to look for
5. Suggest UK-available brands as examples
6. Warn about potential interactions

OUTPUT FORMAT (JSON):
{
  "suggestions": [
    {
      "name": "Vitamin D3",
      "reason": "NHS recommends for all UK adults, especially in winter. Supports bone health and immune function.",
      "dosageGuidance": "10mcg (400 IU) daily as per NHS guidance. Consult GP for higher doses.",
      "qualityMarkers": ["Third-party tested", "Contains D3 (not D2)", "With vitamin K2 for better absorption"],
      "ukBrands": ["Holland & Barrett", "Vitabiotics", "Solgar UK"],
      "warnings": ["Can interact with heart medications", "Consult GP if you have kidney problems"],
      "bestTakenWith": "Food containing fat for better absorption"
    }
  ],
  "generalAdvice": [
    "Food first: aim to get nutrients from diet where possible",
    "Buy from reputable suppliers",
    "Check for third-party testing"
  ],
  "disclaimer": "This information is for general wellness purposes only. Always consult your GP or a registered dietitian before starting any supplement regimen, especially if you are pregnant, breastfeeding, taking medication, or have health conditions.",
  "consultationReminder": "Book a GP appointment to discuss your specific needs and check for potential interactions with your medications."
}

IMPORTANT:
- Be conservative with recommendations
- Emphasize "food first" approach
- Never claim to treat or cure conditions
- Always mention GP consultation
- Consider audience-specific needs (e.g., prenatal vitamins for mums)`;

  return prompt;
}

// ============================================================================
// Product Safety Checker Prompts
// ============================================================================

export function buildProductSafetyPrompt(inputs: ProductSafetyInputs): string {
  const audienceContext = AUDIENCE_CONTEXT[inputs.audience];
  
  const prompt = `${BRAND_CONTEXT}
${audienceContext}

TASK: Analyze product safety and suggest healthier alternatives

PRODUCT DETAILS:
${inputs.barcode ? `- Barcode: ${inputs.barcode}` : ""}
${inputs.productName ? `- Product: ${inputs.productName}` : ""}
${inputs.brand ? `- Brand: ${inputs.brand}` : ""}
${inputs.category ? `- Category: ${inputs.category}` : ""}
${inputs.ingredientList ? `\nINGREDIENTS:\n${inputs.ingredientList}` : ""}

REQUIREMENTS:
1. Analyze the product's safety and ingredient quality
2. Assign a safety score from 1-10 (1=avoid, 10=excellent)
3. Flag concerning ingredients with explanations
4. Highlight positive aspects
5. Suggest 3-5 healthier alternatives available in UK
6. Provide practical advice

SCORING CRITERIA:
- 9-10: Clean ingredients, minimal processing, safe for all
- 7-8: Generally good, minor concerns
- 5-6: Some concerning ingredients, use with caution
- 3-4: Multiple red flags, look for alternatives
- 1-2: Highly concerning, avoid

OUTPUT FORMAT (JSON):
{
  "productName": "Product name",
  "brand": "Brand name",
  "safetyScore": 7,
  "overallAssessment": "Brief overall summary",
  "ingredientAnalysis": [
    {
      "name": "Sodium benzoate",
      "concern": "moderate",
      "explanation": "Common preservative, generally safe in small amounts but some people may be sensitive",
      "alternatives": ["Vitamin E", "Rosemary extract"]
    }
  ],
  "redFlags": [
    "Contains artificial colours",
    "High sugar content"
  ],
  "positives": [
    "No artificial sweeteners",
    "Contains whole grains"
  ],
  "alternatives": [
    {
      "name": "Alternative product name",
      "brand": "Brand",
      "whyBetter": "No artificial additives, organic ingredients",
      "safetyScore": 9,
      "availableAt": ["Waitrose", "Holland & Barrett"]
    }
  ],
  "tips": [
    "Check labels for these ingredients",
    "Consider making homemade versions"
  ]
}

IMPORTANT:
- Be balanced - not everything is dangerous
- Consider the audience (e.g., products safe for babies)
- Use plain English, not scientific jargon
- Focus on actionable advice
- Mention UK-specific concerns (e.g., MHRA guidance)
- Be honest but not alarmist`;

  return prompt;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getSystemPrompt(feature: string): string {
  return `${BRAND_CONTEXT}

You are generating ${feature} advice for UK families with young children.

RESPONSE REQUIREMENTS:
- Output valid JSON only (no markdown, no explanation text)
- Use British English spelling and terminology
- Reference UK brands, supermarkets, and guidelines
- Be practical and realistic for busy families
- Always prioritize safety
- Never make medical claims

Remember: You provide general wellness information, not medical advice.`;
}
