# Provider Onboarding Wizard — Complete Specification

**Document Version:** 1.0  
**Date:** 2025-01-27  
**Author:** Parent-Helper Senior Product Architect

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: Gap Report](#part-1-gap-report)
3. [Part 2: Onboarding Wizard Design](#part-2-onboarding-wizard-design)
4. [Part 3: Technical Blueprint](#part-3-technical-blueprint)
5. [Part 4: Schema Changes](#part-4-schema-changes)
6. [Part 5: Components & Server Actions](#part-5-components--server-actions)
7. [Part 6: Redirect Logic & Progress Tracking](#part-6-redirect-logic--progress-tracking)
8. [Part 7: Integration Plan](#part-7-integration-plan)

---

## Executive Summary

This specification designs a complete Provider Onboarding Wizard that matches or exceeds the UX quality of Treatwell, ClassPass, Airbnb, and Shopify. The wizard guides new providers through a 6-step process to set up their business profile, create class templates, configure locations and schedules, upload media, and publish their first listing.

**Current State:** The codebase has a basic onboarding checklist system (`/provider/onboarding`) that tracks completion of 8 generic steps, but lacks a structured wizard flow with dedicated pages, auto-save functionality, and progressive data collection.

**Target State:** A complete 6-step wizard with dedicated routes, server actions, state persistence, validation, and preview capabilities.

---

## Part 1: Gap Report

### A. What Exists

#### ✅ Existing Onboarding Infrastructure

1. **Onboarding Tracking System**
   - **Location:** `app/provider/(console)/onboarding/`
   - **Files:**
     - `page.tsx` - Server component that fetches onboarding status
     - `OnboardingClient.tsx` - Client component with progress ring and checklist UI
     - `actions.ts` - **STUB ONLY** - Contains placeholder server actions
   - **Status:** UI exists but actions are dev stubs that don't persist data

2. **Onboarding Library**
   - **Location:** `lib/gamification/onboarding.ts`
   - **Features:**
     - `getOnboardingStatus()` - Fetches from `provider_onboarding` table
     - `verifyOnboardingStep()` - Checks if steps are actually complete
     - `completeOnboardingStep()` - Marks steps complete
     - `recalculateOnboardingProgress()` - Syncs progress
   - **Status:** Functional but designed for post-facto verification, not wizard flow

3. **Database Schema**
   - **Table:** `provider_onboarding` (defined in `shared/schema.ts:1918-1924`)
   - **Fields:**
     - `provider_id` (PK)
     - `is_complete` (boolean)
     - `completed_steps` (jsonb array)
     - `progress` (0-100 integer)
     - `updated_at` (timestamp)
   - **Status:** Exists but lacks `current_step` and `saved_data` fields needed for wizard

4. **Provider Console Pages**
   - **Classes Management:** `app/provider/(console)/classes/`
     - Full CRUD for classes
     - Uses `ClassManager.tsx` component
     - Has `actions.ts` with server actions
   - **Venues Management:** `app/provider/(console)/venues/`
     - Full CRUD for venues
     - Uses `VenueManager.tsx` component
     - Has `actions.ts` with server actions
   - **Status:** Functional but not integrated into onboarding flow

5. **Authentication Flow**
   - **Location:** `app/provider/(auth)/login/`
   - **Status:** Functional, redirects logged-in users to `/provider`
   - **Gap:** No redirect to onboarding if incomplete

6. **Provider Dashboard**
   - **Location:** `app/provider/(console)/page.tsx`
   - **Features:**
     - Shows onboarding banner if incomplete
     - Links to `/provider/onboarding`
   - **Status:** Functional but onboarding page is checklist, not wizard

#### ✅ Existing Data Models

1. **Providers Table** (`shared/schema.ts:296-350`)
   - Has all business fields: name, description, contact info, address, etc.
   - **Missing:** `business_type`, `logo_url` (stored in metadata), `primary_contact_name`

2. **Classes Table** (`shared/schema.ts:5-215`)
   - Comprehensive class schema with all needed fields
   - **Status:** Ready for use

3. **Venues Table** (`shared/schema.ts:2064-2081`)
   - Basic venue schema with address, accessibility
   - **Status:** Functional

4. **Class Sessions Table** (`shared/schema.ts:455-475`)
   - Recurring schedule support
   - **Status:** Functional

### B. What's Missing

#### ❌ Critical Missing Components

1. **Wizard Structure**
   - No dedicated step pages (`/provider/onboarding/step-1-business`, etc.)
   - No step navigation component
   - No progress indicator component
   - No auto-save functionality
   - No "Save for Later" functionality

2. **Server Actions**
   - `actions.ts` in onboarding folder is **stub only**
   - Missing:
     - `saveBusinessInfo()`
     - `saveClassTemplate()`
     - `saveVenue()`
     - `saveSchedule()`
     - `uploadMedia()`
     - `publishProvider()`

3. **State Persistence**
   - No `saved_data` field in `provider_onboarding` table
   - No `current_step` tracking
   - No draft state management

4. **Form Components**
   - No dedicated business info form
   - No class template builder
   - No schedule builder component
   - No media uploader component
   - No preview component

5. **Validation Schemas**
   - No Zod schemas for each step
   - No client-side validation
   - No server-side validation in actions

6. **Redirect Logic**
   - No middleware to redirect incomplete onboarding
   - No logic to resume from last step
   - No `?next=` parameter handling in login

7. **Media Upload**
   - No image upload component
   - No Supabase Storage integration for provider media
   - No image cropping/resizing

8. **Preview System**
   - No class listing preview
   - No provider profile preview
   - No SEO preview

### C. What's Broken or Inconsistent

#### ⚠️ Issues Found

1. **Onboarding Actions Are Stubs**
   - `app/provider/(console)/onboarding/actions.ts` contains only console.log statements
   - No actual database writes
   - No error handling

2. **Incomplete Step Verification**
   - `verifyOnboardingStep()` checks for data existence but doesn't validate completeness
   - No validation that required fields are filled

3. **No Wizard Flow**
   - Current onboarding is a checklist, not a guided wizard
   - Steps link to existing pages (e.g., `/provider/classes/new`) but don't guide through setup
   - No sequential flow enforcement

4. **Missing Business Type Field**
   - Providers table has no `business_type` field
   - Cannot distinguish sole trader, franchise, charity, etc.

5. **Logo Storage Inconsistent**
   - Logo stored in `metadata.jsonb` instead of dedicated field
   - No standardized access pattern

6. **No Template System**
   - No `provider_templates` table for class defaults
   - Providers must manually configure each class

7. **No Onboarding Progress Tracking**
   - No `current_step` field to resume from last position
   - No `saved_data` to preserve partial form data

8. **No Redirect on Incomplete Onboarding**
   - Dashboard shows banner but doesn't enforce completion
   - Users can access other console pages without completing onboarding

### D. Technical Blockers

#### 🚫 Missing Infrastructure

1. **Database Schema Gaps**
   - Missing `provider_onboarding.current_step` (text)
   - Missing `provider_onboarding.saved_data` (jsonb)
   - Missing `providers.business_type` (text)
   - Missing `providers.logo_url` (text) - currently in metadata
   - Missing `providers.primary_contact_name` (text)
   - Missing `provider_templates` table entirely

2. **Missing API Routes**
   - No `/api/providers/upload-media` route
   - No `/api/providers/preview` route

3. **Missing Server Actions**
   - All onboarding actions are stubs
   - No validation in actions
   - No RLS policy considerations documented

4. **Missing UI Components**
   - `StepNavigation` component
   - `SaveStatusIndicator` component
   - `FormSection` component
   - `ImageUploader` component
   - `ScheduleBuilder` component
   - `MapPicker` component
   - `PreviewCard` component
   - `ProgressTracker` component

5. **Missing Validation**
   - No Zod schemas for wizard steps
   - No client-side form validation
   - No server-side action validation

6. **Missing State Management**
   - No auto-save on field blur
   - No draft state persistence
   - No optimistic updates

---

## Part 2: Onboarding Wizard Design

### Wizard Overview

The Provider Onboarding Wizard is a 6-step guided flow that collects all necessary information to publish a provider's first class listing. Each step is self-contained, auto-saves progress, and can be completed independently.

**Design Principles:**
- **Progressive Disclosure:** Only ask for what's needed at each step
- **Auto-Save:** Save on every field change (debounced)
- **Validation on Blur:** Validate fields as user leaves them
- **"Later" Options:** Allow skipping non-critical fields
- **Visual Feedback:** Show progress, save status, and validation errors clearly
- **Mobile-First:** Responsive design for all screen sizes

### Step 1: Account Setup

**Route:** `/provider/onboarding/step-1-account` (or handled by login redirect)

**Status:** ✅ **Already Handled**

- Supabase authentication already manages account creation
- If user arrives without session → redirect to `/provider/login?next=/provider/onboarding/step-2-business`
- No additional work needed unless improvements desired

**Implementation Notes:**
- Update login redirect logic to include `?next=` parameter
- After successful login, redirect to `next` or default to step 2

### Step 2: Business Basics

**Route:** `/provider/onboarding/step-2-business`

**Data Collected:**
- Provider name (required)
- Business type (required): `sole_trader` | `franchise` | `charity` | `limited_company` | `partnership` | `other`
- Logo (optional, can upload later)
- About section (required, min 50 chars)
- Website (optional, validated URL)
- Phone number (required, UK format)
- Primary contact name (required)

**UX Requirements:**
- Minimal fields visible at once
- Save on every field change (debounced 500ms)
- Validation on blur
- "Skip for now" option for logo
- Character counter for About section
- Phone number formatting (UK format)

**Validation:**
- Provider name: 2-100 characters
- Business type: Must select from dropdown
- About: 50-2000 characters
- Website: Valid URL or empty
- Phone: UK phone format (validated with regex)
- Contact name: 2-100 characters

**Server Action:** `saveBusinessInfo(providerId, data)`

**Database Updates:**
- Update `providers` table with all fields
- Update `provider_onboarding.saved_data` with form state
- Update `provider_onboarding.current_step` to `step-2-business` if not further

### Step 3: Class Template

**Route:** `/provider/onboarding/step-3-class-template`

**Data Collected:**
- Class name template (required): e.g., "{Provider Name} {Category} - {Location}"
- Age range selector (required): Min and max age (0-5 years)
- Category selector (required): Music, Playgroup, Movement, Sensory, Art, Language, etc.
- Description template (required, min 100 chars)
- Default price (optional): Free, £X per session, £X per term
- Default duration (required): 30, 45, 60, 90 minutes
- Default capacity (optional): Max participants
- Tags (optional, multi-select): Baby sensory, Toddler dance, Messy play, Outdoor, etc.

**UX Requirements:**
- Template preview showing how name will look
- Age range slider or number inputs
- Category dropdown with icons
- Rich text editor for description (or markdown)
- Price format selector (Free, Per session, Per term, Block booking)
- Duration dropdown
- Tag selector with autocomplete

**Validation:**
- Class name template: Must include at least one variable placeholder
- Age range: Min < Max, both 0-5
- Category: Must select from predefined list
- Description: 100-2000 characters
- Duration: 15-180 minutes, in 15-minute increments
- Capacity: 1-50 if provided

**Server Action:** `saveClassTemplate(providerId, data)`

**Database Updates:**
- Insert/update `provider_templates` table (NEW TABLE)
- Store template as JSON for reuse
- Update `provider_onboarding.current_step`

**Template Storage:**
```json
{
  "name_template": "{Provider Name} {Category} - {Location}",
  "default_age_min": 0,
  "default_age_max": 2,
  "default_category": "music",
  "description_template": "...",
  "default_price": "£8 per session",
  "default_duration_minutes": 45,
  "default_capacity": 12,
  "default_tags": ["baby", "music", "sensory"]
}
```

### Step 4: Location & Schedule

**Route:** `/provider/onboarding/step-4-location`

**Data Collected:**
- Venue name (required)
- Address line 1 (required)
- Address line 2 (optional)
- Town (required, autocomplete)
- County (optional)
- Postcode (required, UK format)
- Map pin (auto-set from address, can be adjusted)
- Weekly schedule (required):
  - Day of week (required)
  - Start time (required)
  - End time (required)
  - Recurring toggle (default: true)
  - Frequency (weekly, bi-weekly, monthly)
  - Holiday exceptions (optional, date picker)

**UX Requirements:**
- Address autocomplete (Google Places API or UK postcode lookup)
- Interactive map for pin placement
- Schedule builder with visual calendar
- Add multiple time slots per day
- Add multiple days
- Preview schedule in calendar view
- Holiday exception date picker

**Validation:**
- Venue name: 2-100 characters
- Address: Valid UK address format
- Postcode: Valid UK postcode format
- Coordinates: Valid lat/lng within UK bounds
- Schedule: At least one time slot
- Time: End time > Start time
- Recurring: If enabled, frequency must be selected

**Server Action:** `saveVenueAndSchedule(providerId, venueData, scheduleData)`

**Database Updates:**
- Insert into `venues` table
- Insert into `class_sessions` table for recurring schedule
- Update `provider_onboarding.current_step`

### Step 5: Media Uploads

**Route:** `/provider/onboarding/step-5-media`

**Data Collected:**
- Logo (if not uploaded in step 2)
- Photos (3+ recommended, max 10)
- Videos (optional, max 3)
- Cover image (required, for class listing)

**UX Requirements:**
- Drag-and-drop upload zones
- Image preview with crop tool
- Progress indicators for uploads
- Image gallery with reordering
- Delete functionality
- File size limits: 5MB per image, 50MB per video
- Supported formats: JPG, PNG, WebP for images; MP4, WebM for videos
- Auto-cropping to recommended aspect ratios:
  - Logo: 1:1 (square)
  - Cover: 16:9 (landscape)
  - Photos: 4:3 (portrait or landscape)

**Validation:**
- At least one cover image required
- Logo: Square aspect ratio, max 2MB
- Photos: Max 5MB each, max 10 total
- Videos: Max 50MB each, max 3 total
- File types: JPG, PNG, WebP, MP4, WebM only

**Server Action:** `uploadMedia(providerId, files, type)`

**Database Updates:**
- Upload to Supabase Storage: `providers/{providerId}/media/`
- Update `providers.logo_url` if logo uploaded
- Store media URLs in `provider_onboarding.saved_data` or new `provider_media` table
- Update `provider_onboarding.current_step`

**Storage Structure:**
```
providers/
  {providerId}/
    logo/
      logo.{ext}
    photos/
      photo-1.{ext}
      photo-2.{ext}
      ...
    videos/
      video-1.{ext}
      ...
    cover/
      cover.{ext}
```

### Step 6: Preview & Publish

**Route:** `/provider/onboarding/step-6-preview`

**Data Displayed:**
- Full class listing preview (mobile + desktop views)
- Provider profile preview
- SEO preview (title, meta description, schema snippet)
- All collected data summary

**User Actions:**
- **Publish Now:** Creates first class, publishes provider profile, marks onboarding complete
- **Save as Draft:** Saves class as draft, marks onboarding complete
- **Return to Edit:** Goes back to step with issues

**UX Requirements:**
- Toggle between mobile/desktop preview
- Show all collected data in summary
- Highlight any missing required fields
- Show SEO preview with actual meta tags
- Confirmation dialog before publishing
- Success message with next steps

**Validation:**
- All required fields from previous steps must be complete
- At least one class session must be scheduled
- Cover image must be uploaded

**Server Action:** `publishProvider(providerId, publishAsDraft)`

**Database Updates:**
- Create first class using template + venue + schedule
- Set `providers.is_active = true`
- Set `providers.booking_enabled = false` (can enable later)
- Set `provider_onboarding.is_complete = true`
- Set `provider_onboarding.current_step = 'complete'`
- Award onboarding reward (existing logic)
- Send welcome email

---

## Part 3: Technical Blueprint

### File/Folder Structure

```
app/provider/onboarding/
├── layout.tsx                    # Wizard layout with progress tracker
├── page.tsx                      # Redirects to current step
├── step-1-account/
│   └── page.tsx                  # Account setup (or redirect to login)
├── step-2-business/
│   ├── page.tsx                 # Business basics form
│   ├── BusinessForm.tsx         # Form component
│   └── actions.ts                # saveBusinessInfo action
├── step-3-class-template/
│   ├── page.tsx                 # Class template form
│   ├── ClassTemplateForm.tsx    # Form component
│   └── actions.ts                # saveClassTemplate action
├── step-4-location/
│   ├── page.tsx                 # Location & schedule form
│   ├── LocationForm.tsx         # Form component
│   ├── ScheduleBuilder.tsx      # Schedule component
│   └── actions.ts                # saveVenueAndSchedule action
├── step-5-media/
│   ├── page.tsx                 # Media upload form
│   ├── MediaUploader.tsx        # Upload component
│   └── actions.ts                # uploadMedia action
└── step-6-preview/
    ├── page.tsx                 # Preview & publish
    ├── PreviewCard.tsx          # Preview component
    └── actions.ts                # publishProvider action

components/provider/onboarding/
├── StepNavigation.tsx           # Step nav with progress
├── ProgressTracker.tsx          # Progress indicator
├── SaveStatusIndicator.tsx      # Auto-save status
├── FormSection.tsx              # Reusable form section
├── ImageUploader.tsx            # Image upload with crop
├── MapPicker.tsx                # Map for location
├── ScheduleBuilder.tsx          # Schedule builder
└── PreviewCard.tsx              # Preview component

lib/provider/onboarding/
├── schemas.ts                   # Zod schemas for each step
├── state.ts                     # State management utilities
└── storage.ts                   # Supabase Storage helpers
```

### Route Structure

```
/provider/onboarding                    → Redirects to current step
/provider/onboarding/step-1-account      → Account setup (or login redirect)
/provider/onboarding/step-2-business     → Business basics
/provider/onboarding/step-3-class-template → Class template
/provider/onboarding/step-4-location    → Location & schedule
/provider/onboarding/step-5-media       → Media uploads
/provider/onboarding/step-6-preview      → Preview & publish
```

### State Persistence Strategy

1. **Auto-Save on Field Change**
   - Debounce 500ms
   - Save to `provider_onboarding.saved_data` (jsonb)
   - Update `provider_onboarding.current_step`

2. **Resume from Last Step**
   - On page load, check `provider_onboarding.current_step`
   - Redirect to that step if incomplete
   - Load `saved_data` into form state

3. **Draft State**
   - All data saved as draft until "Publish" clicked
   - Can return to any step to edit
   - No data loss on navigation

### Server Actions Pattern

Each step has a dedicated server action:

```typescript
// Example: step-2-business/actions.ts
"use server";

import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase.server";
import { businessInfoSchema } from "@/lib/provider/onboarding/schemas";

export async function saveBusinessInfo(
  providerId: number,
  formData: FormData
) {
  const supabase = getSupabaseServer();
  
  // Validate
  const data = businessInfoSchema.parse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    // ... etc
  });
  
  // Update providers table
  const { error: providerError } = await supabase
    .from("providers")
    .update({
      name: data.name,
      business_type: data.businessType,
      // ... etc
    })
    .eq("id", providerId);
  
  if (providerError) {
    return { success: false, error: providerError.message };
  }
  
  // Update onboarding progress
  const { error: onboardingError } = await supabase
    .from("provider_onboarding")
    .update({
      current_step: "step-2-business",
      saved_data: data,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_id", providerId);
  
  if (onboardingError) {
    return { success: false, error: onboardingError.message };
  }
  
  return { success: true };
}
```

---

## Part 4: Schema Changes

### Required Database Migrations

#### 1. Update `provider_onboarding` Table

```sql
ALTER TABLE provider_onboarding
ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'step-1-account',
ADD COLUMN IF NOT EXISTS saved_data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS provider_onboarding_current_step_idx 
ON provider_onboarding(current_step);
```

#### 2. Update `providers` Table

```sql
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_name TEXT;

-- Migrate logo from metadata if exists
UPDATE providers
SET logo_url = (metadata->>'logo_url')
WHERE metadata->>'logo_url' IS NOT NULL
AND logo_url IS NULL;
```

#### 3. Create `provider_templates` Table

```sql
CREATE TABLE IF NOT EXISTS provider_templates (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name_template TEXT NOT NULL,
  default_age_min INTEGER NOT NULL DEFAULT 0,
  default_age_max INTEGER NOT NULL DEFAULT 5,
  default_category TEXT NOT NULL,
  description_template TEXT NOT NULL,
  default_price TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 45,
  default_capacity INTEGER,
  default_tags TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id)
);

CREATE INDEX provider_templates_provider_idx ON provider_templates(provider_id);
```

#### 4. Create `provider_media` Table (Optional - can use Storage + saved_data)

```sql
CREATE TABLE IF NOT EXISTS provider_media (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'logo' | 'photo' | 'video' | 'cover'
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, media_type, order_index)
);

CREATE INDEX provider_media_provider_idx ON provider_media(provider_id);
CREATE INDEX provider_media_type_idx ON provider_media(media_type);
```

### Drizzle Schema Updates

Update `shared/schema.ts`:

```typescript
// Update providerOnboarding
export const providerOnboarding = pgTable("provider_onboarding", {
  providerId: integer("provider_id").primaryKey().references(() => providers.id, { onDelete: "cascade" }),
  isComplete: boolean("is_complete").default(false).notNull(),
  completedSteps: jsonb("completed_steps").default([]).notNull(),
  progress: integer("progress").default(0).notNull(),
  currentStep: text("current_step").default("step-1-account"), // NEW
  savedData: jsonb("saved_data").default({}), // NEW
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  currentStepIdx: index("provider_onboarding_current_step_idx").on(table.currentStep), // NEW
}));

// Update providers (add new fields)
export const providers = pgTable("providers", {
  // ... existing fields ...
  businessType: text("business_type"), // NEW
  logoUrl: text("logo_url"), // NEW (migrate from metadata)
  primaryContactName: text("primary_contact_name"), // NEW
  // ... rest of fields ...
});

// New providerTemplates table
export const providerTemplates = pgTable("provider_templates", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  nameTemplate: text("name_template").notNull(),
  defaultAgeMin: integer("default_age_min").notNull().default(0),
  defaultAgeMax: integer("default_age_max").notNull().default(5),
  defaultCategory: text("default_category").notNull(),
  descriptionTemplate: text("description_template").notNull(),
  defaultPrice: text("default_price"),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(45),
  defaultCapacity: integer("default_capacity"),
  defaultTags: text("default_tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  providerIdx: uniqueIndex("provider_templates_provider_idx").on(table.providerId),
}));
```

---

## Part 5: Components & Server Actions

### Required Components

#### 1. `StepNavigation.tsx`

**Purpose:** Navigation between wizard steps with progress indicator

**Props:**
```typescript
interface StepNavigationProps {
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (step: string) => void;
}
```

**Features:**
- Shows all 6 steps
- Highlights current step
- Shows checkmarks for completed steps
- Disables future steps
- Clickable to navigate (if allowed)

#### 2. `ProgressTracker.tsx`

**Purpose:** Visual progress indicator (progress bar or ring)

**Props:**
```typescript
interface ProgressTrackerProps {
  progress: number; // 0-100
  currentStep: number; // 1-6
  totalSteps: number; // 6
}
```

#### 3. `SaveStatusIndicator.tsx`

**Purpose:** Shows auto-save status (saving, saved, error)

**Props:**
```typescript
interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
}
```

#### 4. `FormSection.tsx`

**Purpose:** Reusable form section wrapper

**Props:**
```typescript
interface FormSectionProps {
  title: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

#### 5. `ImageUploader.tsx`

**Purpose:** Image upload with drag-and-drop, preview, crop

**Props:**
```typescript
interface ImageUploaderProps {
  providerId: number;
  type: 'logo' | 'photo' | 'cover';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for landscape
  maxSizeMB?: number;
  maxFiles?: number;
}
```

**Features:**
- Drag-and-drop zone
- File picker button
- Image preview
- Crop tool (using react-image-crop or similar)
- Progress indicator
- Delete functionality
- Multiple file support for photos

#### 6. `MapPicker.tsx`

**Purpose:** Interactive map for selecting venue location

**Props:**
```typescript
interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}
```

**Features:**
- Google Maps or Mapbox integration
- Draggable marker
- Address autocomplete
- Reverse geocoding

#### 7. `ScheduleBuilder.tsx`

**Purpose:** Build weekly recurring schedules

**Props:**
```typescript
interface ScheduleBuilderProps {
  schedules: Schedule[];
  onSchedulesChange: (schedules: Schedule[]) => void;
}

interface Schedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isRecurring: boolean;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  holidayExceptions: string[]; // ISO dates
}
```

**Features:**
- Visual calendar
- Add/remove time slots
- Recurring toggle
- Frequency selector
- Holiday exception date picker
- Preview next 4 weeks

#### 8. `PreviewCard.tsx`

**Purpose:** Preview class listing and provider profile

**Props:**
```typescript
interface PreviewCardProps {
  providerId: number;
  viewMode: 'mobile' | 'desktop';
  data: PreviewData;
}

interface PreviewData {
  provider: ProviderData;
  class: ClassData;
  venue: VenueData;
  schedule: ScheduleData;
  media: MediaData;
}
```

**Features:**
- Toggle mobile/desktop view
- Show actual rendered preview
- SEO preview (title, description, schema)
- Highlight missing fields

### Required Server Actions

#### 1. `saveBusinessInfo(providerId, formData)`

**Location:** `app/provider/onboarding/step-2-business/actions.ts`

**Validation:** Use `businessInfoSchema` from schemas.ts

**Updates:**
- `providers` table
- `provider_onboarding.saved_data`
- `provider_onboarding.current_step`

#### 2. `saveClassTemplate(providerId, formData)`

**Location:** `app/provider/onboarding/step-3-class-template/actions.ts`

**Validation:** Use `classTemplateSchema` from schemas.ts

**Updates:**
- `provider_templates` table (upsert)
- `provider_onboarding.saved_data`
- `provider_onboarding.current_step`

#### 3. `saveVenueAndSchedule(providerId, venueData, scheduleData)`

**Location:** `app/provider/onboarding/step-4-location/actions.ts`

**Validation:** Use `venueSchema` and `scheduleSchema` from schemas.ts

**Updates:**
- `venues` table (insert)
- `class_sessions` table (insert for each schedule)
- `provider_onboarding.saved_data`
- `provider_onboarding.current_step`

#### 4. `uploadMedia(providerId, files, type)`

**Location:** `app/provider/onboarding/step-5-media/actions.ts`

**Validation:**
- File type (MIME type check)
- File size (max 5MB images, 50MB videos)
- Aspect ratio (for logo and cover)

**Updates:**
- Upload to Supabase Storage
- Update `providers.logo_url` if logo
- Store URLs in `provider_onboarding.saved_data` or `provider_media` table
- Update `provider_onboarding.current_step`

#### 5. `publishProvider(providerId, publishAsDraft)`

**Location:** `app/provider/onboarding/step-6-preview/actions.ts`

**Validation:**
- All required fields complete
- At least one class session scheduled
- Cover image uploaded

**Updates:**
- Create first class in `classes` table
- Create class occurrences in `class_occurrences` table
- Set `providers.is_active = true`
- Set `providers.booking_enabled = false`
- Set `provider_onboarding.is_complete = true`
- Set `provider_onboarding.current_step = 'complete'`
- Award onboarding reward (existing logic)
- Send welcome email

### Validation Schemas

**Location:** `lib/provider/onboarding/schemas.ts`

```typescript
import { z } from "zod";

export const businessInfoSchema = z.object({
  name: z.string().min(2).max(100),
  businessType: z.enum(['sole_trader', 'franchise', 'charity', 'limited_company', 'partnership', 'other']),
  logoUrl: z.string().url().optional(),
  about: z.string().min(50).max(2000),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().regex(/^(\+44|0)[1-9]\d{8,9}$/), // UK phone format
  primaryContactName: z.string().min(2).max(100),
});

export const classTemplateSchema = z.object({
  nameTemplate: z.string().min(5).max(200),
  defaultAgeMin: z.number().int().min(0).max(5),
  defaultAgeMax: z.number().int().min(0).max(5),
  defaultCategory: z.string().min(1),
  descriptionTemplate: z.string().min(100).max(2000),
  defaultPrice: z.string().optional(),
  defaultDurationMinutes: z.number().int().min(15).max(180).multipleOf(15),
  defaultCapacity: z.number().int().min(1).max(50).optional(),
  defaultTags: z.array(z.string()).optional(),
}).refine(data => data.defaultAgeMin < data.defaultAgeMax, {
  message: "Minimum age must be less than maximum age",
  path: ["defaultAgeMax"],
});

export const venueSchema = z.object({
  name: z.string().min(2).max(100),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  town: z.string().min(2).max(100),
  county: z.string().max(100).optional(),
  postcode: z.string().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i), // UK postcode
  latitude: z.number().min(49).max(61), // UK bounds
  longitude: z.number().min(-8).max(2), // UK bounds
});

export const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isRecurring: z.boolean(),
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly']).optional(),
  holidayExceptions: z.array(z.string().date()).optional(),
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});
```

---

## Part 6: Redirect Logic & Progress Tracking

### Redirect Strategy

#### 1. Login Redirect

**Location:** `app/provider/(auth)/login/page.tsx`

**Logic:**
```typescript
export default async function ProviderLoginPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (session?.user) {
    // Check onboarding status
    const membership = await getActiveMembershipForUser(supabase, session.user.id);
    if (membership?.providers) {
      const providerId = membership.provider_id;
      const onboarding = await getOnboardingStatus(providerId);
      
      if (!onboarding.isComplete) {
        // Redirect to current step
        redirect(`/provider/onboarding/${onboarding.currentStep || 'step-2-business'}`);
      } else {
        redirect("/provider");
      }
    } else {
      redirect("/provider");
    }
  }

  // Show login form
  return <LoginForm />;
}
```

#### 2. Onboarding Page Redirect

**Location:** `app/provider/onboarding/page.tsx`

**Logic:**
```typescript
export default async function OnboardingPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (!session?.user) {
    redirect("/provider/login?next=/provider/onboarding");
  }

  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  const providerId = membership.provider_id;
  const { data: onboarding } = await supabase
    .from("provider_onboarding")
    .select("current_step, is_complete")
    .eq("provider_id", providerId)
    .single();

  if (onboarding?.is_complete) {
    redirect("/provider");
  }

  // Redirect to current step or step 2
  const currentStep = onboarding?.current_step || "step-2-business";
  redirect(`/provider/onboarding/${currentStep}`);
}
```

#### 3. Provider Console Redirect

**Location:** `app/provider/(console)/page.tsx` (update existing)

**Logic:**
```typescript
// Add after membership check
const { data: onboarding } = await supabase
  .from("provider_onboarding")
  .select("is_complete, current_step")
  .eq("provider_id", providerId)
  .single();

