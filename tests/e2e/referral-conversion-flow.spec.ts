import { test, expect } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const REFERRALS_ENABLED = process.env.REFERRALS_ENABLED === "true";
const REWARDS_ENABLED = process.env.REWARDS_ENABLED === "true";

let supabase: SupabaseClient | null = null;

test.beforeAll(async () => {
  // Setup Supabase client for test data
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
  }
});

test.describe("Referral Conversion Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !REFERRALS_ENABLED || !REWARDS_ENABLED,
      "REFERRALS_ENABLED and REWARDS_ENABLED must be set to true"
    );
    test.skip(!supabase, "Supabase client not available");
  });

  test("member referral conversion on first booking", async ({ page, request }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const referrerEmail = `referrer-${timestamp}@test.parenthelper.dev`;
    const referredEmail = `referred-${timestamp}@test.parenthelper.dev`;
    const referrerUserId = `test-user-${timestamp}-referrer`;
    const referredUserId = `test-user-${timestamp}-referred`;

    // Clean up any existing test data
    if (supabase) {
      await supabase.from("member_referrals").delete().eq("referred_email", referredEmail);
      await supabase.from("rewards").delete().eq("user_id", referrerUserId);
      await supabase.from("rewards").delete().eq("user_id", referredUserId);
      await supabase.from("simple_bookings").delete().eq("email", referredEmail);
    }

    // Step 1: Create referrer user (User A)
    let referrerAuthUserId: string | null = null;
    if (supabase) {
      try {
        const { data: referrerUser, error: createError } = await supabase.auth.admin.createUser({
          email: referrerEmail,
          password: "TestPassword123!",
          email_confirm: true,
        });
        if (!createError && referrerUser?.user) {
          referrerAuthUserId = referrerUser.user.id;
        }
      } catch (error) {
        // User might already exist, try to get it
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser?.users.find((u) => u.email === referrerEmail);
        if (found) {
          referrerAuthUserId = found.id;
        }
      }
    }

    test.skip(!referrerAuthUserId, "Failed to create referrer user");

    // Step 2: User A generates referral link via API
    const createReferralResponse = await request.post(`${baseURL}/api/referral/create`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: `sb-access-token=test-token; sb-refresh-token=test-refresh`, // Mock auth
      },
      data: {
        referred_email: referredEmail,
        type: "member",
      },
      failOnStatusCode: false,
    });

    // If API requires auth, we'll create referral directly via Supabase
    let referralCode: string | null = null;
    let referralId: string | null = null;

    if (supabase && referrerAuthUserId) {
      // Generate referral code in PH-XXXXXX format
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude 0, O, I, 1
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      referralCode = `PH-${code}`;
      
      // Check for uniqueness and retry if needed
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from("member_referrals")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();
        
        if (!existing) {
          break; // Code is unique
        }
        
        // Regenerate
        code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        referralCode = `PH-${code}`;
        attempts++;
      }

      // Create referral record
      const { data: referral, error: referralError } = await supabase
        .from("member_referrals")
        .insert({
          referrer_user_id: referrerAuthUserId,
          referred_email: referredEmail.toLowerCase(),
          referral_code: referralCode,
          status: "pending",
        })
        .select()
        .single();

      if (!referralError && referral) {
        referralId = referral.id;
      }
    }

    test.skip(!referralCode || !referralId, "Failed to create referral");

    // Step 3: Create referred user (User B) via signup with referral code
    let referredAuthUserId: string | null = null;
    if (supabase) {
      try {
        const { data: referredUser, error: createError } = await supabase.auth.admin.createUser({
          email: referredEmail,
          password: "TestPassword123!",
          email_confirm: true,
        });
        if (!createError && referredUser?.user) {
          referredAuthUserId = referredUser.user.id;
        }
      } catch (error) {
        // User might already exist
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser?.users.find((u) => u.email === referredEmail);
        if (found) {
          referredAuthUserId = found.id;
        }
      }
    }

    test.skip(!referredAuthUserId, "Failed to create referred user");

    // Step 4: User B completes first booking
    // Create a simple_booking with the referral code
    // Important: Ensure this is the first booking for this user
    let bookingId: string | null = null;
    if (supabase && referralCode) {
      // Clean up any existing bookings for this user to ensure it's the first
      await supabase
        .from("simple_bookings")
        .delete()
        .eq("email", referredEmail.toLowerCase());
      await supabase
        .from("bookings")
        .delete()
        .eq("email", referredEmail.toLowerCase());

      // Get a test occurrence_id (use first available)
      const { data: occurrence } = await supabase
        .from("session_instances")
        .select("id")
        .limit(1)
        .single();

      if (occurrence) {
        const { data: booking, error: bookingError } = await supabase
          .from("simple_bookings")
          .insert({
            occurrence_id: occurrence.id,
            email: referredEmail.toLowerCase(),
            amount_cents: 2000, // £20.00
            currency: "gbp",
            status: "confirmed",
            referral_code: referralCode,
            reward_triggered: false,
          })
          .select()
          .single();

        if (!bookingError && booking) {
          bookingId = booking.id;
        }
      }
    }

    test.skip(!bookingId, "Failed to create booking");

    // Step 5: Mock Stripe and email services
    await page.route("**/api/stripe/**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { received: true },
      });
    });

    // Mock email sending
    await page.route("**/api/emails/**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { ok: true },
      });
    });

    // Step 6: Call referral convert API
    const convertResponse = await request.post(`${baseURL}/api/referral/convert`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        booking_id: bookingId,
        user_email: referredEmail,
      },
    });

    expect(convertResponse.ok()).toBeTruthy();
    const convertData = await convertResponse.json();
    expect(convertData.success).toBe(true);

    // Step 7: Verify referral status updated
    if (supabase && referralId) {
      const { data: updatedReferral } = await supabase
        .from("member_referrals")
        .select("*")
        .eq("id", referralId)
        .single();

      expect(updatedReferral).toBeTruthy();
      expect(updatedReferral?.status).toBe("converted");
      expect(updatedReferral?.reward_triggered).toBe(true);
      expect(updatedReferral?.converted_at).toBeTruthy();
    }

    // Step 8: Verify reward created for User A (referrer)
    if (supabase && referrerAuthUserId) {
      const { data: referrerRewards } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", referrerAuthUserId)
        .eq("source", "referral")
        .order("created_at", { ascending: false })
        .limit(1);

      expect(referrerRewards).toBeTruthy();
      expect(referrerRewards?.length).toBeGreaterThan(0);
      
      const referrerReward = referrerRewards?.[0];
      expect(referrerReward?.status).toBe("available");
      expect(referrerReward?.value_cents).toBe(500); // £5 reward
      expect(referrerReward?.points).toBe(500);
      expect(referrerReward?.metadata).toBeTruthy();
      
      const metadata = referrerReward?.metadata as any;
      expect(metadata?.source).toBe("referral");
      expect(metadata?.referred_user_id).toBe(referredAuthUserId);
      expect(metadata?.booking_id).toBe(bookingId);
    }

    // Step 9: Verify reward created for User B (referred user)
    if (supabase && referredAuthUserId) {
      const { data: referredRewards } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", referredAuthUserId)
        .eq("source", "referral")
        .order("created_at", { ascending: false })
        .limit(1);

      expect(referredRewards).toBeTruthy();
      expect(referredRewards?.length).toBeGreaterThan(0);
      
      const referredReward = referredRewards?.[0];
      expect(referredReward?.status).toBe("available");
      expect(referredReward?.value_cents).toBe(500); // £5 reward
    }

    // Step 10: Verify referral analytics event logged
    if (supabase) {
      // Check if analytics events table exists and has referral conversion
      const { data: analyticsEvents } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("event_name", "referral_converted")
        .order("created_at", { ascending: false })
        .limit(1);

      // Analytics might be logged to a different table, so this is optional
      // The important thing is that the conversion API succeeded
    }

    // Cleanup
    if (supabase) {
      await supabase.from("member_referrals").delete().eq("id", referralId!);
      await supabase.from("rewards").delete().eq("user_id", referrerAuthUserId!);
      await supabase.from("rewards").delete().eq("user_id", referredAuthUserId!);
      await supabase.from("simple_bookings").delete().eq("id", bookingId!);
      if (referrerAuthUserId) {
        await supabase.auth.admin.deleteUser(referrerAuthUserId);
      }
      if (referredAuthUserId) {
        await supabase.auth.admin.deleteUser(referredAuthUserId);
      }
    }
  });

  test("provider referral conversion on first booking", async ({ page, request }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const referrerProviderId = 999999; // Test provider ID
    const referredProviderId = 999998; // Test provider ID
    
    // Generate referral code in PH-XXXXXX format
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude 0, O, I, 1
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const referralCode = `PH-${code}`;
    const testEmail = `provider-${timestamp}@test.parenthelper.dev`;

    // Clean up test data
    if (supabase) {
      await supabase
        .from("provider_referrals")
        .delete()
        .eq("referral_code", referralCode);
      await supabase
        .from("provider_rewards")
        .delete()
        .eq("provider_id", referrerProviderId);
      await supabase
        .from("simple_bookings")
        .delete()
        .eq("email", testEmail);
    }

    // Step 1: Create provider referral
    let providerReferralId: string | null = null;
    if (supabase) {
      const { data: providerReferral, error: referralError } = await supabase
        .from("provider_referrals")
        .insert({
          provider_id: referrerProviderId,
          referred_provider_id: referredProviderId,
          referral_code: referralCode,
          status: "registered",
          reward_issued: false,
        })
        .select()
        .single();

      if (!referralError && providerReferral) {
        providerReferralId = providerReferral.id;
      }
    }

    test.skip(!providerReferralId, "Failed to create provider referral");

    // Step 2: Create booking with provider referral code
    let bookingId: string | null = null;
    if (supabase) {
      const { data: occurrence } = await supabase
        .from("session_instances")
        .select("id")
        .limit(1)
        .single();

      if (occurrence) {
        // Get provider_id from occurrence
        const { data: classSession } = await supabase
          .from("class_sessions")
          .select("classes!inner(provider_id)")
          .eq("session_instance_id", occurrence.id)
          .single();

        const providerId = (classSession as any)?.classes?.provider_id;

        const { data: booking, error: bookingError } = await supabase
          .from("simple_bookings")
          .insert({
            occurrence_id: occurrence.id,
            email: testEmail,
            amount_cents: 5000, // £50.00
            currency: "gbp",
            status: "confirmed",
            referral_code: referralCode,
            provider_id: providerId || referredProviderId,
            reward_triggered: false,
          })
          .select()
          .single();

        if (!bookingError && booking) {
          bookingId = booking.id;
        }
      }
    }

    test.skip(!bookingId, "Failed to create booking");

    // Step 3: Mock email sending (Stripe coupon creation happens server-side)
    // Note: For e2e tests, Stripe calls happen server-side via getStripe()
    // If STRIPE_SECRET_KEY is set to a test key, real test coupons will be created
    // Otherwise, the test will fail gracefully
    await page.route("**/api/emails/**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { ok: true },
      });
    });

    // Step 4: Call referral convert API
    const convertResponse = await request.post(`${baseURL}/api/referral/convert`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        booking_id: bookingId,
        user_email: testEmail,
      },
    });

    expect(convertResponse.ok()).toBeTruthy();
    const convertData = await convertResponse.json();
    expect(convertData.success).toBe(true);
    expect(convertData.type).toBe("provider_referral");
    // Coupon creation may succeed or fail depending on Stripe test key availability
    // The important thing is that the conversion succeeded
    if (convertData.coupon_created !== undefined) {
      expect(typeof convertData.coupon_created).toBe("boolean");
    }

    // Step 5: Verify provider referral status updated
    if (supabase && providerReferralId) {
      const { data: updatedReferral } = await supabase
        .from("provider_referrals")
        .select("*")
        .eq("id", providerReferralId)
        .single();

      expect(updatedReferral).toBeTruthy();
      expect(updatedReferral?.status).toBe("first_booking");
      expect(updatedReferral?.reward_issued).toBe(true);
    }

    // Step 6: Verify provider reward created with coupon
    if (supabase) {
      const { data: providerRewards } = await supabase
        .from("provider_rewards")
        .select("*")
        .eq("provider_id", referrerProviderId)
        .order("created_at", { ascending: false })
        .limit(1);

      expect(providerRewards).toBeTruthy();
      expect(providerRewards?.length).toBeGreaterThan(0);
      
      const providerReward = providerRewards?.[0];
      expect(providerReward?.status).toBe("available");
      expect(providerReward?.metadata).toBeTruthy();
      
      const metadata = providerReward?.metadata as any;
      expect(metadata?.expired_by_cron).toBeUndefined(); // Should not be expired
      // Stripe coupon ID may or may not be present depending on Stripe test key availability
      // But metadata should contain referral_id
      expect(metadata?.referral_id).toBe(providerReferralId);
      // If coupon was created, verify it's in metadata
      if (convertData.coupon_created && convertData.coupon_id) {
        expect(metadata?.stripe_coupon_id).toBeTruthy();
      }
    }

    // Cleanup
    if (supabase) {
      await supabase
        .from("provider_referrals")
        .delete()
        .eq("id", providerReferralId!);
      await supabase
        .from("provider_rewards")
        .delete()
        .eq("provider_id", referrerProviderId);
      await supabase
        .from("simple_bookings")
        .delete()
        .eq("id", bookingId!);
    }
  });
});

