import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import WellnessHero from "@/components/wellness/WellnessHero";
import AudienceSelector from "@/components/wellness/AudienceSelector";
import MedicalDisclaimer from "@/components/wellness/MedicalDisclaimer";
import SupplementClient from "./_components/SupplementClient";
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
    title: `Supplement Guide for ${audience.charAt(0).toUpperCase() + audience.slice(1)}s | Parent Helper`,
    description: `Get evidence-based supplement suggestions tailored to your health goals and needs.`,
  };
}

export default async function SupplementsPage({
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
        title="Supplement Guide"
        subtitle="Get evidence-based supplement suggestions based on NHS guidelines and your health goals."
      />

      <MedicalDisclaimer variant="banner" />

      <SupplementClient audience={audience as Audience} />
    </div>
  );
}
