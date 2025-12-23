import { Metadata } from "next";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv } from "@/lib/env";
import AdminNutritionClient from "./_components/AdminNutritionClient";
import type { NutritionStageContent, NutritionFood, NutritionEquipment } from "@/lib/wellness/types";

export const metadata: Metadata = {
  title: "Nutrition Content | Parent Helper Admin",
  description: "Manage pregnancy and baby nutrition content",
  robots: "noindex, nofollow",
};

export const revalidate = 0;

async function getNutritionData() {
  if (!hasSupabaseServerEnv()) {
    return { stages: [], foods: [], equipment: [] };
  }
  
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { stages: [], foods: [], equipment: [] };
  }

  const [stagesResult, foodsResult, equipmentResult] = await Promise.all([
    supabase
      .from("nutrition_stages")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("nutrition_foods")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("nutrition_equipment")
      .select("*")
      .order("display_order", { ascending: true }),
  ]);

  return {
    stages: (stagesResult.data || []) as NutritionStageContent[],
    foods: (foodsResult.data || []) as NutritionFood[],
    equipment: (equipmentResult.data || []) as NutritionEquipment[],
  };
}

export default async function AdminNutritionPage() {
  await requireAdminServerComponent();

  const data = await getNutritionData();

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Pregnancy & Baby Nutrition</h1>
          <p className="text-slateSoft text-sm">
            Manage nutrition stages, food suggestions, and equipment recommendations.
          </p>
        </header>
        <AdminNutritionClient 
          initialStages={data.stages}
          initialFoods={data.foods}
          initialEquipment={data.equipment}
        />
      </div>
    </div>
  );
}

