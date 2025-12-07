# Marketing Booster - SEO & Ads Optimization Suite

A comprehensive marketing optimization tool for providers, offering SEO scoring, keyword insights, and advertising advice powered by AI.

## Overview

The Marketing Booster suite helps providers improve their online visibility and grow their class bookings through:

- **SEO Scoring**: Automated analysis of provider listings (0-100 score)
- **Keyword Insights**: AI-powered keyword recommendations
- **Ad Advice**: Platform-specific advertising strategies (Meta, TikTok, Google)
- **Weekly Summaries**: Automated email digests with actionable insights

## Architecture

### Database Tables

1. **`provider_seo_score`**: Stores SEO scores and breakdowns
2. **`provider_keyword_insights`**: Keyword opportunities and recommendations
3. **`provider_ad_advice`**: Platform-specific ad strategies
4. **`provider_weekly_summary_logs`**: Weekly email tracking and trends

### API Endpoints

#### `/api/provider/seo-score`
- **POST**: Calculate or refresh SEO score
  ```json
  {
    "providerId": 123,
    "forceRefresh": false
  }
  ```
- **GET**: Retrieve latest SEO score
  ```
  ?providerId=123
  ```

#### `/api/provider/seo-quick-fix`
- **POST**: Generate quick fixes using AI
  ```json
  {
    "providerId": 123,
    "action": "generate_description" | "suggest_categories" | "generate_alt_text" | "generate_local_copy",
    "context": {}
  }
  ```

#### `/api/provider/ads-advice`
- **POST**: Generate ad advice for a platform
  ```json
  {
    "providerId": 123,
    "platform": "meta" | "tiktok" | "google" | "general",
    "forceRefresh": false
  }
  ```
- **GET**: Retrieve cached ad advice
  ```
  ?providerId=123&platform=meta
  ```

#### `/api/cron/provider-marketing-summary`
- **POST**: Weekly cron job to send marketing summaries
  - Requires `CRON_SECRET` in Authorization header
  - Processes all active providers
  - Sends weekly email digests

## SEO Scoring Logic

The SEO score (0-100) is calculated from 9 factors:

1. **Title Quality** (0-15 points)
   - Length optimization (30-60 chars ideal)
   - Keyword presence
   - Descriptive quality

2. **Description Clarity** (0-15 points)
   - Length (150-300 chars ideal)
   - Key information presence (age range, location, benefits)

3. **Keyword Density** (0-10 points)
   - Relevant keyword frequency
   - Natural keyword usage

4. **Category Match** (0-10 points)
   - Category diversity
   - Category relevance

5. **Image Presence** (0-10 points)
   - Image coverage across classes
   - Image quality (estimated)

6. **Local Keywords Match** (0-15 points)
   - Town/location mentions
   - Local search optimization

7. **Review Data** (0-10 points)
   - Average rating
   - Review count

8. **CTR Score** (0-5 points)
   - Click-through rate (placeholder)

9. **Field Completion** (0-10 points)
   - Profile completeness
   - Required fields filled

## Usage

### Provider Dashboard

Navigate to `/provider/marketing` to access the Marketing Booster dashboard with three main cards:

1. **SEO Score Card**
   - Current score with color coding
   - Top issues list
   - Quick fixes
   - "Generate New Insights" button

2. **Meta Ads Starter Pack**
   - Ad copy suggestions
   - Sample headlines
   - Recommended budget
   - Hashtags
   - "Generate New Insights" button

3. **TikTok Creative Studio**
   - Video script ideas
   - Hashtag suggestions
   - Posting schedule
   - "Generate New Insights" button

### Weekly Emails

Providers receive automated weekly emails containing:
- SEO score trend
- New keyword opportunities
- Top fix for the week
- Ads idea of the week
- Link to marketing dashboard

### Deep Link Pages

Weekly emails include a deep link to `/marketing-summary/[providerId]` which:
- Shows the weekly summary
- Tracks email clicks
- Provides CTA to full dashboard

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for AI-generated content
- `OPENAI_MODEL`: Optional, defaults to `gpt-4o-mini`
- `CRON_SECRET`: Required for cron job authentication
- `NEXT_PUBLIC_SITE_URL`: Base URL for email links

### Feature Flags

No feature flags required - the Marketing Booster is always available to providers.

## Extending the Module

### Adding New SEO Factors

1. Update `lib/utils/provider-seo-score.ts`:
   - Add calculation function
   - Add to breakdown
   - Update total score calculation

2. Update database schema:
   - Add new column to `provider_seo_score` table
   - Update TypeScript types

### Adding New Platforms

1. Update `app/api/provider/ads-advice/route.ts`:
   - Add platform to enum
   - Add platform-specific prompt
   - Handle platform-specific response format

2. Update UI:
   - Add new card in `MarketingBoosterClient.tsx`
   - Add platform-specific display logic

### Customizing AI Prompts

All AI prompts are in:
- `app/api/provider/seo-quick-fix/route.ts` - Quick fix prompts
- `app/api/provider/ads-advice/route.ts` - Ad advice prompts

Modify prompts to adjust tone, length, or focus areas.

## Testing

Run Playwright tests:

```bash
npm run test:e2e tests/e2e/provider-marketing-booster.spec.ts
```

Tests cover:
- API endpoint validation
- Input validation
- Response structure
- Authentication requirements

## Caching Strategy

- **SEO Scores**: Cached for 24 hours (configurable via `forceRefresh`)
- **Ad Advice**: Cached for 7 days (configurable via `forceRefresh`)
- **Weekly Summaries**: Generated weekly, stored in database

## Performance Considerations

- SEO score calculation is optimized for speed
- AI calls are cached to reduce API costs
- Database queries use indexes for fast lookups
- Weekly cron job processes providers in batches

## Troubleshooting

### SEO Score Not Generating

1. Check provider has classes
2. Verify OpenAI API key is set
3. Check database connection
4. Review error logs

### Ad Advice Not Generating

1. Verify OpenAI API key
2. Check provider has description data
3. Review API response for errors
4. Check cache settings

### Weekly Emails Not Sending

1. Verify `CRON_SECRET` is set
2. Check cron job is scheduled
3. Verify SendGrid configuration
4. Check provider email addresses are valid

## Future Enhancements

- [ ] Real CTR data integration
- [ ] Google Business Profile sync
- [ ] A/B testing for ad copy
- [ ] Advanced keyword research tools
- [ ] Competitor analysis
- [ ] ROI tracking for ad campaigns

