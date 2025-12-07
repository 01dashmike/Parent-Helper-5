# Onboarding Wizard - QA & Testing Checklist

## ✅ Implementation Status

This document tracks the polish and QA pass for the provider onboarding wizard.

---

## 🧪 Testing Scenarios

### Authentication & Access Control

#### ✅ Test 1: Unauthenticated User
- **Action:** Visit `/provider/onboarding/wizard/step-1-account` without login
- **Expected:** Redirect to `/provider/login`
- **Status:** ✅ Implemented via `checkStepAccess()`

#### ✅ Test 2: User Without Provider Membership
- **Action:** Logged in user without provider membership tries to access wizard
- **Expected:** Redirect to `/provider/login`
- **Status:** ✅ Implemented via `checkStepAccess()`

#### ✅ Test 3: User With Membership
- **Action:** Logged in user with active provider membership
- **Expected:** Allowed to access wizard
- **Status:** ✅ Implemented

---

### Redirect Rules

#### ✅ Test 4: Current Step Enforcement
- **Action:** User on Step 2 tries to visit Step 5 directly
- **Expected:** Redirect to Step 2 (current step)
- **Status:** ✅ Implemented via `checkStepAccess()` and step order validation

#### ✅ Test 5: Complete Onboarding Redirect
- **Action:** User with `is_complete = true` tries to access any step
- **Expected:** Redirect to `/provider` dashboard
- **Status:** ✅ Implemented

#### ✅ Test 6: Refresh-Safe Saved Data
- **Action:** User fills Step 1, refreshes page
- **Expected:** Form pre-fills with saved data
- **Status:** ✅ Implemented - all steps load from `saved_data`

---

### Step Validation

#### ✅ Test 7: Cannot Proceed Without Required Fields
- **Action:** Try to submit Step 1 without email
- **Expected:** 
  - Inline error message below email field
  - Field highlighted with red border
  - Submit button disabled or shows error
- **Status:** ✅ Implemented - Zod validation + inline errors

#### ✅ Test 8: Inline Errors Always Show
- **Action:** Submit form with invalid data
- **Expected:** 
  - Each invalid field shows error message
  - Fields highlighted with `ring-2 ring-red-400`
  - Error messages in red text
- **Status:** ✅ Implemented

#### ✅ Test 9: Auto-Save Triggers Correctly
- **Action:** Fill field, blur, wait 1.5 seconds
- **Expected:** 
  - Data saved to `saved_data` (silently)
  - No page redirect
  - Toast notification (optional)
- **Status:** ⚠️ Partially implemented - hook created, needs integration

---

### Media Upload (Step 4)

#### ✅ Test 10: Upload Success
- **Action:** Upload valid image (jpg, png, webp, < 5MB)
- **Expected:** 
  - Upload progress indicator
  - Success checkmark
  - Thumbnail preview
  - URL saved to state
- **Status:** ✅ Implemented

#### ✅ Test 11: Upload Fail - Invalid Type
- **Action:** Try to upload .pdf file
- **Expected:** 
  - Error message: "Invalid file type"
  - File rejected
  - No upload attempted
- **Status:** ✅ Implemented - client-side validation

#### ✅ Test 12: Upload Fail - Too Large
- **Action:** Try to upload file > 5MB
- **Expected:** 
  - Error message: "File too large"
  - File rejected
- **Status:** ✅ Implemented

#### ✅ Test 13: Too Few Images
- **Action:** Upload only 1-2 gallery images, try to submit
- **Expected:** 
  - Validation error: "Please upload at least 3 class photos"
  - Submit button disabled
  - Yellow warning banner
- **Status:** ✅ Implemented - client + server validation

#### ✅ Test 14: Too Many Images
- **Action:** Try to upload > 5 gallery images
- **Expected:** 
  - Upload disabled after 5 images
  - "Add Photo" button hidden
- **Status:** ✅ Implemented

---

### Preview (Step 5)

#### ✅ Test 15: Cards Render Correctly
- **Action:** Complete Steps 1-4, view Step 5
- **Expected:** 
  - Provider card shows: name, address, contact, logo
  - Class card shows: name, description, images, schedule, price
  - All data from previous steps visible
- **Status:** ✅ Implemented

#### ✅ Test 16: Edit Buttons Work
- **Action:** Click "Edit Step 3" or "Edit Step 4"
- **Expected:** 
  - Navigate to respective step
  - Form pre-filled with existing data
  - Can make changes and return to preview
- **Status:** ✅ Implemented

---

### Publish (Step 6)

#### ✅ Test 17: Class Published Correctly
- **Action:** Click "Publish and Go to Dashboard"
- **Expected:** 
  - `classes.is_published = true`
  - `classes.is_active = true`
  - `provider_onboarding.is_complete = true`
  - `provider_onboarding.current_step = 'complete'`
  - Redirect to `/provider`
