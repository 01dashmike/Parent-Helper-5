# SEO & Robots.txt Global Notes

This document summarizes the SEO configuration and robots.txt rules across the Parent Helper website.

## Indexable Pages (Public, SEO-Optimized)

These pages are explicitly set to be indexed by search engines (`robots: { index: true, follow: true }`):

### Public Marketing & Content Pages
- **`/`** (Homepage)
  - Full metadata: title, description, canonical, OG tags, Twitter cards
  - Indexable
  
- **`/search`**
  - Dynamic metadata based on search params (town, query)
  - Canonical URL, OG tags, Twitter cards
  - Indexable

- **`/referrals/info`**
  - Full metadata with FAQ structured data
  - Canonical URL, OG tags, Twitter cards
  - Indexable

- **`/class/[id]`**
  - Dynamic metadata from class data (meta_title, meta_description, keywords)
  - Canonical URL, OG tags with images, Twitter cards
  - Event schema.org structured data
  - Indexable

- **`/blog/[slug]`**
  - Dynamic metadata from blog post data
  - OG tags with images
  - Indexable (inherits from blog structure)

## Non-Indexable Pages

### Account Pages (`/account/*`)
All account pages use `robots: { index: false, follow: false }`:
- `/account` - Account dashboard
- `/account/bookings` - User bookings
- `/account/calendar` - Calendar sync
- `/account/calendar-sync` - Calendar sync settings
- `/account/children` - Children management
- `/account/dashboard` - Dashboard
- `/account/login` - Login page
- `/account/notifications` - Notifications
- `/account/plans` - Saved plans
- `/account/referrals` - Referral dashboard
- `/account/rewards` - Rewards
- `/account/searches` - Saved searches
- `/account/wallet` - Wallet (if enabled)
- `/account/alerts` - Alerts

**Rationale**: These pages contain user-specific data and should not appear in search results.

### Admin Pages (`/admin/*`)
All admin pages use `robots: "noindex, nofollow"`:
- `/admin/insights` - Platform insights
- `/admin/rewards` - Rewards management
- `/admin/payments` - Payment management
- `/admin/docs` - Admin documentation
- All other `/admin/*` routes

**Rationale**: Admin pages contain sensitive internal data and should never be indexed.

### Provider Console Pages (`/provider/(console)/*`)
Provider console pages are blocked via robots.txt:
- `/provider/(console)/*` - All provider dashboard pages
- `/provider/onboarding` - Provider onboarding
- `/provider/login` - Provider login
- `/provider/(auth)/*` - Provider auth pages

**Rationale**: Provider console pages are authenticated and contain provider-specific data.

## Robots.txt Configuration

The `app/robots.ts` file controls which pages search engines can crawl:

### Allowed Paths
- `/` - Homepage
- `/search` - Search page
- `/class/*` - Class detail pages
- `/provider/*` - Public provider pages (if any)
- `/referrals/info` - Referral info page
- `/blog/*` - Blog posts

### Disallowed Paths
- `/admin/*` - All admin pages
- `/account/*` - All account pages
- `/api/*` - API endpoints
- `/provider/login` - Provider login
- `/provider/onboarding` - Provider onboarding
- `/provider/(console)/*` - Provider console pages
- `/provider/(auth)/*` - Provider auth pages

### Sitemap
- Sitemap URL: `{NEXT_PUBLIC_APP_URL}/sitemap.xml`

## Metadata Standards

### Required Fields for Indexable Pages
1. **title** - Page title (max 60 characters recommended)
2. **description** - Meta description (max 160 characters recommended)
3. **canonical** - Absolute URL to canonical version
4. **openGraph** - OG tags for social sharing:
   - `title`
   - `description`
   - `url`
   - `siteName`
   - `type` (website/article)
   - `images` (when available)
5. **twitter** - Twitter card metadata:
   - `card` (summary/summary_large_image)
   - `title`
   - `description`
   - `images` (when available)
6. **robots** - Explicit robots directive

### Base URL
All canonical URLs and OG URLs use:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://parenthelper.co.uk";
```

## How to Adjust SEO Settings

### Adding a New Public Page
1. Add metadata export with full SEO fields:
   ```typescript
   export const metadata: Metadata = {
     title: "Page Title | Parent Helper",
     description: "Page description",
     alternates: {
       canonical: `${baseUrl}/your-page`,
     },
     openGraph: {
       title: "Page Title | Parent Helper",
       description: "Page description",
       url: `${baseUrl}/your-page`,
       siteName: "Parent Helper",
       type: "website",
     },
     twitter: {
       card: "summary",
       title: "Page Title | Parent Helper",
       description: "Page description",
     },
     robots: {
       index: true,
       follow: true,
     },
   };
   ```

2. Add route to `app/robots.ts` allowed paths if needed

### Adding a New Account/Admin Page
1. Add metadata with noindex:
   ```typescript
   export const metadata: Metadata = {
     title: "Page Title | My Account | Parent Helper",
     description: "Page description",
     robots: {
       index: false,
       follow: false,
     },
   };
   ```

2. Ensure route is in `app/robots.ts` disallowed paths

### Updating Robots.txt
Edit `app/robots.ts` to add/remove allowed or disallowed paths:
```typescript
rules: [
  {
    userAgent: "*",
    allow: ["/", "/your-new-page"],
    disallow: ["/admin/*", "/account/*", "/your-private-page"],
  },
],
```

## Testing SEO

### Verify Metadata
1. Use browser dev tools to inspect `<head>` section
2. Check for:
   - `<title>` tag
   - `<meta name="description">`
   - `<link rel="canonical">`
   - OG tags (`<meta property="og:*">`)
   - Twitter tags (`<meta name="twitter:*">`)
   - Robots meta tag (`<meta name="robots">`)

### Verify Robots.txt
1. Visit `https://parenthelper.co.uk/robots.txt`
2. Verify allowed/disallowed paths match expectations
3. Check sitemap URL is correct

### Tools
- Google Search Console - Monitor indexing status
- Google Rich Results Test - Test structured data
- Facebook Sharing Debugger - Test OG tags
- Twitter Card Validator - Test Twitter cards

## Notes

- All account pages should have `robots: { index: false, follow: false }`
- All admin pages should have `robots: "noindex, nofollow"`
- Public pages should explicitly set `robots: { index: true, follow: true }`
- Canonical URLs should always be absolute URLs (not relative)
- OG and Twitter images should be absolute URLs
- Base URL is pulled from environment variables with fallback