if (!onboarding?.is_complete) {
  const currentStep = onboarding?.current_step || "step-2-business";
  redirect(`/provider/onboarding/${currentStep}`);
}
```

#### 4. Middleware (Optional)

**Location:** `middleware.ts` (update if exists)

**Logic:**
```typescript
// Add provider onboarding check
if (pathname.startsWith('/provider') && !pathname.startsWith('/provider/onboarding') && !pathname.startsWith('/provider/login')) {
  // Check session and onboarding status
  // Redirect if incomplete
}
```

### Progress Tracking

#### Current Step Tracking

- `provider_onboarding.current_step` stores the current step ID
- Updated on every step navigation
- Used to resume from last position

#### Saved Data

- `provider_onboarding.saved_data` stores all form data as JSON
- Auto-saved on every field change (debounced)
- Loaded into form state on page load

#### Completion Tracking

- `provider_onboarding.is_complete` set to `true` on publish
- `provider_onboarding.completed_steps` array tracks which steps are done
- `provider_onboarding.progress` calculated as percentage (0-100)

#### Progress Calculation

```typescript
function calculateProgress(completedSteps: string[], totalSteps: number): number {
  return Math.round((completedSteps.length / totalSteps) * 100);
}
```

---

## Part 7: Integration Plan

### Phase 1: Foundation (Week 1)

1. **Database Migrations**
   - Add `current_step` and `saved_data` to `provider_onboarding`
   - Add `business_type`, `logo_url`, `primary_contact_name` to `providers`
   - Create `provider_templates` table
   - Update Drizzle schema

2. **Basic Wizard Structure**
   - Create all 6 step folders and `page.tsx` files
   - Create `layout.tsx` with `StepNavigation` and `ProgressTracker`
   - Implement redirect logic

3. **Step 2: Business Basics**
   - Create `BusinessForm.tsx`
   - Implement `saveBusinessInfo` action
   - Add validation schema
   - Test auto-save

### Phase 2: Core Steps (Week 2)

4. **Step 3: Class Template**
   - Create `ClassTemplateForm.tsx`
   - Implement `saveClassTemplate` action
   - Add template preview
   - Test template storage

5. **Step 4: Location & Schedule**
   - Create `LocationForm.tsx` and `ScheduleBuilder.tsx`
   - Integrate map picker (Google Maps or Mapbox)
   - Implement `saveVenueAndSchedule` action
   - Test schedule creation

6. **Step 5: Media Uploads**
   - Create `MediaUploader.tsx` with image crop
   - Set up Supabase Storage buckets
   - Implement `uploadMedia` action
   - Test upload flow

### Phase 3: Preview & Polish (Week 3)

7. **Step 6: Preview & Publish**
   - Create `PreviewCard.tsx`
   - Implement mobile/desktop preview toggle
   - Add SEO preview
   - Implement `publishProvider` action
   - Test full flow end-to-end

8. **Integration & Testing**
   - Update provider console redirects
   - Test resume from last step
   - Test auto-save functionality
   - Test validation on all steps
   - Test error handling

### Phase 4: Enhancements (Week 4)

9. **UX Improvements**
   - Add loading states
   - Add error boundaries
   - Add success animations
   - Add help tooltips
   - Add keyboard navigation

10. **Admin Overrides**
    - Create admin page to view onboarding progress
    - Add ability to complete onboarding for providers
    - Add ability to approve providers

### Integration Points

#### With Existing Provider Console

- **Classes Page:** After onboarding, redirect to classes page with success message
- **Venues Page:** Show created venue from onboarding
- **Dashboard:** Remove onboarding banner after completion

#### With Existing Onboarding System

- **Gamification:** Keep existing `completeOnboardingStep()` calls
- **Rewards:** Existing reward logic in `onboardingReward.ts` will trigger on publish
- **Badges:** Existing badge system will award on completion

#### With Authentication

- **Login:** Add `?next=` parameter support
- **Session:** Check onboarding status on every provider route
- **Membership:** Ensure provider membership exists before onboarding

### Testing Checklist

- [ ] All 6 steps can be completed sequentially
- [ ] Auto-save works on all fields
- [ ] Resume from last step works
- [ ] Validation shows errors correctly
- [ ] Media uploads work (logo, photos, cover)
- [ ] Schedule creation works
- [ ] Preview shows correct data
- [ ] Publish creates class and marks complete
- [ ] Redirect logic works on all routes
- [ ] Mobile responsive on all steps
- [ ] Error handling works (network errors, validation errors)
- [ ] Admin can view and override onboarding

### Success Metrics

- **Completion Rate:** % of providers who complete onboarding
- **Time to Complete:** Average time to complete all 6 steps
- **Drop-off Points:** Which step has highest abandonment
- **Error Rate:** % of form submissions with errors
- **Support Tickets:** Number of onboarding-related support requests

---

## Appendix: Reference Implementations

### Treatwell Provider Onboarding
- Multi-step wizard with progress indicator
- Auto-save functionality
- Image upload with crop
- Schedule builder
- Preview before publish

### ClassPass Partner Onboarding
- Step-by-step guided flow
- Validation on blur
- "Skip for now" options
- Mobile-responsive design

### Airbnb Host Onboarding
- Progressive disclosure
- Visual previews
- Help tooltips
- Success celebrations

### Shopify Setup Flow
- Clear progress tracking
- Auto-save
- Validation feedback
- Preview capabilities

---

**End of Specification**





