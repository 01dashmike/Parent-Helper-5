# Parent Helper - Technical Product Architecture Audit

**Date**: January 2025  
**Architect**: Technical Product Architect  
**Scope**: Complete codebase audit against Treatwell/ClassPass-level requirements

---

## EXECUTIVE SUMMARY

This audit evaluates the Parent Helper platform against high-level product goals:
- ✅ Treatwell-level onboarding wizard
- ⚠️ ClassPass-level analytics (partial)
- ⚠️ Admin tools (functional but not business-focused)
- ⚠️ Provider tools (good foundation, needs UX polish)
- ✅ Fast consumer search (implemented)
- ⚠️ SEO landing pages (city pages exist, missing class type × age × town combos)
- ⚠️ Scalable automation engine (scripts exist, needs orchestration)
- ⚠️ Monetisation-ready architecture (foundation exists, needs expansion)

**Overall Assessment**: Strong technical foundation with 5,684 businesses, but critical UX and feature gaps prevent reaching Treatwell/ClassPass parity.

---

## PART 1: AUDIT FINDINGS

### 1. PROVIDER ONBOARDING

#### Current Implementation

**What Exists:**
- ✅ Onboarding checklist system (`/provider/onboarding`)
- ✅ Progress tracking (`provider_onboarding` table)
- ✅ 8-step checklist: logo, photos, bio, publish class, schedule, location, preview, payments
- ✅ Provider registration form (`/providers/register`)
- ✅ Provider leads management (`/admin/providers/leads`)
- ✅ Onboarding rewards system (XP, badges, £2 reward)

**What's Missing:**
- ❌ **Multi-step wizard flow** — Current is checklist, not guided wizard
- ❌ **Step-by-step navigation** — No "Next/Back" buttons, just links
- ❌ **Progress saving** — Steps link to separate pages, no auto-save
- ❌ **Preview before publish** — No live preview of listing
- ❌ **Essential-first approach** — All 8 steps shown at once, no prioritisation
- ❌ **Template-based class creation** — No class templates for quick setup
- ❌ **Media upload wizard** — No drag-drop, no image optimisation hints
- ❌ **Business info collection** — Registration form exists but not integrated into wizard

**What's Broken:**
- ⚠️ Onboarding steps link to existing pages (`/provider/classes/new`) but no wizard context
- ⚠️ No validation that steps are actually complete before marking done
- ⚠️ Registration form (`/providers/register`) creates lead, not account
- ⚠️ No connection between registration and onboarding wizard

**What Needs Redesign:**
1. **Replace checklist with wizard** — Sequential steps with progress bar
2. **Integrate registration into wizard** — Step 1 should be account creation
3. **Add preview step** — Show listing as parents see it
4. **Add template selection** — "Music class", "Swimming", "Sensory play" templates
5. **Add media upload step** — Dedicated upload with cropping/resizing
6. **Add business verification** — Email verification, phone verification

**Files to Review:**
- `app/provider/(console)/onboarding/page.tsx` — Checklist UI
- `app/provider/(console)/onboarding/OnboardingClient.tsx` — Client component
- `lib/gamification/onboarding.ts` — Step verification logic
- `app/providers/register/page.tsx` — Registration form (disconnected)
- `app/admin/providers/leads/page.tsx` — Lead management

---

### 2. PROVIDER DASHBOARD

#### Current Implementation

**What Exists:**
- ✅ Dashboard page (`/provider/(console)/page.tsx`)
- ✅ Overview stats (classes, venues, upcoming sessions)
- ✅ Growth Score widget (`GrowthScoreClient`)
- ✅ Analytics page (`/provider/(console)/analytics`)
- ✅ Metrics API (`/api/provider/metrics`)
- ✅ Weekly retention metrics (views, bookings, conversion, search appearances)
- ✅ Charts (bookings by day, revenue by week)
- ✅ Profile health score calculation

**What's Missing:**
- ❌ **Hero page design** — Current is functional, not inspiring
- ❌ **Key KPIs at a glance** — No prominent metric cards
- ❌ **Growth Score prominence** — Exists but buried in section
- ❌ **Recommended actions** — No "Next steps" or "Quick wins"
- ❌ **Alerts/notifications** — No prominent alerts for issues
- ❌ **Competitor benchmarks** — No comparison to similar providers
- ❌ **Time on page metrics** — Not tracked or displayed
- ❌ **Referring keywords** — Not tracked or displayed
- ❌ **Search appearance tracking** — Partial (weekly only)
- ❌ **One-click improvements** — No actionable buttons

**What's Broken:**
- ⚠️ Dashboard loads multiple components separately (potential race conditions)
- ⚠️ Growth Score data can be null (no fallback UI)
- ⚠️ Analytics page requires separate navigation (not integrated into dashboard)

**What Needs Redesign:**
1. **Hero section** — Large KPI cards (views, bookings, revenue, growth %)
2. **Growth Score card** — Prominent display with breakdown
3. **Alerts panel** — "Low slots available", "Profile incomplete", "No bookings this week"
4. **Recommended actions** — "Add 3 more photos", "Enable bookings", "Update schedule"
5. **Quick stats grid** — This week vs last week comparison
6. **One-click actions** — "Boost visibility", "Add class", "Update profile"

**Files to Review:**
- `app/provider/(console)/page.tsx` — Main dashboard
- `app/provider/(console)/ProviderDashboardClient.tsx` — Client component
- `app/provider/(console)/analytics/ProviderAnalyticsClient.tsx` — Analytics page
- `app/api/provider/metrics/route.ts` — Metrics API
- `app/provider/(console)/dashboard/GrowthScoreClient.tsx` — Growth score

---

### 3. PROVIDER ANALYTICS

#### Current Implementation

**What Exists:**
- ✅ Metrics API (`/api/provider/metrics`)
- ✅ Weekly analytics table (`provider_analytics_weekly`)
- ✅ Metrics view (`v_provider_metrics`)
- ✅ Bookings tracking (by day, by week)
- ✅ Revenue tracking (last 7/30 days)
- ✅ Profile health score (0-100)
- ✅ Weekly retention metrics (views, bookings, conversion, search, reviews)
- ✅ Charts (bookings chart, revenue chart)
- ✅ Class conversion table
- ✅ Reviews summary

