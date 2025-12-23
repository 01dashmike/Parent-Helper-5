import { redirect } from "next/navigation";

// Redirect all audience-specific nutrition routes to the main nutrition wizard
export default function NutritionPage() {
  redirect("/health-wellness/nutrition");
}
