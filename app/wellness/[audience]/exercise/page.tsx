import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import WellnessHero from "@/components/wellness/WellnessHero";
import AudienceSelector from "@/components/wellness/AudienceSelector";
import ExercisePlannerClient from "./_components/ExercisePlannerClient";
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
    title: `Exercise Planner for ${audience.charAt(0).toUpperCase() + audience.slice(1)}s | Parent Helper`,
    description: `Get a personalized exercise plan tailored to your fitness level, goals, and available time.`,
  };
}

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience} = await params;
  
  if (!audiences.includes(audience as Audience)) {
    notFound();
  }

  return (
    <div className="section space-y-8 py-12">
      <AudienceSelector currentAudience={audience as Audience} />
      
      <WellnessHero
        title="Exercise Planner"
        subtitle="Get a personalised workout plan tailored to your fitness level, available equipment, and goals."
      />

      <ExercisePlannerClient audience={audience as Audience} />
    </div>
  );
}
