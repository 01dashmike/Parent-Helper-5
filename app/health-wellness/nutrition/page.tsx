import { Metadata } from "next";
import NutritionClient from "./_components/NutritionClient";

export const metadata: Metadata = {
  title: "Pregnancy & Baby Nutrition | Parent Helper",
  description: "Personalised nutrition guidance for pregnancy, breastfeeding, formula feeding, and weaning. Get NHS-aligned advice, meal ideas, and safety tips.",
  openGraph: {
    title: "Pregnancy & Baby Nutrition | Parent Helper",
    description: "Personalised nutrition guidance for pregnancy, breastfeeding, formula feeding, and weaning.",
    type: "article",
  },
};

export default function NutritionPage() {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sage via-sage/90 to-terracotta/30 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium text-white">
            Health & Wellness
          </span>
          <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Pregnancy & Baby Nutrition
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Practical, trustworthy guidance for every stage of your feeding journey. 
            From pregnancy through weaning, we&apos;re here to help.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <NutritionClient />
      </div>
    </div>
  );
}
