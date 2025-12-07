# Parent Helper - New Features Documentation

## Overview

This document describes the four major features added to Parent Helper, plus provider growth engine enhancements.

---

## Feature 1: SEND Hub ✅ COMPLETE

### Purpose
Create a trusted hub for families with Special Educational Needs and Disabilities (SEND), offering classes, support resources, AI guidance, and local groups.

### Routes
- `/send` - Landing page with navigation cards
- `/send/classes` - SEND-friendly classes with filters
- `/send/resources` - Support resources from IPSEA, Contact, Mencap, NAS
- `/send/support` - Support groups directory
- `/send/assistant` - AI-powered chat assistant

### Database Changes
**Classes table:**
- `is_sensory_friendly` (boolean)
- `max_group_size` (integer)
- `noise_level` (text: 'quiet' | 'moderate' | 'loud')
- `wheelchair_access` (boolean)
- `send_notes` (text)

**Providers table:**
- `send_friendly` (boolean)
- `send_specialisms` (text[])

**New table: `send_resources`**
- Stores resources from IPSEA, Contact, councils, charities
- Cached and refreshable via API

### Components
- `SendBadge` - Visual indicator for SEND-friendly content
- `SendFilterDrawer` - Filter by noise level, accessibility
- `SendAccessibleClassCard` - Enhanced class card with SEND info
- `SendResourceList` - Categorized resource listing

### API Endpoints
- `GET /api/send/resources` - Fetch cached resources
- `POST /api/send/resources/refresh` - Refresh cache (admin)
- `POST /api/send/assistant` - AI chat assistant (OpenAI gpt-4o-mini)

### Usage
```typescript
// Filter SEND-friendly classes
const classes = await supabase
  .from("classes")
  .select("*")
  .eq("is_sensory_friendly", true)
  .eq("wheelchair_access", true);
```

---

## Feature 2: Hyper-Personalized Newsletters 🚧 IN PROGRESS

### Purpose
Every user receives a unique newsletter tailored to their location, weather, school holidays, child profiles, booking history, and preferences.

### Database
Uses existing `users`, `child_profiles`, `saved_searches`, `bookings` tables.

### Required Implementation
1. **Newsletter Scheduler** (`/supabase/functions/send_weekly_newsletter.ts`)
   - Cron job to send weekly
   - Aggregates user data
   - Fetches weather (OpenWeatherMap)
   - Fetches school holidays
   - Generates personalized content

2. **Data Sources**
   - User profile (town, postcode)
   - Child profiles (ages, interests, allergies, SEND needs)
   - Saved searches
   - Booking history
   - Weather API
   - School holiday API
   - Eventbrite API (local events)

3. **Email Templates**
   - HTML + SendGrid transactional
   - Mobile-first responsive
   - Sections:
     - "This Week in Your Area"
     - Matching classes (AI-ranked)
     - Weekend weather → activity suggestions
     - Personal AI introduction
     - Blogs matched to interests
     - SEND-friendly events (if applicable)

4. **Admin Preview**
   - Route: `/admin/newsletter/preview?user_id=...`
   - Shows rendered newsletter for specific user

### Next Steps
- Create Supabase Edge Function for newsletter
- Build data aggregation service
- Create email template builder
- Integrate weather and school holiday APIs

---

## Feature 3: Family Planner + School Holiday Intelligence ✅ BASIC STRUCTURE

### Purpose
Dynamic weekly planner personalized to each family with bookings, custom events, meal planning, AI suggestions, and school holiday awareness.

### Routes
- `/family/planner` - Main planner page (week/day view)
- `/api/family/planner/events` - CRUD for planner events
- `/api/family/planner/generate` - AI planner generator

### Database
**New table: `family_planner_events`**
- `user_id` (uuid)
- `title`, `description`, `type`
- `start_time`, `end_time` (timestamptz)
- `meta` (jsonb)

**New table: `school_holidays`**
- `region` (text)
- `holiday_name` (text)
- `start_date`, `end_date` (date)
- `academic_year` (text)
- `source` (text)

### Features Implemented
- ✅ Week view calendar
- ✅ Day view
- ✅ Event listing
- ✅ School holiday display
- ✅ Basic API endpoints

### Features Needed
- Drag/drop functionality
- ICS export
- School holiday auto-detection by postcode
- AI planner integration
- Meal planning slots
- Weather-aware suggestions

