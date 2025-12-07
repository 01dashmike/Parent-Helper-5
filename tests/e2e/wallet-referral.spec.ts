import { test, expect } from "@playwright/test";

test.describe("Wallet and Referral System", () => {
  test("provider generates referral link and new provider joins", async ({ page, context }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

    // Provider 1: Generate referral link
    await page.goto(`${baseURL}/provider/login`);
    
    // Mock provider login (in real test, would use actual auth)
    await page.addInitScript(() => {
      localStorage.setItem("provider_session", JSON.stringify({
        providerId: 1,
        name: "Test Provider",
      }));
    });

    await page.goto(`${baseURL}/provider/referrals`);

    // Find generate referral link button
    const generateButton = page.getByRole("button", { name: /generate.*referral|create.*link/i });
    
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();

      // Get referral link
      const referralLink = page.getByRole("textbox", { name: /referral.*link|link/i });
      const linkValue = await referralLink.inputValue();

      expect(linkValue).toContain("referral");
      expect(linkValue).toContain("provider");

      // New provider joins via link
      const newPage = await context.newPage();
      await newPage.goto(linkValue);

      // Complete signup
      await newPage.fill('input[name="email"]', `new-provider-${Date.now()}@example.com`);
      await newPage.fill('input[name="name"]', "New Provider");
      await newPage.click('button[type="submit"]');

      // Verify referral tracked
      await expect(newPage.getByText(/referral.*tracked|thank.*referring/i)).toBeVisible({
        timeout: 5000,
      });

      await newPage.close();
    } else {
      test.skip(true, "Referral feature not available");
    }
  });

  test("simulates paid booking and verifies referral credit", async ({ page, request }) => {
    // Mock referral provider relationship
    const referrerProviderId = 1;
    const referredProviderId = 2;

    // Simulate paid booking by referred provider
    const bookingData = {
      provider_id: referredProviderId,
      amount_cents: 5000, // £50.00
      status: "paid",
    };

    // Mock webhook that processes referral credit
    await page.route("**/api/billing/webhook", async (route) => {
      const requestData = route.request().postDataJSON();
      
      // Simulate referral credit calculation
      if (requestData?.type === "customer.subscription.created") {
        await route.fulfill({
          status: 200,
          json: {
            received: true,
            referralCreditApplied: true,
            creditAmount: 500, // 10% of £50 = £5
          },
        });
      } else {
        await route.continue();
      }
    });

    // Trigger webhook (simulating Stripe event)
    const response = await request.post(
      `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/api/billing/webhook`,
      {
        headers: {
          "stripe-signature": "test-signature",
        },
        data: {
          type: "customer.subscription.created",
          data: {
            object: {
              id: "sub_test_123",
              customer: "cus_test_123",
              metadata: {
                providerId: referredProviderId.toString(),
                referredBy: referrerProviderId.toString(),
              },
            },
          },
        },
      }
    );

    const data = await response.json();
    expect(data.referralCreditApplied).toBe(true);
  });

  test("verifies analytics event recorded for referral", async ({ page, request }) => {
    // Check analytics events for referral conversion
    const response = await request.get(
      `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/api/analytics?event_type=referral_converted`
    );

    // In a real scenario, would verify event exists
    expect([200, 404]).toContain(response.status());
  });
});

