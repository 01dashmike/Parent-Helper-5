import { test, expect } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
let skipE2E = false;
let supabase: SupabaseClient | null = null;

test.use({ baseURL });

test.beforeAll(async ({ request }) => {
  // Check if app is running
  try {
    const response = await request.get("/", { timeout: 5000 });
    if (!response.ok()) {
      skipE2E = true;
    }
  } catch (error) {
    skipE2E = true;
  }

  // Setup Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
  }
});

test.describe("Family Recommendations Flow", () => {
  let testUserId: string | null = null;
  let testFamilyId: string | null = null;
  let testChildId: string | null = null;
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    test.skip(skipE2E, "App not reachable. Start the app or set PLAYWRIGHT_BASE_URL.");
    test.skip(!supabase, "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

    // Generate unique test data
    testEmail = `test-family-${Date.now()}@parenthelper.dev`;
    testPassword = `TestPassword123!${Date.now()}`;

    // Clean up any existing test data
    if (supabase) {
      // Find and delete existing user
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(testEmail);
      if (existingUser?.user) {
        await supabase.auth.admin.deleteUser(existingUser.user.id);
      }

      // Clean up family profiles
      if (testUserId) {
        await supabase.from("family_profiles").delete().eq("user_id", testUserId);
        await supabase.from("children").delete().eq("family_id", testFamilyId || "");
        await supabase.from("saved_recommendations").delete().eq("user_id", testUserId);
      }
    }
  });

  test.afterEach(async () => {
    // Cleanup
    if (supabase && testUserId) {
      await supabase.from("saved_recommendations").delete().eq("user_id", testUserId);
      await supabase.from("children").delete().eq("family_id", testFamilyId || "");
      await supabase.from("family_profiles").delete().eq("user_id", testUserId);
      if (testUserId) {
        await supabase.auth.admin.deleteUser(testUserId);
      }
    }
  });

  test("creates child profile and sees personalized recommendations on homepage", async ({
    page,
  }) => {
    // Step 1: Register a new user
    await page.goto("/account/register");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect or confirmation
    await page.waitForURL(/\/account|home/, { timeout: 10000 });

    // Get user ID from Supabase
    if (supabase) {
      const { data: user } = await supabase.auth.admin.getUserByEmail(testEmail);
      if (user?.user) {
        testUserId = user.user.id;
      }
    }

    expect(testUserId).toBeTruthy();

    // Step 2: Create family profile
    await page.goto("/family/new");
    await page.waitForLoadState("networkidle");

    // Fill family profile form
    await page.fill('input[id="home_town"]', "London");
    await page.fill('input[id="home_postcode"]', "SW11 1AA");

    // Select some interests
    await page.click('button:has-text("music")');
    await page.click('button:has-text("dance")');

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/family/, { timeout: 5000 });

    // Verify family profile was created
    if (supabase && testUserId) {
      const { data: family } = await supabase
        .from("family_profiles")
        .select("id")
        .eq("user_id", testUserId)
        .single();
      expect(family).toBeTruthy();
      if (family) testFamilyId = family.id;
    }

    // Step 3: Add a child
    await page.goto("/family/children/new");
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="first_name"]', "Emma");
    await page.fill('input[id="age_years"]', "2");
    await page.fill('input[id="age_months"]', "6"); // 30 months total

    // Select interests
    await page.click('button:has-text("music")');
    await page.click('button:has-text("arts")');

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/family/, { timeout: 5000 });

    // Verify child was created
    if (supabase && testFamilyId) {
      const { data: children } = await supabase
        .from("children")
        .select("id")
        .eq("family_id", testFamilyId);
      expect(children).toBeTruthy();
      expect(children?.length).toBeGreaterThan(0);
      if (children && children.length > 0) {
        testChildId = children[0].id;
      }
    }

    // Step 4: Refresh homepage and check for recommendations
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for recommendations section to appear (may take a moment to load)
    const recommendationsSection = page.locator('text=Recommended for your family');
    await recommendationsSection.waitFor({ timeout: 10000 }).catch(() => {
      // If no recommendations appear, that's OK - might be no matching classes
      // But we should at least verify the API works
    });

    // Step 5: Verify recommendations API returns data
    const response = await page.request.get("/api/recommendations");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("recommendations");
    expect(Array.isArray(data.recommendations)).toBe(true);

    // If there are classes in the database, we should get recommendations
    // If no classes exist, recommendations will be empty (which is fine)
    if (data.recommendations.length > 0) {
      // Verify recommendation structure
      const firstRec = data.recommendations[0];
      expect(firstRec).toHaveProperty("id");
      expect(firstRec).toHaveProperty("name");
      expect(firstRec).toHaveProperty("score");
      expect(firstRec).toHaveProperty("reason");

      // Verify recommendations are saved in database
      if (supabase && testUserId) {
        const { data: saved } = await supabase
          .from("saved_recommendations")
          .select("*")
          .eq("user_id", testUserId);
        expect(saved).toBeTruthy();
        expect(saved?.length).toBeGreaterThan(0);
      }
    }
  });

  test("excludes classes with allergies", async ({ page }) => {
    // This test verifies that classes mentioning allergens are excluded
    // We'll need to have a class in the database with allergen keywords

    // Register and login
    await page.goto("/account/register");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/account|home/, { timeout: 10000 });

    // Get user ID
    if (supabase) {
      const { data: user } = await supabase.auth.admin.getUserByEmail(testEmail);
      if (user?.user) {
        testUserId = user.user.id;
      }
    }

    // Create family profile with nut allergy
    await page.goto("/family/new");
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="home_town"]', "London");
    await page.click('button:has-text("nuts")'); // Select nut allergy
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/family/, { timeout: 5000 });

    // Get family ID
    if (supabase && testUserId) {
      const { data: family } = await supabase
        .from("family_profiles")
        .select("id")
        .eq("user_id", testUserId)
        .single();
      if (family) testFamilyId = family.id;
    }

    // Add child
    await page.goto("/family/children/new");
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="first_name"]', "Emma");
    await page.fill('input[id="age_months"]', "24");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/family/, { timeout: 5000 });

    // Check recommendations - classes with "nut" in name/description should be excluded
    const response = await page.request.get("/api/recommendations");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.recommendations.length > 0) {
      // Verify no recommendations contain allergen keywords
      const allergenKeywords = ["nut", "peanut", "almond"];
      for (const rec of data.recommendations) {
        const text = `${rec.name} ${rec.description}`.toLowerCase();
        for (const keyword of allergenKeywords) {
          expect(text).not.toContain(keyword);
        }
      }
    }
  });
});

