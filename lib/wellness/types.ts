/**
 * Wellness Feature Types
 * 
 * TypeScript types for all wellness features including meal planning,
 * exercise planning, supplement suggestions, and product safety checking.
 */

// ============================================================================
// Common Types
// ============================================================================

export type Audience = "mum" | "dad" | "couples" | "family" | "grandparents";

export type PlanType = "meal" | "exercise" | "supplement" | "product";

export type BudgetPreference = "budget-friendly" | "moderate" | "premium";

// ============================================================================
// Meal Planner Types
// ============================================================================

export type CookingTime = "15min" | "30min" | "1hr" | "1hr+";

export type DietGoal =
  | "weight-loss"
  | "muscle-gain"
  | "energy"
  | "heart-health"
  | "cholesterol-control"
  | "diabetic-friendly"
  | "gut-health"
  | "general-wellness";

export type UKSupermarket =
  | "Tesco"
  | "Sainsbury's"
  | "Aldi"
  | "Lidl"
  | "M&S"
  | "Waitrose"
  | "Asda"
  | "Morrisons";

export interface FamilySize {
  adults: number;
  childrenAges: {
    babies: number; // 0-1 years
    toddlers: number; // 1-3 years
    preschool: number; // 3-5 years
    schoolAge: number; // 5+ years
  };
}

// Goal-specific data types for personalized meal planning
export type ProteinTarget = "high" | "very-high";
export type WeeklyWeightLossTarget = "0.25kg" | "0.5kg" | "0.75kg" | "1kg";
export type BiologicalSexForCalc = "male" | "female";

export interface MuscleGainData {
  currentWeight: number; // kg
  targetWeight?: number; // kg (optional)
  activityLevel: ActivityLevel;
  proteinTarget: ProteinTarget;
  biologicalSex: BiologicalSexForCalc;
}

export interface WeightLossData {
  currentWeight: number; // kg
  age: number; // years
  height: number; // cm
  activityLevel: ActivityLevel;
  targetWeeklyLoss: WeeklyWeightLossTarget;
  biologicalSex: BiologicalSexForCalc;
}

export interface HeartHealthData {
  currentCholesterol?: string; // optional, e.g., "5.2 mmol/L"
  familyHistoryHeartDisease: boolean;
}

export interface GoalSpecificData {
  muscleGain?: MuscleGainData;
  weightLoss?: WeightLossData;
  heartHealth?: HeartHealthData;
}

export interface MealPlanInputs {
  audience: Audience;
  likes: string[];
  dislikes: string[];
  cookingTime: CookingTime;
  preferredShops: UKSupermarket[];
  goals: DietGoal[];
  allergies?: string[];
  healthConditions?: string[];
  budgetPreference: BudgetPreference;
  familySize?: FamilySize;
  goalSpecificData?: GoalSpecificData;
}

export interface Recipe {
  name: string;
  ingredients: string[];
  method: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  nutritionInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    saturatedFat?: string;
    cholesterol?: string;
  };
  heartHealthScore?: number; // 1-10 scale, only present for heart health/cholesterol goals
}

export interface SnackInfo {
  name: string;
  nutritionInfo?: {
    calories?: string;
    protein?: string;
    saturatedFat?: string;
    cholesterol?: string;
  };
  heartHealthScore?: number; // 1-10 scale
}

export interface DayMealPlan {
  day: string;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
  snacks: string[] | SnackInfo[]; // Can be simple strings or detailed snack info
}

export interface ShoppingListCategory {
  category: string;
  items: string[];
}

export interface MealPlan {
  weekPlan: DayMealPlan[];
  shoppingList: ShoppingListCategory[];
  estimatedCost: {
    min: number;
    max: number;
    currency: "GBP";
  };
  nutritionSummary?: string;
  tips?: string[];
}

// ============================================================================
// Nutrition Calculator Types
// ============================================================================

export type ActivityLevel = "sedentary" | "lightly-active" | "moderately-active" | "very-active";

export type PersonType = "adult-male" | "adult-female" | "baby" | "toddler" | "preschool" | "school-age";

