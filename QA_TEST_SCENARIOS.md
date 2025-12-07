# QA Test Scenarios - Pre-Release Checklist

Manual test scenarios for key features before production release.

---

## 🔍 Search

### Test Case 1: Basic Location Search
- **Starting URL**: `http://localhost:3000/` or production homepage
- **Steps**:
  1. Enter a town/postcode in the search bar (e.g., "London" or "SW1A 1AA")
  2. Click "Explore classes" or press Enter
  3. Verify results page loads
- **Expected Outcome**: 
  - Redirects to `/search?town=London` (or equivalent)
  - Results list displays classes matching the location
  - Map shows markers for results (if map enabled)
  - Results count is displayed

### Test Case 2: Search with Category Filter
- **Starting URL**: `http://localhost:3000/search?town=Manchester`
- **Steps**:
  1. Click on a category chip (e.g., "Music", "Swimming", "Dance")
  2. Verify URL updates with category parameter
  3. Verify results filter to show only that category
- **Expected Outcome**:
  - URL includes `&category=music` (or equivalent)
  - Results list shows only classes in selected category
  - Category chip appears selected/highlighted
  - Results count updates accordingly

### Test Case 3: Search with Age Range Filter
- **Starting URL**: `http://localhost:3000/search?town=Birmingham`
- **Steps**:
  1. Select an age range from dropdown (e.g., "0-12 months", "1-2 years")
  2. Verify results update
  3. Click on a result card
- **Expected Outcome**:
  - URL includes `&age=0-12` (or equivalent)
  - Results show only classes suitable for selected age range
  - Class detail page shows age appropriateness matches filter
  - Age filter persists when navigating back

### Test Case 4: Search with Multiple Filters
- **Starting URL**: `http://localhost:3000/search`
- **Steps**:
  1. Enter location: "Brighton"
  2. Select category: "Yoga"
  3. Select age: "2-3 years"
  4. Verify combined results
- **Expected Outcome**:
  - URL contains all filter parameters: `?town=Brighton&category=yoga&age=24-36`
  - Results match all criteria (location + category + age)
  - No results message appears if no matches found
  - Filters can be cleared individually

### Test Case 5: Empty Search Handling
- **Starting URL**: `http://localhost:3000/search`
- **Steps**:
  1. Navigate to search page without parameters
  2. Enter invalid location (e.g., "XYZ123")
  3. Submit search
- **Expected Outcome**:
  - Shows helpful message: "No classes found" or "Try a different location"
  - Suggests popular locations or categories
  - Map shows default center (Winchester, UK) if no results
  - No errors or crashes

### Test Case 6: Search Results Pagination/Infinite Scroll
- **Starting URL**: `http://localhost:3000/search?town=London`
- **Steps**:
  1. Scroll down results list
  2. Verify more results load (if pagination/infinite scroll implemented)
  3. Click on result from second page/batch
- **Expected Outcome**:
  - Additional results load smoothly
  - No duplicate results
  - Loading indicator appears during fetch
  - Can navigate to class detail page from any result

### Test Case 7: Save Search Functionality
- **Starting URL**: `http://localhost:3000/search?q=music&town=London&age=0-12`
- **Steps**:
  1. Click "Save this search" button
  2. If not signed in, verify modal appears
  3. Enter email and request magic link
  4. Complete sign-in flow
  5. Verify search is saved
- **Expected Outcome**:
  - Modal prompts for sign-in if not authenticated
  - Magic link email sent successfully
  - After sign-in, search is saved to account
  - Alert created for weekly digest
  - Success message displayed

---

## 🗺️ Map + Clusters

### Test Case 1: Map Loads with Results
- **Starting URL**: `http://localhost:3000/search?town=Manchester`
- **Steps**:
  1. Verify map component renders
  2. Check markers appear for each result
  3. Verify map centers on search location
- **Expected Outcome**:
  - Map displays without errors
  - Markers visible for all results (or clusters if >5 markers)
  - Map center matches search location coordinates
  - Map is interactive (can pan/zoom)

