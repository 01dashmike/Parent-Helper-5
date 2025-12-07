# Complete Routes & Endpoints Reference

## API Endpoints

### Provider APIs

#### Growth & Analytics
- `GET /api/provider/growth-score?providerId=X` - Get provider growth score
- `POST /api/provider/next-action` - Generate AI-powered next best action
  ```json
  {
    "providerId": 123,
    "forceRefresh": false
  }
  ```

#### SEO & Marketing
- `POST /api/provider/seo-score` - Calculate SEO score
  ```json
  {
    "providerId": 123,
    "forceRefresh": false
  }
  ```
- `GET /api/provider/seo-score?providerId=X` - Get latest SEO score
- `POST /api/provider/seo-quick-fix` - Generate quick fixes
  ```json
  {
    "providerId": 123,
    "action": "generate_description" | "suggest_categories" | "generate_alt_text" | "generate_local_copy",
    "context": {}
  }
  ```
- `POST /api/provider/ads-advice` - Generate ad advice
  ```json
  {
    "providerId": 123,
    "platform": "meta" | "tiktok" | "google" | "general",
    "forceRefresh": false
  }
  ```
- `GET /api/provider/ads-advice?providerId=X&platform=meta` - Get cached ad advice

### Family APIs

#### Profile Management
- `GET /api/family/profile` - Get family profile
- `POST /api/family/profile` - Create/update family profile
  ```json
  {
    "home_town": "London",
    "home_postcode": "SW1A 1AA",
    "interests": ["music", "swimming"],
    "allergies": []
  }
  ```

#### Children Management
- `GET /api/family/children` - List all children
- `POST /api/family/children` - Add child
  ```json
  {
    "first_name": "Emma",
    "age_years": 2,
    "age_months": 6,
    "interests": ["music", "dance"],
    "allergies": []
  }
  ```
- `PUT /api/family/children/[id]` - Update child
- `DELETE /api/family/children/[id]` - Remove child

#### Recommendations
- `GET /api/family/recommendations?limit=10` - Get personalized recommendations
- Returns cached recommendations (24h) or generates new ones

### Member APIs

#### Saved Searches
- `GET /api/member/saved-searches` - List saved searches
- `POST /api/member/saved-searches` - Create saved search
  ```json
  {
    "query": "q=music&loc=london",
    "town": "London",
    "filters": {},
    "alertFrequency": "weekly"
  }
  ```
- `PUT /api/member/saved-searches/[id]` - Update saved search
- `DELETE /api/member/saved-searches/[id]` - Delete saved search

#### Alerts
- `POST /api/member/alerts` - Check and send alerts for new classes
  ```json
  {
    "searchId": "optional-uuid"
  }
  ```

### Newsletter API
- `POST /api/newsletter` - Subscribe to newsletter
  ```json
  {
    "email": "user@example.com",
    "postcode": "SW1A 1AA"
  }
  ```

### Cron Jobs
- `POST /api/cron/provider-marketing-summary` - Weekly marketing summary (requires CRON_SECRET)
- `POST /api/cron/provider-weekly-growth` - Weekly growth reports (requires CRON_SECRET)

---

## UI Routes

### Public Routes
- `/` - Homepage
- `/parents` - Parents landing page
- `/search` - Class search
- `/blog` - Blog index
- `/blog/[slug]` - Blog post
- `/send` - SEND hub (to be created)
- `/send/resources` - SEND resources (to be created)

### Account Routes
- `/account` - Account dashboard
- `/account/family` - Family profile management (to be created)
- `/account/onboarding` - Member onboarding flow (to be created)
- `/account/saved-searches` - Saved searches management (to be created)

### Provider Routes
- `/provider` - Provider dashboard
- `/provider/classes` - Class management
- `/provider/analytics` - Analytics dashboard
- `/provider/analytics/v2` - Analytics v2 (to be created)
- `/provider/marketing` - Marketing Booster
- `/provider/venues` - Venue management
- `/provider/venues/marketplace` - Venue marketplace (to be created)

### Admin Routes
- `/admin/docs` - Documentation hub
- `/admin/docs/seo-diagnostics` - SEO diagnostics (to be created)
- `/admin/docs/migration-health` - Migration health (to be created)
- `/admin/docs/city-config` - City configuration (to be created)
- `/admin/docs/booking-engine` - Booking engine docs (to be created)
- `/admin/docs/provider-analytics` - Provider analytics docs (to be created)

### Deep Links
- `/marketing-summary/[providerId]` - Weekly marketing summary deep link

---

## Database Tables

### Provider Tables
- `providers` - Provider information
- `provider_accounts` - Provider-user relationships
- `provider_growth_metrics` - Growth scores
- `provider_seo_score` - SEO scores
- `provider_keyword_insights` - Keyword data
- `provider_ad_advice` - Ad recommendations
- `provider_weekly_summary_logs` - Weekly summaries
- `provider_xp_events` - XP events
- `provider_levels` - Provider levels
- `provider_badges` - Provider badges
- `provider_onboarding` - Onboarding progress

### Family Tables
- `family_profiles` - Family profiles
- `children` - Children information
- `saved_recommendations` - Cached recommendations

### Member Tables
- `saved_searches` - Saved search queries
- `alerts_log` - Alert history

### Venue Tables
- `venues_marketplace` - Venue listings
- `venue_enquiries` - Provider-venue enquiries
- `venues` - Provider venues

### SEND Tables
- `send_resources` - SEND resources

### Other Tables
- `classes` - Class listings
- `school_holidays` - School holiday cache
- `family_planner_events` - Family calendar events

---

## Testing

### Test Files
- `tests/e2e/parents-page.spec.ts` - Parents page tests
- `tests/e2e/provider-marketing-booster.spec.ts` - Marketing booster tests

### Test Coverage Needed
- [ ] Family APIs
- [ ] Saved searches APIs
- [ ] Recommendation engine
- [ ] Next-action API
- [ ] Alerts API

---

## Environment Variables

```bash
# Required
OPENAI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Optional
CRON_SECRET=your_secret
OPENWEATHER_API_KEY=your_key
UNSPLASH_ACCESS_KEY=your_key
```

---

## Implementation Status

### ✅ Complete
- Marketing Booster APIs
- Family Recommendations API
- Family Profile API
- Children Management API
- Saved Searches API
- Alerts API
- Provider Next Action API
- Parents Landing Page
- Admin Docs Hub structure

### 🔨 In Progress
- Provider Analytics V2 UI
- Onboarding Flow UI
- City Landing Pages
- SEND Hub UI

### ⏳ Pending
- Venue Marketplace matching
- Weekly Digest Email
- Comprehensive Tests
- Individual Admin Doc Pages

