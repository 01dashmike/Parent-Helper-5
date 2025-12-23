# Provider Onboarding Wizard

## Overview

The provider onboarding wizard is a guided 6-step flow that helps new providers set up their business listing on Parent Helper. It replaces the previous checklist-based onboarding with a sequential, resumable wizard experience.

## Routes

All onboarding routes are namespaced under `/provider/onboarding`:

- `/provider/onboarding` - Entry point (redirects to wizard)
- `/provider/onboarding/wizard` - Wizard entry (redirects to current step)
- `/provider/onboarding/wizard/step-1-account` - Account & Contact
- `/provider/onboarding/wizard/step-2-business` - Business Basics
- `/provider/onboarding/wizard/step-3-class` - Class Template
- `/provider/onboarding/wizard/step-4-media` - Media Upload
- `/provider/onboarding/wizard/step-5-preview` - Preview Listing
- `/provider/onboarding/wizard/step-6-publish` - Publish

## Wizard Steps

### Step 1: Account & Contact
- Collects: name, email, phone
- Updates: `providers.name`, `providers.contact_email`, `providers.contact_phone`
- Pre-fills from: Supabase auth session, existing provider record

### Step 2: Business Basics
- Collects: provider name, address, town, county, postcode, category
- Updates: `providers` table (address fields, metadata.category)
- Auto-geocodes: Address to get lat/lng (future enhancement)

### Step 3: Class Template
- Collects: class name, description, age range, category, venue, schedule, price
- Creates: Draft class in `classes` table with `is_published = false`
- Stores: Class ID in `saved_data` for later steps

### Step 4: Media
- Collects: logo URL, class photo URLs
- Updates: `providers.metadata.logo_url`, `classes.image_urls`
- Note: File upload UI can be added later; currently accepts URLs

### Step 5: Preview
- Shows: Preview of provider + class listing
- No data changes: Read-only preview
- Allows: Navigation back to previous steps

### Step 6: Publish
- Actions: Sets `classes.is_published = true`, `classes.is_active = true`
- Completes: Sets `provider_onboarding.is_complete = true`
- Redirects: To `/provider` dashboard

## Data Storage

### Table: `provider_onboarding`

**Existing Fields:**
- `provider_id` (PK) - References providers.id
- `is_complete` (boolean) - Whether onboarding is finished
- `completed_steps` (jsonb array) - Array of completed step IDs
- `progress` (integer 0-100) - Completion percentage
- `updated_at` (timestamp) - Last update time

**New Fields (added in migration):**
- `current_step` (text) - Current wizard step ID (e.g., "step-1-account")
- `saved_data` (jsonb) - Draft form data stored per step

**Example `saved_data` structure:**
```json
{
  "step-1-account": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "07123 456789"
  },
  "step-2-business": {
    "providerName": "Little Stars Music",
    "addressLine1": "123 High Street",
    "town": "London",
    "postcode": "SW1A 1AA"
  },
  "step-3-class": {
    "className": "Baby Music & Movement",
    "description": "...",
    "classId": 123
  }
}
```

## Progress Tracking

### How `current_step` is Determined

1. On first visit: Creates onboarding record with `current_step = "step-1-account"`
2. After each step: Updates `current_step` to next incomplete step
3. On completion: Sets `current_step = "complete"`

### How `is_complete` is Determined

- Set to `true` when Step 6 (Publish) is completed
- Also verified by checking:
  - Provider has address
  - Class is published (`is_published = true`)
  - Class is active (`is_active = true`)

### How Progress is Calculated

```typescript
progress = Math.round((completedSteps.length / WIZARD_STEPS.length) * 100)
```

## Redirect Logic

### Login Flow

1. Provider logs in via `/provider/login`
2. After successful login, redirects to `/provider`
3. `/provider` page checks onboarding status:
   - If `is_complete = false` → redirects to `/provider/onboarding`
   - If `is_complete = true` → shows dashboard

### Wizard Entry

1. Provider visits `/provider/onboarding`
2. Redirects to `/provider/onboarding/wizard`
3. Wizard entry checks `current_step`:
   - If `is_complete = true` → redirects to `/provider`
   - If `is_complete = false` → redirects to `/provider/onboarding/wizard/{current_step}`

### Step Navigation

- **Next**: Server action saves data, updates `current_step`, redirects to next step
- **Back**: Client-side navigation (no save required)
- **Finish Later**: Links to `/provider` (onboarding remains incomplete)