### Test Case 2: Cluster Formation
- **Starting URL**: `http://localhost:3000/search?town=London`
- **Steps**:
  1. Zoom out to show many results
  2. Verify clusters form when markers are close together
  3. Click on a cluster
- **Expected Outcome**:
  - Clusters appear when multiple markers overlap
  - Cluster shows count of markers (e.g., "15")
  - Clicking cluster zooms in or expands cluster
  - Cluster styling matches brand colors (sage green)

### Test Case 3: Marker Click Interaction
- **Starting URL**: `http://localhost:3000/search?town=Birmingham`
- **Steps**:
  1. Click on a map marker
  2. Verify popup/tooltip appears
  3. Click "View details" or class name in popup
- **Expected Outcome**:
  - Popup shows class name, venue, distance
  - Popup has link to class detail page
  - Clicking link navigates to class page
  - Popup closes when clicking outside or another marker

### Test Case 4: Map Syncs with List View
- **Starting URL**: `http://localhost:3000/search?town=Edinburgh`
- **Steps**:
  1. Click on a result in the list
  2. Verify corresponding marker highlights on map
  3. Scroll through list and verify map updates
- **Expected Outcome**:
  - Selected result highlights on map
  - Map pans to show selected marker if off-screen
  - Marker popup opens when result selected
  - Smooth animation between selections

### Test Case 5: Map Performance with Many Results
- **Starting URL**: `http://localhost:3000/search?town=London&category=music`
- **Steps**:
  1. Verify map loads quickly with 50+ results
  2. Pan and zoom map
  3. Verify no lag or freezing
- **Expected Outcome**:
  - Map renders within 2 seconds
  - Clustering reduces visible markers for performance
  - Smooth pan/zoom interactions
  - No console errors or memory leaks

### Test Case 6: Mobile Map Responsiveness
- **Starting URL**: `http://localhost:3000/search?town=Glasgow` (mobile viewport)
- **Steps**:
  1. Open on mobile device or browser dev tools mobile view
  2. Verify map displays correctly
  3. Test touch interactions (pinch zoom, pan)
- **Expected Outcome**:
  - Map fits mobile screen
  - Touch interactions work smoothly
  - Clusters are touch-friendly (adequate size)
  - Map doesn't interfere with list view on mobile

### Test Case 7: Map Fallback for No Results
- **Starting URL**: `http://localhost:3000/search?town=InvalidLocation123`
- **Steps**:
  1. Perform search with no results
  2. Verify map behavior
- **Expected Outcome**:
  - Map shows default center (Winchester, UK)
  - No markers displayed
  - Map remains functional (can still pan/zoom)
  - Helpful message shown: "No classes found in this area"

---

## ✍️ Blog AI Editor

### Test Case 1: Access Admin Blog Editor
- **Starting URL**: `http://localhost:3000/admin/blogs`
- **Steps**:
  1. Enter admin secret if prompted
  2. Verify blog list/dashboard loads
  3. Click "Create New" or edit existing post
- **Expected Outcome**:
  - Admin gate requires correct secret
  - Blog list shows existing posts
  - Editor drawer/modal opens
  - Form fields are editable

### Test Case 2: Generate AI Blog Post
- **Starting URL**: `http://localhost:3000/admin/blogs`
- **Steps**:
  1. Click "Generate with AI" or similar button
  2. Enter topic/prompt (e.g., "Benefits of baby swimming classes")
  3. Select category and location if applicable
  4. Click "Generate"
  5. Wait for AI draft
- **Expected Outcome**:
  - Loading indicator appears
  - AI generates draft within 30-60 seconds
  - Draft appears in editor with title, excerpt, content
  - Content is relevant and well-formatted
  - Can edit generated content

### Test Case 3: Edit Blog Post Metadata
- **Starting URL**: `http://localhost:3000/admin/blogs` (with post open in editor)
- **Steps**:
  1. Edit title field
  2. Edit excerpt
  3. Update SEO title and description
  4. Add tags
  5. Save changes
