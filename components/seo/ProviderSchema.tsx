/**
 * Provider Schema Markup Component
 * 
 * Renders JSON-LD schema for providers (LocalBusiness/ChildCare)
 */

export type ProviderSchemaProps = {
  name: string;
  url: string;
  logoUrl?: string;
  town?: string;
  postcode?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: {
    value: number;
    count: number;
  };
};

export function ProviderSchema({
  name,
  url,
  logoUrl,
  town,
  postcode,
  address,
  phone,
  website,
  email,
  rating,
}: ProviderSchemaProps) {
  // Build address
  const addressObj = town || postcode
    ? {
        "@type": "PostalAddress",
        addressLocality: town,
        postalCode: postcode,
        addressCountry: "GB",
        ...(address && { streetAddress: address }),
      }
    : undefined;

  // Build aggregate rating
  const aggregateRating =
    rating && rating.count > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: rating.value.toString(),
          reviewCount: rating.count.toString(),
          bestRating: "5",
          worstRating: "1",
        }
      : undefined;

  // LocalBusiness schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    ...(logoUrl && { image: logoUrl }),
    ...(addressObj && { address: addressObj }),
    ...(phone && { telephone: phone }),
    ...(website && { sameAs: [website] }),
    ...(email && { email }),
    ...(aggregateRating && { aggregateRating }),
  };

  // ChildCare schema (if applicable)
  const childCareSchema = {
    "@context": "https://schema.org",
    "@type": "ChildCare",
    name,
    url,
    ...(logoUrl && { image: logoUrl }),
    ...(addressObj && { address: addressObj }),
    ...(phone && { telephone: phone }),
    ...(website && { sameAs: [website] }),
    ...(email && { email }),
    ...(aggregateRating && { aggregateRating }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(childCareSchema) }}
      />
    </>
  );
}