**What's Missing:**
- ❌ **Profile views** — Not tracked separately (only in weekly table)
- ❌ **Website clicks** — Not tracked
- ❌ **Phone clicks** — Not tracked
- ❌ **Email clicks** — Not tracked
- ❌ **Time on page** — Not tracked
- ❌ **Referring keywords** — Not tracked
- ❌ **Search appearances** — Only weekly aggregate, not per-query
- ❌ **Competitor benchmarks** — No comparison data
- ❌ **Growth score calculation** — Exists but not ClassPass-level sophisticated
- ❌ **Recommended actions** — No AI-driven suggestions
- ❌ **Historical trends** — Only 30 days bookings, 12 weeks revenue

**What's Broken:**
- ⚠️ Metrics API caches for 60s but no invalidation on events
- ⚠️ Weekly analytics may be incomplete if aggregation fails
- ⚠️ Profile health score is basic (40/30/30 split, not weighted)

**What Needs Redesign:**
1. **Event tracking** — Track profile views, website clicks, phone clicks, email clicks
2. **Search analytics** — Track which queries show provider, position in results
3. **Time on page** — Track average time parents spend on provider page
4. **Referring keywords** — Track search terms that lead to profile
5. **Competitor analysis** — Compare to similar providers in same town/category
6. **Growth score algorithm** — Weighted factors: completeness (30%), engagement (40%), growth (30%)
7. **AI recommendations** — "Your photos are 2x more effective than average", "Add schedule to boost bookings 15%"

**Files to Review:**
- `app/api/provider/metrics/route.ts` — Metrics API
- `app/provider/(console)/analytics/ProviderAnalyticsClient.tsx` — Analytics UI
- `app/provider/(console)/analytics/components/` — Chart components
- Database views: `v_provider_metrics`, `provider_analytics_weekly`

---

### 4. ADMIN BACKEND

#### Current Implementation

**What Exists:**
- ✅ Admin dashboard (`/admin/page.tsx`)
- ✅ Admin authentication (`lib/admin/auth-improved.ts`)
- ✅ Provider leads management (`/admin/providers/leads`)
- ✅ Analytics dashboard (`/admin/analytics`, `/admin/insights`)
- ✅ Bookings management (`/admin/bookings`)
- ✅ Reviews moderation (`/admin/reviews`)
- ✅ Security dashboard (`/admin/security`)
- ✅ Payments dashboard (`/admin/payments`)
- ✅ Blog management (`/admin/blogs`)
- ✅ Automation dashboard (`/admin/automation`)

**What's Missing:**
- ❌ **Provider CRUD** — No easy way to edit provider details
- ❌ **Bulk operations** — No bulk approve/reject/update
- ❌ **Provider verification workflow** — Leads exist but no clear approve → activate flow
- ❌ **Business-focused UI** — Current feels like developer panels
- ❌ **Provider search/filter** — No search by name, town, status
- ❌ **Provider activity log** — No history of changes
- ❌ **Quick actions** — No "Approve & Activate", "Send Welcome Email" buttons

**What's Broken:**
- ⚠️ Provider leads page shows leads but no direct "Approve" → "Create Provider" flow
- ⚠️ Admin pages are functional but not intuitive for non-technical operators

**What Needs Redesign:**
1. **Provider management page** — List all providers with search, filters, bulk actions
2. **Provider detail page** — Edit provider info, view analytics, manage classes
3. **Verification workflow** — "Review Lead" → "Approve" → "Activate" → "Send Welcome"
4. **Bulk operations** — "Approve 10", "Send email to 5", "Feature all in London"
5. **Activity log** — "Provider X updated by Admin Y at Z time"
6. **Business metrics** — "Total providers", "Active this week", "Pending approval"

**Files to Review:**
- `app/admin/page.tsx` — Admin dashboard
- `app/admin/providers/leads/page.tsx` — Provider leads
- `components/admin/ProviderLeadsManager.tsx` — Leads manager
- Need to create: `app/admin/providers/page.tsx` — Provider list
- Need to create: `app/admin/providers/[id]/page.tsx` — Provider detail

---

### 5. SEARCH & FILTERING

#### Current Implementation

**What Exists:**
- ✅ Search page (`/search/page.tsx`)
- ✅ Search API (`/api/search/route.ts`)
- ✅ Location-based filtering (town, postcode)
- ✅ Category filtering
- ✅ Age range filtering
- ✅ Price filtering (free/paid)
- ✅ Ranking algorithm (`lib/search/ranking.ts`)
- ✅ Featured listings support
- ✅ Search caching (`lib/cache/searchCache.ts`)

**What's Missing:**
- ❌ **8-second target** — No performance monitoring to ensure <8s
- ❌ **Advanced filters** — No day of week, time of day, distance radius
- ❌ **Search suggestions** — No autocomplete
- ❌ **Recent searches** — No history
- ❌ **Saved searches** — Exists in account but not integrated into search UI
- ❌ **Map view** — No map-based search
- ❌ **Sort options** — No "Distance", "Price", "Rating" sorting

**What's Broken:**
- ⚠️ Search performance not measured — No way to verify <8s target
- ⚠️ Ranking algorithm exists but weights not optimised

**What Needs Redesign:**
1. **Performance monitoring** — Track search query time, ensure <8s
2. **Autocomplete** — Suggest towns, categories, class names as user types
3. **Advanced filters panel** — Day, time, distance, rating, booking availability
4. **Map integration** — Show results on map with clustering
5. **Sort dropdown** — "Relevance", "Distance", "Price: Low to High", "Rating"
6. **Search analytics** — Track popular queries, zero-result searches

**Files to Review:**
- `app/search/page.tsx` — Search page
- `components/search/SearchPageClient.tsx` — Search UI
- `app/api/search/route.ts` — Search API
- `lib/search/ranking.ts` — Ranking algorithm

---

### 6. SEO ARCHITECTURE

#### Current Implementation