- **Expected Outcome**:
  - All fields save correctly
  - Slug auto-generates from title
  - SEO fields update
  - Changes persist after refresh
  - No validation errors for valid inputs

### Test Case 4: Publish Blog Post
- **Starting URL**: `http://localhost:3000/admin/blogs` (with draft post)
- **Steps**:
  1. Complete all required fields
  2. Click "Publish" or "Approve"
  3. Verify post appears on blog index
  4. Navigate to published post URL
- **Expected Outcome**:
  - Post status changes to "published"
  - Post appears at `/blog/[slug]`
  - Post shows in blog index page
  - SEO metadata renders correctly
  - Post is shareable and accessible

### Test Case 5: Delete Blog Post
- **Starting URL**: `http://localhost:3000/admin/blogs`
- **Steps**:
  1. Open existing post in editor
  2. Click "Delete" button
  3. Confirm deletion
  4. Verify post removed
- **Expected Outcome**:
  - Confirmation dialog appears
  - Post deleted from database
  - Post removed from admin list
  - Post URL returns 404
  - No errors in console

### Test Case 6: Blog Post Image Upload
- **Starting URL**: `http://localhost:3000/admin/blogs` (with post in editor)
- **Steps**:
  1. Click "Upload Hero Image" or paste image URL
  2. Enter image URL or upload file
  3. Verify image preview
  4. Save post
- **Expected Outcome**:
  - Image URL accepted or file uploads successfully
  - Image preview displays correctly
  - Image appears on published post
  - Image is optimized/resized if needed
  - Alt text can be added

### Test Case 7: Blog Post Validation
- **Starting URL**: `http://localhost:3000/admin/blogs` (new post)
- **Steps**:
  1. Try to save with empty title
  2. Try to save with invalid URL in image field
  3. Try to save with very long title (>200 chars)
- **Expected Outcome**:
  - Validation errors appear for invalid inputs
  - Save button disabled until valid
  - Clear error messages shown
  - No crashes or unhandled errors

---

## 🏢 Provider Dashboard

### Test Case 1: Provider Login/Access
- **Starting URL**: `http://localhost:3000/provider/login` or provider dashboard URL
- **Steps**:
  1. Navigate to provider dashboard
  2. Sign in with provider credentials
  3. Verify dashboard loads
- **Expected Outcome**:
  - Login form appears if not authenticated
  - Successful login redirects to dashboard
  - Dashboard shows provider name and stats
  - Navigation menu visible

### Test Case 2: View Provider Classes List
- **Starting URL**: `http://localhost:3000/provider/dashboard` (authenticated)
- **Steps**:
  1. Navigate to "My Classes" or similar section
  2. Verify list of provider's classes displays
  3. Click on a class to view details
- **Expected Outcome**:
  - List shows all classes for this provider
  - Each class shows name, status, views/clicks
  - Can filter/sort classes
  - Clicking class opens edit/view page

### Test Case 3: Edit Class Information
- **Starting URL**: `http://localhost:3000/provider/classes/[id]` (authenticated)
- **Steps**:
  1. Click "Edit" on a class
  2. Update class name, description, or schedule
  3. Save changes
  4. Verify changes appear on public class page
- **Expected Outcome**:
  - Edit form loads with current data
  - Changes save successfully
  - Success message displayed
  - Public class page reflects changes
  - No data loss or corruption

### Test Case 4: View Analytics/Insights
- **Starting URL**: `http://localhost:3000/provider/dashboard` (authenticated)
- **Steps**:
  1. Navigate to "Analytics" or "Insights" section
  2. Verify metrics display (views, clicks, bookings)
  3. Check date range filters work
- **Expected Outcome**:
  - Charts/graphs render correctly
  - Data matches actual activity
  - Date filters update data
  - Export functionality works (if available)
  - No loading errors

### Test Case 5: Manage Bookings
- **Starting URL**: `http://localhost:3000/provider/bookings` (authenticated)
- **Steps**:
  1. View bookings list
  2. Click on a booking to view details
  3. Update booking status (approve/reject)
  4. Send confirmation message
