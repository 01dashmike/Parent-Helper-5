import Link from "next/link";
import WellnessHero from "@/components/wellness/WellnessHero";
import WellnessCTA from "@/components/wellness/WellnessCTA";
import WellnessLandingClient from "@/components/wellness/WellnessLandingClient";
import { isAuthenticated } from "@/lib/wellness/auth";

export default async function WellnessPage() {
  const authenticated = await isAuthenticated();
  const audiences = [
    {
      title: "Pregnancy & Baby",
      description:
        "Nutrition, exercise, and wellness guidance for expecting parents and those with newborns.",
      image: "https://images.unsplash.com/photo-1695783606162-c203d620364f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDEwODB8MHwxfHNlYXJjaHwyfHxwcmVnbmFuY3klMjBtYXRlcm5pdHklMjBjb3VwbGUlMjBoYXBweXxlbnwwfDJ8fHwxNzY2MzM4NzUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      href: "/wellness/pregnancy",
      imagePosition: "center 20%",
    },
    {
      title: "For Mums",
      description:
        "Personalised wellness plans designed for busy mums juggling childcare, work, and self-care.",
      image: "/images/categories/postnatal.webp",
      href: "/wellness/mum",
      imagePosition: "center 30%",
    },
    {
      title: "For Dads",
      description:
        "Practical health and fitness advice for active dads who want to stay energised and engaged.",
      image: "https://images.unsplash.com/photo-1729188180247-236c39e8200e?w=600&h=400&fit=crop",
      href: "/wellness/dad",
    },
    {
      title: "For Couples",
      description:
        "Wellness plans and activities designed for partners to enjoy together, whether expecting or simply prioritising health as a team.",
      image: "https://images.unsplash.com/photo-1758523421906-44f2f030b65c?w=600&h=400&fit=crop",
      href: "/wellness/couples",
    },
    {
      title: "For Families",
      description:
        "Healthy meal plans and activities that bring the whole family together. Tips for feeding picky children and making mealtimes easier.",
      image: "https://images.unsplash.com/photo-1764816650480-1fd68c7a8241?w=600&h=400&fit=crop",
      href: "/wellness/family",
    },
    {
      title: "For Grandparents",
      description:
        "Gentle, age-appropriate wellness guidance for grandparents caring for grandchildren.",
      image: "https://images.unsplash.com/photo-1758612897699-9cdd1a4361de?w=600&h=400&fit=crop",
      href: "/wellness/grandparents",
    },
  ];

  const features = [
    {
      title: "Meal Planner",
      description:
        "Get a personalised 7-day meal plan with recipes, shopping lists, and nutrition tips tailored to your preferences and goals.",
      backgroundImage: "/images/categories/meal-planner.webp",
      basePath: "/diet",
    },
    {
      title: "Pregnancy & Baby Nutrition",
      description:
        "Practical guidance for pregnancy, breastfeeding, bottle feeding, and weaning. NHS-aligned advice, recipes, and equipment recommendations.",
      backgroundImage: "https://images.unsplash.com/photo-1586102728466-46b99b3bc411?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDEwODB8MHwxfHNlYXJjaHw0fHxwcmVnbmFudCUyMHdvbWFuJTIwYnVtcCUyMGhvbWV8ZW58MHwwfHx8MTc2NjMzOTI0Mnww&ixlib=rb-4.1.0&q=80&w=1080",
      basePath: "/nutrition",
      directLink: "/health-wellness/nutrition",
      imagePosition: "center 25%",
    },
    {
      title: "Exercise Plans",
      description:
        "Custom workout routines for your fitness level, available equipment, and time constraints—whether at home or the gym.",
      backgroundImage: "/images/categories/exercise-plans.webp",
      basePath: "/exercise",
    },
    {
      title: "Supplement Guide",
      description:
        "Evidence-based supplement suggestions based on your health goals, with safety guidance and UK brand recommendations.",
      backgroundImage: "/images/categories/supplements.webp",
      basePath: "/supplements",
    },
    {
      title: "Product Safety Checker",
      description:
        "Scan barcodes or search products to see ingredient analysis, safety scores, and healthier alternatives.",
      backgroundImage: "/images/categories/product-safety.webp",
      basePath: "/product-check",
    },
  ];

  return (
    <div className="section space-y-8 py-6">
      {/* Login/Register Banner */}
      {!authenticated && (
        <div className="rounded-2xl bg-gradient-to-r from-sage to-sage/80 p-6 text-white shadow-soft">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold">
                Create an account to save your preferences
              </h3>
              <p className="mt-1 text-sm text-white/90">
                Sign up in seconds and keep your wellness plans accessible from any device
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/wellness/register"
                className="whitespace-nowrap rounded-full bg-white px-6 py-2 font-medium text-sage hover:bg-white/90"
              >
                Sign Up Free
              </Link>
              <Link
                href="/wellness/login"
                className="whitespace-nowrap rounded-full border-2 border-white px-6 py-2 font-medium text-white hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Link for Logged-in Users */}
      {authenticated && (
        <div className="rounded-2xl bg-sage/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-charcoal">
                Welcome back!
              </h3>
              <p className="mt-1 text-sm text-charcoal/70">
                Your wellness plans and preferences are saved in your dashboard
              </p>
            </div>
            <Link
              href="/wellness/dashboard"
              className="whitespace-nowrap rounded-full bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <WellnessHero
        title="Your Family's Health & Wellness Hub"
        subtitle="Personalised tools to help you eat better, move more, and make informed choices for your family's wellbeing."
      />

      {/* Features Overview - Now Clickable with Audience Selection */}
      <WellnessLandingClient features={features} audiences={audiences} />

      {/* How It Works */}
      <section className="rounded-2xl bg-sage/10 p-8">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-charcoal">
          How It Works
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-4 text-4xl">1</div>
            <h3 className="mb-2 font-semibold text-charcoal">
              Choose Your Tool
            </h3>
            <p className="text-sm text-charcoal/70">
              Select from meal planning, exercise, supplements, or product
              safety checking
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 text-4xl">2</div>
            <h3 className="mb-2 font-semibold text-charcoal">
              Share Your Preferences
            </h3>
            <p className="text-sm text-charcoal/70">
              Answer a few quick questions about your goals, preferences, and
              constraints
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 text-4xl">3</div>
            <h3 className="mb-2 font-semibold text-charcoal">
              Get Your Plan
            </h3>
            <p className="text-sm text-charcoal/70">
              Receive personalised recommendations you can print, save, and act
              on immediately
            </p>
          </div>
        </div>
      </section>

      {/* Important Disclaimer */}
      <section className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-6">
        <h3 className="mb-3 font-semibold text-charcoal">
          Important Health Information
        </h3>
        <p className="text-sm leading-relaxed text-charcoal/80">
          The wellness tools on this site provide general information and
          suggestions based on your inputs. They are <strong>not</strong> a
          substitute for professional medical advice, diagnosis, or treatment.
          Always consult your GP, registered dietitian, or qualified healthcare
          professional before making significant changes to your diet, exercise
          routine, or supplement regimen—especially if you are pregnant,
          breastfeeding, taking medications, or have any health conditions.
        </p>
      </section>

      {/* CTA */}
      <div className="text-center">
        <WellnessCTA
          exploreQuery="wellness activities"
          exploreLabel="Find wellness classes near you"
          showNewsletter={true}
        />
      </div>
    </div>
  );
}
