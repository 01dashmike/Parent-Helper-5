# Provider Onboarding Wizard - Implementation Summary

## Overview

Upgraded the existing checklist-based provider onboarding into a guided 6-step wizard that provides a Treatwell/ClassPass-level UX while reusing existing data structures and auth flows.

## What Was Implemented

### 1. Database Schema Updates

**Migration:** `supabase/migrations/20250220000000_add_wizard_fields_to_provider_onboarding.sql`
- Added `current_step` (text) - Tracks which wizard step provider is on
- Added `saved_data` (jsonb) - Stores draft form data per step
- Added index on `current_step` for faster lookups

**Schema Update:** `shared/schema.ts`
- Updated `providerOnboarding` table definition with new fields
- Added index definition for `current_step`

### 2. Route Structure

Created new wizard routes under `/provider/onboarding/wizard/`:

```
/provider/onboarding                    # Entry point (redirects to wizard)
/provider/onboarding/wizard             # Wizard entry (redirects to current step)
/provider/onboarding/wizard/step-1-account
/provider/onboarding/wizard/step-2-business
/provider/onboarding/wizard/step-3-class
/provider/onboarding/wizard/step-4-media
/provider/onboarding/wizard/step-5-preview
/provider/onboarding/wizard/step-6-publish
```

### 3. Server Actions

**File:** `app/provider/(console)/onboarding/wizard/actions.ts`

Implemented server actions for:
- `getCurrentWizardStep()` - Gets current step for provider
- `getSavedStepData()` - Retrieves saved form data for a step
- `saveStep1Account()` - Saves account & contact info
- `saveStep2Business()` - Saves business basics
- `saveStep3Class()` - Creates draft class
- `saveStep4Media()` - Saves media URLs
- `publishOnboarding()` - Publishes class and marks onboarding complete

All actions:
- Validate input with Zod schemas
- Check authentication and provider membership
- Update `provider_onboarding` table
- Advance to next step on success
- Handle errors gracefully

### 4. UI Components

**WizardShell Component:** `app/provider/(console)/onboarding/components/WizardShell.tsx`
- Progress bar showing completion percentage
- Step indicators (1-6) with visual states
- Back button navigation
- "Finish later" link
- Consistent layout wrapper for all steps

**Step 1 Component:** Fully implemented
- `step-1-account/page.tsx` - Server component
- `step-1-account/Step1AccountClient.tsx` - Client form component
- Collects: name, email, phone
- Pre-fills from existing provider data or saved data

**Steps 2-6:** Placeholder pages created (ready for implementation)

### 5. Redirect Logic

**Updated:** `app/provider/(console)/onboarding/page.tsx`
- Now redirects to `/provider/onboarding/wizard` instead of showing checklist
- Maintains backward compatibility

**Wizard Entry:** `app/provider/(console)/onboarding/wizard/page.tsx`
- Checks if onboarding is complete → redirects to dashboard
- Gets current step → redirects to that step
- Creates onboarding record if it doesn't exist

## Step Mapping

The 6 wizard steps map to existing checklist items:

1. **Step 1: Account & Contact** - New (prerequisite data)
2. **Step 2: Business Basics** - Maps to `add_location` (partially)
3. **Step 3: Class Template** - Maps to `publish_class` (draft) + `add_schedule` (stub)
4. **Step 4: Media** - Maps to `upload_logo` + `upload_photos`
5. **Step 5: Preview** - Maps to `preview_listing`
6. **Step 6: Publish** - Maps to `publish_class` (final) + sets `is_complete = true`

## Data Flow

1. Provider visits `/provider/onboarding`
2. Redirects to `/provider/onboarding/wizard`
3. Wizard entry checks `provider_onboarding.current_step`
4. Redirects to appropriate step page
5. Step page loads saved data from `provider_onboarding.saved_data[step_id]`
6. User fills form and submits
7. Server action validates, saves to DB, updates `current_step`
8. Redirects to next step
9. Repeat until Step 6 (Publish)
10. Step 6 sets `is_complete = true` and redirects to `/provider`

