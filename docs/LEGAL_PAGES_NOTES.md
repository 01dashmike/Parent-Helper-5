# Legal Pages Documentation

This document summarizes the legal pages implementation, routes, content structure, and SEO configuration.

## Routes

Three legal pages are available at:

- **`/legal/terms`** - Terms of Service
- **`/legal/privacy`** - Privacy Policy  
- **`/legal/cookies`** - Cookie Policy

All pages are server components (SEO-friendly) and use Next.js App Router.

## File Structure

```
app/
  legal/
    terms/
      page.tsx
    privacy/
      page.tsx
    cookies/
      page.tsx
```

## Content Structure

### Terms of Service (`/legal/terms`)

Sections:
1. Introduction
2. Definitions
3. Account
4. Payments
5. Wallet
6. Bookings
7. Providers
8. Liability
9. Governing Law
10. Contact Us

### Privacy Policy (`/legal/privacy`)

Sections:
1. Introduction
2. Definitions
3. Account
4. Payments
5. Wallet
6. Bookings
7. Providers
8. Liability
9. Governing Law (includes data protection rights)
10. Contact Us

### Cookie Policy (`/legal/cookies`)

Sections:
1. Introduction
2. Definitions
3. Cookies (Essential, Analytics, Functional)
4. Tracking
5. Opt-out (Browser Settings, Platform Settings, Third-Party Opt-Outs)
6. Account
7. Payments
8. Governing Law
9. Contact Us

## SEO Configuration

All legal pages include full SEO metadata:

```typescript
export const metadata: Metadata = {
  title: "[Page Title] | Parent Helper",
  description: "[Page description]",
  alternates: {
    canonical: `${baseUrl}/legal/[page]`,
  },
  openGraph: {
    title: "[Page Title] | Parent Helper",
    description: "[Page description]",
    url: `${baseUrl}/legal/[page]`,
    siteName: "Parent Helper",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "[Page Title] | Parent Helper",
    description: "[Page description]",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### SEO Rules

- **Indexable**: All legal pages are set to `robots: { index: true, follow: true }`
- **Canonical URLs**: Absolute URLs using `baseUrl` environment variable
- **OG Tags**: Full Open Graph tags for social sharing
- **Twitter Cards**: Summary cards for Twitter sharing
- **Base URL**: Uses `NEXT_PUBLIC_APP_URL` or `APP_URL` env var, defaults to `https://parenthelper.co.uk`

## Layout & Styling

All pages use a simple, clean layout:

- **Container**: `max-w-4xl` centered container
- **Background**: `bg-cream` (consistent with site theme)
- **Typography**: 
  - H1: `text-4xl font-bold`
  - H2: `text-2xl font-semibold`
  - H3: `text-xl font-semibold`
  - Body: `prose prose-lg` with Tailwind Typography
- **Spacing**: Consistent `space-y-8` between sections
- **Lists**: Standard bullet lists with `list-disc pl-6`

No fancy components or animations - just clean, readable legal text.

## Footer Integration

Legal pages are linked in the Footer component (`components/Footer.tsx`):

- Added "Legal" section in footer grid
- Links to all three legal pages
- Also included in footer bottom bar alongside copyright

Footer structure:
```tsx
<div className="space-y-2">
  <h3>Legal</h3>
  <ul>
    <li><Link href="/legal/terms">Terms of Service</Link></li>
    <li><Link href="/legal/privacy">Privacy Policy</Link></li>
    <li><Link href="/legal/cookies">Cookie Policy</Link></li>
  </ul>
</div>
```

## How to Update Content

### Editing Page Content

1. **Navigate to the page file**: `app/legal/[page]/page.tsx`
2. **Update sections**: Edit the JSX content within each `<section>` tag
3. **Update last modified date**: The date is dynamically generated, but you can add a static date if preferred
4. **Update contact information**: Replace placeholder email addresses and addresses in the "Contact Us" section

### Adding New Sections

To add a new section to any legal page:

```tsx
<section>
  <h2 className="mt-8 text-2xl font-semibold text-charcoal">X. Section Title</h2>
  <p>
    Section content here.
  </p>
  <ul className="list-disc pl-6 space-y-2">
    <li>List item</li>
  </ul>
</section>
```

### Updating Metadata

To update SEO metadata for a page:

1. Edit the `metadata` export at the top of the page file
2. Update `title` and `description` fields
3. Ensure `canonical` URL matches the page route
4. Update OG and Twitter tags to match

### Updating Contact Information

All pages have a "Contact Us" section at the bottom. Update:
- Email addresses (e.g., `legal@parenthelper.co.uk`, `privacy@parenthelper.co.uk`)
- Business address placeholder
- Add Data Protection Officer contact if needed

## Content Guidelines

### Placeholder Content

Current content is placeholder text that should be reviewed and updated by legal counsel. Key areas to customize:

1. **Business Information**: Replace placeholder addresses and contact details
2. **Service-Specific Terms**: Update terms to match actual platform features
3. **Payment Terms**: Customize based on actual payment processing setup
4. **Data Processing**: Update privacy policy to reflect actual data collection practices
5. **Cookie Usage**: Update cookie policy to match actual cookie implementation
6. **Governing Law**: Verify jurisdiction and legal framework

### Legal Review Required

⚠️ **Important**: All legal page content should be reviewed by qualified legal counsel before going live. The current content is placeholder text and may not be legally compliant.

### Content Updates Checklist

When updating legal pages:

- [ ] Review all sections for accuracy
- [ ] Update contact information
- [ ] Verify legal jurisdiction and governing law
- [ ] Ensure compliance with UK GDPR and Data Protection Act 2018
- [ ] Update last modified date
- [ ] Have content reviewed by legal counsel
- [ ] Test all links and formatting
- [ ] Verify SEO metadata is correct

## Testing

### Verify Pages Load

1. Visit `/legal/terms`
2. Visit `/legal/privacy`
3. Visit `/legal/cookies`

### Verify SEO Metadata

1. View page source and check for:
   - `<title>` tag
   - `<meta name="description">`
   - `<link rel="canonical">`
   - OG tags (`<meta property="og:*">`)
   - Twitter tags (`<meta name="twitter:*">`)
   - Robots meta tag

### Verify Footer Links

1. Scroll to footer on any page
2. Check "Legal" section appears
3. Verify all three links work correctly
4. Check footer bottom bar also has links

### Tools

- Google Search Console - Monitor indexing
- Facebook Sharing Debugger - Test OG tags
- Twitter Card Validator - Test Twitter cards
- Browser DevTools - Inspect metadata in `<head>`

## Robots.txt

Legal pages are automatically included in `app/robots.ts` as they are public pages. No special configuration needed - they inherit the default "allow" rules.

## Notes

- All pages use server components for optimal SEO
- Content is currently placeholder text - requires legal review
- Pages follow consistent structure and styling
- Footer integration provides easy access from any page
- SEO metadata is comprehensive and follows best practices
- Base URL is configurable via environment variables

