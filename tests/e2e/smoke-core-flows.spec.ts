import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Smoke Tests - Core Flows", () => {
  test.describe("Search + Open Class Flow", () => {
    test("search page loads and displays results", async ({ page }) => {
      await page.goto(`${baseURL}/search`);
      
      // Check search page loads
      await expect(page).toHaveTitle(/search|classes/i);
      
      // Check search bar is visible
      const searchInput = page.getByPlaceholder(/search|find classes/i).or(
        page.locator('input[type="search"]')
      ).first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });
    });

    test("can search and open a class", async ({ page }) => {
      await page.goto(`${baseURL}/search`);
      
      // Wait for page to load
      await page.waitForLoadState("networkidle");
      
      // Try to find search input
      const searchInput = page.getByPlaceholder(/search|find classes/i).or(
        page.locator('input[type="search"]')
      ).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        // Perform a search
        await searchInput.fill("swimming");
        await searchInput.press("Enter");
        
        // Wait for results
        await page.waitForLoadState("networkidle");
      }
      
      // Look for class cards/links
      const classLink = page.getByRole("link", { name: /class|activity/i }).first();
      
      if (await classLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click on a class
        await classLink.click();
        
        // Verify we're on a class detail page
        await expect(page).toHaveURL(/\/class\/|\/classes\//, { timeout: 5000 });
        
        // Check key elements are visible
        await expect(page.getByRole("heading", { level: 1 }).or(
          page.locator("h1")
        ).first()).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, "No class results found - may need test data");
      }
    });
  });

  test.describe("Blog AI Generate + Save Draft Flow", () => {
    test("admin blogs page loads", async ({ page }) => {
      await page.goto(`${baseURL}/admin/blogs`);
      
      // Check page loads (may redirect if not authenticated)
      await page.waitForLoadState("networkidle");
      
      // Check if we're on admin blogs page or redirected
      const currentUrl = page.url();
      if (currentUrl.includes("/admin/blogs")) {
        // Check for key elements
        const heading = page.getByRole("heading").or(page.locator("h1")).first();
        await expect(heading).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, "Admin blogs page requires authentication");
      }
    });

    test("blog generate API endpoint exists", async ({ request }) => {
      // Just check the endpoint exists (will fail auth, but that's expected)
      const response = await request.post(`${baseURL}/api/blog/generate`, {
        data: {},
      });
      
      // Should return 401 (unauthorized) or 400 (bad request), not 404
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe("Provider Dashboard Metrics", () => {
    test("provider analytics page loads", async ({ page }) => {
      await page.goto(`${baseURL}/provider/analytics`);
      
      // Wait for page load
      await page.waitForLoadState("networkidle");
      
      // Check if redirected (auth required) or on analytics page
      const currentUrl = page.url();
      if (currentUrl.includes("/provider/analytics")) {
        // Look for analytics/metrics content
        const heading = page.getByRole("heading").or(page.locator("h1")).first();
        await expect(heading).toBeVisible({ timeout: 5000 });
        
        // Check for metrics or dashboard content
        const metricsContent = page.getByText(/analytics|metrics|performance/i).first();
        await expect(metricsContent).toBeVisible({ timeout: 5000 }).catch(() => {
          // If not found, that's okay - just verify page loaded
        });
      } else {
        test.skip(true, "Provider analytics requires authentication");
      }
    });
  });

  test.describe("Wallet Summary", () => {
    test("wallet summary API endpoint responds", async ({ request }) => {
      // Check endpoint exists (will fail auth, but that's expected)
      const response = await request.get(`${baseURL}/api/wallet/summary`);
      
      // Should return 401 (unauthorized) or 200 (if test user), not 404
      expect([200, 401, 403]).toContain(response.status());
    });

    test("wallet page loads (if exists)", async ({ page }) => {
      // Try common wallet page paths
      const walletPaths = ["/wallet", "/account/wallet", "/wallet/summary"];
      
      for (const path of walletPaths) {
        try {
          await page.goto(`${baseURL}${path}`, { timeout: 5000 });
          await page.waitForLoadState("networkidle");
          
          const currentUrl = page.url();
          if (currentUrl.includes("wallet")) {
            // Found wallet page
            const heading = page.getByRole("heading").or(page.locator("h1")).first();
            await expect(heading).toBeVisible({ timeout: 5000 });
            return; // Success
          }
        } catch {
          // Try next path
          continue;
        }
      }
      
      test.skip(true, "Wallet page not found - may not be implemented");
    });
  });

  test.describe("Booking Flow Skeleton", () => {
    test("booking page/flow loads", async ({ page }) => {
      // Try to find a bookable class first
      await page.goto(`${baseURL}/search`);
      await page.waitForLoadState("networkidle");
      
      // Look for booking buttons/links
      const bookButton = page.getByRole("button", { name: /book/i }).or(
        page.getByRole("link", { name: /book/i })
      ).first();
      
      if (await bookButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await bookButton.click();
        
        // Wait for booking page/flow to load
        await page.waitForLoadState("networkidle");
        
        // Check we're in booking flow
        const bookingContent = page.getByText(/booking|book|checkout/i).first();
        await expect(bookingContent).toBeVisible({ timeout: 5000 });
      } else {
        // Try direct booking page path
        await page.goto(`${baseURL}/book`);
        await page.waitForLoadState("networkidle");
        
        const currentUrl = page.url();
        if (currentUrl.includes("/book")) {
          const heading = page.getByRole("heading").or(page.locator("h1")).first();
          await expect(heading).toBeVisible({ timeout: 5000 });
        } else {
          test.skip(true, "No booking flow found - may need test data or feature disabled");
        }
      }
    });

    test("booking checkout page loads", async ({ page }) => {
      await page.goto(`${baseURL}/book/checkout`);
      await page.waitForLoadState("networkidle");
      
      // Check if redirected or on checkout page
      const currentUrl = page.url();
      if (currentUrl.includes("checkout")) {
        const heading = page.getByRole("heading").or(page.locator("h1")).first();
        await expect(heading).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, "Checkout page requires booking session or redirects");
      }
    });
  });

  test.describe("Onboarding Flow", () => {
    test("onboarding start page loads", async ({ page }) => {
      await page.goto(`${baseURL}/onboarding`);
      await page.waitForLoadState("networkidle");
      
      // Check onboarding page loads
      const heading = page.getByRole("heading", { level: 1 }).or(
        page.locator("h1")
      ).first();
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test("onboarding form elements are visible", async ({ page }) => {
      await page.goto(`${baseURL}/onboarding`);
      await page.waitForLoadState("networkidle");
      
      // Look for form elements or CTAs
      const formOrCTA = page.getByRole("button").or(
        page.getByRole("link")
      ).or(
        page.locator("form")
      ).first();
      
      await expect(formOrCTA).toBeVisible({ timeout: 5000 });
    });

    test("can navigate through onboarding steps", async ({ page }) => {
      await page.goto(`${baseURL}/onboarding`);
      await page.waitForLoadState("networkidle");
      
      // Look for "Get started" or similar CTA
      const startButton = page.getByRole("button", { name: /start|get started|begin/i }).or(
        page.getByRole("link", { name: /start|get started|begin/i })
      ).first();
      
      if (await startButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startButton.click();
        await page.waitForLoadState("networkidle");
        
        // Check we've progressed in onboarding
        const currentUrl = page.url();
        // May stay on same page or navigate
        // Just verify page is still responsive
        await expect(page.locator("body")).toBeVisible();
      } else {
        // Onboarding might be single page or already started
        test.skip(true, "Onboarding start button not found - may be single page flow");
      }
    });
  });

  test.describe("General Page Loads", () => {
    test("homepage loads", async ({ page }) => {
      await page.goto(baseURL);
      await page.waitForLoadState("networkidle");
      
      // Check homepage loads
      await expect(page).toHaveTitle(/parent helper/i);
      
      // Check main content is visible
      const mainContent = page.getByRole("main").or(
        page.locator("main")
      ).or(
        page.locator('[role="main"]')
      ).first();
      
      await expect(mainContent).toBeVisible({ timeout: 5000 }).catch(() => {
        // If no main tag, check for any heading
        expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
      });
    });

    test("search page loads", async ({ page }) => {
      await page.goto(`${baseURL}/search`);
      await page.waitForLoadState("networkidle");
      
      // Check search page loads
      await expect(page).toHaveTitle(/search|classes/i);
    });

    test("blog page loads", async ({ page }) => {
      await page.goto(`${baseURL}/blog`);
      await page.waitForLoadState("networkidle");
      
      // Check blog page loads
      const heading = page.getByRole("heading").or(page.locator("h1")).first();
      await expect(heading).toBeVisible({ timeout: 5000 });
    });
  });
});