- **Expected Outcome**:
  - Bookings list shows pending/confirmed/cancelled
  - Booking details show parent/child info
  - Status updates save correctly
  - Email notifications sent (if configured)
  - Calendar view works (if available)

### Test Case 6: Upgrade to Featured Listing
- **Starting URL**: `http://localhost:3000/provider/classes/[id]` (authenticated)
- **Steps**:
  1. Click "Upgrade to Featured" or similar CTA
  2. Select plan/pricing option
  3. Complete Stripe checkout
  4. Verify class becomes featured
- **Expected Outcome**:
  - Pricing options display correctly
  - Stripe checkout opens in modal or new tab
  - Payment processes successfully
  - Class status updates to "featured"
  - Featured badge appears on class listing

### Test Case 7: Provider Settings/Profile
- **Starting URL**: `http://localhost:3000/provider/settings` (authenticated)
- **Steps**:
  1. Update provider name or description
  2. Change email or contact info
  3. Update billing information
  4. Save changes
- **Expected Outcome**:
  - Settings form loads current data
  - Changes save successfully
  - Email verification sent if email changed
  - Billing info updates in Stripe
  - Success confirmation displayed

---

## 💰 Wallet

### Test Case 1: View Wallet Balance
- **Starting URL**: `http://localhost:3000/provider/wallet` (authenticated provider)
- **Steps**:
  1. Navigate to wallet page
  2. Verify balance displays
  3. Check transaction history loads
- **Expected Outcome**:
  - Current balance shown correctly
  - Balance matches Stripe account balance
  - Transaction history displays
  - Can filter by date/type
  - No calculation errors

### Test Case 2: View Transaction History
- **Starting URL**: `http://localhost:3000/provider/wallet` (authenticated)
- **Steps**:
  1. Scroll through transaction list
  2. Click on a transaction for details
  3. Verify transaction details accurate
- **Expected Outcome**:
  - Transactions listed chronologically
  - Each transaction shows amount, date, type
  - Transaction details modal/page shows full info
  - Stripe transaction IDs match
  - Fees and net amounts correct

### Test Case 3: Request Payout
- **Starting URL**: `http://localhost:3000/provider/wallet` (with balance > minimum)
- **Steps**:
  1. Click "Request Payout" or "Withdraw"
  2. Enter amount (or use full balance)
  3. Confirm payout request
  4. Verify payout initiated
- **Expected Outcome**:
  - Payout form validates amount (min/max)
  - Confirmation dialog appears
  - Payout request created in Stripe
  - Balance updates (pending payout)
  - Email confirmation sent

### Test Case 4: View Payout Status
- **Starting URL**: `http://localhost:3000/provider/wallet` (with pending payout)
- **Steps**:
  1. Navigate to "Payouts" or "Withdrawals" section
  2. Verify pending payout shows correct status
  3. Check estimated arrival date
- **Expected Outcome**:
  - Payout status accurate (pending/processing/paid)
  - Estimated arrival date displayed
  - Can view payout details
  - Status updates when payout completes

### Test Case 5: Wallet Error Handling
- **Starting URL**: `http://localhost:3000/provider/wallet` (authenticated)
- **Steps**:
  1. Try to request payout with insufficient balance
  2. Try to request payout above available balance
  3. Verify error messages
- **Expected Outcome**:
  - Clear error messages for invalid amounts
  - Payout button disabled when balance too low
  - Validation prevents invalid requests
  - No crashes or unhandled errors

### Test Case 6: Stripe Webhook Integration
- **Starting URL**: N/A (backend test)
- **Steps**:
  1. Simulate Stripe payout webhook event
  2. Verify wallet balance updates
  3. Check transaction history updated
- **Expected Outcome**:
  - Webhook received and processed
  - Balance updates automatically
  - Transaction appears in history
  - Provider notified (email/in-app)

### Test Case 7: Wallet Mobile Responsiveness
- **Starting URL**: `http://localhost:3000/provider/wallet` (mobile viewport)
- **Steps**:
  1. Open wallet on mobile device
  2. Verify layout displays correctly
  3. Test transaction list scrolling
