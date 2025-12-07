# Performance Optimizations

This document summarizes the performance optimizations applied to meet Lighthouse thresholds (Performance ≥90, Accessibility ≥90, SEO ≥90, Best Practices ≥85).

## Optimizations Applied

### 1. Homepage (`app/page.tsx`)
- **Added Suspense boundaries** with proper fallbacks for GrowthLoopCards and PersonalizedRecommendations
- **Client wrapper** for PersonalizedRecommendations ensures it mounts only after hydration
- **Impact**: Reduces initial bundle size and improves Time to Interactive (TTI)

### 2. Search Page (`components/search/SearchPageClient.tsx`)
- **Optimized eventsLocation calculation**: Early return for empty results, optimized loop instead of reduce
- **Added Suspense boundary** around NearbyEvents component
- **Client-only sections**: ResultsSplit and NearbyEvents now load through lightweight client wrappers
- **Impact**: Reduces main thread blocking and improves Largest Contentful Paint (LCP)

### 3. City Page (`app/[city]/CityPageClient.tsx`)
- **Client wrappers** for WeatherCard and LocalPhotoChip keep the server tree pure
- **Added Suspense boundaries** around non-critical components
- **Memoized ClassesGrid**: Prevents unnecessary re-renders
- **Impact**: Reduces initial JavaScript bundle and improves First Contentful Paint (FCP)

### 4. Blog Page (`components/blog/PostCard.tsx`)
- **Memoized PostCard component**: Prevents re-renders when parent updates
- **Impact**: Reduces React reconciliation work and improves rendering performance

### 5. Account/Rewards Page (`app/account/rewards/_components/RewardsClient.tsx`)
- **Memoized callbacks**: `fetchSummary` and `handleRedeem` wrapped in `useCallback`
- **Already using useMemo**: Expensive computations (expiringRewards, otherRewards) are memoized
- **Impact**: Prevents unnecessary function recreations and reduces re-renders

### 6. ClassesGrid Component (`app/[city]/ClassesGrid.tsx`)
- **Memoized component**: Prevents re-renders when parent updates
- **Impact**: Reduces React reconciliation work

## Key Techniques Used

1. **Dynamic Imports with `next/dynamic`**:
   - Non-critical components loaded on-demand
   - Reduces initial bundle size
   - Improves Time to Interactive

2. **React.Suspense Boundaries**:
   - Allows progressive rendering
   - Prevents blocking on slow components
   - Provides better loading states

3. **React.memo()**:
   - Prevents unnecessary re-renders
   - Reduces reconciliation overhead
   - Improves rendering performance

4. **useMemo() and useCallback()**:
   - Memoizes expensive computations
   - Prevents function recreation
   - Reduces dependency array triggers

5. **Optimized Calculations**:
   - Early returns for empty data
   - Optimized loops instead of array methods where beneficial
   - Reduced unnecessary iterations

## Remaining Tradeoffs

### Known Limitations

1. **WeatherCard Loading**:
   - Uses `requestIdleCallback` with 2s delay
   - May appear after initial render
   - **Tradeoff**: Better initial load performance vs. immediate weather display

2. **NearbyEvents**:
   - Only loads when user has location data
   - Requires user interaction to load events
   - **Tradeoff**: Reduced initial bundle vs. immediate event display

3. **Dynamic Imports**:
   - Some components may flash during loading
   - Requires careful fallback design
   - **Tradeoff**: Better performance vs. potential visual flicker

4. **Memoization Overhead**:
   - Small memory overhead for memoized components
   - Requires careful dependency management
   - **Tradeoff**: Better performance vs. slightly increased complexity

## Performance Targets

- **Performance**: ≥90 (Lighthouse)
- **Accessibility**: ≥90 (Lighthouse)
- **SEO**: ≥90 (Lighthouse)
- **Best Practices**: ≥85 (Lighthouse)

## Testing

Run performance tests with:
```bash
npm run test:perf
```

This runs Lighthouse audits on:
- `/` (homepage)
- `/search?q=music` (search page)
- `/london` (city page)
- `/blog` (blog index)

## Future Optimizations

Potential future improvements:
1. **Image Optimization**: Ensure all images use Next.js Image component with proper sizing
2. **Font Loading**: Consider font-display: swap for web fonts
3. **Code Splitting**: Further split large components if bundle size increases
4. **Service Worker**: Consider adding for offline support and caching
5. **Preconnect**: Add preconnect hints for external APIs (weather, events)

## Notes

- All optimizations are surgical and focused on high-impact changes
- No major component rewrites were performed
- Existing functionality preserved
- Accessibility maintained throughout

