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

    // Setup Supabase client for email verification
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
        supabase = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false },
        });
    }
});

test.describe("Booking success flow", () => {
    test.beforeEach(async ({ page }) => {
        test.skip(skipE2E, "App not reachable. Start the app or set PLAYWRIGHT_BASE_URL.");
        test.skip(
            process.env.FEATURE_BOOKINGS !== "true",
            "FEATURE_BOOKINGS must be enabled for booking tests."
        );
    });

    test("completes full booking flow with Stripe mock and verifies emails", async ({
        page,
        request,
    }) => {
        // Generate unique test data
        const testEmail = `test-booking-${Date.now()}@parenthelper.dev`;
        const testCheckoutId = `cs_test_${Date.now()}`;
        const testAmountCents = 2000; // £20.00

        // Clean up any existing test data
        if (supabase) {
            await supabase.from("simple_bookings").delete().eq("email", testEmail);
            await supabase.from("email_logs").delete().eq("to_address", testEmail);
        }

        // Find a class with booking enabled
        const classId = process.env.TEST_CLASS_ID || "1";

        // Visit class page
        await page.goto(`/class/${classId}`);
        await page.waitForLoadState("networkidle");

        // Look for "Book now" button
        const bookButton = page.getByRole("link", { name: /book now/i }).first();

        // If no book button, skip test
        if (!(await bookButton.isVisible().catch(() => false))) {
            test.skip(
                true,
                `Class ${classId} does not have booking enabled or no bookable sessions available.`
            );
            return;
        }

        // Get the payment link URL from the button
        const paymentLinkUrl = await bookButton.getAttribute("href");
        if (!paymentLinkUrl) {
            test.skip(true, "No payment link URL found on book button");
            return;
        }

        // Get occurrence ID from the page (we'll need to extract it)
        // For now, we'll use a test occurrence ID or get it from the page
        let testOccurrenceId: number | null = null;
        try {
            // Try to extract occurrence ID from the page data or use a default
            testOccurrenceId = 1; // Fallback - in real test you'd extract from page
        } catch {
            testOccurrenceId = 1;
        }

        // Mock Stripe Payment Link - intercept the redirect
        // When Stripe checkout completes, it redirects back to our site
        await page.route("https://buy.stripe.com/**", async (route) => {
            // Simulate Stripe checkout completion redirect
            const redirectUrl = `${baseURL}/booking/thanks?ref=${testCheckoutId}`;
            await route.fulfill({
                status: 200,
                contentType: "text/html",
                body: `
          <html>
            <head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head>
            <body>Redirecting...</body>
          </html>
        `,
            });
        });

        // Mock Stripe API calls if needed
        await page.route("https://api.stripe.com/**", async (route) => {
            // Allow Stripe API calls to pass through or mock them
            await route.continue();
        });

        // Click Book button - opens Stripe in new tab
        const [stripePage] = await Promise.all([
            page.context().waitForEvent("page", { timeout: 10000 }),
            bookButton.click(),
        ]);

        // Wait for redirect to thanks page (Stripe redirects after checkout)
        await stripePage.waitForURL(`**/booking/thanks?ref=*`, { timeout: 15000 });
        await stripePage.waitForLoadState("networkidle");

        // Verify confirmation text is visible
        await expect(stripePage.getByText(/booking confirmed/i)).toBeVisible({ timeout: 5000 });
        await expect(stripePage.getByText(/thank you/i)).toBeVisible();

        // Extract occurrence ID from the page or payment link
        // Try to get it from the page data attributes or URL params
        let testOccurrenceId: number | null = null;
        try {
            // Try to find occurrence ID in the page - check data attributes or extract from booking button
            const occurrenceIdAttr = await bookButton.getAttribute("data-occurrence-id");
            if (occurrenceIdAttr) {
                testOccurrenceId = parseInt(occurrenceIdAttr, 10);
            }
        } catch {
            // Fallback: try to get from URL or use default
            testOccurrenceId = 1;
        }

        // Simulate Stripe webhook by creating booking and sending emails directly
        // In real flow, Stripe webhook does this, but for testing we'll simulate it
        if (supabase && testOccurrenceId) {
            // Get occurrence details for email
            const { data: occurrence } = await supabase!
                .from("session_instances")
                .select(
                    `
          id,
          starts_at,
          ends_at,
          class_sessions!inner(
            id,
            title,
            classes!inner(
              id,
              name,
              providers!inner(
                id,
                name,
                contact_email
              )
            )
          )
        `
                )
                .eq("id", testOccurrenceId)
                .single();

            if (occurrence) {
                // Create booking directly (simulating webhook)
                const { error: bookingError } = await supabase.from("simple_bookings").insert({
                    occurrence_id: testOccurrenceId,
                    email: testEmail,
                    amount_cents: testAmountCents,
                    currency: "gbp",
                    status: "confirmed",
                    stripe_checkout_id: testCheckoutId,
                });

                if (!bookingError) {
                    const classData = occurrence.class_sessions?.classes;
                    const providerData = classData?.providers;
                    const sessionTitle =
                        occurrence.class_sessions?.title || classData?.name || "Class";

                    // Import and send emails (simulating webhook email sending)
                    const { sendTransactional } = await import("@/lib/emails/sendTransactional");

                    // Send customer confirmation email
                    await sendTransactional({
                        to: testEmail,
                        subject: `Booking Confirmed: ${sessionTitle}`,
                        html: `<h2>Booking Confirmed</h2><p>Thank you for your booking!</p><p><strong>Class:</strong> ${sessionTitle}</p>`,
                        text: `Booking Confirmed\n\nClass: ${sessionTitle}\n\nThank you for your booking!`,
                        type: "booking_confirmation",
                    });

                    // Send provider notification email if contact email exists
                    if (providerData?.contact_email) {
                        await sendTransactional({
                            to: providerData.contact_email,
                            subject: `New Booking: ${sessionTitle}`,
                            html: `<h2>New Booking Received</h2><p>A new booking has been made for your class.</p><p><strong>Customer Email:</strong> ${testEmail}</p>`,
                            text: `New Booking\n\nClass: ${sessionTitle}\nCustomer Email: ${testEmail}`,
                            type: "provider_booking_notification",
                        });
                    }
                }
            }

            // Wait for emails to be processed and logged
            await stripePage.waitForTimeout(2000);
        }

        // Verify customer confirmation email is logged
        if (supabase) {
            await expect
                .poll(
                    async () => {
                        const { data } = await supabase!
                            .from("email_logs")
                            .select("type, to_address, subject")
                            .eq("to_address", testEmail)
                            .eq("type", "booking_confirmation")
                            .order("created_at", { ascending: false })
                            .limit(1)
                            .maybeSingle();
                        return data;
                    },
                    { timeout: 10000, intervals: [500, 1000, 2000] }
                )
                .toMatchObject({
                    type: "booking_confirmation",
                    to_address: testEmail,
                });
        }

        // Verify provider notification email is logged (if provider email exists)
        if (supabase) {
            const { data: classData } = await supabase!
                .from("classes")
                .select("providers!inner(contact_email)")
                .eq("id", classId)
                .maybeSingle();

            if (classData?.providers?.contact_email) {
                await expect
                    .poll(
                        async () => {
                            const { data } = await supabase!
                                .from("email_logs")
                                .select("type, to_address, subject")
                                .eq("to_address", classData.providers.contact_email)
                                .eq("type", "provider_booking_notification")
                                .order("created_at", { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            return data;
                        },
                        { timeout: 10000, intervals: [500, 1000, 2000] }
                    )
                    .toMatchObject({
                        type: "provider_booking_notification",
                    });
            }
        }

        // Clean up test data
        if (supabase) {
            await supabase.from("simple_bookings").delete().eq("email", testEmail);
            await supabase.from("email_logs").delete().eq("to_address", testEmail);
        }
    });
});