- **Status:** ✅ Implemented

#### ✅ Test 18: Summary Displays Correctly
- **Action:** View Step 6 before publishing
- **Expected:** 
  - Summary shows: provider name, address, class name, schedule, media count
  - All checkmarks visible
  - Clear confirmation message
- **Status:** ✅ Implemented

---

## 🎨 UI/UX Checklist

### Loading States

- [x] Submit buttons show spinner when `pending` or `isSubmitting`
- [x] Buttons disabled during submission
- [x] Upload progress indicators (Step 4)
- [ ] Skeleton loaders for initial data fetch (optional)

### Error Display

- [x] Inline field errors below labels
- [x] Fields highlighted with red border on error
- [x] Root error messages in red banner
- [x] Toast notifications for save success/error
- [x] Validation errors prevent submission

### Navigation

- [x] Back button on all steps except Step 1
- [x] "Finish later" link in header
- [x] Progress bar shows current step
- [x] Step indicators show completed/current/pending
- [x] Mobile-friendly sticky footer

### Consistency

- [x] All steps use `WizardShell` wrapper
- [x] All steps use `FormField` component
- [x] All steps use consistent button styling
- [x] All steps use same validation pattern
- [x] All steps use same error display pattern

---

## 🔍 Code Quality Checklist

### Validation

- [x] Client-side Zod validation matches server-side
- [x] All required fields validated
- [x] Email format validated
- [x] Phone number length validated
- [x] Minimum image count enforced (Step 4)
- [x] File type validation (Step 4)
- [x] File size validation (Step 4)

### Redirect Guards

- [x] Server-side guards in all step pages
- [x] Authentication check
- [x] Membership check
- [x] Step order enforcement
- [x] Complete onboarding redirect

### Data Persistence

- [x] All steps save to `saved_data`
- [x] All steps pre-fill from `saved_data` or DB
- [x] Refresh-safe (data persists)
- [x] Auto-save hook created (needs integration)

### Analytics

- [x] Step view tracking
- [x] Step save tracking
- [x] Error tracking
- [x] Completion tracking

---

## 🐛 Known Issues & Limitations

### Auto-Save
- **Status:** Hook created but not fully integrated
- **Impact:** Low - users can still save manually
- **Fix:** Integrate `useAutoSave` into Steps 1-3

### Analytics
- **Status:** Using fetch to `/api/analytics` (may need adjustment)
- **Impact:** Low - analytics failures don't break app
- **Fix:** Verify analytics endpoint accepts onboarding events

### Image Upload
- **Status:** Uses API route (not direct Supabase client)
- **Impact:** Low - works correctly, just not optimal
- **Fix:** Can optimize later for better performance

---

## 📋 Manual Testing Steps

### Complete Flow Test

1. **Start:** Visit `/provider/onboarding` as new provider
2. **Step 1:** Fill name, email, phone → Submit
3. **Step 2:** Fill business details → Submit
4. **Step 3:** Fill class details → Submit
5. **Step 4:** Upload logo + 3+ gallery images → Submit
6. **Step 5:** Review preview → Click "Continue"
7. **Step 6:** Review summary → Click "Publish"
8. **Verify:** Redirected to `/provider`, onboarding complete

### Error Handling Test

1. **Step 1:** Try to submit without email → Should show error
2. **Step 1:** Enter invalid email → Should show error
3. **Step 4:** Upload .pdf file → Should reject
4. **Step 4:** Upload only 1 image → Should show validation error
5. **Step 4:** Try to submit with < 3 images → Should be disabled

### Redirect Test

1. **Complete onboarding:** Set `is_complete = true` in DB
2. **Try to access:** `/provider/onboarding/wizard/step-1-account`
3. **Expected:** Redirect to `/provider`

4. **Set current_step:** `step-2-business` in DB
5. **Try to access:** `/provider/onboarding/wizard/step-5-preview`
6. **Expected:** Redirect to `/provider/onboarding/wizard/step-2-business`

### Refresh Test

1. **Fill Step 1:** Enter name, email, phone
2. **Refresh page:** Press F5
3. **Expected:** Form pre-fills with entered data
4. **Repeat:** For Steps 2, 3, 4

---

## ✅ Completion Status

### Core Features
- [x] All 6 steps implemented
- [x] Validation (client + server)
- [x] Redirect guards
- [x] Loading states
- [x] Error display
- [x] Data persistence
- [x] Analytics tracking

### Polish Features
- [x] Inline error messages
- [x] Field highlighting on error
- [x] Toast notifications
- [x] Progress bar
- [x] Step indicators
- [x] Mobile responsive
- [ ] Auto-save (hook created, needs integration)
- [ ] Skeleton loaders (optional)

### Testing
- [x] QA checklist created
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Performance tested

---

**Last Updated:** [Current Date]
**Status:** ✅ Core implementation complete, polish in progress