## Server Actions

All server actions are in `app/provider/(console)/onboarding/wizard/actions.ts`:

- `getCurrentWizardStep(providerId)` - Returns current step ID
- `getSavedStepData(providerId, stepId)` - Returns saved data for a step
- `saveStep1Account(formData)` - Saves account info
- `saveStep2Business(formData)` - Saves business info
- `saveStep3Class(formData)` - Creates draft class
- `saveStep4Media(formData)` - Saves media URLs
- `publishOnboarding(formData)` - Publishes class and completes onboarding

All actions:
- Validate input with Zod schemas
- Check authentication and provider membership
- Update `provider_onboarding` table
- Handle errors gracefully
- Return typed results: `{ success: boolean, error?: string }`

## Components

### WizardShell
**Location:** `app/provider/(console)/onboarding/components/WizardShell.tsx`

Provides consistent layout for all steps:
- Progress bar (percentage complete)
- Step indicators (1-6) with visual states
- Back button navigation
- "Finish later" link
- Consistent styling

### Step Components

Each step has:
- **Server Component** (`page.tsx`) - Loads data, handles auth
- **Client Component** (`StepXClient.tsx`) - Form UI, handles submission

## Integration with Existing Systems

### Auth Flow
- Uses existing `getActiveMembershipForUser()` helper
- No changes to login/auth routes
- Provider must be logged in and have active membership

### Gamification
- Reuses existing `lib/gamification/onboarding.ts` functions
- `verifyOnboardingStep()` can still be used to check completion
- `completeOnboardingStep()` can be called after wizard steps

### Provider Console
- Existing `/provider` dashboard checks `is_complete`
- Shows banner if incomplete (existing behavior)
- Wizard completion sets `is_complete = true` (existing behavior)

## How to Change Steps

To modify the wizard steps:

1. **Add a new step:**
   - Add step ID to `WIZARD_STEPS` array in `actions.ts`
   - Create route: `app/provider/(console)/onboarding/wizard/step-X-name/page.tsx`
   - Create client component: `StepXNameClient.tsx`
   - Add server action: `saveStepXName()`
   - Update `WizardShell` step count if needed

2. **Modify an existing step:**
   - Update the step's client component form
   - Update the corresponding server action
   - Update Zod validation schema if needed

3. **Remove a step:**
   - Remove from `WIZARD_STEPS` array
   - Delete route and component files
   - Remove server action
   - Update progress calculation

## Testing

### Scenario A: Brand New Provider
1. Log out
2. Sign up as a new provider user (via existing flow)
3. Visit `/provider/onboarding`
4. Should redirect to `/provider/onboarding/wizard/step-1-account`
5. Complete all 6 steps
6. Should end up on `/provider` dashboard
7. Verify `provider_onboarding.is_complete = true`

### Scenario B: Returning Provider (Mid-Onboarding)
1. Log in as a provider with `current_step = "step-3-class"`
2. Visit `/provider/onboarding`
3. Should redirect to `/provider/onboarding/wizard/step-3-class`
4. Form should pre-fill with saved data from `saved_data.step-3-class`
5. Complete remaining steps
6. Should end up on `/provider` dashboard

### Scenario C: Provider with Completed Onboarding
1. Log in as a provider with `is_complete = true`
2. Visit `/provider/onboarding`
3. Should redirect to `/provider` (dashboard)

## Migration

To apply the database changes:

```bash
# Run the migration
psql $DATABASE_URL -f supabase/migrations/20250220000000_add_wizard_fields_to_provider_onboarding.sql
```

Or if using Drizzle:

```bash
npm run db:push
```

## Future Enhancements

- Auto-save on blur/change (currently only saves on submit)
- Step validation before allowing "Next"
- File upload UI for Step 4 (currently URL-based)
- Auto-geocoding for Step 2 addresses
- Multi-class creation in Step 3
- Template library for common class types
- Preview using actual class card component (currently simplified)

## Troubleshooting

### Redirect Loops
- Ensure no redirects at module top-level
- All redirects should be in components or server actions
- Check that `is_complete` check happens before redirect

### Data Not Saving
- Check that `saved_data` is being updated in `saveStepAndAdvance()`
- Verify Zod validation is passing
- Check Supabase permissions for `provider_onboarding` table

### Step Not Advancing
- Verify server action is returning `{ success: true, nextStep: "..." }`
- Check that redirect is happening after successful save
- Verify `current_step` is being updated in database








