import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next/types";
import WellnessHero from "@/components/wellness/WellnessHero";
import AudienceSelector from "@/components/wellness/AudienceSelector";
import type { Audience } from "@/lib/wellness/types";

const audiences: Audience[] = ["mum", "dad", "couples", "family", "grandparents"];

const audienceData: Record<
  Audience,
  {
    title: string;
    subtitle: string;
    description: string;
  }
> = {
  mum: {
    title: "Wellness for Mums",
    subtitle:
      "Personalised health tools designed for busy mums balancing childcare, work, and self-care.",
    description:
      "Whether you're navigating postnatal recovery, looking for quick healthy meals, or finding time for exercise, our tools are here to support you.",
  },
  dad: {
    title: "Wellness for Dads",
    subtitle:
      "Practical health and fitness advice for active dads who want to stay energised.",
    description:
      "Get meal plans that fit your schedule, workout routines you can stick to, and wellness guidance that works for busy fathers.",
  },
  couples: {
    title: "Wellness for Couples",
    subtitle:
      "Health and fitness plans designed for partners to achieve goals together.",
    description:
      "Plan nutritious meals for two, find couple-friendly workouts, and support each other's wellness journey—whether you're expecting, newly parenting, or simply prioritising health as a team.",
  },
  family: {
    title: "Wellness for Families",
    subtitle:
      "Healthy meal plans and activities that bring the whole family together.",
    description:
      "Plan nutritious meals everyone will enjoy, find activities that get the whole family moving, and make informed choices about products you use.",
  },
  grandparents: {
    title: "Wellness for Grandparents",
    subtitle:
      "Gentle, age-appropriate wellness guidance for grandparents caring for grandchildren.",
    description:
      "Get meal ideas suitable for all ages, exercise routines, and product safety information to keep your grandchildren safe and healthy.",
  },
};

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

  const data = audienceData[audience as Audience];

  return {
    title: `${data.title} | Parent Helper`,
    description: data.subtitle,
  };
}

export default async function AudienceWellnessPage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  
  if (!audiences.includes(audience as Audience)) {
    notFound();
  }

  const data = audienceData[audience as Audience];

  const tools = [
    {
      title: "Meal Planner",
      description:
        "Get a personalised 7-day meal plan with recipes, shopping lists, and cost estimates.",
      href: `/wellness/${audience}/diet`,
      features: [
        "Customised to your preferences and dietary needs",
        "UK supermarket shopping lists",
        "Quick and family-friendly recipes",
        "Nutritional guidance",
      ],
    },
    {
      title: "Exercise Planner",
      description:
        "Custom workout routines based on your fitness level, equipment, and available time.",
      href: `/wellness/${audience}/exercise`,
      features: [
        "Home or gym workouts",
        "Beginner to advanced levels",
        "15-60 minute sessions",
        "Form tips and modifications",
      ],
    },
    {
      title: "💊 Supplement Guide",
      description:
        "Evidence-based supplement suggestions tailored to your health goals and needs.",
      href: `/wellness/${audience}/supplements`,
      features: [
        "Based on NHS guidelines",
        "UK-available brands",
        "Safety and interaction warnings",
        "Dosage guidance",
      ],
    },
    {
      title: "🔍 Product Safety Checker",
      description:
        "Scan barcodes or search products to check toxicity levels, eco credentials, and ingredient safety for your family.",
      href: `/wellness/${audience}/product-check`,
      features: [
        "Barcode scanning",
        "Toxicity and safety analysis",
        "Eco credentials and sustainability ratings",
        "Ingredient breakdown and health scores",
      ],
    },
  ];

  return (
    <div className="section space-y-12 py-12">
      {/* Audience Selector */}
      <AudienceSelector currentAudience={audience as Audience} />

      {/* Hero */}
      <WellnessHero title={data.title} subtitle={data.subtitle} />

      {/* Description */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-lg leading-relaxed text-charcoal/80">
          {data.description}
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block rounded-2xl bg-sage-dark p-6 shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02] hover:bg-sage-darker"
          >
            <h3 className="mb-3 text-xl font-semibold text-white group-hover:text-white/95 transition-colors">
              {tool.title}
            </h3>
            <p className="mb-4 text-white/90">{tool.description}</p>
            <ul className="space-y-2">
              {tool.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-white/85"
                >
                  <span className="text-white font-semibold">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
              Get Started
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-6">
        <h3 className="mb-2 font-semibold text-charcoal">
          Health Information Disclaimer
        </h3>
        <p className="text-sm leading-relaxed text-charcoal/80">
          These tools provide general wellness information and are not a
          substitute for professional medical advice. Always consult your GP or
          a qualified healthcare professional before making significant changes
          to your diet, exercise, or supplement routine.
        </p>
      </div>
    </div>
  );
}

