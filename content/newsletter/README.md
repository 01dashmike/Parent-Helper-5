# Newsletter Email Templates & Web Copy

This directory contains all email templates and web copy for the personalised family newsletter launch.

## Files

### Email Templates

1. **signup-confirmation-email.html** – Welcome email sent immediately after signup
2. **signup-confirmation-email.txt** – Plain text version of welcome email
3. **weekly-intro-email.html** – Template for weekly newsletter emails
4. **progressive-profiling-prompt.html** – Email prompting users to complete their profile

### Web Copy

5. **in-app-messaging.md** – All in-app messaging for newsletter feature
6. **website-banner-copy.md** – Banner copy for various pages
7. **landing-page-variant-a.md** – Benefit-focused landing page
8. **landing-page-variant-b.md** – Problem-solution focused landing page
9. **landing-page-variant-c.md** – Social proof & urgency focused landing page

## Template Variables

All templates use the following variable placeholders:

- `{{firstName}}` – User's first name
- `{{location}}` – User's location/town
- `{{postcode}}` – User's postcode
- `{{ageGroup}}` – Children's age group (e.g., "toddler", "preschool")
- `{{classCount}}` – Number of classes found
- `{{category}}` – Class category
- `{{profileLink}}` – Link to profile completion page
- `{{privacyLink}}` – Link to privacy policy
- `{{unsubscribeLink}}` – Link to unsubscribe
- `{{preferencesLink}}` – Link to preferences page
- `{{classLink}}` – Link to specific class
- `{{browseLink}}` – Link to browse all classes
- `{{savedSearchesLink}}` – Link to saved searches
- `{{upcomingBookingsLink}}` – Link to bookings
- `{{localTip}}` – Local tip content
- `{{featuredClasses}}` – Array of featured class objects

## Implementation Notes

### Email Templates

- All HTML emails are mobile-responsive
- Plain text versions included for email clients that don't support HTML
- Privacy messaging included in all emails (GDPR-compliant)
- Unsubscribe links required in all emails

### Landing Pages

- Three variants for A/B testing
- Variant A: Benefit-focused (best for awareness stage)
- Variant B: Problem-solution (best for consideration stage)
- Variant C: Social proof (best for conversion stage)

### Tone Guidelines

- **Helpful** – Focus on solving problems, not selling
- **Practical** – Clear, actionable language
- **Family-focused** – Use "your children", "your family", not generic terms
- **Personalised** – Reference location and child-specific details
- **Trustworthy** – Clear privacy messaging, no pressure tactics

## Next Steps

1. Integrate templates into email service (SendGrid)
2. Set up A/B testing for landing page variants
3. Create progressive profiling form component
4. Implement in-app messaging components
5. Set up analytics tracking for conversions
6. Test email rendering across email clients
7. Set up automated email sequences

## Testing Checklist

- [ ] Test all email templates in major email clients (Gmail, Outlook, Apple Mail)
- [ ] Verify all links work correctly
- [ ] Check mobile responsiveness
- [ ] Test unsubscribe flow
- [ ] Verify privacy policy links
- [ ] Test progressive profiling form
- [ ] A/B test landing page variants
- [ ] Test signup flow end-to-end
- [ ] Verify GDPR compliance messaging
- [ ] Check accessibility (WCAG AA)

