# AI Tools - QA Checklist

## ✅ Pre-Deployment Testing

### Authentication & Permissions

- [ ] Only authenticated providers can access AI tools
- [ ] Non-providers see "Unauthorized" error
- [ ] Server actions verify provider membership
- [ ] No API keys exposed to client

### Rate Limiting

- [ ] 20 calls per day limit enforced
- [ ] Error message shown when limit reached
- [ ] Limit resets at midnight
- [ ] Premium users have unlimited (when implemented)

### Caching

- [ ] Identical inputs return cached results
- [ ] Cache updates `last_used_at` on access
- [ ] Cache lookup is fast (< 100ms)
- [ ] Cache doesn't return stale data

---

## 🧪 Tool-Specific Tests

### 1. Class Copy Assistant

#### Create from Scratch
- [ ] Generates title, subtitle, description, bullets
- [ ] Respects tone selection (calm/exciting/professional/friendly)
- [ ] Includes age-appropriate safety notes
- [ ] No medical advice in output
- [ ] "Apply" buttons populate form fields correctly

#### Improve Existing Text
- [ ] Improves clarity and engagement
- [ ] Keeps all factual information
- [ ] Shows list of changes made
- [ ] Respects tone selection
- [ ] "Apply" button works

#### Change Tone
- [ ] Uses "Improve" tab with tone selector
- [ ] Output reflects selected tone
- [ ] Original meaning preserved

---

### 2. Schedule Suggestions

- [ ] Suggests 3-5 schedule options
- [ ] Each suggestion includes day, time, duration, reasoning
- [ ] Suggestions based on age range (mornings for babies, etc.)
- [ ] Price range shown as benchmark only (not advice)
- [ ] "Apply" buttons update schedule fields
- [ ] No financial advice in output

---

### 3. SEO Optimiser

- [ ] SEO title ≤ 60 characters
- [ ] SEO H1 ≤ 80 characters
- [ ] Meta description ≤ 160 characters
- [ ] City hooks are location-specific
- [ ] Suggested tags are relevant
- [ ] Improved description is more SEO-friendly
- [ ] Before/after comparison shows differences
- [ ] All "Apply" buttons work

---

### 4. Review Reply Assistant

- [ ] Generates polite, professional replies
- [ ] Respects tone selection (grateful/neutral/professional/apologetic)
- [ ] No medical/legal claims
- [ ] Encourages offline resolution for issues
- [ ] Reply is editable before applying
- [ ] Copy to clipboard works
- [ ] "Apply to Reply" button works

---

### 5. Parent Communication Assistant

- [ ] Generates 3 subject line options
- [ ] Email body is appropriate length (2-3 paragraphs)
- [ ] SMS variant ≤ 160 characters
- [ ] Respects event type (class_update, schedule_change, etc.)
- [ ] Respects tone selection
- [ ] Includes all key points
- [ ] Holiday specials include holiday context
- [ ] All "Use" buttons work

---

### 6. Insight Coach

- [ ] Generates plain-language summary
- [ ] Identifies key changes/trends
- [ ] Provides actionable suggestions
- [ ] Some suggestions blurred for free users
- [ ] "Unlock with Premium Analytics" CTA works
- [ ] Refresh button regenerates insights
- [ ] Time range selector works (week/month)
- [ ] Shows "Generated at" timestamp

---

### 7. Onboarding AI Helpers

#### Step 2: Tagline
- [ ] Button appears under tagline field
- [ ] Generates relevant tagline
- [ ] Populates form field
- [ ] User can edit before saving

#### Step 3: Description
- [ ] Button appears in class template step
- [ ] Generates class description
- [ ] Uses existing wizard data (age, category, style)
- [ ] Populates form field
- [ ] User can edit before saving

#### Step 4: Captions
- [ ] Button appears under photo gallery
- [ ] Generates 3-5 caption suggestions
- [ ] Captions are relevant to photos
- [ ] User can select and use captions

---

## 🔒 Safety Tests

### Medical/Health Claims
- [ ] AI refuses to generate medical advice
- [ ] No health guarantees in output
- [ ] Safety notes are age-appropriate only
- [ ] No promises of specific outcomes

### Discriminatory Content
- [ ] Language is inclusive
- [ ] Body-positive messaging
- [ ] No discriminatory terms
- [ ] Family-friendly throughout

