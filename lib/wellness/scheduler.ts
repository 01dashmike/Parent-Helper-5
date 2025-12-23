/**
 * Wellness Email Scheduler
 * 
 * Documentation and utilities for scheduling accountability emails
 */

/**
 * Scheduling Options:
 * 
 * 1. Vercel Cron Jobs (Recommended for Vercel deployments)
 *    - Add to vercel.json:
 *    {
 *      "crons": [
 *        {
 *          "path": "/api/cron/wellness-accountability?frequency=weekly&key=YOUR_SECRET",
 *          "schedule": "0 9 * * 1"
 *        },
 *        {
 *          "path": "/api/cron/wellness-accountability?frequency=biweekly&key=YOUR_SECRET",
 *          "schedule": "0 9 1,15 * *"
 *        },
 *        {
 *          "path": "/api/cron/wellness-accountability?frequency=monthly&key=YOUR_SECRET",
 *          "schedule": "0 9 1 * *"
 *        }
 *      ]
 *    }
 * 
 * 2. External Cron Service (e.g., cron-job.org)
 *    - Create jobs that hit: 
 *      https://yourdomain.com/api/cron/wellness-accountability?frequency=weekly&key=YOUR_SECRET
 *    - Schedule:
 *      - Weekly: Every Monday at 9am
 *      - Biweekly: 1st and 15th of month at 9am
 *      - Monthly: 1st of month at 9am
 * 
 * 3. Manual Trigger (for testing)
 *    - Visit: /api/cron/wellness-accountability?frequency=weekly&key=YOUR_SECRET
 * 
 * Environment Variables Required:
 * - CRON_SECRET_KEY: Secret key to authenticate cron requests
 * - SENDGRID_API_KEY: For sending emails
 * - EMAIL_FROM: From email address
 */

export const SCHEDULE_INFO = {
  weekly: {
    description: "Sent every Monday at 9am",
    cron: "0 9 * * 1",
    withinDays: 7,
  },
  biweekly: {
    description: "Sent on 1st and 15th of each month at 9am",
    cron: "0 9 1,15 * *",
    withinDays: 14,
  },
  monthly: {
    description: "Sent on 1st of each month at 9am",
    cron: "0 9 1 * *",
    withinDays: 30,
  },
};

/**
 * Test the cron endpoint manually
 */
export async function testCronEndpoint(
  frequency: "weekly" | "biweekly" | "monthly",
  apiKey?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = new URL("/api/cron/wellness-accountability", window.location.origin);
    url.searchParams.set("frequency", frequency);
    
    if (apiKey) {
      url.searchParams.set("key", apiKey);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Request failed" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
