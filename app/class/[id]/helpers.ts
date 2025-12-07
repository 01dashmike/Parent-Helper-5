"use server";

import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { isReviewsFeatureEnabled } from "@/lib/env";
import type { ClassPageData } from "./types";

const cachedFetchClassData = cache(async (id: string): Promise<ClassPageData | null> => {
  const supabase = createServerClient();

  const includeBookings = process.env.FEATURE_BOOKINGS === "true";
  const includeReviews = isReviewsFeatureEnabled();

  const providerSelect = includeReviews
    ? "id, name, slug, website, contact_email, provider_reputation ( avg_rating, review_count )"
    : "id, name, slug, website, contact_email";

  const selectQuery = includeBookings
    ? `id, name, description, price, booking_url, tags, metadata, created_at, provider_id, meta_title, meta_description, keywords, main_category, providers:providers ( ${providerSelect} ), venues:venues ( id, name, address_line1, address_line2, city, county, postcode ), class_sessions ( id, title, weekday, start_time, end_time, session_instances ( id, starts_at, ends_at, status, bookable, stripe_payment_link_url, capacity, available_spots ) ), images:images ( storage_path, alt_text )`
    : `id, title, summary, description, price, booking_url, tags, metadata, created_at, provider_id, meta_title, meta_description, keywords, main_category, providers:providers ( ${providerSelect} ), venues:venues ( id, name, address_line1, address_line2, city, county, postcode ), class_occurrences ( id, starts_at, ends_at, status, venue_id ), images:images ( storage_path, alt_text )`;

  const { data, error } = await supabase
    .from("classes")
    .select(selectQuery)
    .eq("id", id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[fetchClassData] query failed:", error);
    return null;
  }

  return (data as ClassPageData | null) ?? null;
});

export async function fetchClassData(id: string): Promise<ClassPageData | null> {
  return cachedFetchClassData(id);
}


