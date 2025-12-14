/**
 * Class List Component
 * 
 * Simple list component for displaying classes on SEO pages
 */

import Link from "next/link";
import Image from "next/image";
import type { SEOClassResult } from "@/lib/seo/queries";
import { safeImage } from "@/lib/images";

export type ClassListProps = {
  classes: SEOClassResult[];
  showImages?: boolean;
};

export function ClassList({ classes, showImages = true }: ClassListProps) {
  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-sage/30 bg-cream/20 p-6 text-center">
        <p className="text-charcoal/70">No classes found. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => {
        const className = cls.title || cls.name;
        const classUrl = `/class/${cls.id}`;
        const { src, alt } = safeImage({
          src: "/images/placeholder-class.jpg",
          alt: `${className} in ${cls.town}`,
        });

        return (
          <Link
            key={cls.id}
            href={classUrl}
            className="group rounded-xl border border-sage/30 bg-white p-4 hover:border-sage/50 hover:shadow-md transition-all"
          >
            {showImages && (
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
            )}
            <h3 className="text-body font-semibold text-charcoal mb-2 group-hover:text-sage transition-colors">
              {className}
            </h3>
            {cls.description && (
              <p className="text-small text-charcoal/70 line-clamp-2 mb-3">
                {cls.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-charcoal/60">
              {cls.category && (
                <span className="rounded-full bg-sage/15 px-2 py-1">
                  {cls.category}
                </span>
              )}
              {cls.town && (
                <span className="rounded-full bg-cream px-2 py-1">
                  {cls.town}
                </span>
              )}
              {cls.age_group_min !== undefined && cls.age_group_max !== undefined && (
                <span className="rounded-full bg-cream px-2 py-1">
                  Ages {Math.floor(cls.age_group_min / 12)}-{Math.floor(cls.age_group_max / 12)}
                </span>
              )}
            </div>
            {cls.price && (
              <p className="mt-2 text-sm font-medium text-charcoal">{cls.price}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}








