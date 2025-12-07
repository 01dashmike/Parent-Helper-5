/**
 * Referral code generation utilities
 * 
 * Generates branded referral codes in format: PH-XXXXXX
 * Where XXXXXX is a 6-character uppercase alphanumeric string
 */

import { getSupabaseServer } from "@/lib/supabase.server";

/**
 * Generate a random 6-character uppercase alphanumeric string
 * Excludes confusing characters: 0, O, I, 1
 */
function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude 0, O, I, 1
  let code = "";
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Generate a branded referral code in format: PH-XXXXXX
 * 
 * @returns A referral code string (e.g., "PH-4F92KD")
 */
export function generateReferralCode(): string {
  const prefix = "PH-";
  return prefix + generateRandomCode();
}

/**
 * Check if a referral code is unique across all referral tables
 * 
 * @param code - The referral code to check
 * @param supabase - Supabase client instance
 * @returns Promise<boolean> - true if unique, false if exists
 */
async function isCodeUnique(
  code: string,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  // Check member_referrals table
  const { data: memberReferral } = await supabase
    .from("member_referrals")
    .select("id")
    .eq("referral_code", code)
    .limit(1)
    .maybeSingle();

  if (memberReferral) {
    return false;
  }

  // Check provider_referrals table
  const { data: providerReferral } = await supabase
    .from("provider_referrals")
    .select("id")
    .eq("referral_code", code)
    .limit(1)
    .maybeSingle();

  if (providerReferral) {
    return false;
  }

  // Check referrals table (legacy/combined table)
  const { data: referral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referral_code", code)
    .limit(1)
    .maybeSingle();

  if (referral) {
    return false;
  }

  return true;
}

/**
 * Generate a unique referral code with collision checking
 * 
 * Checks for uniqueness across all referral tables:
 * - member_referrals
 * - provider_referrals
 * - referrals (legacy)
 * 
 * Retries up to 10 times if collisions occur.
 * 
 * @param supabase - Optional Supabase client (will fetch if not provided)
 * @returns Promise<string> - A unique referral code
 * @throws Error if unable to generate unique code after retries
 */
export async function generateUniqueReferralCode(
  supabase?: ReturnType<typeof getSupabaseServer>
): Promise<string> {
  const client = supabase || getSupabaseServer();
  
  if (!client) {
    throw new Error("Supabase client not available");
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateReferralCode();
    
    if (await isCodeUnique(code, client)) {
      return code;
    }
    
    attempts++;
  }

  throw new Error(`Failed to generate unique referral code after ${maxAttempts} attempts`);
}

