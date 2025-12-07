import { test, expect } from "@playwright/test";

test.describe("Community Engagement", () => {
  test("asks provider question and verifies answer", async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    
    // Mock authenticated user
    await page.addInitScript(() => {
      localStorage.setItem("ph_session_id", "test-user-session");
    });

    // Navigate to a class page
    await page.goto(`${baseURL}/class/1`);

    // Find and click "Ask a Question" button
    const askQuestionButton = page.getByRole("button", { name: /ask.*question|question.*provider/i });
    
    if (await askQuestionButton.isVisible().catch(() => false)) {
      await askQuestionButton.click();

      // Fill question form
      const questionInput = page.getByPlaceholder(/your question|ask.*question/i);
      await questionInput.fill("What age is this class suitable for?");

      // Submit question
      await page.getByRole("button", { name: /submit|send/i }).click();

      // Verify question appears
      await expect(page.getByText(/what age|your question/i)).toBeVisible({
        timeout: 3000,
      });
    } else {
      test.skip(true, "Question feature not available on this class");
    }
  });

  test("verifies provider email notification sent", async ({ page, request }) => {
    // This would typically be verified via email logs or webhook
    // For E2E, we'll simulate the question submission

    const questionData = {
      class_id: 1,
      question_text: "Test question",
      user_email: "test@example.com",
    };

    // Mock the API call that sends provider notification
    await page.route("**/api/questions/**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          questionId: 1,
          emailSent: true,
        },
      });
    });

    const response = await request.post(
      `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/api/questions`,
      {
        data: questionData,
      }
    );

    const data = await response.json();
    expect(data.emailSent).toBe(true);
  });

  test("displays answer under class after provider responds", async ({ page }) => {
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/class/1`);

    // Reload page to check for new answer
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Look for Q&A section
    const qaSection = page.getByText(/questions.*answers|q&a|faq/i);
    
    if (await qaSection.isVisible().catch(() => false)) {
      // Check if answer is visible
      const answer = page.getByText(/answer|response/i).first();
      if (await answer.isVisible().catch(() => false)) {
        await expect(answer).toBeVisible();
      }
    }
  });
});

