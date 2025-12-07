/**
 * Related Classes Component
 * 
 * Automated internal linking for SEO pages
 * 
 * This is a server component that generates internal links
 */

import Link from "next/link";
import { SEO_CATEGORIES, SEO_AGES, getSEOCities, type SEOCategory, type SEOAge, type SEOCity } from "@/lib/seo/taxonomy";
import { getClassCountForCombo } from "@/lib/seo/stats";

export type RelatedClassesProps = {
  currentCategorySlug: string;
  currentTownSlug?: string;
  currentAgeSlug?: string;
};

export default async function RelatedClasses({
  currentCategorySlug,
  currentTownSlug,
  currentAgeSlug,
}: RelatedClassesProps) {
  const currentCategory = SEO_CATEGORIES.find((cat) => cat.slug === currentCategorySlug);
  if (!currentCategory) return null;

  const currentAge = currentAgeSlug ? SEO_AGES.find((age) => age.slug === currentAgeSlug) : null;
  const cities = await getSEOCities(3); // Lower threshold for related links
  const currentTown = currentTownSlug
    ? cities.find((city) => city.slug === currentTownSlug)
    : null;

  const relatedLinks: Array<{ href: string; label: string }> = [];

  // 1. Sibling categories in same town/age
  if (currentTown && currentAge) {
    // Other categories for same age+town
    for (const category of SEO_CATEGORIES) {
      if (category.slug === currentCategorySlug) continue;
      if (category.ageSlug && category.ageSlug !== currentAgeSlug) continue;

      const count = await getClassCountForCombo(category, currentAge, currentTown);
      if (count > 0) {
        relatedLinks.push({
          href: `/classes/${category.slug}/${currentAgeSlug}/${currentTownSlug}`,
          label: `${currentAge.label} ${category.label} in ${currentTown.label}`,
        });
      }
    }
  }

  // 2. Sibling age segments for same category+town
  if (currentTown && currentCategory) {
    for (const age of SEO_AGES) {
      if (age.slug === currentAgeSlug) continue;

      const count = await getClassCountForCombo(currentCategory, age, currentTown);
      if (count > 0) {
        relatedLinks.push({
          href: `/classes/${currentCategorySlug}/${age.slug}/${currentTownSlug}`,
          label: `${age.label} ${currentCategory.label} in ${currentTown.label}`,
        });
      }
    }
  }

  // 3. Sibling towns for same category+age
  if (currentAge && currentCategory) {
    for (const town of cities.slice(0, 5)) {
      // Limit to top 5 towns
      if (town.slug === currentTownSlug) continue;

      const count = await getClassCountForCombo(currentCategory, currentAge, town);
      if (count > 0) {
        relatedLinks.push({
          href: `/classes/${currentCategorySlug}/${currentAgeSlug}/${town.slug}`,
          label: `${currentAge.label} ${currentCategory.label} in ${town.label}`,
        });
      }
    }
  }

  // 4. Parent pages (broader scope)
  if (currentAge && currentCategory) {
    relatedLinks.push({
      href: `/classes/${currentCategorySlug}/${currentAgeSlug}`,
      label: `All ${currentAge.label} ${currentCategory.label}`,
    });
  }

  if (currentCategory) {
    relatedLinks.push({
      href: `/classes/${currentCategorySlug}`,
      label: `All ${currentCategory.label}`,
    });
  }

  if (currentTown && currentCategory) {
    relatedLinks.push({
      href: `/${currentTownSlug}/${currentCategorySlug}`,
      label: `${currentCategory.label} in ${currentTown.label}`,
    });
  }

  if (relatedLinks.length === 0) return null;

  return (
    <section className="mt-12 rounded-xl border border-sage/30 bg-cream/20 p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">You might also like</h2>
      <ul className="space-y-2">
        {relatedLinks.slice(0, 8).map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sage hover:text-forest underline-offset-4 hover:underline text-sm"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