- **Expected Outcome**:
  - Wallet page responsive on mobile
  - Balance clearly visible
  - Transaction list scrollable
  - Buttons touch-friendly
  - No horizontal scrolling

---

## 📅 Booking

### Test Case 1: Initiate Booking Flow
- **Starting URL**: `http://localhost:3000/classes/[class-slug]` (public class page)
- **Steps**:
  1. Click "Book Now" or "Request Booking" button
  2. Verify booking form appears
  3. Fill in parent and child details
- **Expected Outcome**:
  - Booking form/modal opens
  - Form fields: parent name, email, phone, child name, age
  - Date/time selection works
  - Form validates required fields

### Test Case 2: Complete Booking Request
- **Starting URL**: `http://localhost:3000/classes/[class-slug]` (with booking form open)
- **Steps**:
  1. Fill all required fields
  2. Select session date/time
  3. Enter special requirements (optional)
  4. Submit booking request
- **Expected Outcome**:
  - Booking request created successfully
  - Confirmation message displayed
  - Confirmation email sent to parent
  - Provider notified of new booking
  - Booking appears in provider dashboard

### Test Case 3: Booking Payment Flow
- **Starting URL**: `http://localhost:3000/classes/[class-slug]` (paid class)
- **Steps**:
  1. Click "Book Now"
  2. Complete booking form
  3. Proceed to payment
  4. Complete Stripe checkout
- **Expected Outcome**:
  - Payment amount calculated correctly
  - Stripe checkout opens
  - Payment processes successfully
  - Booking confirmed after payment
  - Receipt email sent

### Test Case 4: Provider Approves Booking
- **Starting URL**: `http://localhost:3000/provider/bookings` (authenticated provider)
- **Steps**:
  1. View pending booking
  2. Click "Approve" or "Confirm"
  3. Add optional message
  4. Confirm approval
- **Expected Outcome**:
  - Booking status changes to "confirmed"
  - Parent receives confirmation email
  - Booking appears in provider's confirmed list
  - Calendar updated (if integrated)
  - Commission calculated correctly

### Test Case 5: Provider Rejects Booking
- **Starting URL**: `http://localhost:3000/provider/bookings` (authenticated provider)
- **Steps**:
  1. View pending booking
  2. Click "Reject" or "Decline"
  3. Enter rejection reason
  4. Confirm rejection
- **Expected Outcome**:
  - Booking status changes to "rejected"
  - Parent notified via email
  - Refund processed if payment made
  - Booking removed from active list
  - Provider can add notes

### Test Case 6: View Booking Confirmation
- **Starting URL**: `http://localhost:3000/booking/[confirmation-code]` (after booking)
- **Steps**:
  1. Navigate to confirmation URL (from email)
  2. Verify booking details display
  3. Check cancellation options
- **Expected Outcome**:
  - Booking details shown correctly
  - Confirmation code displayed
  - Date, time, class name accurate
  - "Cancel Booking" option available (if allowed)
  - Contact provider link works

### Test Case 7: Cancel Booking
- **Starting URL**: `http://localhost:3000/booking/[confirmation-code]` (confirmed booking)
- **Steps**:
  1. Click "Cancel Booking"
  2. Confirm cancellation
  3. Verify refund processed (if applicable)
- **Expected Outcome**:
  - Cancellation confirmation dialog
  - Booking status changes to "cancelled"
  - Refund processed within policy timeframe
  - Provider notified
  - Cancellation email sent to parent

---

## 🎯 Onboarding

### Test Case 1: Save Search Triggers Onboarding
- **Starting URL**: `http://localhost:3000/search?q=music&town=London`
- **Steps**:
  1. Click "Save this search" (while not signed in)
  2. Verify modal prompts for email
  3. Enter email and request magic link
  4. Complete magic link sign-in
- **Expected Outcome**:
  - Modal appears when not authenticated
  - Magic link email sent
  - Sign-in redirects to onboarding flow
  - Search params preserved in URL