**What Exists:**
- ✅ City pages (`/[city]/page.tsx`) — Dynamic city landing pages
- ✅ Sitemap (`app/sitemap.ts`) — Includes cities, blog, main pages
- ✅ Schema markup (`CityPageSchema.tsx`) — JSON-LD for cities
- ✅ Search page metadata — Dynamic titles/descriptions
- ✅ Blog SEO — Individual post pages with metadata

**What's Missing:**
- ❌ **Class type pages** — No `/classes/music`, `/classes/swimming` pages
- ❌ **Age group pages** — No `/classes/baby`, `/classes/toddler` pages
- ❌ **Combination pages** — No `/classes/music/baby/london` pages
- ❌ **Town × category pages** — No `/london/music`, `/london/swimming` pages
- ❌ **Neighbourhood pages** — No `/london/camden` pages
- ❌ **Internal linking** — No automated cross-linking between related pages
- ❌ **Schema for classes** — No structured data for individual classes
- ❌ **Schema for providers** — No structured data for provider pages

**What's Broken:**
- ⚠️ Sitemap only includes top-level pages, not dynamic combinations
- ⚠️ City pages exist but no category/age filtering on city pages

**What Needs Redesign:**
1. **Dynamic route generation** — `/classes/[category]/[age]/[town]` pages
2. **Town × category pages** — `/london/music`, `/manchester/swimming`
3. **Neighbourhood pages** — `/london/camden`, `/london/islington`
4. **Schema markup** — Add LocalBusiness, Service, Offer schemas
5. **Internal linking** — Auto-link "Related classes in London", "More music classes"
6. **Sitemap generation** — Include all dynamic combinations (with limits)

**Files to Review:**
- `app/[city]/page.tsx` — City pages
- `app/sitemap.ts` — Sitemap generation
- `app/[city]/CityPageSchema.tsx` — Schema markup
- Need to create: `app/classes/[category]/page.tsx`
- Need to create: `app/classes/[category]/[age]/page.tsx`
- Need to create: `app/classes/[category]/[age]/[town]/page.tsx`

---

### 7. PROVIDER TOOLS

#### Current Implementation

**What Exists:**
- ✅ Class management (`/provider/(console)/classes`)
- ✅ Venue management (`/provider/(console)/venues`)
- ✅ Schedule management (`/provider/(console)/classes/[id]/schedule`)
- ✅ Analytics dashboard
- ✅ Reviews management (`/provider/(console)/reviews`)
- ✅ Payouts (`/provider/(console)/payouts`)
- ✅ Marketing booster (`/provider/(console)/marketing`)

**What's Missing:**
- ❌ **10× easier than Happity** — Current tools are functional but not 10× easier
- ❌ **Bulk class creation** — No "Create 5 classes from template"
- ❌ **AI content suggestions** — Partial (exists but not prominent)
- ❌ **One-click scheduling** — Schedule creation is multi-step
- ❌ **Quick edit** — No inline editing of class details
- ❌ **Photo management** — No drag-drop, no bulk upload
- ❌ **Social media integration** — No auto-post to Instagram/Facebook

**What Needs Redesign:**
1. **Simplified class creation** — 3-step wizard: Name → Schedule → Publish
2. **Template library** — Pre-filled templates for common class types
3. **Bulk operations** — "Duplicate class", "Create weekly series", "Update all prices"
4. **Inline editing** — Click to edit name, price, description without page reload
5. **Photo upload** — Drag-drop with auto-optimisation, bulk upload
6. **AI assistance** — "Generate description", "Suggest tags", "Optimise for SEO"

**Files to Review:**
- `app/provider/(console)/classes/ClassManager.tsx` — Class management
- `app/provider/(console)/classes/actions.ts` — Class actions
- `app/provider/(console)/venues/VenueManager.tsx` — Venue management
- `app/provider/(console)/classes/AIContentSuggestion.tsx` — AI suggestions

---

### 8. AUTOMATION ENGINE

#### Current Implementation

**What Exists:**
- ✅ Cron jobs (`app/api/cron/`) — Referral reminders, inactivity checks, alerts
- ✅ Blog generation automation (`app/api/blog/cron/route.ts`)
- ✅ Automation dashboard (`/admin/automation`)
- ✅ Scripts in root (`*.cjs`, `*.js`) — Data sync, scheduling, enhancements
- ✅ Provider analytics aggregation (weekly)

**What's Missing:**
- ❌ **Orchestration** — Scripts are standalone, no central scheduler
- ❌ **Error handling** — No retry logic, no alerting on failures
- ❌ **Monitoring** — No dashboard for automation health
- ❌ **Scalability** — Scripts run manually, not distributed
- ❌ **Provider onboarding automation** — No automated welcome emails, reminders
- ❌ **Content generation** — Blog automation exists but not class descriptions, provider bios
- ❌ **Data enrichment** — Manual scripts, not automated pipeline

**What Needs Redesign:**
1. **Job queue system** — Use BullMQ or similar for job scheduling
2. **Automation dashboard** — Show job status, success/failure rates, logs
3. **Retry logic** — Automatic retries with exponential backoff
4. **Alerting** — Email/Slack alerts on job failures
5. **Provider onboarding automation** — Auto-send welcome email, day 3 reminder, day 7 nudge
6. **Content generation pipeline** — Auto-generate class descriptions, provider bios, SEO content
7. **Data sync automation** — Automated Google Places sync, schedule updates

**Files to Review:**
- `app/api/cron/` — Cron endpoints
- `app/admin/automation/` — Automation dashboard
- Root scripts: `continuous-scheduler.js`, `complete-scheduling-system.js`, etc.

---

## PART 2: DELIVERABLES

### 1. GAP REPORT

#### Onboarding — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| Multi-step wizard | ❌ Checklist only | ✅ Sequential wizard | **CRITICAL** |
| Progress saving | ❌ Links to pages | ✅ Auto-save per step | **HIGH** |
| Preview before publish | ❌ No preview | ✅ Live preview | **HIGH** |
| Template selection | ❌ No templates | ✅ Class templates | **MEDIUM** |
| Media upload wizard | ❌ Basic upload | ✅ Drag-drop, crop, optimise | **MEDIUM** |
| Business info collection | ⚠️ Separate form | ✅ Integrated into wizard | **HIGH** |
| Essential-first approach | ❌ All steps shown | ✅ Progressive disclosure | **MEDIUM** |

