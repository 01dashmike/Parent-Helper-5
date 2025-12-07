"use client";

import Image from "next/image";
import Link from "next/link";
import LinkComponent from "@/components/ui/link";
import { useState } from "react";

import { safeImage } from "@/lib/images";

import QuickStartProfile from "./QuickStartProfile";

interface Profile {
  family: {
    household_name?: string | null;
    postcode?: string | null;
    home_lat?: number | null;
    home_lng?: number | null;
  };
  children: Array<{
    id: string;
    first_name?: string | null;
    age_months: number;
  }>;
  preferences: {
    default_radius_km: number;
  } | null;
}

interface Recommendation {
  id: string;
  score: number;
  rationale: string;
  classes: {
    id: number;
    name: string;
    category?: string | null;
    town?: string | null;
    hero_image?: string | null;
  };
}

interface RecentActivity {
  id: string;
  classes: {
    id: number;
    name: string;
    category?: string | null;
  };
}

interface Props {
  userId: string;
  greeting: string;
  profile: Profile;
  recommendations: Recommendation[];
  recentActivity: RecentActivity[];
}

export default function PersonalizedHomeClient({
  userId,
  greeting,
  profile,
  recommendations,
  recentActivity,
}: Props) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Get age-appropriate classes (matching child ages)
  const ageAppropriate = recommendations.filter((rec) => {
    return profile.children.some((_) => {
      // Simple check - in real implementation, match against class age ranges
      return rec.rationale.includes("age-appropriate");
    });
  });

  // Get nearby classes (distance-sorted)
  const nearby = [...recommendations]
    .filter((rec) => rec.rationale.includes("close to you"))
    .slice(0, 6);

  // Get popular classes
  const popular = [...recommendations]
    .filter((rec) => rec.rationale.includes("popular"))
    .slice(0, 6);

  // Format child age
  const formatChildAge = (ageMonths: number) => {
    if (ageMonths < 12) {
      return `${ageMonths} ${ageMonths === 1 ? "month" : "months"}`;
    }
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    if (months === 0) {
      return `${years} ${years === 1 ? "year" : "years"}`;
    }
    return `${years}y ${months}m`;
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display-2 font-semibold">
              {greeting}, {profile.family.household_name || "there"}!
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.family.postcode && (
                <span className="rounded-full bg-sage/10 px-3 py-1 text-small text-forest">
                  📍 {profile.family.postcode}
                </span>
              )}
              {profile.children.map((child) => (
                <span
                  key={child.id}
                  className="rounded-full bg-sage/10 px-3 py-1 text-small text-forest"
                >
                  {child.first_name || "Child"}, {formatChildAge(child.age_months)}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="rounded-full border border-sage/30 bg-white px-4 py-2 text-small text-forest transition hover:bg-sage/10"
          >
            Edit Profile
          </button>
        </div>

        {/* Age-Appropriate Section */}
        {ageAppropriate.length > 0 && (
          <section>
            <h2 className="mb-4 text-title font-semibold">
              Because of {profile.children[0]?.first_name || "your child"}&apos;s age
            </h2>
            <div className="grid-responsive gap-card">
              {ageAppropriate.slice(0, 6).map((rec) => (
                <Link
                  key={rec.id}
                  href={`/classes/${rec.classes.id}`}
                  className="card rounded-2xl p-4 group bg-white border-l-0 transition hover:border-sage hover:shadow-card"
                >
                  {rec.classes.hero_image && (
                    <div className="relative mb-3 h-32 w-full overflow-hidden rounded-xl aspect-[16/9]">
                      <Image
                        src={safeImage({ src: rec.classes.hero_image, alt: rec.classes.name || "Recommended class" }).src}
                        alt={rec.classes.name || "Recommended class"}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-charcoal">{rec.classes.name}</h3>
                  {rec.classes.category && (
                    <p className="mt-1 text-small text-slateSoft">{rec.classes.category}</p>
                  )}
                  {rec.classes.town && (
                    <p className="mt-1 text-small text-slateSoft">📍 {rec.classes.town}</p>
                  )}
                  <p className="mt-2 text-small text-charcoal/80">{rec.rationale}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Close to You Section */}
        {nearby.length > 0 && (
          <section>
            <h2 className="mb-4 text-title font-semibold">Close to you</h2>
            <div className="grid-responsive gap-card">
              {nearby.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/classes/${rec.classes.id}`}
                  className="card rounded-2xl p-4 group bg-white border-l-0 transition hover:border-sage hover:shadow-card"
                >
                  <h3 className="font-semibold text-charcoal">{rec.classes.name}</h3>
                  {rec.classes.category && (
                    <p className="mt-1 text-small text-slateSoft">{rec.classes.category}</p>
                  )}
                  {rec.classes.town && (
                    <p className="mt-1 text-small text-slateSoft">📍 {rec.classes.town}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular Section */}
        {popular.length > 0 && (
          <section>
            <h2 className="mb-4 text-title font-semibold">Popular with families like yours</h2>
            <div className="grid-responsive gap-card">
              {popular.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/classes/${rec.classes.id}`}
                  className="card rounded-2xl p-4 group bg-white border-l-0 transition hover:border-sage hover:shadow-card"
                >
                  <h3 className="font-semibold text-charcoal">{rec.classes.name}</h3>
                  {rec.classes.category && (
                    <p className="mt-1 text-small text-slateSoft">{rec.classes.category}</p>
                  )}
                  {rec.classes.town && (
                    <p className="mt-1 text-small text-slateSoft">📍 {rec.classes.town}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Continue Where You Left Off */}
        {recentActivity.length > 0 && (
          <section>
            <h2 className="mb-4 text-title font-semibold">Pick up where you left off</h2>
            <div className="grid-responsive gap-card">
              {recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/classes/${activity.classes.id}`}
                  className="card rounded-2xl p-4 group bg-white border-l-0 transition hover:border-sage hover:shadow-card"
                >
                  <h3 className="font-semibold text-charcoal">{activity.classes.name}</h3>
                  {activity.classes.category && (
                    <p className="mt-1 text-small text-slateSoft">{activity.classes.category}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {recommendations.length === 0 && (
          <section className="card rounded-2xl p-8 text-center bg-white border-l-0">
            <h2 className="text-title font-semibold">Building your recommendations...</h2>
            <p className="mt-2 text-slateSoft">
              We&apos;re finding the perfect classes for your family. Check back soon!
            </p>
            <LinkComponent
              href="/search"
              className="mt-4 inline-block rounded-full bg-brand px-6 py-2 text-body font-medium text-white transition hover:bg-brand/90"
              prefetch={false}
            >
              Browse All Classes
            </LinkComponent>
          </section>
        )}
      </div>

      {showProfileModal && (
        <QuickStartProfile userId={userId} onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
}