### Usage
```typescript
// Create planner event
await fetch("/api/family/planner/events", {
  method: "POST",
  body: JSON.stringify({
    title: "Swimming Class",
    type: "booking",
    startTime: "2024-12-15T10:00:00Z",
  }),
});

// Generate AI plan
await fetch("/api/family/planner/generate", {
  method: "POST",
  body: JSON.stringify({
    weekStart: "2024-12-15",
    preferences: { budget: 50, outdoor: true },
  }),
});
```

---

## Feature 4: Venue Marketplace 🚧 SCHEMA READY

### Purpose
Connect property owners with class providers. Solve the #1 provider pain: finding affordable space.

### Database
**New table: `venues_marketplace`**
- `venue_id` (uuid, PK)
- `owner_id` (uuid, FK users)
- `name`, `address`, `postcode`, `town`
- `latitude`, `longitude`
- `sq_ft`, `max_capacity`
- `parking`, `accessibility` (array)
- `price_per_hour` (decimal)
- `availability` (jsonb - weekly schedule)
- `photos` (array)
- `approved` (boolean)

**New table: `venue_enquiries`**
- `venue_id`, `provider_id`
- `message`, `status`

**New table: `venues`** (standalone venue management)
- Extends classes with venue-specific accessibility data

### Required Implementation
1. **Provider Dashboard Section**
   - "Find a Venue" tab
   - Map view with filters
   - Filter by: capacity, price, accessibility, location
   - Request to book functionality

2. **Venue Owner Dashboard**
   - Add/edit venue
   - Manage availability
   - Respond to enquiries

3. **Admin Moderation**
   - Route: `/admin/venues`
   - Approve/reject listings

4. **AI Helper**
   - Suggested pricing
   - Accessibility improvements
   - Occupancy optimization

### Next Steps
- Create provider venue search UI
- Create venue owner dashboard
- Build enquiry system
- Add map integration
- Create admin moderation queue

---

## Provider Growth Engine Enhancements 🚧 FOUNDATION EXISTS

### Existing Features
- ✅ Growth Score v2 calculation
- ✅ XP and badge system
- ✅ Onboarding Success Path
- ✅ Weekly insights

### Required Additions

#### 1. SEO Assistant
- Audits provider listing
- Actionable fixes
- Keyword recommendations
- Meta/TikTok ad audience suggestions
- Weekly growth plan output

#### 2. Local Expert Box
- AI-generated town facts
- Local family insights
- Seasonal tips
- Top categories

#### 3. Venue Recommendations
- Suggest venues based on provider needs
- Integration with venue marketplace

#### 4. Microtasks System
- "Earn XP" tasks
- Quick wins for providers
- Progress tracking

#### 5. Ad Strategy Helper
- Meta (Facebook/Instagram) guidance
- TikTok ad recommendations
- Audience targeting suggestions

---

## Testing Requirements

### E2E Tests Needed

#### SEND Hub
- [ ] Browse SEND-friendly classes
- [ ] Filter by noise level and accessibility
- [ ] Use SEND Assistant chat
- [ ] View resources

#### Family Planner
- [ ] Create custom event
- [ ] View week/day calendar
- [ ] Generate AI plan
- [ ] Export ICS

#### Venue Marketplace
- [ ] Provider searches for venue
- [ ] Venue owner adds listing
- [ ] Provider sends enquiry
- [ ] Admin approves venue

#### Newsletter
- [ ] Newsletter generates for user
- [ ] Handles missing data gracefully
- [ ] Multiple children support
- [ ] Admin preview works

---

## Environment Variables Required

```bash
# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# OpenWeatherMap (for newsletters/planner)
OPENWEATHER_API_KEY=...

# SendGrid (for newsletters)
SENDGRID_API_KEY=SG...

# Eventbrite (for local events)
EVENTBRITE_API_KEY=...
```

---

## Migration Checklist

1. ✅ Run database migrations for new tables
2. ✅ Add SEND fields to existing tables
3. ⏳ Create Supabase Edge Function for newsletters
4. ⏳ Set up cron jobs
5. ⏳ Configure external API keys
6. ⏳ Deploy and test

---

## Next Steps Summary

### Immediate (High Priority)
1. Complete Family Planner drag/drop and ICS export
2. Build Newsletter scheduler and templates
3. Create Venue Marketplace provider search UI

### Short-term (Medium Priority)
4. Add SEO Assistant to provider dashboard
5. Create Local Expert Box component
6. Implement school holiday auto-detection

### Long-term (Testing & Polish)
7. Comprehensive E2E tests
8. Performance optimization
9. Documentation updates

---

## Support & Questions

For implementation questions or issues, refer to:
- `IMPLEMENTATION_STATUS.md` - Current status
- `shared/schema.ts` - Database schema
- Individual feature READMEs (to be created)