## Files Created

### New Files
- `supabase/migrations/20250220000000_add_wizard_fields_to_provider_onboarding.sql`
- `app/provider/(console)/onboarding/wizard/page.tsx`
- `app/provider/(console)/onboarding/wizard/actions.ts`
- `app/provider/(console)/onboarding/wizard/step-1-account/page.tsx`
- `app/provider/(console)/onboarding/wizard/step-1-account/Step1AccountClient.tsx`
- `app/provider/(console)/onboarding/wizard/step-2-business/page.tsx`
- `app/provider/(console)/onboarding/wizard/step-3-class/page.tsx`
- `app/provider/(console)/onboarding/wizard/step-4-media/page.tsx`
- `app/provider/(console)/onboarding/wizard/step-5-preview/page.tsx`
- `app/provider/(console)/onboarding/wizard/step-6-publish/page.tsx`
- `app/provider/(console)/onboarding/components/WizardShell.tsx`
- `docs/ONBOARDING_WIZARD_DESIGN.md`
- `docs/ONBOARDING_WIZARD_IMPLEMENTATION.md` (this file)

### Modified Files
- `shared/schema.ts` - Added `currentStep` and `savedData` fields to `providerOnboarding`
- `app/provider/(console)/onboarding/page.tsx` - Now redirects to wizard

## Next Steps (To Complete Implementation)

1. **Implement Step 2 (Business Basics)**
   - Form for provider name, address, town, postcode, category
   - Auto-geocode address to get lat/lng
   - Update `Step2BusinessClient.tsx`

2. **Implement Step 3 (Class Template)**
   - Form for class name, description, age range, category, venue, schedule, price
   - Create draft class (not published)
   - Update `Step3ClassClient.tsx`

3. **Implement Step 4 (Media)**
   - File upload component for logo
   - File upload component for class photos
   - Integration with Supabase Storage
   - Update `Step4MediaClient.tsx`

4. **Implement Step 5 (Preview)**
   - Reuse existing class card component
   - Show preview of provider + class listing
   - Allow editing previous steps
   - Update `Step5PreviewClient.tsx`

5. **Implement Step 6 (Publish)**
   - Confirmation screen
   - Publish class (set `is_published = true`)
   - Mark onboarding complete
   - Show success message
   - Update `Step6PublishClient.tsx`

6. **Testing**
   - Test new provider flow (no onboarding record)
   - Test returning provider (mid-onboarding)
   - Test completed onboarding (should redirect to dashboard)
   - Test step navigation (back/forward)
   - Test data persistence (saved_data)

## How to Test

### As a Brand New Provider
1. Log in as a provider with no `provider_onboarding` record
2. Visit `/provider/onboarding`
3. Should redirect to `/provider/onboarding/wizard/step-1-account`
4. Fill out Step 1 form
5. Should advance to Step 2

### As a Returning Provider (Mid-Onboarding)
1. Log in as a provider with `current_step = "step-3-class"`
2. Visit `/provider/onboarding`
3. Should redirect to `/provider/onboarding/wizard/step-3-class`
4. Form should pre-fill with saved data

### As a Provider with Completed Onboarding
1. Log in as a provider with `is_complete = true`
2. Visit `/provider/onboarding`
3. Should redirect to `/provider` (dashboard)

## Safety Notes

- ✅ No changes to global auth or middleware
- ✅ No destructive migrations (only adds columns)
- ✅ Reuses existing `provider_onboarding` table
- ✅ Maintains backward compatibility (old checklist still accessible via direct URL if needed)
- ✅ All redirects are in components/actions (no top-level redirects)
- ✅ Type-safe with Zod validation

## Known Limitations

1. Steps 2-6 are placeholder pages (need full implementation)
2. Media upload (Step 4) needs file upload UI
3. Preview (Step 5) needs to reuse existing class card component
4. Auto-save on blur/change not yet implemented (can be added later)
5. Step validation before allowing "Next" not yet implemented








