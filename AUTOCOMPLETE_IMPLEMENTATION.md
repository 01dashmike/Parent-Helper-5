# Search Autocomplete Implementation

## Components Created/Updated

### 1. `/app/api/search/suggest/route.ts` (NEW)
- **Endpoint**: `GET /api/search/suggest?q={query}`
- **Returns**: Top 5 suggestions (3 classes + 2 providers)
- **Features**:
  - Searches classes by name, description, town, category
  - Searches providers by name, description, town
  - Returns results ordered by popularity (classes) and recency (providers)
  - Cached for 30 seconds
  - Sanitized input to prevent injection

### 2. `/lib/hooks/useDebounce.ts` (NEW)
- **Hook**: `useDebounce<T>(value: T, delay: number = 300)`
- **Purpose**: Debounces input to reduce API calls
- **Default delay**: 300ms

### 3. `/components/search/SearchAutocomplete.tsx` (NEW)
- **Component**: `SearchAutocomplete`
- **Features**:
  - Debounced search (300ms delay)
  - Safe fetch integration with error handling
  - Keyboard navigation (Arrow Up/Down, Enter, Escape)
  - Click-to-fill behavior
  - Loading indicator
  - Clear button
  - Accessible (ARIA attributes)

### 4. `/components/SearchBar.tsx` (UPDATED)
- Integrated `SearchAutocomplete` component
- Maintains existing styling and behavior
- Preserves form submission logic

## Example API Response

```json
{
  "suggestions": [
    {
      "id": 123,
      "name": "Baby Yoga London",
      "type": "class",
      "town": "London",
      "category": "Yoga"
    },
    {
      "id": 456,
      "name": "Music Classes Manchester",
      "type": "class",
      "town": "Manchester",
      "category": "Music"
    },
    {
      "id": 789,
      "name": "Little Dancers",
      "type": "class",
      "town": "Birmingham",
      "category": "Dance"
    },
    {
      "id": 10,
      "name": "Active Kids",
      "type": "provider",
      "town": "Bristol"
    },
    {
      "id": 11,
      "name": "Tiny Tots Academy",
      "type": "provider",
      "town": "Leeds"
    }
  ]
}
```

## UX Flow

### 1. User Types Query
- User types "yoga" in search bar
- After 300ms debounce, API call is made
- Loading spinner appears (if no clear button visible)

### 2. Suggestions Appear
- Dropdown appears below input with up to 5 suggestions
- Each suggestion shows:
  - Icon (📚 for class, 🏢 for provider)
  - Name
  - Category and town (for classes)
  - Town (for providers)

### 3. Keyboard Navigation
- **Arrow Down**: Move to next suggestion
- **Arrow Up**: Move to previous suggestion
- **Enter**: Select highlighted suggestion or submit current query
- **Escape**: Close suggestions dropdown

### 4. Click Selection
- User clicks a suggestion
- Input is filled with suggestion name
- User is navigated to:
  - `/class/{id}` for classes
  - `/classes/{name}` for providers

### 5. Form Submission
- User can still press Enter or click "Explore classes" button
- Navigates to `/classes/{query}` with full search results

## Features

### Debouncing
- 300ms delay prevents excessive API calls
- Previous requests are cancelled when new input arrives
- Reduces server load and improves performance

### Error Handling
- Uses `safeFetch` wrapper for network error handling
- Gracefully handles API failures
- Shows empty suggestions on error (doesn't crash)

### Accessibility
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Proper semantic HTML

### Performance
- Aborts previous requests when new input arrives
- Cached API responses (30 seconds)
- Minimal re-renders with proper React hooks

## Styling

- Matches existing SearchBar design
- Uses existing color scheme (sage, charcoal, slateSoft)
- Responsive dropdown positioning
- Smooth transitions and hover states
- Loading and clear button indicators