**Priority**: **CRITICAL** — Onboarding is first impression, must be wizard-based.

---

#### Provider Dashboard — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| Hero KPI cards | ❌ Basic stats | ✅ Large, prominent metrics | **HIGH** |
| Growth Score prominence | ⚠️ In section | ✅ Top of page | **MEDIUM** |
| Recommended actions | ❌ None | ✅ AI-driven suggestions | **HIGH** |
| Alerts/notifications | ⚠️ Basic banners | ✅ Prominent alert panel | **MEDIUM** |
| Competitor benchmarks | ❌ None | ✅ Comparison data | **LOW** |
| One-click improvements | ❌ None | ✅ Action buttons | **HIGH** |
| Time on page metrics | ❌ Not tracked | ✅ Displayed | **MEDIUM** |
| Referring keywords | ❌ Not tracked | ✅ Displayed | **MEDIUM** |

**Priority**: **HIGH** — Dashboard is daily touchpoint, must inspire action.

---

#### Analytics — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| Profile views | ⚠️ Weekly only | ✅ Real-time + historical | **HIGH** |
| Website clicks | ❌ Not tracked | ✅ Tracked & displayed | **HIGH** |
| Phone clicks | ❌ Not tracked | ✅ Tracked & displayed | **HIGH** |
| Email clicks | ❌ Not tracked | ✅ Tracked & displayed | **HIGH** |
| Time on page | ❌ Not tracked | ✅ Tracked & displayed | **MEDIUM** |
| Referring keywords | ❌ Not tracked | ✅ Tracked & displayed | **MEDIUM** |
| Search appearances | ⚠️ Weekly aggregate | ✅ Per-query tracking | **HIGH** |
| Competitor benchmarks | ❌ None | ✅ Comparison data | **LOW** |
| Growth score algorithm | ⚠️ Basic (40/30/30) | ✅ Weighted, sophisticated | **MEDIUM** |
| AI recommendations | ❌ None | ✅ Actionable suggestions | **HIGH** |

**Priority**: **HIGH** — Analytics drive provider engagement and retention.

---

#### Admin Tools — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| Provider CRUD | ❌ No edit page | ✅ Full CRUD interface | **CRITICAL** |
| Bulk operations | ❌ None | ✅ Bulk approve/update | **HIGH** |
| Provider search/filter | ❌ None | ✅ Search by name/town/status | **HIGH** |
| Verification workflow | ⚠️ Manual process | ✅ Guided workflow | **HIGH** |
| Activity log | ❌ None | ✅ Change history | **MEDIUM** |
| Business-focused UI | ❌ Developer panels | ✅ Business dashboard | **HIGH** |
| Quick actions | ❌ None | ✅ One-click operations | **MEDIUM** |

**Priority**: **HIGH** — Admin efficiency directly impacts provider onboarding speed.

---

#### Search — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| 8-second performance | ⚠️ Not measured | ✅ Monitored & optimised | **HIGH** |
| Autocomplete | ❌ None | ✅ Search suggestions | **MEDIUM** |
| Advanced filters | ⚠️ Basic | ✅ Day, time, distance, rating | **MEDIUM** |
| Map view | ❌ None | ✅ Map-based search | **LOW** |
| Sort options | ❌ None | ✅ Distance, price, rating | **MEDIUM** |
| Search analytics | ❌ None | ✅ Query tracking | **LOW** |

**Priority**: **MEDIUM** — Search works but needs polish for 8s target.

---

#### SEO — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| Class type pages | ❌ None | ✅ `/classes/music` | **HIGH** |
| Age group pages | ❌ None | ✅ `/classes/baby` | **HIGH** |
| Combination pages | ❌ None | ✅ `/classes/music/baby/london` | **HIGH** |
| Town × category pages | ⚠️ City pages only | ✅ `/london/music` | **HIGH** |
| Neighbourhood pages | ❌ None | ✅ `/london/camden` | **MEDIUM** |
| Schema for classes | ❌ None | ✅ LocalBusiness, Service | **HIGH** |
| Internal linking | ❌ None | ✅ Auto cross-links | **MEDIUM** |
| Sitemap generation | ⚠️ Static only | ✅ Dynamic combinations | **HIGH** |

**Priority**: **HIGH** — SEO drives organic traffic, critical for growth.

---

#### Provider Tools — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| 10× easier than Happity | ⚠️ Functional | ✅ Intuitive, fast | **HIGH** |
| Bulk class creation | ❌ None | ✅ Template-based bulk | **MEDIUM** |
| AI content suggestions | ⚠️ Exists but hidden | ✅ Prominent, helpful | **MEDIUM** |
| One-click scheduling | ⚠️ Multi-step | ✅ Quick schedule | **MEDIUM** |
| Inline editing | ❌ Page reload | ✅ Click to edit | **MEDIUM** |
| Photo management | ⚠️ Basic | ✅ Drag-drop, bulk | **MEDIUM** |

**Priority**: **MEDIUM** — Tools work but need UX polish for 10× claim.

---

#### Automation — Current vs Required

| Feature | Current | Required | Gap |
|---------|---------|---------|-----|
| Job orchestration | ❌ Standalone scripts | ✅ Central scheduler | **MEDIUM** |
| Error handling | ❌ No retries | ✅ Retry logic | **HIGH** |
| Monitoring dashboard | ⚠️ Basic | ✅ Health dashboard | **MEDIUM** |
| Scalability | ❌ Manual execution | ✅ Distributed jobs | **LOW** |
| Onboarding automation | ❌ None | ✅ Welcome emails, reminders | **MEDIUM** |
| Content generation | ⚠️ Blog only | ✅ Class descriptions, bios | **MEDIUM** |

**Priority**: **MEDIUM** — Automation exists but needs reliability improvements.

---

### 2. PRIORITISED FIX LIST (0–3 WEEKS)

#### Week 1: Critical Onboarding & Admin

