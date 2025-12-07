# Release Checklist

## Pre-Release Commands

### 1. Linting
```bash
npm run lint
```
- **Expected**: No linting errors
- **Action if fails**: Run `npm run fix:errors` to auto-fix where possible, manually fix remaining issues

### 2. Type Checking
```bash
npm run typecheck
```
- **Expected**: No TypeScript errors
- **Action if fails**: Fix type errors before proceeding

### 3. Build
```bash
npm run build
```
- **Expected**: Successful production build without errors
- **Action if fails**: Review build errors, check for missing dependencies or configuration issues
- **Note**: This runs `migration:verify` and `check:server-actions` as pre-build hooks

### 4. Tests

#### Unit Tests
```bash
npm run test:unit
```
- **Expected**: All unit tests pass
- **Action if fails**: Fix failing tests or update test expectations

#### End-to-End Tests
```bash
npm run test:e2e
```
- **Expected**: All E2E tests pass
- **Action if fails**: Review test failures, check for environment or data issues

#### Full Test Suite (Optional but Recommended)
```bash
npm run test:full
```
- **Expected**: All unit and E2E tests pass
- **Action if fails**: Address all test failures

#### CI Test Suite (Production Build + Tests)
```bash
npm run test:ci
```
- **Expected**: Build succeeds and all tests pass
- **Action if fails**: This is the most comprehensive check - fix all issues before release

---

## Manual Sanity Checks

### Search Flow
**Routes**: `/search`, `/classes/[id]`, `/classes/[id]/[town]`

- [ ] **Basic Search**
  - [ ] Search by location (postcode/town) returns relevant results
  - [ ] Search results display correctly with class cards
  - [ ] Map view shows markers for search results
  - [ ] Filters (category, age range, price) work correctly
  - [ ] Filter combinations work as expected

- [ ] **Search Results**
  - [ ] Pagination works (if applicable)
  - [ ] Sorting options function correctly
  - [ ] Class detail pages load with all information
  - [ ] Images load correctly
  - [ ] Contact information displays properly

- [ ] **Location Features**
  - [ ] Location detection works
  - [ ] Distance calculations are accurate
  - [ ] "Near me" functionality works

---

### Booking Flow
**Routes**: `/book/*`, `/booking/*`, `/book/checkout`, `/book/thank-you`

- [ ] **Booking Request Creation**
  - [ ] Can initiate booking from class detail page
  - [ ] Booking form validates required fields
  - [ ] Parent/child information is captured correctly
  - [ ] Session selection works (if applicable)
  - [ ] Special requirements field accepts input

- [ ] **Checkout Process**
  - [ ] Booking summary displays correct information
  - [ ] Price calculations are accurate
  - [ ] Stripe payment integration works (test mode)
  - [ ] Payment form validates card details
  - [ ] Error handling for failed payments works

- [ ] **Post-Booking**
  - [ ] Confirmation page displays after successful booking
  - [ ] Confirmation email is sent (check SendGrid)
  - [ ] Booking appears in user's account/bookings
  - [ ] Provider receives booking notification
  - [ ] Booking status updates correctly

- [ ] **Wallet Integration** (if `FAMILY_WALLET_ENABLED=true`)
  - [ ] Can use wallet credits for booking
  - [ ] Wallet balance updates after booking
  - [ ] Partial wallet + payment works correctly

---

### Wallet Flow
**Routes**: `/account/wallet`, `/api/wallet/*`

**Note**: Only test if `FAMILY_WALLET_ENABLED` or `NEXT_PUBLIC_FAMILY_WALLET_ENABLED` is set to `"true"`

- [ ] **Wallet Dashboard**
  - [ ] Wallet balance displays correctly
  - [ ] Transaction history loads
  - [ ] Credit/debit transactions show properly

- [ ] **Add Funds**
  - [ ] Add funds modal opens
  - [ ] Stripe payment for adding funds works
  - [ ] Balance updates after adding funds
  - [ ] Transaction appears in history

- [ ] **Family Wallet Features**
  - [ ] Can invite family members
  - [ ] Invite link works correctly
  - [ ] Family members can accept invites
  - [ ] Shared balance displays correctly
  - [ ] Can gift credits to family members
  - [ ] Transfer credits between family members works

- [ ] **Cash Out** (if applicable)
  - [ ] Cash out modal opens
  - [ ] Cash out process completes
  - [ ] Balance updates correctly

- [ ] **Wallet in Booking Flow**
  - [ ] Wallet option appears during checkout
  - [ ] Can apply wallet credits to booking
  - [ ] Partial payment with wallet works

---

### Provider Dashboard
**Routes**: `/provider/(console)/*`, `/provider/onboarding`

- [ ] **Provider Login/Access**
  - [ ] Provider can log in
  - [ ] Provider dashboard loads
  - [ ] Only authorized providers can access their dashboard

- [ ] **Class Management**
  - [ ] Can view list of provider's classes
  - [ ] Can add new class
  - [ ] Can edit existing class
  - [ ] Can delete/deactivate class
  - [ ] Class images upload correctly
  - [ ] Scheduling information saves correctly

- [ ] **Booking Management**
  - [ ] Can view incoming booking requests
  - [ ] Can approve/reject bookings
  - [ ] Booking status updates correctly
  - [ ] Can respond to booking inquiries

- [ ] **Analytics** (if `PROVIDER_ANALYTICS_ENABLED=true`)
  - [ ] Analytics dashboard loads
  - [ ] Metrics display correctly
  - [ ] Charts render properly
  - [ ] Date range filters work

