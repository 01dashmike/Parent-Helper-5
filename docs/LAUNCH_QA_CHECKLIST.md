# Launch QA Checklist

**Last Updated:** 2024-12-19  
**Version:** 1.0

---

## 1. User Signup & Login

- [ ] Email signup creates account, verification sent
- [ ] Password requirements enforced, duplicate email prevented
- [ ] Login works, invalid credentials show error
- [ ] Forgot password flow works, reset email sent
- [ ] Session persists, logout clears session
- [ ] Protected routes redirect unauthenticated users
- [ ] Guest users can browse but not book

---

## 2. Booking Flow

**Card Payment:** Stripe checkout works, payment creates `simple_bookings`, confirmation/provider emails sent, booking appears in account

**Wallet Payment:** Balance displayed, "Pay with Wallet" shown when sufficient, debits correctly, `payment_method: 'wallet'` set, insufficient balance disables option

**Rewards & Coupons:** Reward selector works, coupon applies discount, discount in Stripe checkout, reward marked redeemed, expired rewards not selectable

**Referrals:** Referral code applies at checkout, referrer/referred user receive rewards, tracking records created

---

## 3. Provider Flows

**Onboarding:** Step 1 creates provider account, Step 2 marks complete after first class, Step 3 photo upload optional, Step 4 referral link displays, onboarding reward awarded, redirects to dashboard, banner hidden

**Class Management:** Form validates, draft saves (`is_published = false`), publishing sets `is_published = true`, appears in search, edit/delete work

**Photo Upload:** Accepts jpg/png/webp, size limits enforced, progress indicator, displays after upload, multiple images, deletion works

**Review Responses:** Provider can respond, displays on class page, character limit enforced, edit/delete work

---

## 4. Search

**Filters:** Category, age range, price, day of week, time filters work, multiple filters combine (AND logic), clear resets all

**Geo Search:** Location search (postcode/town) works, distance filter works, map view displays classes, markers cluster, clicking shows details, bounds update

**Empty States:** No results message helpful, suggests adjusting filters, "Reset filters" works, empty state for new users

---

## 5. Wallet

**Top-up:** "Add Funds" button visible, modal/form displays, amount validation, Stripe payment link (if implemented)

**Family Sharing:** Shared balance displays, members view transactions, owner invites members, invite email/link work, member accepts

**Payment:** Sufficient balance allows payment, debits correctly, transaction record created, balance updates immediately

**Refund:** Cancelled booking refunds wallet, refund transaction created, balance increases, idempotency prevents double-refund

**Cash-out:** Owner-only button visible, modal displays, amount validation, request creates transaction, status "pending"

---

## 6. Rewards

**Milestone:** First booking reward awarded, email sent, appears in account, expiry date set

**Referral:** Referrer reward when referred user books, referred user welcome reward, values correct, emails sent

**Onboarding:** Provider onboarding reward awarded, appears in dashboard, banner displays once, expiry tracked

**Expiry:** Expired rewards not selectable, warning shown, removed from list, cron job runs correctly

---

## 7. Email Deliverability

**Booking:** Confirmation sent to customer, provider notification sent, templates render, links work, logs recorded

**Referral:** Invite email sent, conversion email sent, reward notification sent, links work

**Rewards:** Earned email sent, expiry warning sent, content accurate

**Wallet:** Credit/debit notifications sent, cash-out confirmation sent

---

## 8. Calendar Sync

**iCal Export:** Export link generates, file downloads, events display in apps, recurring events handled, updates sync

**Google Calendar:** "Add to Google Calendar" button works, details populate, timezone handled

---

## 9. SEO

**Metadata:** Page titles unique/descriptive, meta descriptions present, Open Graph/Twitter Card tags, canonical URLs set

**Sitemap:** `/sitemap.xml` accessible, all public pages included, last modified dates accurate, priority/changefreq set

**Robots.txt:** `/robots.txt` accessible, disallows admin/private routes, allows public pages, sitemap reference present

**Structured Data:** JSON-LD schema on class pages, Organization schema on homepage, Breadcrumb schema, validates in Google Rich Results Test

---

## 10. Accessibility

**Keyboard Navigation:** All interactive elements accessible, tab order logical, focus indicators visible, skip links present

**Screen Readers:** ARIA labels on elements, form labels associated, error messages announced, landmark regions used

**Visual:** Color contrast WCAG AA, text resizable, images have alt text, focus states visible

**Forms:** Required fields marked, error messages clear, validation accessible, success messages announced

---

## 11. Admin

**Payments Dashboard:** Reconciliation accurate, Stripe charges match database, wallet payments excluded, refunded bookings show, provider payouts calculated

**Insights Dashboard:** New users/bookings count accurate (30 days), referral conversion rate, rewards issued/redeemed tracked, provider growth metrics, charts render

**Audit:** Activity logs record key events, admin/user actions logged, logs searchable

---

## 12. Security Checks

**RLS:** Users access only own data, providers access only own classes, admin routes protected, public data accessible

**Admin Authentication:** Admin routes require `ph_admin` cookie, invalid secret rejected, admin gate works, returns 401/403 when unauthorized

**Feature Flags:** `FAMILY_WALLET_ENABLED`/`FEATURE_BOOKINGS` control features, disabled features return 503/404, flags checked consistently

**Input Validation:** SQL injection prevented (parameterized queries), XSS prevented (sanitized), CSRF protection, file upload validation

**API Security:** Rate limiting on public APIs, auth required for protected endpoints, CORS configured, sensitive data not exposed

---

## Quick Smoke Tests

**Critical Paths:** User signup → Login → Browse → Book → Payment → Confirmation | Provider signup → Onboarding → Create class → Publish → View in search | Search → Filter → View class → Book → Wallet payment | Referral link → Signup → Book → Rewards awarded

**Browser Compatibility:** Chrome/Firefox/Safari/Edge (latest), Mobile Safari (iOS), Chrome Mobile (Android)

**Performance:** Page load < 3s on 3G, images lazy load, API responses < 500ms, no console errors

---

**Notes:**
- Test with real Stripe test cards: `4242 4242 4242 4242`
- Use test email addresses for email testing
- Verify all feature flags set correctly in environment
- Check error logging for unexpected errors

