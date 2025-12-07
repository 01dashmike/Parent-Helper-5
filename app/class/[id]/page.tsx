import { Metadata } from "next";

// Revalidate: 30 seconds for class detail pages
// Class details may change (availability, featured status, etc.)
export const revalidate = 30;
import { notFound } from "next/navigation";
import { Suspense, lazy } from "react";
import Image from "next/image";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { BookingButton } from "@/components/BookingButton";
import { BookNowButton } from "@/components/BookNowButton";
import { isBookingsFeatureEnabled } from "@/lib/env";
import { ProviderRating } from "@/components/ProviderRating";
import { isClassQAEnabled } from "@/lib/env";
import ClassPageClient from "./ClassPageClient";
import ClassCalendarClient from "@/components/class/ClassCalendarClient";
import { formatDate, formatDateRange as formatDateRangeHelper } from "@/lib/utils/date";
import { fetchClassData } from "./helpers";
import type { ClassPageData } from "./types";
import { Breadcrumb } from "@/components/Breadcrumb";

// Lazy load QnAServer as it's a large component with client-side logic
const QnAServer = lazy(() => import("@/components/class/QnAServer").then(mod => ({ default: mod.default })));

// Lazy load map component
const LazyMap = lazy(() => import("@/components/search/ResultsSplitMap").then(mod => ({ default: mod.MapPane })));

type ClassPageParams = {
  id: string;
};

type SessionInstance = {
  id: number;
  starts_at: string;
  ends_at: string | null;
  status: string;
  bookable: boolean;
  stripe_payment_link_url: string | null;
  capacity: number | null;
  available_spots: number | null;
};

type ClassSession = {
  id: number;
  title: string | null;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  session_instances: SessionInstance[];
};

// Use ClassPageData type from actions
type ClassRow = ClassPageData;

function formatCurrency(price: string | null) {
  if (!price) return null;
  const match = price.match(/([\d,.]+)/);
  if (!match) return price;
  const numeric = parseFloat(match[1].replace(/,/g, ""));
  if (Number.isNaN(numeric)) return price;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(numeric);
}

function statusToSchema(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "cancelled") return "https://schema.org/EventCancelled";
  if (normalized === "postponed") return "https://schema.org/EventPostponed";
  return "https://schema.org/EventScheduled";
}

// Deferred data fetching components
async function DeferredQnA({ classId, providerId, currentUserId }: { classId: number; providerId: number | null; currentUserId: string | null }) {
  if (!isClassQAEnabled()) return null;
  
  return (
    <Suspense fallback={<div className="mt-8 text-small text-text-tertiary">Loading Q&A...</div>}>
      <QnAServer
        classId={classId}
        providerId={providerId}
        currentUserId={currentUserId}
      />
    </Suspense>
  );
}

async function DeferredQnAJsonLd({ classId }: { classId: number }) {
  if (!isClassQAEnabled()) return null;
  
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data } = await supabase
      .from("class_questions")
      .select(
        `
        id,
        body,
        created_at,
        class_answers (
          id,
          body,
          created_at,
          providers ( name )
        )
      `
      )
      .eq("class_id", classId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5); // Limit for JSON-LD

    if (!data || data.length === 0) return null;
    
    const qaJsonLd = buildQAPageJsonLd(classId, data.map((item: { id?: any; body?: any; created_at?: any; class_answers?: any }) => ({
      body: String(item.body || ""),
      created_at: String(item.created_at || ""),
      class_answers: Array.isArray(item.class_answers) ? item.class_answers.map((ans: { id?: any; body?: any; created_at?: any; providers?: any }) => ({
        body: String(ans.body || ""),
        created_at: String(ans.created_at || ""),
        providers: Array.isArray(ans.providers) && ans.providers[0] ? { name: String(ans.providers[0].name || "") } : undefined,
      })) : undefined,
    })));
    if (!qaJsonLd) return null;
    
    return (
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(qaJsonLd) }}
      />
    );
  } catch (error) {
    console.error("Error fetching Q&A for JSON-LD:", error);
    return null;
  }
}

