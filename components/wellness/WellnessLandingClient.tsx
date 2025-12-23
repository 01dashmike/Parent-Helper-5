"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import WellnessCard from "./WellnessCard";
import { X } from "lucide-react";
import { safeImage } from "@/lib/images";

interface Feature {
  title: string;
  description: string;
  backgroundImage: string;
  basePath: string;
  directLink?: string; // Optional direct link that bypasses audience selection
}

interface AudienceOption {
  title: string;
  description: string;
  image: string;
  href: string;
  imagePosition?: string;
  imageScale?: number;
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

  const handleFeatureClick = (feature: Feature) => {
    // If feature has a direct link, navigate directly without audience selection
    if (feature.directLink) {
      router.push(feature.directLink);
    } else {
      setSelectedFeature(feature);
    }
  };

  const handleAudienceSelect = (audienceHref: string) => {
    if (selectedFeature) {
      // Extract audience slug from href (e.g., "/wellness/mum" -> "mum")
      const audienceSlug = audienceHref.split("/").pop();
      router.push(`/wellness/${audienceSlug}${selectedFeature.basePath}`);
    }
  };

  return (
    <>
      {/* Features Overview - Carousel Style */}
      <section>
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
          What You Can Do Here
        </h2>
        <p className="mb-8 text-center text-charcoal/70">
          Personalised wellness tools designed for busy families
        </p>

        <div
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {features.map((feature) => {
            const { src } = safeImage({
              src: feature.backgroundImage,
              alt: feature.title,
            });
            return (
              <button
                key={feature.title}
                onClick={() => handleFeatureClick(feature)}
                className="relative aspect-[4/3] w-[85%] shrink-0 overflow-hidden rounded-3xl bg-cream shadow-card transition-standard hover:shadow-md snap-center sm:w-[45%] lg:w-[20%] text-left"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={src}
                    alt={feature.title}
                    fill
                    className="object-cover object-top rounded-xl"
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 20vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-4 text-white pointer-events-none">
                  <h3 className="text-lg font-semibold leading-tight">{feature.title}</h3>
                  <p className="text-sm opacity-90 line-clamp-2">{feature.description}</p>
                </div>
              </button>
            );
          })}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {audiences.map((audience) => (
            <Link
              key={audience.href}
              href={audience.href}
              className="group block"
            >
              <WellnessCard
                title={audience.title}
                description={audience.description}
                backgroundImage={audience.image}
                imagePosition={audience.imagePosition}
                imageScale={audience.imageScale}
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
            className="max-w-3xl w-full rounded-2xl bg-gradient-to-br from-sage to-sage/90 p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {selectedFeature.title}
                </h3>
                <p className="mt-1 text-sm text-white/80">
                  Who is this plan for?
                </p>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="rounded-full p-2 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white/80" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audiences.map((audience) => {
                const audienceSlug = audience.href.split("/").pop();
                return (
                  <button
                    key={audience.href}
                    onClick={() => handleAudienceSelect(audience.href)}
                    className="rounded-xl border-2 border-white/30 bg-white/10 p-4 text-left transition-all hover:bg-white/20 hover:border-white/50 hover:shadow-md backdrop-blur-sm"
                  >
                    <h4 className="mb-2 font-semibold text-white">
                      {audience.title}
                    </h4>
                    <p className="text-xs text-white/80">
                      {audience.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-sm text-white/70 hover:text-white transition-colors"
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

