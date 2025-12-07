# ARIA-BUSY Accessibility Audit Report

## Summary

Added `aria-busy` attributes to all components that enter a "loading..." UI state to improve accessibility for screen reader users.

## Pattern Applied

```tsx
aria-busy={loading ? "true" : "false"}
```

Applied to:
- Buttons with `isLoading` or `isSubmitting`
- Forms during submit
- Search results during fetch
- List containers when pending

## Files Updated

### Buttons with Loading States

1. ✅ **components/search/SaveSearchFAB.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the save button

2. ✅ **components/search/SaveSearchButton.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the save button

3. ✅ **components/search/NearbyEvents.tsx**
   - Added `aria-busy={loading ? "true" : "false"}` to the "Load events" button

4. ✅ **components/class/QnA.tsx**
   - Added `aria-busy={submitting ? "true" : "false"}` to the "Ask Question" button
   - Added `aria-busy={submitting ? "true" : "false"}` to the "Answer" button

5. ✅ **components/modals/SaveSearchPrompt.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the submit button

6. ✅ **components/onboarding/AddChildModal.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the submit button

7. ✅ **components/family/FamilyProfileForm.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the submit button

### Forms During Submit

1. ✅ **components/class/QnA.tsx**
   - Added `aria-busy={submitting ? "true" : "false"}` to the question form

2. ✅ **components/modals/SaveSearchPrompt.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the form

3. ✅ **components/onboarding/AddChildModal.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the form

4. ✅ **components/family/FamilyProfileForm.tsx**
   - Added `aria-busy={isSubmitting ? "true" : "false"}` to the form

### Search Results During Fetch

1. ✅ **components/search/SearchPageClient.tsx**
   - Added `aria-busy="true"` to the loading section container

2. ✅ **components/search/ResultsSplit.tsx**
   - Added `aria-busy="false"` to the results list container (when not loading)

3. ✅ **components/search/NearbyEvents.tsx**
   - Added `aria-busy="true"` to the loading skeleton container
   - Added `aria-busy="false"` to the events list container (when loaded)

### List Containers When Pending

1. ✅ **components/class/QnA.tsx**
   - Added `aria-busy="true"` to the loading state container
   - Added `aria-busy="false"` to the questions list container (when loaded)

## Implementation Details

### Button Pattern
```tsx
<button
  onClick={handleAction}
  disabled={isSubmitting || isSaved}
  aria-busy={isSubmitting ? "true" : "false"}
>
  {isSubmitting ? "Saving..." : "Save"}
</button>
```

### Form Pattern
```tsx
<form 
  onSubmit={handleSubmit} 
  aria-busy={isSubmitting ? "true" : "false"}
>
  {/* form fields */}
  <button type="submit" aria-busy={isSubmitting ? "true" : "false"}>
    {isSubmitting ? "Submitting..." : "Submit"}
  </button>
</form>
```

### Search Results Pattern
```tsx
{loading ? (
  <section aria-busy="true" aria-label="Loading search results">
    {/* skeleton loaders */}
  </section>
) : (
  <div aria-busy="false">
    <ResultsList results={results} />
  </div>
)}
```

### List Container Pattern
```tsx
{loading ? (
  <div aria-busy="true" aria-label="Loading questions">
    <p>Loading...</p>
  </div>
) : (
  <div className="space-y-6" aria-busy="false">
    {items.map(item => ...)}
  </div>
)}
```

## Accessibility Benefits

1. **Screen Reader Announcements**: Screen readers will announce when content is busy/loading
2. **Better UX**: Users understand when actions are in progress
3. **WCAG Compliance**: Meets accessibility guidelines for dynamic content updates
4. **State Communication**: Clear indication of loading vs. loaded states

## Testing Recommendations

1. **Screen Reader Testing**: Test with NVDA, JAWS, or VoiceOver to verify announcements
2. **Keyboard Navigation**: Ensure buttons remain focusable and functional during loading
3. **State Transitions**: Verify aria-busy changes correctly between true/false
4. **Multiple Loads**: Test rapid successive actions to ensure state is accurate

## Notes

- All fetch logic remains unchanged (as requested)
- Only accessibility attributes were added
- No business logic modifications
- All changes passed linting

## Files Modified

1. `components/search/SaveSearchFAB.tsx`
2. `components/search/SaveSearchButton.tsx`
3. `components/search/SearchPageClient.tsx`
4. `components/search/ResultsSplit.tsx`
5. `components/search/NearbyEvents.tsx`
6. `components/class/QnA.tsx`
7. `components/modals/SaveSearchPrompt.tsx`
8. `components/onboarding/AddChildModal.tsx`
9. `components/family/FamilyProfileForm.tsx`

