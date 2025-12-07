import { Child } from "@/shared/schema";

const MEAL_EXERCISE_EXPERIMENT = process.env.MEAL_EXERCISE_EXPERIMENT === "true";

export interface MealPlanDay {
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
}

export interface MealPlan {
    childName: string;
    ageMonths: number;
    days: MealPlanDay[];
}

/**
 * Generate a 7-day meal plan placeholder based on child profile
 * This is a stub implementation - in production, this would use AI or a meal database
 */
export function profileToMealPlan(child: Child): MealPlan | null {
    if (!MEAL_EXERCISE_EXPERIMENT) {
        return null;
    }

    if (!child || !child.birthdate) {
        return null;
    }

    // Calculate age in months
    const birth = new Date(child.birthdate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const ageMonths = years * 12 + months;

    // Consider allergies
    const allergies = child.allergies || [];
    const hasNutAllergy = allergies.some((a) => a.toLowerCase().includes("nut"));
    const hasDairyAllergy = allergies.some((a) => a.toLowerCase().includes("dairy"));

    // Age-appropriate meal suggestions (placeholder)
    const breakfastOptions = ageMonths < 12
        ? ["Baby porridge", "Pureed fruit", "Soft scrambled eggs"]
        : ageMonths < 24
          ? ["Oatmeal with fruit", "Toast with avocado", "Yogurt with berries"]
          : ["Cereal with milk", "Pancakes", "Eggs and toast"];

    const lunchOptions = ageMonths < 12
        ? ["Pureed vegetables", "Soft pasta", "Mashed sweet potato"]
        : ageMonths < 24
          ? ["Sandwich fingers", "Pasta salad", "Soup with bread"]
          : ["Chicken and rice", "Pasta", "Sandwich"];

    const dinnerOptions = ageMonths < 12
        ? ["Pureed meat and vegetables", "Soft fish", "Lentil puree"]
        : ageMonths < 24
          ? ["Fish fingers", "Pasta with sauce", "Chicken pieces"]
          : ["Fish and vegetables", "Pasta", "Chicken dinner"];

    const snackOptions = ageMonths < 12
        ? ["Soft fruit pieces", "Rice cakes"]
        : ageMonths < 24
          ? ["Fruit", "Cheese cubes", "Crackers"]
          : ["Fruit", "Yogurt", "Crackers with cheese"];

    // Filter out allergens
    const filterAllergens = (items: string[]) => {
        return items.filter((item) => {
            if (hasNutAllergy && item.toLowerCase().includes("nut")) return false;
            if (hasDairyAllergy && (item.toLowerCase().includes("cheese") || item.toLowerCase().includes("milk") || item.toLowerCase().includes("yogurt"))) return false;
            return true;
        });
    };

    const days: MealPlanDay[] = [
        { day: "Monday", breakfast: breakfastOptions[0], lunch: lunchOptions[0], dinner: dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
        { day: "Tuesday", breakfast: breakfastOptions[1] || breakfastOptions[0], lunch: lunchOptions[1] || lunchOptions[0], dinner: dinnerOptions[1] || dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
        { day: "Wednesday", breakfast: breakfastOptions[2] || breakfastOptions[0], lunch: lunchOptions[2] || lunchOptions[0], dinner: dinnerOptions[2] || dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
        { day: "Thursday", breakfast: breakfastOptions[0], lunch: lunchOptions[0], dinner: dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
        { day: "Friday", breakfast: breakfastOptions[1] || breakfastOptions[0], lunch: lunchOptions[1] || lunchOptions[0], dinner: dinnerOptions[1] || dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
        { day: "Saturday", breakfast: breakfastOptions[2] || breakfastOptions[0], lunch: lunchOptions[2] || lunchOptions[0], dinner: dinnerOptions[2] || dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
        { day: "Sunday", breakfast: breakfastOptions[0], lunch: lunchOptions[0], dinner: dinnerOptions[0], snacks: filterAllergens(snackOptions).slice(0, 2) },
    ];

    return {
        childName: child.first_name,
        ageMonths,
        days,
    };
}