**Day 1-2: Provider Onboarding Wizard**
- [ ] Create `app/provider/(console)/onboarding/wizard/page.tsx` — Multi-step wizard
- [ ] Create `components/provider/OnboardingWizard.tsx` — Wizard component with progress bar
- [ ] Create `app/api/provider/onboarding/save-step/route.ts` — Auto-save each step
- [ ] Update `lib/gamification/onboarding.ts` — Add wizard step validation
- [ ] Create `app/provider/(console)/onboarding/wizard/[step]/page.tsx` — Individual step pages
- [ ] Add preview step: `app/provider/(console)/onboarding/wizard/preview/page.tsx`

**Day 3-4: Admin Provider Management**
- [ ] Create `app/admin/providers/page.tsx` — Provider list with search/filter
- [ ] Create `app/admin/providers/[id]/page.tsx` — Provider detail/edit page
- [ ] Create `components/admin/ProviderManager.tsx` — Provider CRUD component
- [ ] Create `app/api/admin/providers/[id]/route.ts` — Provider update API
- [ ] Add bulk actions: `app/api/admin/providers/bulk/route.ts`

**Day 5: Integration**
- [ ] Connect registration form to wizard: Update `app/providers/register/page.tsx`
- [ ] Add "Approve & Activate" button in admin leads page
- [ ] Test end-to-end: Registration → Admin Approval → Wizard → Dashboard

---

#### Week 2: Dashboard & Analytics

**Day 1-2: Dashboard Hero Page**
- [ ] Redesign `app/provider/(console)/page.tsx` — Hero section with large KPI cards
- [ ] Create `components/provider/DashboardHero.tsx` — Hero component
- [ ] Create `components/provider/KPICard.tsx` — Reusable KPI card
- [ ] Create `components/provider/RecommendedActions.tsx` — AI-driven suggestions
- [ ] Create `components/provider/AlertsPanel.tsx` — Prominent alerts
- [ ] Move Growth Score to top of page

**Day 3-4: Analytics Event Tracking**
- [ ] Create `app/api/analytics/track/route.ts` — Event tracking endpoint
- [ ] Add tracking to class pages: Profile view, website click, phone click, email click
- [ ] Create `lib/analytics/events.ts` — Event tracking utilities
- [ ] Update `app/api/provider/metrics/route.ts` — Include event-based metrics
- [ ] Create database table: `provider_analytics_events` for raw events

**Day 5: Analytics UI Updates**
- [ ] Update `app/provider/(console)/analytics/ProviderAnalyticsClient.tsx` — Show new metrics
- [ ] Create `components/provider/analytics/EventMetrics.tsx` — Event metrics component
- [ ] Add "Referring Keywords" section
- [ ] Add "Time on Page" metric

---

#### Week 3: SEO & Search

**Day 1-2: Dynamic SEO Pages**
- [ ] Create `app/classes/[category]/page.tsx` — Class type pages
- [ ] Create `app/classes/[category]/[age]/page.tsx` — Age group pages
- [ ] Create `app/classes/[category]/[age]/[town]/page.tsx` — Combination pages
- [ ] Create `app/[town]/[category]/page.tsx` — Town × category pages
- [ ] Update `app/sitemap.ts` — Include dynamic routes (with limits)

**Day 3: Schema Markup**
- [ ] Create `components/seo/ClassSchema.tsx` — LocalBusiness schema for classes
- [ ] Create `components/seo/ProviderSchema.tsx` — LocalBusiness schema for providers
- [ ] Add schema to class detail pages
- [ ] Add schema to provider pages

**Day 4: Search Performance**
- [ ] Add performance monitoring to `app/api/search/route.ts`
- [ ] Create `lib/search/performance.ts` — Search timing utilities
- [ ] Add caching for common queries
- [ ] Optimise ranking algorithm if needed

**Day 5: Internal Linking**
- [ ] Create `components/seo/RelatedClasses.tsx` — Auto-generate related links
- [ ] Add to class pages: "More classes in London", "More music classes"
- [ ] Add to city pages: "Music classes", "Swimming classes" links

---

### 3. ONBOARDING WIZARD SPEC

#### Overview

Replace the current checklist-based onboarding with a guided multi-step wizard that collects essential information progressively and provides a live preview before publishing.

#### Step-by-Step Flow

**Step 1: Account Creation**
- **Route**: `/provider/onboarding/wizard/account`
- **Fields**:
  - Email (required)
  - Password (required, min 8 chars)
  - Business name (required)
  - Contact name (required)
- **Validation**: Email uniqueness, password strength
- **Server Action**: `createProviderAccount`
- **DB Fields**: `users` (email, password), `providers` (name, contact_email)

**Step 2: Business Info**
- **Route**: `/provider/onboarding/wizard/business`
- **Fields**:
  - Legal name (optional)
  - Phone (required)
  - Website (optional, URL validation)
  - Address line 1 (required)
  - Address line 2 (optional)
  - Town (required, autocomplete)
  - County (optional)
  - Postcode (required, UK format)
- **Auto-fill**: Geocode address to get lat/lng
- **Server Action**: `updateProviderBusinessInfo`
- **DB Fields**: `providers` (legal_name, contact_phone, website, address_line1, address_line2, town, county, postcode, latitude, longitude)

**Step 3: Class Template**
- **Route**: `/provider/onboarding/wizard/template`
- **Templates**: "Music Class", "Swimming", "Sensory Play", "Yoga", "STEM", "Custom"
- **Template Selection**: Radio buttons with icons
- **If Template Selected**: Pre-fill category, age range, description
- **If Custom**: Show category dropdown, age range inputs
- **Server Action**: `createClassFromTemplate`
- **DB Fields**: `classes` (title, category, age_range, description, provider_id)

**Step 4: Media Uploads**
- **Route**: `/provider/onboarding/wizard/media`
- **Uploads**:
  - Logo (1 image, square, min 200x200px)
  - Class photos (3-10 images, landscape, min 800x600px)
- **Features**:
  - Drag-drop upload
  - Image cropping (logo: square, photos: 16:9)
  - Image optimisation (auto-resize, compress)
  - Preview before upload
