import { test, expect } from "@playwright/test";

const CHILD_PROFILES_ENABLED = process.env.CHILD_PROFILES_ENABLED === "true";

test.describe("Child Profiles", () => {
    test.beforeEach(async ({ page }) => {
        // Skip tests if feature is not enabled
        test.skip(!CHILD_PROFILES_ENABLED, "CHILD_PROFILES_ENABLED is not set to true");
    });

    test("should create child profile and see personalized recommendations", async ({ page }) => {
        // Navigate to account login
        await page.goto("/account/login");

        // Note: In a real test, you would need to authenticate first
        // For now, we'll test the flow assuming authentication is handled

        // Navigate to children page
        await page.goto("/account/children");

        // Wait for page to load
        await page.waitForSelector("h1");

        // Click "Add Child Profile" button
        const addButton = page.getByRole("button", { name: /add child profile/i });
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Fill in child form
        await page.fill('input[name="first_name"]', "Test Child");
        
        // Set birthdate (2 years ago)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const birthdate = twoYearsAgo.toISOString().split("T")[0];
        await page.fill('input[name="birthdate"]', birthdate);

        // Select some interests
        const musicInterest = page.getByRole("button", { name: "music" });
        if (await musicInterest.isVisible()) {
            await musicInterest.click();
        }

        const danceInterest = page.getByRole("button", { name: "dance" });
        if (await danceInterest.isVisible()) {
            await danceInterest.click();
        }

        // Submit form
        const submitButton = page.getByRole("button", { name: /create profile/i });
        await submitButton.click();

        // Wait for success (profile should appear in list)
        await page.waitForSelector('text="Test Child"', { timeout: 5000 });

        // Verify child profile appears
        const childCard = page.locator('text="Test Child"');
        await expect(childCard).toBeVisible();

        // Check that recommendations component would show personalized results
        // (This would require the component to be on the page)
        // For now, we verify the API endpoint works
        const childId = await page.locator('[data-child-id]').getAttribute('data-child-id');
        
        if (childId) {
            // Test recommendations API
            const response = await page.request.get(`/api/recommendations/classes?childId=${childId}`);
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
        }
    });

    test("should edit child profile", async ({ page }) => {
        test.skip(true, "Requires existing child profile - implement setup in beforeEach");
        
        await page.goto("/account/children");
        
        // Find edit button and click
        const editButton = page.getByRole("button", { name: /edit/i }).first();
        await editButton.click();
        
        // Update name
        await page.fill('input[name="first_name"]', "Updated Name");
        
        // Submit
        await page.getByRole("button", { name: /update profile/i }).click();
        
        // Verify update
        await expect(page.locator('text="Updated Name"')).toBeVisible();
    });

    test("should delete child profile", async ({ page }) => {
        test.skip(true, "Requires existing child profile - implement setup in beforeEach");
        
        await page.goto("/account/children");
        
        // Find delete button
        const deleteButton = page.getByRole("button", { name: /delete/i }).first();
        
        // Set up dialog handler
        page.on("dialog", async (dialog) => {
            expect(dialog.type()).toBe("confirm");
            await dialog.accept();
        });
        
        await deleteButton.click();
        
        // Verify deletion (profile should disappear)
        await expect(page.locator('text="Test Child"')).not.toBeVisible();
    });
});