### Test Case 2: Progressive Profile Creation
- **Starting URL**: `http://localhost:3000/onboarding/child?search=...` (after magic link)
- **Steps**:
  1. Enter household name (optional)
  2. Enter child's name (optional)
  3. Enter child's birthdate (required)
  4. Select interests and allergies (optional)
  5. Submit profile
- **Expected Outcome**:
  - Form validates birthdate is required
  - Profile saves to `family_profiles` and `child_profiles`
  - Welcome email sent
  - Redirects to `/account/alerts?welcome=true`
  - Saved search created automatically

### Test Case 3: Skip Profile Creation
- **Starting URL**: `http://localhost:3000/onboarding/child?search=...` (after magic link)
- **Steps**:
  1. Click "Skip" button
  2. Verify redirect
  3. Check saved search still created
- **Expected Outcome**:
  - Redirects to `/account/alerts`
  - Saved search created even without profile
  - Alert created from saved search
  - No errors or crashes

### Test Case 4: Welcome Email Delivery
- **Starting URL**: N/A (backend verification)
- **Steps**:
  1. Complete onboarding flow
  2. Check email inbox
  3. Verify email content
- **Expected Outcome**:
  - Welcome email received within 1 minute
  - Email includes personalized greeting
  - Links to explore classes work
  - Unsubscribe link present
  - Email renders correctly in major clients

### Test Case 5: Onboarding Redirects Existing Users
- **Starting URL**: `http://localhost:3000/onboarding/child` (signed in with existing profile)
- **Steps**:
  1. Navigate to onboarding page
  2. Verify redirect behavior
- **Expected Outcome**:
  - Redirects to `/account/alerts` if profile exists
  - No duplicate profile creation
  - Existing profile data preserved

### Test Case 6: Onboarding Form Validation
- **Starting URL**: `http://localhost:3000/onboarding/child` (after sign-in)
- **Steps**:
  1. Try to submit without birthdate
  2. Enter future birthdate
  3. Enter very old birthdate (>18 years)
  4. Verify validation messages
- **Expected Outcome**:
  - Clear error messages for invalid inputs
  - Submit button disabled until valid
  - Birthdate validates as past date
  - Age calculation correct

### Test Case 7: Onboarding Mobile Experience
- **Starting URL**: `http://localhost:3000/onboarding/child` (mobile viewport)
- **Steps**:
  1. Open onboarding on mobile device
  2. Complete form on mobile
  3. Verify all interactions work
- **Expected Outcome**:
  - Form displays correctly on mobile
  - Date picker works on touch devices
  - Interest/allergy chips touch-friendly
  - Submit button accessible
  - No horizontal scrolling

---

## ✅ General Cross-Feature Tests

### Test Case 1: Authentication Persistence
- **Starting URL**: Any authenticated page
- **Steps**:
  1. Sign in
  2. Close browser tab
  3. Reopen and navigate to authenticated page
- **Expected Outcome**:
  - Session persists across tabs
  - No forced re-login
  - User data loads correctly

### Test Case 2: Error Handling
- **Starting URL**: Various pages
- **Steps**:
  1. Trigger various error conditions (network failure, invalid data, etc.)
  2. Verify error messages display
- **Expected Outcome**:
  - User-friendly error messages
  - No unhandled errors in console
  - Graceful degradation
  - Retry options where appropriate

### Test Case 3: Mobile Responsiveness
- **Starting URL**: All major pages
- **Steps**:
  1. Test on mobile viewport (375px width)
  2. Verify layouts adapt correctly
- **Expected Outcome**:
  - No horizontal scrolling
  - Touch targets adequate size (44px min)
  - Text readable without zooming
  - Navigation works on mobile

---

## 📝 Notes

- Test on Chrome, Firefox, Safari, and Edge browsers
- Test on iOS Safari and Android Chrome
- Verify all external integrations (Stripe, SendGrid) work in test mode
- Check console for errors/warnings during all tests
- Verify analytics events fire correctly (if applicable)
- Test with slow 3G network throttling
- Verify accessibility (keyboard navigation, screen readers)