- **Server Action**: `uploadProviderMedia`
- **Storage**: Supabase Storage (`providers/{id}/logo`, `providers/{id}/gallery`)
- **DB Fields**: `providers.metadata.logo_url`, `classes.image_urls[]`

**Step 5: Preview**
- **Route**: `/provider/onboarding/wizard/preview`
- **Display**: Live preview of provider listing as parents see it
- **Components**: Use existing `ClassCard` and `ProviderCard` components
- **Actions**:
  - "Edit" buttons to go back to previous steps
  - "Looks Good" button to proceed
  - "Save as Draft" button to save without publishing

**Step 6: Publish**
- **Route**: `/provider/onboarding/wizard/publish`
- **Confirmation**: "You're about to publish your listing. It will be visible to parents immediately."
- **Actions**:
  - "Publish Now" — Sets `is_active = true`, `is_published = true`
  - "Save as Draft" — Sets `is_published = false`
- **Server Action**: `publishProviderListing`
- **Post-publish**: Redirect to dashboard with success message

#### Required Pages

```
app/provider/(console)/onboarding/wizard/
├── page.tsx                    # Wizard container (redirects to step 1)
├── [step]/
│   └── page.tsx                # Dynamic step page
├── account/
│   └── page.tsx                # Step 1: Account
├── business/
│   └── page.tsx                # Step 2: Business Info
├── template/
│   └── page.tsx                # Step 3: Template
├── media/
│   └── page.tsx                # Step 4: Media
├── preview/
│   └── page.tsx                # Step 5: Preview
└── publish/
    └── page.tsx                 # Step 6: Publish
```

#### Required Components

```
components/provider/onboarding/
├── OnboardingWizard.tsx        # Main wizard container
├── WizardProgress.tsx           # Progress bar (1/6, 2/6, etc.)
├── StepAccount.tsx             # Step 1 form
├── StepBusiness.tsx            # Step 2 form
├── StepTemplate.tsx            # Step 3 template selection
├── StepMedia.tsx               # Step 4 media upload
├── StepPreview.tsx             # Step 5 preview
├── StepPublish.tsx             # Step 6 confirmation
└── MediaUploader.tsx           # Reusable drag-drop uploader
```

#### Required Server Actions

```
app/provider/(console)/onboarding/wizard/actions.ts
- createProviderAccount(email, password, businessName, contactName)
- updateProviderBusinessInfo(providerId, businessInfo)
- createClassFromTemplate(providerId, templateId, customData?)
- uploadProviderMedia(providerId, logo?, photos?)
- publishProviderListing(providerId, classId, publish: boolean)
- getOnboardingProgress(providerId) // Returns current step
```

#### Required DB Fields

**New Tables:**
- `provider_onboarding_wizard` (provider_id, current_step, completed_steps[], saved_data jsonb)

**Existing Tables (updates):**
- `providers` — Already has all needed fields
- `classes` — Already has all needed fields
- `users` — Already has email/password

#### Progress Saving

- **Auto-save**: Save form data to `provider_onboarding_wizard.saved_data` on blur/change
- **Resume**: On wizard load, check `current_step` and redirect to that step
- **Validation**: Before moving to next step, validate current step data

#### Navigation

- **Back button**: Always visible, goes to previous step
- **Next button**: Validates current step, saves progress, moves to next
- **Skip** (optional): For non-essential steps, allow skip with warning
- **Exit**: "Save and continue later" saves progress and redirects to dashboard

---

### 4. PROVIDER DASHBOARD "HERO PAGE" SPEC

#### Overview

