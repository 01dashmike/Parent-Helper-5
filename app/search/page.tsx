import { Suspense } from "react";
import { Metadata } from "next";
import CategoryRail from "@/components/search/CategoryRail";
import QuickFilters from "@/components/search/QuickFilters";
import ResultsSplit from "@/components/search/ResultsSplit";
import SearchBarSticky from "@/components/search/SearchBarSticky";
// SearchResultsSchema component removed - structured data handled elsewhere

export const dynamic = "force-dynamic";
export const revalidate = 60; // ISR: revalidate every 60 seconds for popular searches

// Dynamic metadata with SEO optimization
export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const location = (searchParams.loc as string) || "your area";
  const category = (searchParams.category as string) || "";
  const query = (searchParams.q as string) || "";
  
  // Build dynamic title
  let title = "Find Baby & Toddler Classes Near You | Parent Helper";
  if (category && location) {
    title = `${category} Classes in ${location} | Parent Helper`;
  } else if (location !== "your area") {
    title = `Baby & Toddler Classes in ${location} | Parent Helper`;
  } else if (query) {
    title = `${query} Classes for Babies & Toddlers | Parent Helper`;
  }

  // Build dynamic description
  const categoryText = category ? `${category.toLowerCase()}, ` : "";
  const description = `Discover the best local baby and toddler classes in ${location}. Explore ${categoryText}sensory play, yoga, music, and more — all trusted by local parents. Find the perfect class for your little one today.`;

  const siteName = "Parent Helper";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://parenthelper.co.uk";
  const ogImage = `${baseUrl}/images/og-search.jpg`;

  return {
    title,
    description,
    keywords: [
      "baby classes",
      "toddler classes",
      "sensory classes",
      "music classes",
      "yoga for babies",
      "parent and baby",
      location,
      category,
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_GB",
      url: `${baseUrl}/search`,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Find baby and toddler classes in ${location}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@parenthelper",
    },
    alternates: {
      canonical: `${baseUrl}/search`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function SearchPage() {
  return (
    <div className="bg-cream text-charcoal min-h-screen">
      {/* JSON-LD Structured Data - handled in component */}
      
      {/* Sticky search bar - critical for LCP */}
      <Suspense fallback={<div className="h-20 border-b border-sage/20 bg-cream animate-pulse" />}>
        <SearchBarSticky />
      </Suspense>
      
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Category rail with branded skeleton */}
        <Suspense fallback={
          <div className="flex gap-2 overflow-x-auto py-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-10 w-24 shrink-0 rounded-full bg-white/60 animate-pulse" />
            ))}
          </div>
        }>
          <CategoryRail />
        </Suspense>
        
        {/* Quick filters with branded skeleton */}
        <div className="rounded-2xl border border-sage/20 bg-white/70 p-4">
          <Suspense fallback={
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-cream/60 animate-pulse" />
              ))}
            </div>
          }>
            <QuickFilters />
          </Suspense>
        </div>
        
        {/* Results split view with branded skeleton */}
        <Suspense fallback={
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl border border-sage/20 bg-white/60 animate-pulse" />
              ))}
            </div>
            <div className="h-[60vh] rounded-2xl border border-sage/20 bg-white/60 animate-pulse" />
          </div>
        }>
          <ResultsSplit results={[]} />
        </Suspense>
      </div>
    </div>
  );
}
