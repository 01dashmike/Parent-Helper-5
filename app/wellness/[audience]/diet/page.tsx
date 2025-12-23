import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import WellnessHero from "@/components/wellness/WellnessHero";
import AudienceSelector from "@/components/wellness/AudienceSelector";
import MealPlannerClient from "./_components/MealPlannerClient";
import type { Audience } from "@/lib/wellness/types";

const audiences: Audience[] = ["mum", "dad", "couples", "family", "grandparents"];

export async function generateStaticParams() {
  return audiences.map((audience) => ({
    audience,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience } = await params;
  
  if (!audiences.includes(audience as Audience)) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `Meal Planner for ${audience.charAt(0).toUpperCase() + audience.slice(1)}s | Parent Helper`,
    description: `Get a personalized 7-day meal plan with recipes, shopping lists, and nutrition tips.`,
  };
}

export default async function DietPage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  
  if (!audiences.includes(audience as Audience)) {
    notFound();
  }

  return (
    <div className="section space-y-8 py-12">
      <AudienceSelector currentAudience={audience as Audience} />
      
      <WellnessHero
        title="Meal Planner & Snack Generator"
        subtitle="Get a personalised 7-day meal plan with recipes, shopping lists, and healthier snack alternatives."
      />

      <MealPlannerClient audience={audience as Audience} />
    </div>
  );
}