### Legal/Financial
- [ ] No legal claims
- [ ] Price suggestions are benchmarks only
- [ ] No financial advice
- [ ] Encourages offline resolution for issues

---

## 🎨 UI/UX Tests

### Responsive Design
- [ ] Components work on mobile
- [ ] Forms are usable on small screens
- [ ] Buttons are appropriately sized
- [ ] Text is readable

### Loading States
- [ ] Loading spinners show during generation
- [ ] Buttons disabled during loading
- [ ] Error states display clearly
- [ ] Success states show confirmation

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen readers can access content
- [ ] Focus states are visible
- [ ] ARIA labels where needed

---

## 🔄 Integration Tests

### Onboarding Wizard
- [ ] Wizard still works without AI
- [ ] AI buttons don't block manual input
- [ ] Generated text can be edited
- [ ] Wizard can be completed without AI

### Provider Dashboard
- [ ] Dashboard loads with Insight Coach
- [ ] Insights refresh correctly
- [ ] Premium blurring works
- [ ] Links to upgrade work

### Class Management
- [ ] AI tools don't interfere with class editing
- [ ] "Apply" buttons update correct fields
- [ ] Form validation still works
- [ ] Save functionality unaffected

---

## 📊 Performance Tests

### Response Times
- [ ] AI calls complete in < 5 seconds
- [ ] Cache hits return in < 100ms
- [ ] UI updates smoothly
- [ ] No blocking during generation

### Error Handling
- [ ] Network errors handled gracefully
- [ ] API errors show user-friendly messages
- [ ] Rate limit errors are clear
- [ ] Timeout errors handled

### Database
- [ ] Usage events logged correctly
- [ ] Cache entries created/updated
- [ ] Indexes perform well
- [ ] No N+1 queries

---

## 🧹 Regression Tests

### Existing Features
- [ ] Onboarding wizard still works
- [ ] Provider dashboard still works
- [ ] Class management still works
- [ ] Review management still works
- [ ] No breaking changes to existing flows

### Monetisation Integration
- [ ] Premium Analytics check works
- [ ] Blurred insights show correctly
- [ ] Upgrade CTAs link correctly
- [ ] Entitlement checks don't break

---

## 🚀 Production Readiness

### Environment Variables
- [ ] All required env vars set
- [ ] API keys are secure
- [ ] Rate limits configured
- [ ] Model selection appropriate

### Database
- [ ] Migration applied successfully
- [ ] Indexes created
- [ ] Triggers working
- [ ] RLS policies set (if needed)

### Monitoring
- [ ] Usage tracking works
- [ ] Error logging configured
- [ ] Performance metrics available
- [ ] Alerts set up (if needed)

---

## 📝 Test Scenarios

### Scenario 1: New Provider Onboarding
1. Start onboarding wizard
2. Use AI to generate tagline
3. Use AI to generate class description
4. Use AI to suggest captions
5. Complete wizard
6. ✅ Verify all AI-generated content saved correctly

### Scenario 2: Existing Provider Improving Listing
1. Navigate to class management
2. Use "Improve my text" feature
3. Apply improved description
4. Use SEO optimiser
5. Apply SEO suggestions
6. Save class
7. ✅ Verify changes persisted

### Scenario 3: Rate Limit Testing
1. Make 20 AI calls
2. Attempt 21st call
3. ✅ Verify error message shown
4. Wait until next day (or reset in test)
5. ✅ Verify limit resets

### Scenario 4: Premium Analytics Integration
1. As free user, view Insight Coach
2. ✅ Verify some suggestions blurred
3. Click "Unlock with Premium Analytics"
4. ✅ Verify redirects to upgrade page
5. (As premium user) ✅ Verify all insights visible

---

## 🐛 Known Issues & Edge Cases

### Edge Cases to Test
- [ ] Empty input fields
- [ ] Very long input text
- [ ] Special characters in input
- [ ] Missing context data
- [ ] Network interruptions
- [ ] Concurrent requests
- [ ] Cache expiration

### Error Scenarios
- [ ] API key invalid
- [ ] API rate limit exceeded
- [ ] API timeout
- [ ] Database connection lost
- [ ] Invalid provider ID
- [ ] Missing user authentication

---

## ✅ Sign-Off

**Tested by:** _______________

**Date:** _______________

**Status:** ☐ Pass  ☐ Fail  ☐ Needs Review

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________





