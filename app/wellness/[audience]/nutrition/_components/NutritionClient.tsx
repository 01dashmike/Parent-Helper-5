"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { 
  Audience,
  NutritionStage, 
  NutritionStageContent, 
  NutritionFood, 
  NutritionEquipment, 
  BlogPostSummary 
} from "@/lib/wellness/types";
import NutritionRecipeFinder from "@/app/health-wellness/nutrition/_components/NutritionRecipeFinder";

const STAGE_META: Record<NutritionStage, { label: string; icon: string; description: string }> = {
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

interface NutritionClientProps {
  audience: Audience;
  initialStage: NutritionStage;
  stageData: NutritionStageContent;
  foods: NutritionFood[];
  equipment: NutritionEquipment[];
  relatedBlogs: BlogPostSummary[];
  allStages: Array<{ stage: NutritionStage; title: string; display_order: number }>;
}

// Star rating component
function StarRating({ rating, showDisclaimer = false }: { rating: number; showDisclaimer?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
      <span className="sr-only">{rating} out of 5 stars</span>
      {showDisclaimer && (
        <span className="ml-2 text-xs text-charcoal/50" title="Editorial rating, not medical advice">
          ⓘ
        </span>
      )}
    </div>
  );
}

export default function NutritionClient({
  audience,
  initialStage,
  stageData,
  foods,
  equipment,
  relatedBlogs,
  allStages,
}: NutritionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStage, setCurrentStage] = useState<NutritionStage>(initialStage);

  const handleStageChange = useCallback((stage: NutritionStage) => {
    setCurrentStage(stage);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("stage", stage);
    router.push(`/wellness/${audience}/nutrition?${params.toString()}`, { scroll: false });
  }, [router, searchParams, audience]);

  return (
    <div className="space-y-8">
      {/* Stage Navigation Tabs */}
      <nav aria-label="Nutrition stages" className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {allStages.map(({ stage, title }) => {
            const meta = STAGE_META[stage];
            const isActive = currentStage === stage;
            return (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sage text-white shadow-md"
                    : "bg-white text-charcoal hover:bg-sage/10 border border-sage/20"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span aria-hidden="true">{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="space-y-10">
        {/* 1. Intro / Overview */}
        <section className="rounded-2xl bg-white p-6 shadow-soft md:p-8">
          <h2 className="mb-4 text-2xl font-bold text-charcoal md:text-3xl">
            {stageData.title}
          </h2>
          <p className="text-lg leading-relaxed text-charcoal/80">
            {stageData.intro_text}
          </p>
        </section>

        {/* 2. Key Guidance */}
        <section className="rounded-2xl bg-sage/10 p-6 md:p-8">
          <h2 className="mb-4 text-xl font-bold text-charcoal">
            Key Guidance
          </h2>
          <ul className="space-y-3">
            {stageData.key_guidance.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-white">
                  ✓
                </span>
                <span className="text-charcoal/80">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Cheats & Top Tips */}
        <section className="rounded-2xl bg-terracotta/10 p-6 md:p-8">
          <h2 className="mb-4 text-xl font-bold text-charcoal">
            💡 Cheats & Top Tips
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {stageData.cheats_and_tips.map((tip, index) => (
              <div
                key={index}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-charcoal/80">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Food Suggestions */}
        {foods.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">
                🥗 Recommended Foods
              </h2>
              <p className="text-xs text-charcoal/50">
                ★ ratings are editorial, not medical advice
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {foods.map((food) => (
                <article
                  key={food.id}
                  className="rounded-2xl bg-white p-5 shadow-soft transition-shadow hover:shadow-soft-lg"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-charcoal">{food.name}</h3>
                    <StarRating rating={food.nutrition_star_rating} />
                  </div>
                  <p className="mb-3 text-sm text-charcoal/70">{food.why_it_helps}</p>
                  {food.allergens && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <span className="font-medium">⚠️ Allergen:</span> {food.allergens}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 5. Recipe Finder */}
        <section className="rounded-2xl bg-white p-6 shadow-soft md:p-8">
          <h2 className="mb-4 text-xl font-bold text-charcoal">
            🍳 Recipe Finder
          </h2>
          <p className="mb-6 text-charcoal/70">
            Find recipes tailored to your {STAGE_META[currentStage].label.toLowerCase()} nutrition needs.
          </p>
          <NutritionRecipeFinder stage={currentStage} />
        </section>

        {/* 6. Equipment Suggestions */}
        {equipment.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-charcoal">
              🛒 Equipment & Essentials
            </h2>
            <p className="text-sm text-charcoal/60">
              Helpful products for this stage. Links may be affiliate links – see our{" "}
              <Link href="/about#affiliate-disclosure" className="text-sage underline">
                disclosure policy
              </Link>.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {equipment.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-soft"
                >
                  <div className="flex gap-4">
                    {item.image_url && (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal">{item.name}</h3>
                      <p className="mt-1 text-sm text-charcoal/70">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-sage/5 p-3">
                    <p className="text-xs font-medium text-charcoal/60">What to look for:</p>
                    <p className="mt-1 text-sm text-charcoal/80">{item.buying_guidance}</p>
                  </div>
                  {item.affiliate_url && (
                    <a
                      href={item.affiliate_url}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage/90"
                    >
                      View Options
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7. Supporting Blogs */}
        {relatedBlogs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-charcoal">
              📚 Related Articles
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedBlogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.slug}`}
                  className="group block rounded-2xl bg-white shadow-soft transition-all hover:shadow-soft-lg hover:scale-[1.02]"
                >
                  {blog.hero_image && (
                    <div className="relative h-40 overflow-hidden rounded-t-2xl">
                      <Image
                        src={blog.hero_image}
                        alt=""
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-charcoal group-hover:text-sage">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
                        {blog.excerpt}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sage">
                      Read more <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Safety Disclaimers */}
        {stageData.safety_disclaimers && stageData.safety_disclaimers.length > 0 && (
          <section className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-6">
            <h2 className="mb-4 font-semibold text-charcoal">
              ⚠️ Important Safety Information
            </h2>
            <ul className="space-y-2 text-sm text-charcoal/80">
              {stageData.safety_disclaimers.map((disclaimer, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 text-terracotta">•</span>
                  <span>{disclaimer}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* General Disclaimer */}
        <section className="rounded-2xl border border-sage/30 bg-sage/5 p-6">
          <h3 className="mb-2 font-semibold text-charcoal">
            Health Information Disclaimer
          </h3>
          <p className="text-sm leading-relaxed text-charcoal/70">
            The information on this page is for general guidance only and should not replace 
            professional medical advice. Always consult your midwife, health visitor, GP, or 
            a registered dietitian before making significant changes to your diet or your 
            baby&apos;s feeding routine. If you have any concerns about your health or your 
            baby&apos;s health, seek medical advice promptly.
          </p>
        </section>

        {/* Back to Wellness Hub */}
        <div className="text-center">
          <Link
            href="/wellness"
            className="inline-flex items-center gap-2 rounded-full bg-charcoal/10 px-6 py-3 font-medium text-charcoal hover:bg-charcoal/20"
          >
            <span aria-hidden="true">←</span>
            Back to Health & Wellness
          </Link>
        </div>
      </div>
    </div>
  );
}

