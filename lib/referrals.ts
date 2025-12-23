import { cookies, headers } from "next/headers";
import { createSupabaseServerActionClient } from "@/lib/supabase";
import crypto from "crypto";

const REFERRAL_COOKIE_NAME = "ph_referral_id";
const REFERRAL_SECRET = process.env.REFERRAL_SIGNING_SECRET || "dev_referral_secret";

/**
 * Very small bot filter – you can tighten this later
 */
export function isProbablyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("headless") ||
    ua.includes("monitor") ||
    ua.includes("uptime") ||
    ua.includes("pingdom")
  );
}

/**
 * Create signed cookie payload
 */
function signPayload(payload: object): string {
  const json = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", REFERRAL_SECRET);
  hmac.update(json);
  const signature = hmac.digest("hex");
  return Buffer.from(JSON.stringify({ json, signature })).toString("base64url");
}

/**
 * Verify and parse cookie payload
 */
export function parseSignedReferralCookie(raw: string | undefined | null) {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const { json, signature } = JSON.parse(decoded) as { json: string; signature: string };
    const hmac = crypto.createHmac("sha256", REFERRAL_SECRET);
    hmac.update(json);
    const expected = hmac.digest("hex");
    if (expected !== signature) return null;
    return JSON.parse(json) as {
      cookieId: string;
      refCode: string;
      createdAt: string;
      visitId?: string | null;
    };
  } catch {
    return null;
  }
}

/**
 * Create a new signed referral cookie payload
 */
export function createReferralCookieValue(args: { cookieId: string; refCode: string; visitId?: string }) {
  const payload = {
    cookieId: args.cookieId,
    refCode: args.refCode,
    visitId: args.visitId ?? null,
    createdAt: new Date().toISOString(),
  };
  return signPayload(payload);
}

/**
 * Record a referral VISIT if we don't have one yet for this browser
 * Returns { visitId, cookieId }
 */
export async function recordReferralVisit(refCode: string) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const existingRaw = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  const parsed = parseSignedReferralCookie(existingRaw);

  // If we already have a visit with a visitId, just return it
  if (parsed?.visitId && parsed.cookieId && parsed.refCode === refCode) {
    return { visitId: parsed.visitId, cookieId: parsed.cookieId };
  }

  const cookieId = parsed?.cookieId ?? crypto.randomUUID();
  const userAgent = headerStore.get("user-agent");
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0] ?? null;
  const path = headerStore.get("x-pathname") ?? null; // optional, may be null

  if (isProbablyBot(userAgent)) {
    // Don't create DB rows for bots, but still set a cookie so we don't retry
    return { visitId: null, cookieId };
  }

  const supabase = createSupabaseServerActionClient();

  // Ensure the source row exists
  const { data: source } = await supabase
    .from("referral_sources")
    .select("*")
    .eq("ref_code", refCode)
    .maybeSingle();

  let sourceId = source?.id as string | undefined;

  if (!sourceId) {
    const { data: inserted } = await supabase
      .from("referral_sources")
      .insert({ ref_code: refCode, name: refCode })
      .select()
      .single();

    sourceId = inserted?.id;
  }

  const { data: visit } = await supabase
    .from("referral_visits")
    .insert({
      ref_code: refCode,
      source_id: sourceId,
      cookie_id: cookieId,
      ip,
      user_agent: userAgent,
      first_path: path,
    })
    .select()
    .single();

  return { visitId: visit?.id ?? null, cookieId };
}

/**
 * Attach a CONVERSION to the referral for the current user (if any)
 * Call this from your auth callback / post-login flow.
 */
export async function recordReferralConversionForCurrentUser({
  userId,
}: {
  userId: string;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  const parsed = parseSignedReferralCookie(raw);

  if (!parsed?.cookieId || !parsed.refCode) return;

  const supabase = createSupabaseServerActionClient();

  // Find the latest visit for this cookie/ref
  const { data: visit } = await supabase
    .from("referral_visits")
    .select("*")
    .eq("cookie_id", parsed.cookieId)
    .eq("ref_code", parsed.refCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!visit?.id) return;

  // Check if we already have a conversion for this user + visit
  const { data: existing } = await supabase
    .from("referral_conversions")
    .select("*")
    .eq("user_id", userId)
    .eq("visit_id", visit.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("referral_conversions").insert({
    visit_id: visit.id,
    user_id: userId,
    conversion_type: "signup",
  });
}








