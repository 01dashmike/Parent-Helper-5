import { test, expect } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.use({ baseURL });

let supabase: SupabaseClient | null = null;

test.beforeAll(() => {
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

test.describe("Provider registration flow", () => {
    test("submitting the form creates a lead and logs an admin email", async ({ page }) => {
        test.skip(!supabase, "Supabase client not available");

        const email = `provider-${Date.now()}@parenthelper.dev`;

        // Clean up any existing artifacts with this email
        await supabase!
            .from("providers_leads")
            .delete()
            .eq("email", email);
        await supabase!
            .from("email_logs")
            .delete()
            .eq("to_address", email);

        await page.goto("/providers/register");

        await page.getByLabel("Your name *").fill("Test Provider");
        await page.getByLabel("Email address *").fill(email);
        await page.getByLabel("Phone number").fill("+447700900123");
        await page.getByLabel("Website or social link").fill("https://example.com");
        await page.getByLabel("Where do you run classes? *").fill("Manchester");
        await page.getByLabel("Arts & Crafts").check();
        await page
            .getByLabel("Tell us about your sessions *")
            .fill("We run creative play groups every Wednesday morning for babies and toddlers.");
        await page
            .getByLabel(
                "I agree to Parent Helper storing my details to process this application and contact me about onboarding. *"
            )
            .check();

        await page.getByRole("button", { name: "Submit my details" }).click();

        await expect(page.getByText("Thank you! We’ll review your submission and be in touch shortly.")).toBeVisible();

        // Verify the lead exists
        await expect
            .poll(async () => {
                const { data } = await supabase!
                    .from("providers_leads")
                    .select("id, email, status, categories, town")
                    .eq("email", email)
                    .maybeSingle();
                return data;
            }, { timeout: 10_000 })
            .toMatchObject({
                email,
                status: "new",
                town: "Manchester",
            });

        // Verify the admin notification email is logged (preview mode still records)
        await expect
            .poll(async () => {
                const { data } = await supabase!
                    .from("email_logs")
                    .select("type, to_address")
                    .eq("type", "admin_notify")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data;
            }, { timeout: 10_000 })
            .not.toBeNull();
    });
});

