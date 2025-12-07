/**
 * Class Schema Markup Component
 * 
 * Renders JSON-LD schema for classes (Event/Course/LocalBusiness)
 */

import { buildAbsoluteUrl } from "@/lib/siteUrl";

export type ClassSchemaProps = {
  classId: number;
  name: string;
  description: string;
  category: string;
  providerName: string;
  providerUrl?: string;
  town: string;
  postcode?: string;
  address?: string;
  priceFrom?: number;
  priceCurrency?: string;
  ageRange?: { minMonths?: number; maxMonths?: number };
  imageUrls?: string[];
  rating?: number;
  reviewCount?: number;
  startDate?: string;
  endDate?: string;
};

export function ClassSchema({
  classId,
  name,
  description,
  category: _category,
  providerName,
  providerUrl,
  town,
  postcode,
  address,
  priceFrom,
  priceCurrency = "GBP",
  ageRange,
  imageUrls = [],
  rating,
  reviewCount,
  startDate,
  endDate,
}: ClassSchemaProps) {
  const classUrl = buildAbsoluteUrl(`/class/${classId}`);

  // Build address object
  const addressObj = address || postcode
    ? {
        "@type": "PostalAddress",
        addressLocality: town,
        postalCode: postcode,
        addressCountry: "GB",
        ...(address && { streetAddress: address }),
      }
    : undefined;

  // Build location
  const location = addressObj
    ? {
        "@type": "Place",
        name: town,
        address: addressObj,
      }
    : undefined;

  // Build offers
  const offers = priceFrom
    ? {
        "@type": "Offer",
        priceCurrency,
        price: priceFrom.toString(),
        url: classUrl,
        availability: "https://schema.org/InStock",
        ...(startDate && { validFrom: startDate }),
      }
    : undefined;

  // Build aggregate rating
  const aggregateRating =
    rating && reviewCount && reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: rating.toString(),
          reviewCount: reviewCount.toString(),
          bestRating: "5",
          worstRating: "1",
        }
      : undefined;

  // Build audience (age range)
  const audience = ageRange
    ? {
        "@type": "Audience",
        audienceType: ageRange.minMonths !== undefined && ageRange.maxMonths !== undefined
          ? `${Math.floor(ageRange.minMonths / 12)}-${Math.floor(ageRange.maxMonths / 12)} years`
          : "Children",
      }
    : undefined;

  // Event schema
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description: description.substring(0, 500), // Limit description length
    image: imageUrls.length > 0 ? imageUrls : undefined,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location,
    organizer: {
      "@type": "Organization",
      name: providerName,
      ...(providerUrl && { url: providerUrl }),
    },
    offers,
    aggregateRating,
    audience,
    url: classUrl,
  };

  // Course schema (for educational classes)
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description: description.substring(0, 500),
    image: imageUrls.length > 0 ? imageUrls : undefined,
    provider: {
      "@type": "Organization",
      name: providerName,
      ...(providerUrl && { url: providerUrl }),
    },
    aggregateRating,
    offers,
    courseCode: classId.toString(),
    url: classUrl,
    inLanguage: "en-GB",
    audience,
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
    </>
  );
}


