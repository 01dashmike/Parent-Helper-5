"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * SearchResultsSchema
 * 
 * Generates JSON-LD structured data for search results page
 * Helps search engines understand and display class listings
 * with rich snippets (events, organizations, local business)
 */
export function SearchResultsSchema() {
  const params = useSearchParams();
  const query = params?.toString() ?? "";
  const { data } = useSWR(`/api/search?${query}`, fetcher, {
    revalidateOnFocus: false,
  });

  const results = data?.results ?? [];

  if (results.length === 0) return null;

  // Generate schema.org structured data for each class result
  const classEvents = results
    .slice(0, 10) // Limit to top 10 for performance
    .map((result: any) => {
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = typeof result.day_of_week === "number" 
        ? daysOfWeek[result.day_of_week] 
        : undefined;

      return {
        "@type": "Event",
        "name": result.class_name || "Baby & Toddler Class",
        "description": result.description || `Join us for ${result.class_name} - a fun and engaging class for babies and toddlers.`,
        "image": result.image_url || "https://parenthelper.co.uk/images/default-class.jpg",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": {
          "@type": "Place",
          "name": result.venue_name || "Local Venue",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": result.town || "",
            "postalCode": result.postcode || "",
            "addressCountry": "GB",
          },
          ...(result.latitude && result.longitude && {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": result.latitude,
              "longitude": result.longitude,
            },
          }),
        },
        ...(dayName && {
          "eventSchedule": {
            "@type": "Schedule",
            "byDay": dayName,
            "startTime": result.start_time || "",
            "endTime": result.end_time || "",
          },
        }),
        "organizer": {
          "@type": "Organization",
          "name": result.provider_name || "Local Provider",
          "url": result.provider_website || "https://parenthelper.co.uk",
        },
        "offers": result.price_pounds ? {
          "@type": "Offer",
          "price": result.price_pounds,
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
        } : undefined,
      };
    })
    .filter(Boolean);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": classEvents.map((event: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": event,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}


