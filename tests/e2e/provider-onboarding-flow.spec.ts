import { test, expect } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.use({ baseURL });

let supabase: SupabaseClient | null = null;
let testUserId: string | null = null;
let testProviderId: number | null = null;
let testClassId: number | null = null;

test.beforeAll(async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    test.skip(true, "Supabase environment variables are required for provider onboarding e2e tests.");
    return;
  }

  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
});

test.afterAll(async () => {
  if (!supabase) return;

  // Cleanup test data
  if (testClassId) {
    await supabase.from("classes").delete().eq("id", testClassId);
  }
  if (testProviderId) {
    await supabase.from("provider_onboarding").delete().eq("provider_id", testProviderId);
    await supabase.from("provider_rewards").delete().eq("provider_id", testProviderId);
    await supabase.from("provider_accounts").delete().eq("provider_id", testProviderId);
    await supabase.from("providers_users").delete().eq("provider_id", testProviderId);
    await supabase.from("providers").delete().eq("id", testProviderId);
  }
  if (testUserId) {
    await supabase.auth.admin.deleteUser(testUserId);
  }
});

test.describe("Provider Onboarding Flow", () => {
  test("complete provider onboarding funnel", async ({ page }) => {
    test.skip(!supabase, "Supabase client not available");

    // Mock email sending
    await page.route("**/api/emails/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock Stripe calls
    await page.route("**/api/stripe/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Step 1: Seed a new user (not yet a provider)
    const testEmail = `provider-onboarding-${Date.now()}@test.parenthelper.co.uk`;
    const testPassword = "TestPassword123!";

    const { data: authData, error: authError } = await supabase!.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testUserId = authData.user.id;

    // Verify user is not yet a provider
    const { data: existingProvider } = await supabase!
      .from("providers")
      .select("id")
      .eq("claimed_by_user_id", testUserId)
      .maybeSingle();

    expect(existingProvider).toBeNull();

    // Step 2: Visit /provider/onboarding
    await page.goto("/provider/login");
    
    // Login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /sign in|login/i }).click();
    
    // Wait for redirect after login
    await page.waitForURL(/\/provider/, { timeout: 10000 });

    // Navigate to onboarding
    await page.goto("/provider/onboarding");
    await page.waitForLoadState("networkidle");

    // Step 3: Complete Step 1 (basic details)
    await expect(page.getByText(/basic details/i)).toBeVisible();

    const businessName = `Test Business ${Date.now()}`;
    await page.getByLabel(/business name/i).fill(businessName);
    await page.getByLabel(/contact email/i).fill(testEmail);
    await page.getByLabel(/contact phone/i).fill("07123456789");
    await page.getByLabel(/region/i).selectOption({ label: "London" });

    await page.getByRole("button", { name: /continue/i }).click();

    // Wait for step 1 to complete and provider account to be created
    await expect
      .poll(
        async () => {
          const { data: provider } = await supabase!
            .from("providers")
            .select("id, name, contact_email")
            .eq("claimed_by_user_id", testUserId)
            .maybeSingle();
          return provider;
        },
        { timeout: 10000 }
      )
      .toMatchObject({
        name: businessName,
        contact_email: testEmail,
      });

    const { data: provider } = await supabase!
      .from("providers")
      .select("id")
      .eq("claimed_by_user_id", testUserId)
      .single();

    testProviderId = provider!.id;

    // Verify onboarding record created
    const { data: onboarding } = await supabase!
      .from("provider_onboarding")
      .select("provider_id, completed_steps, progress")
      .eq("provider_id", testProviderId)
      .single();

    expect(onboarding).toBeTruthy();
    expect(onboarding?.completed_steps).toContain("step1");

    // Step 4: Complete Step 2 - add first class
    await page.waitForSelector("text=/add.*first class/i", { timeout: 5000 });

    // Click "Create Class" button
    await page.getByRole("button", { name: /create class/i }).click();

    // Wait for class creation page (could be /provider/classes/new or similar)
    await page.waitForURL(/\/provider\/.*classes.*new|\/provider\/classes/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Fill in class details - try multiple selectors for flexibility
    const titleField = page.getByLabel(/title|class name/i).first();
    if (await titleField.isVisible()) {
      await titleField.fill(`Test Class ${Date.now()}`);
    } else {
      // Fallback: try by placeholder or name attribute
      await page.locator('input[name="title"], input[placeholder*="title" i]').fill(`Test Class ${Date.now()}`);
    }

    const summaryField = page.getByLabel(/summary|description/i).first();
    if (await summaryField.isVisible()) {
      await summaryField.fill("A test class for onboarding");
    } else {
      await page.locator('textarea[name="summary"], textarea[placeholder*="description" i]').fill("A test class for onboarding");
    }
    
    // Set price if field exists
    const priceField = page.getByLabel(/price/i).first();
    if (await priceField.isVisible()) {
      await priceField.fill("10.00");
    }

    // Check is_published checkbox (if exists) - look for checkbox or toggle
    const publishedCheckbox = page.locator('input[name="is_published"], input[type="checkbox"][value*="published" i]').first();
    if (await publishedCheckbox.isVisible()) {
      await publishedCheckbox.check();
    } else {
      // Try toggle or switch
      const publishedToggle = page.locator('button[aria-label*="published" i], [role="switch"]').first();
      if (await publishedToggle.isVisible()) {
        const isChecked = await publishedToggle.getAttribute("aria-checked");
        if (isChecked !== "true") {
          await publishedToggle.click();
        }
      }
    }

    // Submit class creation - try multiple button text patterns
    const submitButton = page.getByRole("button", { name: /create|save|submit|publish/i }).first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      // Fallback: try form submit
      await page.locator('form').first().submit();
    }

    // Wait for class to be created - check for redirect or success message
    await expect
      .poll(
        async () => {
          const { data: classes } = await supabase!
            .from("classes")
            .select("id, is_published")
            .eq("provider_id", testProviderId)
            .eq("is_published", true);
          return classes && classes.length > 0 ? classes[0] : null;
        },
        { timeout: 15000 }
      )
      .not.toBeNull();

    // Navigate back to onboarding to continue (class creation may redirect)
    await page.goto("/provider/onboarding?step=2");
    await page.waitForLoadState("networkidle");
    
    // If step 2 shows as complete, click continue
    const continueButton = page.getByRole("button", { name: /continue|next/i });
    if (await continueButton.isVisible()) {
      await continueButton.click();
    }

    const { data: createdClass } = await supabase!
      .from("classes")
      .select("id, is_published")
      .eq("provider_id", testProviderId)
      .eq("is_published", true)
      .single();

    testClassId = createdClass!.id;

    // Verify class exists and is published
    expect(createdClass).toBeTruthy();
    expect(createdClass?.is_published).toBe(true);

    // Verify onboarding step 2 marked complete
    const { data: onboardingAfterClass } = await supabase!
      .from("provider_onboarding")
      .select("completed_steps")
      .eq("provider_id", testProviderId)
      .single();

    expect(onboardingAfterClass?.completed_steps).toContain("step2");

    // Verify onboarding reward created
    await expect
      .poll(
        async () => {
          const { data: reward } = await supabase!
            .from("provider_rewards")
            .select("id, reward_type, provider_id")
            .eq("provider_id", testProviderId)
            .eq("reward_type", "provider_onboarding")
            .maybeSingle();
          return reward;
        },
        { timeout: 10000 }
      )
      .toMatchObject({
        reward_type: "provider_onboarding",
        provider_id: testProviderId,
      });

    // Step 5: Optionally complete Step 3 (upload photo - can be skipped)
    // Navigate back to onboarding if needed
    await page.goto("/provider/onboarding?step=3");
    await page.waitForLoadState("networkidle");

    // Skip photo upload for now (optional step)
    const skipButton = page.getByRole("button", { name: /skip|continue without/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      // If no skip button, just continue to next step
      const continueButton = page.getByRole("button", { name: /continue|next/i });
      if (await continueButton.isVisible()) {
        await continueButton.click();
      }
    }

    // Step 6: Step 4 - show referral link
    await page.waitForURL(/\/provider\/onboarding/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Wait for referral code to appear
    await expect
      .poll(
        async () => {
          const referralCodeElement = page.locator('text=/PH-[A-Z0-9]+/i, [class*="referral"], code').first();
          return await referralCodeElement.isVisible();
        },
        { timeout: 10000 }
      )
      .toBe(true);

    // Verify referral code is present
    const referralCodeText = await page.locator('text=/PH-[A-Z0-9]+/i, code, [class*="referral"]').first().textContent();
    expect(referralCodeText).toBeTruthy();
    expect(referralCodeText).toMatch(/PH-[A-Z0-9]+/i);

    // Verify referral code is stored in database
    const { data: providerWithCode } = await supabase!
      .from("providers")
      .select("referral_code")
      .eq("id", testProviderId)
      .single();

    expect(providerWithCode?.referral_code).toBeTruthy();
    expect(providerWithCode?.referral_code).toMatch(/PH-[A-Z0-9]+/i);

    // Complete onboarding
    await page.getByRole("button", { name: /complete onboarding|finish/i }).click();

    // Wait for onboarding completion
    await expect
      .poll(
        async () => {
          const { data: onboardingComplete } = await supabase!
            .from("provider_onboarding")
            .select("is_complete")
            .eq("provider_id", testProviderId)
            .single();
          return onboardingComplete?.is_complete;
        },
        { timeout: 10000 }
      )
      .toBe(true);

    // Step 7: After completion - verify redirects and banners
    // Visiting /provider/onboarding should redirect to /provider/dashboard
    await page.goto("/provider/onboarding");
    await page.waitForURL(/\/provider(\/dashboard)?(\/)?$/, { timeout: 10000 });

    // Verify onboarding banner is hidden
    const onboardingBanner = page.locator('text=/finish.*onboarding|complete.*setup/i');
    await expect(onboardingBanner).not.toBeVisible({ timeout: 5000 });

    // Verify reward banner is visible
    const rewardBanner = page.locator('text=/earned.*reward|onboarding reward/i');
    await expect(rewardBanner).toBeVisible({ timeout: 5000 });

    // Verify final onboarding state
    const { data: finalOnboarding } = await supabase!
      .from("provider_onboarding")
      .select("is_complete, completed_steps, progress")
      .eq("provider_id", testProviderId)
      .single();

    expect(finalOnboarding?.is_complete).toBe(true);
    expect(finalOnboarding?.completed_steps).toContain("step1");
    expect(finalOnboarding?.completed_steps).toContain("step2");
    expect(finalOnboarding?.completed_steps).toContain("step4");
    expect(finalOnboarding?.progress).toBeGreaterThanOrEqual(75); // At least 3/4 steps complete
  });
});