async function getCurrentUser() {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user ?? null;
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ClassPageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const classRow = await fetchClassData(id);
  if (!classRow) {
    return {
      title: "Class not found | Parent Helper",
      robots: { index: false, follow: false },
    };
  }

  // Use AI-generated metadata if available, fallback to defaults
  const title = classRow.meta_title || `${classRow.title || classRow.name} | Parent Helper`;
  const description =
    classRow.meta_description ??
    classRow.summary ??
    classRow.description ??
    "Discover family-friendly classes near you with Parent Helper.";
  const structuredData = buildJsonLd(classRow);
  const structuredDataJson = structuredData ? JSON.stringify(structuredData) : undefined;

  const images = (classRow.images && Array.isArray(classRow.images) ? classRow.images : [])
    .filter((image) => image && image.storage_path)
    .map((image) => ({
      url: image.storage_path.startsWith("http")
        ? image.storage_path
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${image.storage_path}`,
      alt: image.alt_text ?? (classRow.title || classRow.name || "Class image"),
    }));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk";
  const classUrl = `${baseUrl}/class/${id}`;

  // Ensure images array has at least one fallback image
  const ogImages = images.length > 0 
    ? images 
    : [
        {
          url: `${baseUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: classRow.title || classRow.name || "Parent Helper",
        },
      ];
  const twitterImage = images.length > 0 ? images[0].url : ogImages[0].url;

  return {
    title,
    description,
    keywords: classRow.keywords && classRow.keywords.length > 0 ? classRow.keywords.join(", ") : undefined,
    alternates: {
      canonical: classUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: classUrl,
      siteName: "Parent Helper",
      images: ogImages,
      locale: "en_GB",
      publishedTime: classRow.created_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage],
    },
    robots: {
      index: true,
      follow: true,
    },
    other: structuredDataJson
      ? {
          "script:ld+json": structuredDataJson,
        }
      : undefined,
  };
}

function buildJsonLd(data: ClassPageData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk";
  const classUrl = `${baseUrl}/class/${data.id}`;
  
  // Get occurrences from either class_occurrences or session_instances
  const occurrences = data.class_occurrences && Array.isArray(data.class_occurrences)
    ? data.class_occurrences
        .filter((occ) => occ && occ.starts_at)
        .map((occ) => ({ 
          starts_at: occ.starts_at, 
          ends_at: occ.ends_at ?? null, 
          status: occ.status ?? "scheduled" 
        }))
    : data.class_sessions && Array.isArray(data.class_sessions)
      ? data.class_sessions
          .filter((session) => session && session.session_instances && Array.isArray(session.session_instances))
          .flatMap((session) =>
            (session.session_instances || [])
              .filter((inst) => inst && inst.starts_at)
              .map((inst) => ({
                starts_at: inst.starts_at,
                ends_at: inst.ends_at ?? null,
                status: inst.status ?? "scheduled",
              }))
          )
      : [];

  const upcomingOccurrences = occurrences
    .filter((occurrence) => occurrence && occurrence.starts_at && new Date(occurrence.starts_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 10);

  const venue = data.venues;
  const organizer = data.providers;

  const location =
    venue && venue.name
      ? {
        "@type": "Place",
        name: venue.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: [venue.address_line1, venue.address_line2].filter(Boolean).join(", "),
          addressLocality: venue.city ?? undefined,
          addressRegion: venue.county ?? undefined,
          postalCode: venue.postcode ?? undefined,
          addressCountry: "GB",
        },
      }
      : undefined;

  const price = formatCurrency(data.price);
  const priceValue = price ? parseFloat(price.replace(/[£,\s]/g, "")) : null;
  
  // Use title or name consistently
  const className = data.title || data.name || "";

  // Build image URLs
  const images = (data.images && Array.isArray(data.images) ? data.images : [])
    .filter((img) => img && img.storage_path)
    .map((img) => {
      if (img.storage_path.startsWith("http")) {
        return img.storage_path;
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${img.storage_path}`;
    });

  // Build rating aggregate if available
  const aggregateRating = data.providers?.reputation?.avg_rating && data.providers.reputation.review_count > 0
    ? {
      "@type": "AggregateRating",
      ratingValue: data.providers.reputation.avg_rating.toString(),
      reviewCount: data.providers.reputation.review_count,
      bestRating: "5",
      worstRating: "1",
    }
    : undefined;

  const description = data.summary ?? data.description ?? "";

  // Event schema (existing - enhanced with images and ratings)
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: className,
    description,
    image: images.length > 0 ? images : undefined,
    startDate: upcomingOccurrences[0]?.starts_at ?? data.created_at,
    endDate: upcomingOccurrences[0]?.ends_at ?? undefined,
    eventStatus: statusToSchema(upcomingOccurrences[0]?.status ?? "scheduled"),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location,
    organizer: organizer
      ? {
        "@type": "Organization",
        name: organizer.name,
        url: organizer.website ?? undefined,
        email: organizer.contact_email ?? undefined,
      }
      : undefined,
    offers: priceValue
      ? {
        "@type": "Offer",
        priceCurrency: "GBP",
        price: priceValue.toString(),
        url: data.booking_url ?? classUrl,
        availability: "https://schema.org/InStock",
        validFrom: data.created_at,
      }
      : undefined,
    aggregateRating,
    url: classUrl,
    subEvent: upcomingOccurrences.map((occurrence) => ({
      "@type": "Event",
      name: `${className} session`,
      startDate: occurrence.starts_at,
      endDate: occurrence.ends_at ?? undefined,
      eventStatus: statusToSchema(occurrence.status),
    })),
  };

  // Course schema (for educational classes)
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: className,
    description,
    image: images.length > 0 ? images : undefined,
    provider: organizer
      ? {
        "@type": "Organization",
        name: organizer.name,
        url: organizer.website ?? undefined,
      }
      : undefined,
    aggregateRating,
    offers: priceValue
      ? {
        "@type": "Offer",
        priceCurrency: "GBP",
        price: priceValue.toString(),
        url: data.booking_url ?? classUrl,
        availability: "https://schema.org/InStock",
      }
      : undefined,
    courseCode: data.id,
    url: classUrl,
    inLanguage: "en-GB",
    audience: {
      "@type": "Audience",
      audienceType: "Babies and Toddlers",
    },
  };

  // LocalBusiness schema for provider (if venue and provider info available)
  const localBusinessSchema = organizer && venue
    ? {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: organizer.name,
      description: `${organizer.name} - ${className}`,
      image: images.length > 0 ? images[0] : undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: [venue.address_line1, venue.address_line2].filter(Boolean).join(", "),
        addressLocality: venue.city ?? undefined,
        addressRegion: venue.county ?? undefined,
        postalCode: venue.postcode ?? undefined,
        addressCountry: "GB",
      },
      aggregateRating,
      url: organizer.website ?? classUrl,
      telephone: undefined, // Add if available
      priceRange: priceValue ? `£${priceValue}` : undefined,
    }
    : null;

  return {
    event: eventSchema,
    course: courseSchema,
    localBusiness: localBusinessSchema,
  };
}

function formatDateRange(start: string, end: string | null) {
  if (!end) {
    return formatDate(start, "datetime");
  }
  return formatDateRangeHelper(start, end);
}

function buildQAPageJsonLd(classId: number, questions: Array<{ body: string; created_at: string; class_answers?: Array<{ body: string; created_at: string; providers?: { name: string } }> }>) {
  if (!questions || questions.length === 0) return null;

  const mainEntity = questions.map((q, _index) => ({
    "@type": "Question",
    name: q.body,
    text: q.body,
    dateCreated: q.created_at,
    author: {
      "@type": "Person",
      name: "Parent",
    },
    acceptedAnswer: q.class_answers && q.class_answers.length > 0
      ? {
          "@type": "Answer",
          text: q.class_answers[0].body,
          dateCreated: q.class_answers[0].created_at,
          author: {
            "@type": "Person",
            name: q.class_answers[0].providers?.name || "Provider",
          },
        }
      : undefined,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity,
  };
}

export default async function PublicClassPage({ params }: { params: Promise<ClassPageParams> }) {
  const { id } = await params;
  
  // Fetch critical data in parallel
  const [data, currentUserId] = await Promise.all([
    fetchClassData(id),
    getCurrentUser(),
  ]);
  
  if (!data) {
    notFound();
  }

  const jsonLdSchemas = buildJsonLd(data);
  const priceLabel = formatCurrency(data.price);
  const classIdNum = parseInt(id, 10);

  // Get upcoming occurrences from either class_occurrences or session_instances
  const upcoming = process.env.FEATURE_BOOKINGS === "true" && data.class_sessions && Array.isArray(data.class_sessions)
    ? data.class_sessions
      .filter((session) => session && session.session_instances && Array.isArray(session.session_instances))
      .flatMap((session) =>
        (session.session_instances || [])
          .filter((inst) => inst && inst.starts_at && new Date(inst.starts_at).getTime() >= Date.now())
          .map((inst) => ({
            id: inst?.id ?? "",
            starts_at: inst?.starts_at ?? new Date().toISOString(),
            ends_at: inst?.ends_at ?? null,
            status: inst?.status ?? "scheduled",
            bookable: inst?.bookable ?? false,
            stripe_payment_link_url: inst?.stripe_payment_link_url ?? null,
          }))
      )
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    : data.class_occurrences && Array.isArray(data.class_occurrences)
      ? data.class_occurrences
        .filter((occurrence) => occurrence && occurrence.starts_at && new Date(occurrence.starts_at).getTime() >= Date.now())
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .map((occ) => ({
          id: occ?.id ?? "",
          starts_at: occ?.starts_at ?? new Date().toISOString(),
          ends_at: occ?.ends_at ?? null,
          status: occ?.status ?? "scheduled",
          bookable: false,
          stripe_payment_link_url: null,
        }))
      : [];

  return (
    <div className="bg-cream/30 pb-20">
      <noscript>
        <div className="mx-auto max-w-4xl mb-4 px-6 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-small text-charcoal">
          <p className="font-medium mb-1">JavaScript is disabled</p>
          <p>Some features like interactive booking and live updates require JavaScript. You can still view class details and contact information.</p>
        </div>
      </noscript>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Breadcrumb 
          items={[
            { label: "Home", href: "/" },
            { label: data.title || data.name || "Class" }
          ]}
          className="mb-6"
        />
        <div className="rounded-3xl border border-sage/30 bg-white p-8 shadow-xl">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-sage/15 px-3 py-1 text-smallall font-semibold uppercase tracking-wide text-forest">
              Parent Helper class
            </span>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-display-2 font-bold text-charcoal break-words" lang="en">{data.title || data.name}</h1>
                {data.summary ? (
                  <p className="text-body text-charcoal/80 line-clamp-3" lang="en">{data.summary}</p>
                ) : null}
              </div>
              {data.providers?.reputation && (
                <ProviderRating
                  avgRating={data.providers.reputation.avg_rating}
                  reviewCount={data.providers.reputation.review_count}
                  size="lg"
                />
              )}
            </div>
            {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-small text-charcoal/60">
                {data.tags
                  .filter((tag) => tag && typeof tag === "string")
                  .map((tag) => (
                    <span key={tag} className="rounded-full bg-cream/80 px-3 py-1 truncate max-w-[150px]" lang="en">
                      #{tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Class Images Gallery */}
          {data.images && data.images.length > 0 && (
            <section className="mt-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.images.map((image, idx) => {
                  const imageUrl = image.storage_path.startsWith("http")
                    ? image.storage_path
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${image.storage_path}`;
                  const imageAlt = image.alt_text || `${data.title || data.name} - Image ${idx + 1}`;
                  
                  return (
                    <div key={idx} className="relative aspect-video overflow-hidden rounded-xl border border-sage/20 bg-cream/40">
                      <Image
                        src={imageUrl}
                        alt={imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center"
                        loading={idx === 0 ? "eager" : "lazy"}
                        quality={85}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              {data.description ? (
                <article className="prose prose-sm max-w-none text-charcoal">
                  {(data.description || "")
                    .split("\n\n")
                    .filter((p) => p && p.trim())
                    .map((paragraph, idx) => (
                      <p key={idx} lang="en" className="break-words">{paragraph}</p>
                    ))}
                </article>
              ) : (
                <p className="text-small text-text-tertiary">
                  More details coming soon. Contact the organiser for the latest information.
                </p>
              )}

              <div className="space-y-3 rounded-2xl border border-sage/30 bg-cream/40 p-4">
                <h2 className="text-smallall font-semibold uppercase tracking-wide text-charcoal/80">
                  Upcoming sessions
                </h2>
                {upcoming.length === 0 ? (
                  <div role="status" aria-live="polite">
                    <h3 className="text-smallall font-semibold text-charcoal mb-1">No upcoming sessions</h3>
                    <p className="text-small text-text-tertiary">
                      New sessions will appear here as soon as they are scheduled. Contact the provider for more information.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2 text-small text-charcoal/80">
                    {upcoming.map((occurrence) => {
                      const isBookable =
                        process.env.FEATURE_BOOKINGS === "true" &&
                        "bookable" in occurrence &&
                        occurrence.bookable &&
                        occurrence.stripe_payment_link_url;
                      return (
                        <li
                          key={occurrence.id}
                          className="flex items-center justify-between rounded-lg border border-sage/20 bg-white/90 px-3 py-2"
                        >
                          <span>{formatDateRange(occurrence.starts_at, occurrence.ends_at)}</span>
                          <div className="flex items-center gap-2">
                            {isBookable && isBookingsFeatureEnabled() ? (
                              <BookNowButton
                                classId={parseInt(id, 10)}
                                occurrenceId={occurrence.id}
                                className="!px-3 !py-1 !text-smallall"
                              />
                            ) : isBookable ? (
                              <BookingButton
                                paymentLinkUrl={occurrence.stripe_payment_link_url!}
                                occurrenceId={occurrence.id}
                                className="!px-3 !py-1 !text-smallall"
                              />
                            ) : null}
                            <span className="rounded-full bg-sage/15 px-2 py-1 text-smallall font-medium uppercase tracking-wide text-forest">
                              {occurrence.status}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-sage/30 bg-cream/20 p-5">
              {data.providers ? (
                <div className="space-y-2">
                  <h2 className="text-smallall font-semibold uppercase tracking-wide text-charcoal/80">
                    Organised by
                  </h2>
                  <p className="text-body font-medium text-charcoal truncate" lang="en">{data.providers.name}</p>
                  {data.providers.reputation && (
                    <ProviderRating
                      avgRating={data.providers.reputation.avg_rating}
                      reviewCount={data.providers.reputation.review_count}
                      size="sm"
                    />
                  )}
                  {data.providers.website ? (
                    <a
                      href={data.providers.website}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="text-small font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                      tabIndex={0}
                      aria-label={`Visit ${data.providers.name || "provider"} website (opens in new tab)`}
                    >
                      Visit provider website
                    </a>
                  ) : null}
                </div>
              ) : null}

              {data.venues ? (
                <div className="space-y-2">
                  <h2 className="text-smallall font-semibold uppercase tracking-wide text-charcoal/80">
                    Venue
                  </h2>
                  <p className="text-body font-medium text-charcoal truncate" lang="en">
                    {data.venues.name ?? "TBC"}
                  </p>
                  <p className="whitespace-pre-line text-small text-text-tertiary">
                    {[data.venues.address_line1, data.venues.address_line2, data.venues.city, data.venues.postcode]
                      .filter(Boolean)
                      .join("\n")}
                  </p>
                </div>
              ) : null}

              {priceLabel ? (
                <div className="space-y-2">
                  <h2 className="text-smallall font-semibold uppercase tracking-wide text-charcoal/80">
                    Pricing
                  </h2>
                  <p className="text-body font-medium text-charcoal">{priceLabel}</p>
                </div>
              ) : null}

              {data.booking_url ? (
                <a
                  href={data.booking_url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="flex w-full items-center justify-center rounded-md bg-sage px-4 py-2 text-small font-semibold text-white transition hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                  tabIndex={0}
                  aria-label="Book now (opens in new tab)"
                >
                  Book now
                </a>
              ) : null}
            </aside>
          </section>

          {/* Q&A Section - Deferred */}
          {isClassQAEnabled() && (
            <Suspense fallback={<div className="mt-8 text-small text-text-tertiary">Loading Q&A...</div>}>
              <DeferredQnA
                classId={classIdNum}
                providerId={data.provider_id ?? null}
                currentUserId={currentUserId}
              />
            </Suspense>
          )}
        </div>
      </div>
      <ClassPageClient
        classId={id}
        className={data.title || data.name || undefined}
        category={data.main_category || null}
        location={data.venues?.city || data.venues?.address_line1 || null}
        providerId={data.provider_id ?? null}
      />
      {/* Event Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchemas.event) }}
      />
      {/* Course Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchemas.course) }}
      />
      {/* LocalBusiness Schema for Provider */}
      {jsonLdSchemas.localBusiness && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchemas.localBusiness) }}
        />
      )}
      {/* Q&A Schema - Deferred */}
      <Suspense fallback={null}>
        <DeferredQnAJsonLd classId={classIdNum} />
      </Suspense>
    </div>
  );
}