Transform the current functional dashboard into an inspiring, action-oriented hero page that providers want to check daily. Focus on prominent KPIs, growth score, recommended actions, and one-click improvements.

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  HERO SECTION (Full width, prominent)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Views  │ │ Bookings │ │ Revenue  │ │  Growth  │ │
│  │   1,234  │ │    45    │ │   £2,340 │ │   +12%   │ │
│  │  +15% ↑  │ │   +8% ↑  │ │  +23% ↑  │ │   85/100 │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GROWTH SCORE CARD (Large, prominent)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Your Growth Score: 85/100                       │  │
│  │  ████████████████░░░░ 85%                        │  │
│  │                                                    │  │
│  │  Completeness: 90%  │  Engagement: 80%  │  ...  │  │
│  │  [View Breakdown]                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────┐
│  ALERTS & NOTIFICATIONS  │  RECOMMENDED ACTIONS         │
│  ┌──────────────────────┐ │  ┌────────────────────────┐ │
│  │  ⚠️ Low slots        │ │  │  1. Add 3 more photos  │ │
│  │     available        │ │  │     [Do It Now]        │ │
│  └──────────────────────┘ │  └────────────────────────┘ │
│  ┌──────────────────────┐ │  ┌────────────────────────┐ │
│  │  ℹ️ Profile 80%        │ │  │  2. Enable bookings   │ │
│  │     complete          │ │  │     [Enable]           │ │
│  └──────────────────────┘ │  └────────────────────────┘ │
└──────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  QUICK STATS (This Week vs Last Week)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Views   │ │ Bookings │ │ Conversion│ │  Search  │ │
│  │  234     │ │    12    │ │   5.1%    │ │   156    │ │
│  │  +15%    │ │   +8%    │ │   +0.5%   │ │   +12%   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ONE-CLICK ACTIONS                                       │
│  [Boost Visibility] [Add Class] [Update Profile]         │
│  [Enable Bookings] [View Analytics]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AT A GLANCE (Existing section, keep)                   │
│  Total Classes | Venues | Upcoming Sessions             │
└─────────────────────────────────────────────────────────┘
```

#### Required Components

```
components/provider/dashboard/
├── DashboardHero.tsx            # Main hero section
├── KPICard.tsx                  # Reusable KPI card (views, bookings, revenue, growth)
├── GrowthScoreCard.tsx          # Large growth score display
├── AlertsPanel.tsx              # Alerts and notifications
├── RecommendedActions.tsx       # AI-driven action suggestions
├── QuickStatsGrid.tsx           # This week vs last week
└── OneClickActions.tsx          # Quick action buttons
```

#### KPIs to Display

1. **Views** — Total profile views (this week, change %)
2. **Bookings** — Total bookings (this week, change %)
3. **Revenue** — Total revenue (this week, change %)
4. **Growth Score** — Overall score (0-100, change %)

#### Growth Score Breakdown

- **Completeness** (30%): Profile filled, photos uploaded, classes published
- **Engagement** (40%): Views, bookings, reviews, conversion rate
- **Growth** (30%): Week-over-week improvements, trending upward

#### Alerts

- **Low slots available** — Featured listing slots running out
- **Profile incomplete** — Missing required fields
- **No bookings this week** — Alert if 0 bookings
- **Reviews pending** — Unresponded reviews
- **Payment setup needed** — Stripe not connected

#### Recommended Actions

AI-driven suggestions based on:
- Profile completeness gaps
- Low-performing areas (e.g., "Add photos to boost views 20%")
- Best practices (e.g., "Enable bookings to increase revenue")
- Competitor analysis (e.g., "Similar providers have 5+ photos")

Each action has:
- Title
- Description
- Impact estimate ("+20% views")
- "Do It Now" button

#### One-Click Actions

- **Boost Visibility** — Opens featured listings purchase
- **Add Class** — Quick class creation flow
- **Update Profile** — Edit provider info
- **Enable Bookings** — Stripe Connect setup
- **View Analytics** — Link to analytics page

#### Required API Endpoints

```
GET /api/provider/dashboard/hero
Returns:
{
  kpis: {
    views: { value: 1234, change: 15 },
    bookings: { value: 45, change: 8 },
    revenue: { value: 2340, change: 23 },
    growthScore: { value: 85, change: 12 }
  },
  growthScore: {
    overall: 85,
    completeness: 90,
    engagement: 80,
    growth: 85,
    breakdown: [...]
  },
  alerts: [...],
  recommendedActions: [...],
  quickStats: {
    views: { thisWeek: 234, lastWeek: 203, change: 15 },
    bookings: { thisWeek: 12, lastWeek: 11, change: 8 },
    ...
  }
}
```

#### Required DB Queries

- Aggregate views, bookings, revenue from `provider_analytics_weekly`
- Calculate growth score from multiple factors
- Fetch alerts from various sources (featured listings, profile completeness, etc.)
- Generate recommended actions (AI or rule-based)

---

### 5. TECHNICAL IMPLEMENTATION PLAN (6–12 WEEKS)

#### Phase 1: Foundation (Weeks 1-2)

**Week 1: Onboarding Wizard**
- Implement multi-step wizard
- Add progress saving
- Add preview step
- Integrate with registration

**Week 2: Admin Provider Management**
- Provider CRUD interface
- Bulk operations
- Verification workflow
- Activity logging

**Deliverables:**
- ✅ Onboarding wizard live
- ✅ Admin can manage providers easily
- ✅ Registration → Approval → Wizard flow working

---

#### Phase 2: Dashboard & Analytics (Weeks 3-4)

**Week 3: Dashboard Hero Page**
- Redesign dashboard with hero section
- Add KPI cards
- Add growth score prominence
- Add recommended actions

**Week 4: Analytics Event Tracking**
- Implement event tracking system
- Track profile views, clicks, time on page
- Update analytics UI with new metrics
- Add referring keywords tracking

**Deliverables:**
- ✅ Inspiring dashboard hero page
- ✅ Comprehensive analytics with event tracking
- ✅ Providers can see full engagement metrics

---

#### Phase 3: SEO & Search (Weeks 5-6)

**Week 5: Dynamic SEO Pages**
- Create class type pages (`/classes/music`)
- Create age group pages (`/classes/baby`)
- Create combination pages (`/classes/music/baby/london`)
- Create town × category pages (`/london/music`)
- Update sitemap generation

**Week 6: Schema & Internal Linking**
- Add LocalBusiness schema to classes
- Add LocalBusiness schema to providers
- Implement internal linking system
- Add "Related classes" sections

**Deliverables:**
- ✅ SEO-optimised dynamic pages
- ✅ Schema markup for all entities
- ✅ Internal linking for better crawlability

---

#### Phase 4: Provider Tools (Weeks 7-8)

**Week 7: Class Creation UX**
- Simplify class creation to 3 steps
- Add template library
- Add bulk operations (duplicate, series)
- Add inline editing

**Week 8: Media & Content**
- Improve photo upload (drag-drop, bulk)
- Add AI content suggestions (prominent)
- Add one-click scheduling
- Add social media integration (optional)

**Deliverables:**
- ✅ 10× easier class management
- ✅ Fast photo upload and management
- ✅ AI-assisted content creation

---

#### Phase 5: Automation (Weeks 9-10)

**Week 9: Job Orchestration**
- Set up job queue (BullMQ or similar)
- Migrate existing cron jobs to queue
- Add retry logic with exponential backoff
- Add job monitoring dashboard

**Week 10: Automation Features**
- Provider onboarding automation (welcome emails, reminders)
- Content generation pipeline (class descriptions, bios)
- Data sync automation (Google Places, schedules)
- Error alerting (email/Slack)

**Deliverables:**
- ✅ Reliable automation system
- ✅ Automated provider onboarding
- ✅ Content generation pipeline

---

#### Phase 6: Polish & Launch (Weeks 11-12)

**Week 11: Performance & Testing**
- Optimise search performance (<8s target)
- Add search autocomplete
- Add advanced filters
- Performance testing and optimisation

**Week 12: Final Polish**
- UX improvements based on feedback
- Bug fixes
- Documentation
- Launch preparation

**Deliverables:**
- ✅ All features complete
- ✅ Performance optimised
- ✅ Ready for launch

---

#### Suggested Folder Structure

```
app/
├── provider/
│   └── (console)/
│       ├── onboarding/
│       │   └── wizard/          # NEW: Wizard flow
│       │       ├── [step]/
│       │       ├── account/
│       │       ├── business/
│       │       ├── template/
│       │       ├── media/
│       │       ├── preview/
│       │       └── publish/
│       ├── dashboard/           # ENHANCED: Hero page
│       │   ├── page.tsx
│       │   └── components/
│       └── analytics/           # ENHANCED: Event tracking
│
├── admin/
│   └── providers/               # NEW: Provider management
│       ├── page.tsx            # Provider list
│       └── [id]/
│           └── page.tsx        # Provider detail/edit
│
├── classes/                     # NEW: SEO pages
│   └── [category]/
│       ├── page.tsx            # Class type page
│       └── [age]/
│           ├── page.tsx        # Age group page
│           └── [town]/
│               └── page.tsx    # Combination page
│
└── [town]/                      # ENHANCED: Town pages
    └── [category]/
        └── page.tsx            # Town × category page

