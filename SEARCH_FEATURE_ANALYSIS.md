# Search Feature Analysis

## Current Search Behavior Summary

The search feature follows this flow:

1. **Entry Point**: `/search` page (`app/search/page.tsx`) - Server component that renders `SearchPageClient`
2. **Client Component**: `SearchPageClient.tsx` manages search state and orchestrates UI
3. **Query Source**: URL search params (`?q=...&town=...&age=...`) via `useSearchParams()`
4. **API Call**: Fetches from `/api/search` with query string parameters
5. **Results Display**: `ResultsSplit.tsx` shows list view, `ResultsSplitMap.tsx` shows map view
6. **Filters**: `QuickFilters.tsx`, `CategoryRail.tsx`, `SearchBarSticky.tsx` allow filtering
7. **Map Integration**: Uses Leaflet with custom `MarkerClusterGroup` for clustering

---

## Search Flow Trace

### 1. Route Entry (`app/search/page.tsx`)
- **Type**: Server Component
- **Renders**: `SearchPageClient` with no props
- **Metadata**: Sets SEO metadata for search page
- **Status**: ✅ Working

### 2. Client Orchestrator (`components/search/SearchPageClient.tsx`)
- **State Management**: 
  - Uses `useSearchParams()` to read URL params (`q`, `town`, `age`)
  - Maintains local state: `results[]`, `loading`, `error`
  - Uses `useMemo` for derived values (headline, events location)
- **API Call**: 
  - Fetches from `/api/search?q=...&town=...&age=...`
  - Uses `AbortController` for cleanup
  - Transforms response: `json.results` → `ClassResult[]`
- **Analytics**: Calls `logSearchPerformed()` after successful fetch
- **Status**: ✅ Working (all imports present)

### 3. API Endpoint (`app/api/search/route.ts`)
- **Input**: URL search params (`q`, `town`, `age`, `lat`, `lng`, `radius`, `category`, `price`)
- **Processing**:
  - Normalizes query strings
  - Builds Supabase query with filters
  - Handles featured listings, boosts, and subscriptions
  - Calculates distances if lat/lng provided
  - Applies sorting (featured first, then distance/date)
- **Output**: `{ results: ClassResult[] }`
- **Status**: ✅ Working

### 4. Results Display (`components/search/ResultsSplit.tsx`)
- **Props**: `results: ClassResult[]`, `onResetFilters?: () => void`
- **Renders**: 
  - List view with `ResultCard` components
  - Map view via `ResultsSplitMap`
  - Empty state when no results
- **Status**: ✅ Working

### 5. Map Component (`components/search/ResultsSplitMap.tsx`)
- **Props**: `points: MapPoint[]`, `center?: [number, number]`, `zoom?: number`
- **Renders**: Leaflet map with markers/clusters
- **Status**: ✅ Working (all imports present)

### 6. Filter Components
- **QuickFilters.tsx**: Age range, price, day filters
- **CategoryRail.tsx**: Category chips
- **SearchBarSticky.tsx**: Sticky search bar
- **Status**: ✅ Working

---

## Concrete Issues Identified

### ✅ VERIFIED: All Components Have Required Imports

**Status**: 
- ✅ `SearchPageClient.tsx` - All imports present (React hooks, Next.js hooks, analytics)
- ✅ `QuickFilters.tsx` - All imports present
- ✅ `CategoryRail.tsx` - All imports present
- ✅ `SaveSearchFAB.tsx` - All imports present
- ✅ `NearbyEvents.tsx` - All imports present
- ✅ `ResultsSplit.tsx` - All imports present
- ✅ `ResultsSplitMap.tsx` - All imports present
- ✅ `MarkerClusterGroup.tsx` - All imports present

---

### ⚠️ MEDIUM: Parameter Name Mismatch

**Location**: `components/search/SearchBarSticky.tsx:19-20, 32-35`

**Issue**: Component uses `loc` state but API expects `town` parameter. The component maps `loc` → `town` in URL, but there's potential confusion.

**Risk**: Low - Currently works but naming inconsistency could cause bugs

**Fix Required**: Consider standardizing on `town` throughout, or document the mapping clearly

---

### ⚠️ LOW: Age Parameter Format Inconsistency

**Location**: `components/search/SearchBarSticky.tsx:7-12, 36-45` vs `SearchPageClient.tsx:47`

**Issue**: 
- `SearchBarSticky` uses `minAge`/`maxAge` URL params and converts to `age` format (`"0-12"`)
- `SearchPageClient` reads `age` directly from URL
- API expects `age` as a string

**Risk**: Low - Works but format conversion adds complexity

**Fix Required**: Standardize age parameter format across all components

---

### ✅ VERIFIED: Map Points Validation

**Location**: `components/search/ResultsSplitMap.tsx:66-79`

**Status**: ✅ Coordinates are validated before mapping. Invalid points are filtered out with proper range checks.

---

### ✅ VERIFIED: Filter State Synced with URL

**Location**: `components/search/QuickFilters.tsx:16-29`, `CategoryRail.tsx:31-36`

**Status**: ✅ Both components correctly update URL params via `router.replace()` with debouncing. Filters persist on refresh and work with browser navigation.