- [ ] **Provider Onboarding**
  - [ ] New provider onboarding flow works
  - [ ] Can complete all onboarding steps
  - [ ] Provider account is created correctly
  - [ ] Stripe subscription setup works (if applicable)

- [ ] **Provider Settings**
  - [ ] Can update provider profile
  - [ ] Contact information saves
  - [ ] Payment settings work
  - [ ] Subscription management works

---

### Onboarding Flow
**Routes**: `/onboarding`, `/onboarding/child`, `/onboarding/premium`

- [ ] **User Onboarding**
  - [ ] New user signup works
  - [ ] Onboarding steps progress correctly
  - [ ] Can add child information
  - [ ] Age preferences save correctly
  - [ ] Location preferences save correctly
  - [ ] Onboarding completion redirects correctly

- [ ] **Child Information**
  - [ ] Can add multiple children
  - [ ] Age ranges are validated
  - [ ] Child information displays in account
  - [ ] Can edit/delete child information

- [ ] **Premium Onboarding** (if applicable)
  - [ ] Premium signup flow works
  - [ ] Payment processing works
  - [ ] Premium features activate after signup

- [ ] **Provider Onboarding**
  - [ ] Provider signup form works
  - [ ] "List Your Class" form submits correctly
  - [ ] Provider receives confirmation
  - [ ] Provider onboarding steps complete

---

### Blog AI Editor
**Routes**: `/admin/blogs`, `/api/blog/generate`, `/api/blog/admin`

**Note**: Requires admin access (check `ADMIN_SECRET`)

- [ ] **Admin Access**
  - [ ] Admin blog page loads with authentication
  - [ ] Unauthorized users cannot access
  - [ ] Admin cookie/session works

- [ ] **Blog Post Generation**
  - [ ] Can generate new blog post from topic
  - [ ] AI generation completes successfully
  - [ ] Generated content displays in editor
  - [ ] Markdown renders correctly
  - [ ] Images are included (if applicable)

- [ ] **Blog Post Editing**
  - [ ] Can edit generated posts
  - [ ] Title, excerpt, category can be updated
  - [ ] SEO fields (title, description) save correctly
  - [ ] Tags can be added/removed
  - [ ] Hero image can be set
  - [ ] Locality/postcode prefix can be set

- [ ] **Blog Post Publishing**
  - [ ] Can publish posts
  - [ ] Published posts appear on `/blog` page
  - [ ] Post detail pages (`/blog/[slug]`) load correctly
  - [ ] SEO metadata is correct
  - [ ] Schema.org JSON-LD is generated

- [ ] **Blog Post Management**
  - [ ] Can delete posts
  - [ ] Can update post status (draft/published)
  - [ ] Post list displays all posts correctly
  - [ ] Filtering/sorting works (if applicable)

- [ ] **Blog Index Page**
  - [ ] `/blog` page displays published posts
  - [ ] Pagination works (if applicable)
  - [ ] Post previews display correctly
  - [ ] Categories/tags filter correctly

---

## Known Issues (Acceptable for Release)

### Map Clustering
- **Issue**: Map marker clustering is currently disabled due to React 19 compatibility
- **Status**: Acceptable - simple markers are displayed instead
- **Future Fix**: Will reintroduce clustering once React 19-compatible option is available

### Feature Flags
- **Note**: Several features are behind feature flags. Ensure appropriate flags are set in production:
  - `FAMILY_WALLET_ENABLED` - Wallet features
  - `PROVIDER_ANALYTICS_ENABLED` - Provider analytics
  - `BULK_SCHEDULING_ENABLED` - Bulk scheduling
  - `GROWTH_AUTOMATION_DASHBOARD_ENABLED` - Growth automation
  - `PROVIDER_PAYOUTS_ENABLED` - Provider payouts
  - `PERSONALIZATION_ENABLED` - AI personalization
  - `NEWSLETTER_ENABLED` - Newsletter features

### Environment Variables
- **Note**: Ensure all required environment variables are set in production:
  - Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
  - Stripe keys (`STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
  - SendGrid (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`)
  - OpenAI (`OPENAI_API_KEY`) - for blog AI editor
  - Admin secret (`ADMIN_SECRET`) - for admin routes

### Database Migrations
- **Note**: The build process runs `migration:verify` automatically. Ensure all migrations are applied in production before deploying.

---

## Post-Release Verification

After deployment, verify:

- [ ] Production site loads without errors
- [ ] No console errors in browser DevTools
- [ ] Critical user flows work in production
- [ ] Email notifications are being sent (check SendGrid dashboard)
- [ ] Stripe webhooks are receiving events (check Stripe dashboard)
- [ ] Database connections are stable
- [ ] API routes respond correctly
- [ ] Static assets load correctly
- [ ] Images and media files display properly

---

## Rollback Plan

If critical issues are discovered post-release:

1. **Immediate**: Revert to previous deployment version
2. **Database**: Check if any migrations need to be rolled back
3. **Environment**: Verify environment variables are correct
4. **Monitoring**: Check error logs and monitoring dashboards
5. **Communication**: Notify users if service disruption occurred

---

## Notes

- All commands should be run from the project root directory
- Ensure you have the correct Node.js version (check `package.json` engines if specified)
- For production builds, use `npm run railway-build` on Railway or `npm run build` on other platforms
- Test in staging environment that mirrors production before final release
- Consider running `npm run test:quality` for accessibility and performance checks if time permits