components/
├── provider/
│   ├── onboarding/             # NEW: Wizard components
│   │   ├── OnboardingWizard.tsx
│   │   ├── WizardProgress.tsx
│   │   └── [step components]
│   └── dashboard/              # NEW: Hero components
│       ├── DashboardHero.tsx
│       ├── KPICard.tsx
│       ├── GrowthScoreCard.tsx
│       ├── AlertsPanel.tsx
│       └── RecommendedActions.tsx
│
├── admin/
│   └── providers/              # NEW: Provider management
│       ├── ProviderManager.tsx
│       └── ProviderList.tsx
│
└── seo/                         # NEW: SEO components
    ├── ClassSchema.tsx
    ├── ProviderSchema.tsx
    └── RelatedClasses.tsx

lib/
├── analytics/
│   └── events.ts               # NEW: Event tracking
├── search/
│   └── performance.ts         # NEW: Search monitoring
└── automation/
    └── jobs.ts                 # NEW: Job queue utilities
```

#### Component Architecture

**Onboarding Wizard:**
- Server Components for data fetching
- Client Components for interactivity
- Server Actions for mutations
- Progress stored in database

**Dashboard:**
- Server Component for initial data
- Client Components for real-time updates
- API routes for metrics
- Caching for performance

**Analytics:**
- Event tracking via API route
- Aggregation via database views
- Real-time updates via polling or WebSockets (future)

**SEO Pages:**
- Static generation for top combinations
- SSR for dynamic combinations
- Edge caching for performance
- Schema markup via components

#### API Design

**Onboarding:**
```
POST /api/provider/onboarding/save-step
POST /api/provider/onboarding/publish
GET  /api/provider/onboarding/progress
```

**Dashboard:**
```
GET /api/provider/dashboard/hero
GET /api/provider/dashboard/kpis
GET /api/provider/dashboard/actions
```

**Analytics:**
```
POST /api/analytics/track          # Event tracking
GET  /api/provider/metrics        # Enhanced with events
GET  /api/provider/analytics/keywords
```

**Admin:**
```
GET    /api/admin/providers
GET    /api/admin/providers/[id]
PUT    /api/admin/providers/[id]
POST   /api/admin/providers/bulk
```

#### Required Schema Changes

**New Tables:**
```sql
-- Onboarding wizard progress
CREATE TABLE provider_onboarding_wizard (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  current_step TEXT NOT NULL,
  completed_steps TEXT[] DEFAULT '{}',
  saved_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE provider_analytics_events (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES providers(id),
  class_id INTEGER REFERENCES classes(id),
  event_type TEXT NOT NULL, -- 'profile_view', 'website_click', 'phone_click', 'email_click'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search analytics
CREATE TABLE search_analytics (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  results_count INTEGER,
  provider_ids INTEGER[],
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New Indexes:**
```sql
CREATE INDEX idx_provider_analytics_events_provider ON provider_analytics_events(provider_id, created_at);
CREATE INDEX idx_provider_analytics_events_type ON provider_analytics_events(event_type, created_at);
CREATE INDEX idx_search_analytics_query ON search_analytics(query, created_at);
```

**New Views:**
```sql
-- Enhanced provider metrics with events
CREATE VIEW v_provider_metrics_enhanced AS
SELECT 
  p.id as provider_id,
  -- ... existing metrics ...
  COUNT(DISTINCT CASE WHEN e.event_type = 'profile_view' THEN e.id END) as total_views,
  COUNT(DISTINCT CASE WHEN e.event_type = 'website_click' THEN e.id END) as website_clicks,
  COUNT(DISTINCT CASE WHEN e.event_type = 'phone_click' THEN e.id END) as phone_clicks,
  COUNT(DISTINCT CASE WHEN e.event_type = 'email_click' THEN e.id END) as email_clicks
FROM providers p
LEFT JOIN provider_analytics_events e ON e.provider_id = p.id
GROUP BY p.id;
```

#### Automation Flows

**Provider Onboarding Automation:**
1. Registration → Send welcome email
2. Day 1 → Reminder to complete wizard
3. Day 3 → "You're 50% done" encouragement
4. Day 7 → "Complete your profile" final reminder
5. Publish → "Congratulations" email with tips

**Content Generation:**
1. New class created → Generate SEO-optimised description
2. Provider bio empty → Suggest bio based on classes
3. Low photo count → Remind to add photos

**Data Sync:**
1. Daily → Sync Google Places data
2. Weekly → Update schedules from external sources
3. Monthly → Verify provider information

---

## CONCLUSION

The Parent Helper platform has a **strong technical foundation** with 5,684 businesses and functional core features. However, to reach **Treatwell/ClassPass parity**, critical UX and feature gaps must be addressed:

1. **Onboarding** — Must be wizard-based, not checklist
2. **Dashboard** — Must inspire action, not just show data
3. **Analytics** — Must track all engagement events
4. **Admin Tools** — Must be business-focused, not developer panels
5. **SEO** — Must have dynamic combination pages
6. **Provider Tools** — Must be 10× easier than competitors

**Recommended Priority:**
1. **Weeks 1-2**: Onboarding wizard + Admin provider management (critical for growth)
2. **Weeks 3-4**: Dashboard hero + Analytics event tracking (critical for retention)
3. **Weeks 5-6**: SEO pages + Schema markup (critical for organic growth)
4. **Weeks 7-12**: Polish, automation, and launch preparation

This plan provides a clear path to achieving the high-level product goals while building on the existing solid foundation.

---

**End of Audit Report**