export interface MacroBreakdown {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface PersonNutrition {
  label: string; // e.g., "Adult 1", "Toddler 1"
  personType: PersonType;
  dailyCalories: number;
  macros: MacroBreakdown;
  mealCalories: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
}

export interface NutritionBreakdown {
  people: PersonNutrition[];
  totalDailyCalories: number;
  totalMacros: MacroBreakdown;
  disclaimer: string;
}

export interface NutritionInputs {
  familySize: FamilySize;
  activityLevel?: ActivityLevel;
  goals: DietGoal[];
}

export interface SnackAlternative {
  unhealthySnack: string;
  healthyAlternative: string;
  reason: string;
  tasteProfile: string;
  where: string;
}

export interface SnackGeneratorInputs {
  audience: Audience;
  currentSnacks: string[];
  goals?: DietGoal[];
}

export interface SnackGeneratorResult {
  alternatives: SnackAlternative[];
  generalTips: string[];
}

// ============================================================================
// Exercise Planner Types
// ============================================================================

export type ExerciseLocation = "home-bodyweight" | "home-with-equipment" | "gym";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export type ExerciseGoal =
  | "strength"
  | "weight-loss"
  | "recomposition"
  | "flexibility"
  | "energy"
  | "stress-relief"
  | "postnatal-recovery"
  | "general-fitness";

export type ExerciseTime = "15min" | "30min" | "45min" | "1hr";

export interface ExercisePlanInputs {
  audience: Audience;
  location: ExerciseLocation;
  equipment: string[];
  fitnessLevel: FitnessLevel;
  goals: ExerciseGoal[];
  timePerSession: ExerciseTime;
  daysPerWeek: number;
  injuries: string[];
  limitations?: string[];
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  restTime?: string;
  description: string;
  formTips: string[];
  modifications?: {
    easier?: string;
    harder?: string;
  };
  equipment?: string[];
  // Gym-Fit API enrichment (optional)
  gymFitId?: string;
  imageUrl?: string;
  gymFitInstructions?: string[];
  targetMuscles?: string[];
  variations?: Array<{
    id: string;
    name: string;
    bodyPart: string;
    image: string;
  }>;
}

export interface WorkoutSession {
  day: string;
  focus: string;
  warmup: Exercise[];
  mainWorkout: Exercise[];
  cooldown: Exercise[];
  estimatedTime: string;
  notes?: string[];
}

export interface ExercisePlan {
  weekPlan: WorkoutSession[];
  progressionTips: string[];
  safetyReminders: string[];
  expectedResults?: string;
}

// ============================================================================
// Supplement Suggester Types
// ============================================================================

export type AgeRange = "18-30" | "31-45" | "46-60" | "60+";

export type BiologicalSex = "male" | "female" | "prefer-not-to-say";

export type SupplementGoal =
  | "energy"
  | "sleep"
  | "immunity"
  | "joint-health"
  | "mental-clarity"
  | "stress-management"
  | "prenatal"
  | "postnatal"
  | "bone-health"
  | "heart-health";

export type DietType = "omnivore" | "vegetarian" | "vegan" | "pescatarian";

export interface SupplementInputs {
  audience: Audience;
  ageRange: AgeRange;
  biologicalSex: BiologicalSex;
  goals: SupplementGoal[];
  healthConditions: string[];
  currentMedications: string[];
  dietType: DietType;
  budgetPreference: BudgetPreference;
}

export interface SupplementSuggestion {
  name: string;
  reason: string;
  dosageGuidance: string;
  qualityMarkers: string[];
  ukBrands: string[];
  warnings: string[];
  interactions?: string[];
  bestTakenWith?: string;
  notes?: string[];
}

export interface SupplementResult {
  suggestions: SupplementSuggestion[];
  generalAdvice: string[];
  disclaimer: string;
  consultationReminder: string;
}

// ============================================================================
// Product Safety Types
// ============================================================================

export type ProductCategory =
  | "food"
  | "skincare"
  | "haircare"
  | "household"
  | "baby-care"
  | "personal-care"
  | "other";

export interface ProductSafetyInputs {
  audience: Audience;
  barcode?: string;
  productName?: string;
  brand?: string;
  ingredientList?: string;
  category?: ProductCategory;
}

export interface IngredientAnalysis {
  name: string;
  concern: "none" | "low" | "moderate" | "high";
  explanation: string;
  alternatives?: string[];
}

export interface ProductAlternative {
  name: string;
  brand: string;
  whyBetter: string;
  safetyScore: number;
  availableAt?: string[];
}

export interface ProductSafetyResult {
  productName: string;
  brand?: string;
  safetyScore: number; // 1-10
  overallAssessment: string;
  ingredientAnalysis: IngredientAnalysis[];
  redFlags: string[];
  positives: string[];
  alternatives: ProductAlternative[];
  tips: string[];
}

// ============================================================================
// Database Types
// ============================================================================

export interface WellnessProfile {
  id: string;
  user_id: string;
  audience: Audience;
  dietary_likes?: string[];
  dietary_dislikes?: string[];
  allergies?: string[];
  preferred_shops?: string[];
  cooking_time?: string;
  diet_goals?: string[];
  budget_preference?: string;
  exercise_location?: string;
  available_equipment?: string[];
  fitness_level?: string;
  exercise_goals?: string[];
  exercise_time?: string;
  exercise_days?: number;
  injuries?: string[];
  age_range?: string;
  biological_sex?: string;
  health_conditions?: string[];
  current_medications?: string[];
  diet_type?: string;
  created_at: string;
  updated_at: string;
}

export interface WellnessPlan {
  id: string;
  user_id?: string;
  session_id?: string;
  audience: Audience;
  plan_type: PlanType;
  plan_data: MealPlan | ExercisePlan | SupplementResult | ProductSafetyResult;
  inputs?: Record<string, unknown>;
  created_at: string;
}

export interface ProductSafetyCache {
  id: string;
  barcode?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  safety_score: number;
  analysis: Record<string, unknown>;
  alternatives?: Record<string, unknown>;
  ingredient_list?: string;
  created_at: string;
  expires_at: string;
  lookup_count: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface WellnessActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export type MealPlanResult = WellnessActionResult<MealPlan>;
export type SnackResult = WellnessActionResult<SnackGeneratorResult>;
export type ExercisePlanResult = WellnessActionResult<ExercisePlan>;
export type SupplementSuggestionResult = WellnessActionResult<SupplementResult>;
export type ProductSafetyAnalysisResult = WellnessActionResult<ProductSafetyResult>;

// ============================================================================
// UI Component Props
// ============================================================================

export interface AudienceSelectorProps {
  currentAudience: Audience;
  onAudienceChange?: (audience: Audience) => void;
}

export interface WellnessCardData {
  title: string;
  description: string;
  icon?: string;
  href: string;
  audience?: Audience;
}

export interface MedicalDisclaimerProps {
  variant?: "banner" | "inline" | "modal";
  customMessage?: string;
}

// ============================================================================
// Pregnancy & Baby Nutrition Types
// ============================================================================

export type NutritionStage = "pregnancy" | "breastfeeding" | "bottle-feeding" | "weaning";

export interface NutritionStageContent {
  id: number;
  stage: NutritionStage;
  title: string;
  intro_text: string;
  key_guidance: string[];
  cheats_and_tips: string[];
  linked_blog_tags: string[];
  safety_disclaimers: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionFood {
  id: number;
  name: string;
  stage_tags: NutritionStage[];
  why_it_helps: string;
  allergens?: string | null;
  nutrition_star_rating: 1 | 2 | 3 | 4 | 5;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionEquipment {
  id: number;
  name: string;
  stage_tags: NutritionStage[];
  description: string;
  buying_guidance: string;
  affiliate_url?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionPageData {
  stage: NutritionStageContent;
  foods: NutritionFood[];
  equipment: NutritionEquipment[];
  relatedBlogs: BlogPostSummary[];
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  hero_image?: string | null;
  category?: string | null;
  created_at: string;
}

// Nutrition stage metadata for UI
export const NUTRITION_STAGE_META: Record<NutritionStage, { label: string; icon: string; description: string }> = {
  pregnancy: {
    label: "Pregnancy",
    icon: "🤰",
    description: "Nutrition guidance for a healthy pregnancy",
  },
  breastfeeding: {
    label: "Breastfeeding",
    icon: "🤱",
    description: "What to eat while breastfeeding",
  },
  "bottle-feeding": {
    label: "Bottle Feeding",
    icon: "🍼",
    description: "Formula feeding guidance and safety",
  },
  weaning: {
    label: "Weaning",
    icon: "🥄",
    description: "First foods and weaning tips",
  },
};

