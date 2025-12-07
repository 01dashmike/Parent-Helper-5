/**
 * Normalize referral code utility
 * 
 * Rules:
 * 1. Trim whitespace
 * 2. Uppercase
 * 3. Auto-add PH- prefix if missing
 * 4. Validate final pattern /^PH-[A-Z0-9]{6}$/
 * 
 * @param code - Raw referral code input
 * @returns Normalized referral code or null if invalid
 */
export function normalizeReferralCode(code: string | null | undefined): string | null {
    if (!code || typeof code !== "string") {
        return null;
    }

    // Step 1: Trim whitespace
    let normalized = code.trim();

    // Step 2: Uppercase
    normalized = normalized.toUpperCase();

    // Step 3: Auto-add PH- prefix if missing
    if (!normalized.startsWith("PH-")) {
        normalized = `PH-${normalized}`;
    }

    // Step 4: Validate final pattern /^PH-[A-Z0-9]{6}$/
    const pattern = /^PH-[A-Z0-9]{6}$/;
    if (!pattern.test(normalized)) {
        return null;
    }

    return normalized;
}

/**
 * Normalize referral code (throws on invalid)
 * Use this when you want to throw an error for invalid codes
 * 
 * @param code - Raw referral code input
 * @throws Error if code is invalid
 * @returns Normalized referral code
 */
export function normalizeReferralCodeOrThrow(code: string | null | undefined): string {
    const normalized = normalizeReferralCode(code);
    if (!normalized) {
        throw new Error(`Invalid referral code format. Expected format: PH-XXXXXX (6 alphanumeric characters)`);
    }
    return normalized;
}

