"use client";

import Link from "next/link";
import Image from "next/image";
import { safeImage } from "@/lib/images";

export type SearchClassResult = {
  id: number;
  name: string;
  providerName: string;
  ageMin: number;
  ageMax: number;
  category: string;
  town: string;
  nextSession: string | null;
  distanceKm?: number;
  score: number;
  imageUrl?: string;
};

type SearchResultsGridProps = {
  results: SearchClassResult[];
  loading?: boolean;
};

export default function SearchResultsGrid({ results, loading }: SearchResultsGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-sage/20 bg-white p-4">
            <div className="h-40 w-full rounded-lg bg-cream/40 mb-4" />
            <div className="h-4 w-3/4 rounded bg-cream/40 mb-2" />
            <div className="h-4 w-1/2 rounded bg-cream/40" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-sage/20 bg-white p-12 text-center">
        <p className="text-lg font-medium text-charcoal mb-2">No classes found</p>
        <p className="text-sm text-slateSoft">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((result) => {
        const { src, alt } = safeImage({
          src: result.imageUrl,
          alt: `${result.name} in ${result.town}`,
        });

        const ageRange = result.ageMin === 0 && result.ageMax === 999
          ? null
          : `${Math.floor(result.ageMin / 12)}-${Math.floor(result.ageMax / 12)} years`;

        return (
          <Link
            key={result.id}
            href={`/class/${result.id}`}
            className="group rounded-lg border border-sage/20 bg-white p-4 hover:border-sage/40 hover:shadow-md transition-all"
          >
            <div className="relative h-40 w-full mb-3 rounded-lg overflow-hidden bg-cream/40">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center"
                loading="lazy"
              />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2 group-hover:text-sage transition-colors">
              {result.name}
            </h3>
            <p className="text-sm text-slateSoft mb-3">{result.providerName}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {result.category && (
                <span className="rounded-full bg-sage/15 px-2 py-1 text-forest">
                  {result.category}
                </span>
              )}
              {result.town && (
                <span className="rounded-full bg-cream px-2 py-1">
                  {result.town}
                </span>
              )}
              {ageRange && (
                <span className="rounded-full bg-cream px-2 py-1">
                  Ages {ageRange}
                </span>
              )}
              {result.distanceKm !== undefined && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                  {result.distanceKm.toFixed(1)} km away
                </span>
              )}
            </div>
            {result.nextSession && (
              <p className="mt-3 text-sm text-slateSoft">
                Next: {result.nextSession}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}





