"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WellnessCard from "./WellnessCard";
import { X } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: string;
  basePath: string;
}

interface AudienceOption {
  title: string;
  description: string;
  image: string;
  href: string;
}

interface WellnessLandingClientProps {
  features: Feature[];
  audiences: AudienceOption[];
}

export default function WellnessLandingClient({
  features,
  audiences,
}: WellnessLandingClientProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const router = useRouter();

  const handleAudienceSelect = (audienceHref: string) => {
    if (selectedFeature) {
      // Extract audience slug from href (e.g., "/wellness/mum" -> "mum")
      const audienceSlug = audienceHref.split("/").pop();
      router.push(`/wellness/${audienceSlug}${selectedFeature.basePath}`);
    }
  };

  return (
    <>
      {/* Features Overview */}
      <section>
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
          What You Can Do Here
        </h2>
        <p className="mb-8 text-center text-charcoal/70">
          Personalised wellness tools designed for busy families
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <button
              key={feature.title}
              onClick={() => setSelectedFeature(feature)}
              className="group rounded-2xl bg-white p-6 shadow-soft transition-all hover:shadow-soft-lg cursor-pointer text-left"
            >
              <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-charcoal group-hover:text-sage transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-charcoal/70">{feature.description}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-sage opacity-0 group-hover:opacity-100 transition-opacity">
                Get Started
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Audience Selection */}
      <section>
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
          Choose Your Path
        </h2>
        <p className="mb-8 text-center text-charcoal/70">
          Get wellness advice tailored to your role in the family
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {audiences.map((audience) => (
            <Link
              key={audience.href}
              href={audience.href}
              className="group block"
            >
              <WellnessCard
                title={audience.title}
                description={audience.description}
                icon={audience.image}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Audience Selection Modal */}
      {selectedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="max-w-3xl w-full rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-charcoal">
                  {selectedFeature.icon} {selectedFeature.title}
                </h3>
                <p className="mt-1 text-sm text-charcoal/70">
                  Who is this plan for?
                </p>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="rounded-full p-2 hover:bg-sage/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-charcoal/60" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audiences.map((audience) => {
                const audienceSlug = audience.href.split("/").pop();
                return (
                  <button
                    key={audience.href}
                    onClick={() => handleAudienceSelect(audience.href)}
                    className="rounded-xl border-2 border-sage/20 bg-white p-4 text-left transition-all hover:border-sage hover:shadow-md"
                  >
                    <h4 className="mb-2 font-semibold text-charcoal">
                      {audience.title}
                    </h4>
                    <p className="text-xs text-charcoal/70">
                      {audience.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-sm text-charcoal/60 hover:text-charcoal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