---

### ⚠️ LOW: Missing Loading States in Filter Components

**Location**: `components/search/QuickFilters.tsx`, `CategoryRail.tsx`, `SearchBarSticky.tsx`

**Issue**: Filter components don't show loading state while search is in progress. However, debouncing (300-350ms) prevents rapid clicks.

**Risk**: Low - Minor UX improvement opportunity

**Fix Required**: Disable filters during loading, show loading indicator (optional enhancement)

---

### ✅ VERIFIED: Debouncing Present

**Location**: `components/search/SearchBarSticky.tsx:29-49`

**Status**: ✅ Search bar has 350ms debouncing via `setTimeout` before updating URL params. Prevents excessive API calls.

---

### ⚠️ LOW: Empty Results State Could Be Better

**Location**: `components/search/ResultsSplit.tsx:146-152`

**Issue**: Empty state message is generic, doesn't suggest trying different filters or location.

**Risk**: Low - Minor UX improvement opportunity

**Fix Required**: Add helpful suggestions in empty state

---

### ✅ VERIFIED: All Imports Present

- `SearchPageClient.tsx`: All React/Next.js hooks imported ✅
- `ResultsSplitMap.tsx`: All Leaflet imports present ✅
- `MarkerClusterGroup.tsx`: All React/Leaflet imports present ✅
- `ResultsSplit.tsx`: All component imports present ✅

---

### ✅ VERIFIED: API Response Structure

**Location**: `app/api/search/route.ts:850+`

```typescript
return NextResponse.json({ results: normalizedResults });
```

**Status**: ✅ API correctly returns `{ results: ClassResult[] }` structure

---

## Files That Must Be Touched to Fix Issues

### Priority 1: Medium Priority (Naming/Consistency)

1. **`components/search/SearchBarSticky.tsx`**
   - Consider standardizing `loc` → `town` naming throughout
   - Document the parameter mapping clearly
   - **Current behavior**: Uses `loc` state internally, maps to `town` URL param (works correctly)

2. **`components/search/SearchPageClient.tsx`**
   - Add defensive error handling for API response structure (already has fallback to empty array)
   - Consider adding response validation

### Priority 2: Low Priority (UX Enhancements)

3. **`components/search/QuickFilters.tsx`**
   - Add loading state (disable filters during search) - Optional enhancement
   - Currently works fine with debouncing

4. **`components/search/CategoryRail.tsx`**
   - Add loading state - Optional enhancement
   - Currently works fine

5. **`components/search/SearchBarSticky.tsx`**
   - Add loading state - Optional enhancement
   - Currently works fine with debouncing

6. **`components/search/ResultsSplit.tsx`**
   - Empty state already has good UX, but could add more specific suggestions based on active filters

7. **`app/api/search/route.ts`**
   - Add response validation (already has error handling)
   - Add error logging for malformed queries (already logs errors)
   - Response caching already implemented via `searchCache`

---

## Type Definitions Status

### ✅ `ClassResult` Type
**Location**: `components/search/SearchPageClient.tsx:6-30`

```typescript
export type ClassResult = {
  id: number | string;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  town: string | null;
  age_range: string | null;
  slug?: string | null;
  venueName?: string | null;
  primaryImage?: string | null;
  scheduleSummary?: string | null;
  ageRangeLabel?: string | null;
  priceLabel?: string | null;
  featured?: { ... } | null;
  searchScore?: number | null;
};
```

**Status**: ✅ Well-defined, matches API response structure

### ✅ `MapPoint` Type
**Location**: `components/search/ResultsSplitMap.tsx:7-14`

```typescript
type MapPoint = {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
  distance?: number | null;
};
```

**Status**: ✅ Well-defined, but needs validation (lat/lng may be null in ClassResult)

---

## Summary

### What's Working ✅
- Search page route and client component
- API endpoint with proper filtering
- Results display (list and map)
- Map clustering
- Analytics tracking
- All imports present

### What's Broken ❌
- **CRITICAL**: No validation of API response structure (may fail silently)
- **MEDIUM**: Map may crash with invalid coordinates
- **MEDIUM**: Filter state not synced with URL params

### What Needs Improvement ⚠️
- Loading states in filter components
- Debouncing for search input (if applicable)
- Better empty state messaging
- Error boundaries for map component

### Files Requiring Changes
1. `components/search/SearchPageClient.tsx` (CRITICAL)
2. `components/search/ResultsSplitMap.tsx` (CRITICAL)
3. `components/search/QuickFilters.tsx` (MEDIUM)
4. `components/search/CategoryRail.tsx` (MEDIUM)
5. `components/search/SearchBarSticky.tsx` (MEDIUM)
6. `components/search/ResultsSplit.tsx` (LOW)
7. `app/api/search/route.ts` (LOW - optional improvements)

---

## Recommendations

1. **Immediate**: Add response validation in `SearchPageClient.tsx`
2. **Immediate**: Add coordinate validation in `ResultsSplitMap.tsx`
3. **Soon**: Sync filter state with URL params
4. **Later**: Add loading states and improve empty state UX

