# Provider Weekly Engagement Emails

## Overview

The provider weekly engagement email system sends automated emails to active providers every Sunday at midnight, summarizing their performance metrics and encouraging retention.

## Email Content

The email template is generated in `app/api/cron/provider-weekly-analytics/route.ts` using the `getWeeklyEmailTemplate()` function.

### Current Email Structure

1. **Header**: Personalized greeting with provider name
2. **Top 3 Metrics**: Automatically selected from:
   - Views (class page views)
   - Bookings (confirmed bookings)
   - Conversion Rate (views to bookings percentage)
3. **Profile Health Score**: 0-100 score with color-coded feedback
4. **Special Offers**: Location-based offers fetched from `/api/providers/offers`
5. **Call-to-Action**: Link to full analytics dashboard

### Editing Email Content

To modify the email template:

1. **Open**: `app/api/cron/provider-weekly-analytics/route.ts`
2. **Find**: `getWeeklyEmailTemplate()` function (around line 229)
3. **Modify**: HTML template string or text version in `getWeeklyEmailText()`

### Customizing Offers

Offers are dynamically fetched from `/api/providers/offers`. To add or modify offers:

1. **Open**: `app/api/providers/offers/route.ts`
2. **Modify**: The `offers` array to include your custom offers
3. **Format**: Each offer should have:
   - `title`: Short headline
   - `description`: Brief explanation
   - `cta`: Button text
   - `ctaUrl`: Link destination

### Profile Health Score Messages

The health score feedback messages are in `getWeeklyEmailTemplate()`:

- **70+**: "Great job! Your profile is in excellent shape."
- **50-69**: "Your profile could use some improvements."
- **<50**: "Let's boost your profile health."

To change these messages, edit the template around line 274.

## Cron Schedule

The weekly analytics job runs every Sunday at midnight (00:00 UTC).

### Manual Trigger

To manually trigger the weekly analytics:

```bash
curl -X POST https://your-domain.com/api/cron/provider-weekly-analytics \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Environment Variables

Required environment variables:

- `CRON_SECRET`: Secret key for authenticating cron requests
- `NEXT_PUBLIC_SITE_URL`: Base URL for email links
- `SENDGRID_API_KEY`: SendGrid API key for sending emails

## Metrics Calculation

The weekly analytics aggregates:

- **Views**: Count of `page_view` events for provider's classes
- **Bookings**: Count of confirmed bookings
- **Conversion Rate**: (Bookings / Views) × 100
- **Search Appearances**: Featured listing impressions
- **Reviews**: New reviews received
- **Profile Health Score**: Calculated from profile completeness and activity

## Testing

To test the email template locally:

1. Set up a test provider in your database
2. Manually call the cron endpoint with test data
3. Check SendGrid logs for sent emails

## Troubleshooting

### Emails Not Sending

1. Check `CRON_SECRET` is set correctly
2. Verify SendGrid API key is valid
3. Check provider `contact_email` is not null
4. Review server logs for errors

### Incorrect Metrics

1. Verify `provider_analytics_weekly` table has data
2. Check analytics events are being tracked
3. Ensure bookings are marked as "confirmed"

## Future Enhancements

Potential improvements:

- A/B testing different email templates
- Personalization based on provider type
- Dynamic content based on performance trends
- Multi-language support

