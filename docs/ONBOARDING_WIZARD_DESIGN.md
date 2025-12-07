# Provider Onboarding Wizard - Design Document

## Overview

Upgrade the existing checklist-based onboarding into a guided 6-step wizard that feels like Treatwell/ClassPass, while reusing existing data structures and auth flows.

## Step Mapping: 8 Checklist Items → 6 Wizard Steps

### Existing Checklist Steps (from `lib/gamification/onboarding.ts`):
1. `upload_logo`
2. `upload_photos`
3. `add_bio`
4. `publish_class`
5. `add_schedule`
6. `add_location`
7. `preview_listing`
8. `connect_payments`

### New Wizard Steps:

**Step 1: Account & Contact**
- Collects: name, email, phone
- Maps to: `providers.name`, `providers.contact_email`, `providers.contact_phone`
- Checklist items covered: None (prerequisite data)

**Step 2: Business Basics**
- Collects: provider name, address, town, postcode, category
- Maps to: `providers.address_line1`, `providers.town`, `providers.postcode`, `providers.metadata.category`
- Checklist items covered: `add_location` (partially)

**Step 3: Class Template**
- Collects: class name, description, age range, category, venue, schedule, price
- Creates: Draft class in `classes` table with `is_published = false`
- Checklist items covered: `publish_class` (draft), `add_schedule` (stub)

**Step 4: Media**
- Collects: logo, class photos
- Maps to: `providers.metadata.logo_url`, `classes.image_urls`
- Checklist items covered: `upload_logo`, `upload_photos`

**Step 5: Preview**
- Shows: Live preview of provider + class listing
- Checklist items covered: `preview_listing`

**Step 6: Publish**
- Actions: Sets `classes.is_published = true`, `provider_onboarding.is_complete = true`
- Checklist items covered: `publish_class` (final), `add_bio` (optional, can be done later)

**Note:** `connect_payments` is intentionally excluded from wizard (can be done post-onboarding)

## Database Schema

### Existing Table: `provider_onboarding`
```sql
provider_id (PK)
is_complete (boolean)
completed_steps (jsonb array)
progress (integer 0-100)
updated_at (timestamp)
```

### New Columns to Add:
```sql
current_step (text) -- e.g., "step-1-account", "step-2-business", etc.
saved_data (jsonb) -- Stores draft form data per step
```

### Migration Strategy:
- Add columns with defaults (non-breaking)
- `current_step` defaults to `NULL` (will be set on first wizard visit)
- `saved_data` defaults to `{}` (empty JSON object)

## Progress Tracking Model

### Single Source of Truth: `provider_onboarding` table

**Current Step:**
- Stored in: `provider_onboarding.current_step`
- Values: `"step-1-account"`, `"step-2-business"`, `"step-3-class"`, `"step-4-media"`, `"step-5-preview"`, `"step-6-publish"`, `"complete"`
- Updated: When user moves to next step

**Completed Steps:**
- Stored in: `provider_onboarding.completed_steps` (jsonb array)
- Values: Array of step IDs: `["step-1-account", "step-2-business", ...]`
- Updated: When step is successfully saved

**Is Complete:**
- Stored in: `provider_onboarding.is_complete` (boolean)
- Set to `true`: When Step 6 (Publish) is completed
- Also verified by: Checking provider has address, class is published, class has schedule

**Draft Data:**
- Stored in: `provider_onboarding.saved_data` (jsonb)
- Structure: `{ "step-1-account": {...}, "step-2-business": {...}, ... }`
- Updated: On each step save (auto-save on blur/change)

## Route Structure

```
/provider/onboarding                    # Entry point (redirects to current step)
/provider/onboarding/wizard             # Wizard entry (redirects to current step)
/provider/onboarding/wizard/step-1-account
/provider/onboarding/wizard/step-2-business
/provider/onboarding/wizard/step-3-class
/provider/onboarding/wizard/step-4-media
/provider/onboarding/wizard/step-5-preview
/provider/onboarding/wizard/step-6-publish
```

## Redirect Logic

### When provider visits `/provider/onboarding`:
1. Check if `provider_onboarding` record exists
2. If no record → create with `current_step = "step-1-account"`
3. If record exists:
   - If `is_complete = true` → show "You're all set" or redirect to `/provider`
   - If `is_complete = false` → redirect to `/provider/onboarding/wizard/{current_step}`

### When provider completes a step:
1. Save data to `saved_data[step_id]`
2. Add step to `completed_steps` array
3. Update `current_step` to next incomplete step
4. Redirect to next step

### When provider clicks "Back":
1. Navigate to previous step (no save required)
2. Load data from `saved_data[previous_step_id]` if available

## Integration with Existing Systems

### Auth Flow:
- Uses existing `getActiveMembershipForUser()` helper
- No changes to login/auth routes
- Provider must be logged in and have active membership

### Gamification:
- Reuses existing `lib/gamification/onboarding.ts` functions
- `verifyOnboardingStep()` can still be used to check completion
- `completeOnboardingStep()` can be called after wizard steps

### Provider Console:
- Existing `/provider` dashboard checks `is_complete`
- Shows banner if incomplete (existing behavior)
- Wizard completion sets `is_complete = true` (existing behavior)

## Error Handling

- If provider doesn't exist → redirect to `/provider/login`
- If no membership → show "Access pending" (existing behavior)
- If step data is invalid → show validation errors, don't advance
- If save fails → show error message, allow retry

## Future Enhancements (Out of Scope)

- Auto-save on blur/change (can be added later)
- Step validation before allowing "Next"
- Skip optional steps
- Multi-class creation in Step 3





