# Lightweight AI Personalization Implementation

## Overview

Added lightweight AI personalization to the homepage and search using heuristics and past behavior analysis. The system uses simple, efficient algorithms to provide personalized class and provider recommendations without requiring heavy AI/ML infrastructure.

## Architecture

### Server Action: `app/(authed)/home/actions/personalize.ts`

The main personalization logic is implemented as a server action that:
- Extracts user signals from past behavior
- Scores candidate classes using weighted heuristics
- Returns personalized recommendations with explanations

### Components Updated

1. **PersonalizedRecommendationsWrapper.tsx**
   - Gets user ID from Supabase session
   - Passes userId to PersonalizedRecommendations component

2. **PersonalizedRecommendations.tsx**
   - Calls `personalizeForUser` server action
   - Displays recommendations with loading states and error handling
   - Includes safe fallbacks when personalization is unavailable

## Signals Used

The personalization system uses the following signals:

### 1. Search History
- **Source**: `saved_searches` table
- **Signals extracted**:
  - Categories searched
  - Locations searched (towns)
  - Age ranges searched
- **Weight**: Used to build category and location preference maps

### 2. Viewed Classes
- **Source**: 
  - `recommendations` table (classes previously recommended)
  - `simple_bookings` table (classes user has booked)
- **Signals extracted**:
  - Class IDs viewed/booked
  - Used for novelty scoring (prefer unseen classes)

### 3. Category Preferences
- **Source**: 
  - Search history (`saved_searches.filters.category`)
  - User preferences (`user_preferences.preferred_categories`)
- **Signals extracted**:
  - Preferred categories with frequency weights
  - Explicit preferences get higher weights (2x multiplier)

### 4. Locations
- **Source**:
  - Search history (`saved_searches.town`)
  - Family profile (`family_profiles.home_lat`, `home_lng`)
- **Signals extracted**:
  - Preferred towns/locations
  - Home coordinates for distance calculation
  - Location frequency weights

### 5. Child Ages
- **Source**: `child_profiles` table (via `family_profiles`)
- **Signals extracted**:
  - Child ages in months
  - Used for age-appropriateness scoring

## Scoring Algorithm

Classes are scored using weighted heuristics:

```typescript
Score = (w_category × categoryScore) +
        (w_location × locationScore) +
        (w_age × ageScore) +
        (w_popularity × popularityScore) +
        (w_novelty × noveltyScore) +
        (w_distance × distanceScore)
```

### Default Weights
- **Category match**: 0.30 (30%)
- **Location match**: 0.25 (25%)
- **Age fit**: 0.20 (20%)
- **Popularity**: 0.15 (15%)
- **Novelty**: 0.05 (5%)
- **Distance**: 0.05 (5%)

Weights can be customized via `RECS_WEIGHTS` environment variable.

### Scoring Details

1. **Category Score (0-1)**
   - Matches class category to user's preferred categories
   - Weighted by frequency of searches/preferences
   - Normalized to 0-1 range

2. **Location Score (0-1)**
   - Matches class town to user's searched/preferred locations
   - Weighted by frequency

3. **Distance Score (0-1)**
   - Calculates distance from user's home using Haversine formula
   - Score: `1 - (distance / maxRadiusKm)`
   - Only calculated if user has home coordinates

4. **Age Fit Score (0-1)**
   - Checks if any child's age falls within class age range
   - Perfect fit: 1.0, Partial: 0.3, No fit: 0.0

5. **Popularity Score (0-1)**
   - Normalizes class popularity (0-100 scale)
   - Formula: `min(popularity / 100, 1)`

6. **Novelty Score (0-1)**
   - Penalizes previously viewed/booked classes
   - Unseen: 1.0, Seen: 0.2

## Safe Fallbacks

The system includes multiple safe fallbacks:

1. **Feature Disabled**
   - Returns `null` if `PERSONALIZATION_ENABLED` is false
   - Component gracefully handles `null` and shows empty state

2. **Supabase Unavailable**
   - Returns `null` if Supabase client creation fails
   - Catches all errors and returns safe defaults

3. **No User Data**
   - If no signals found, falls back to popular classes
   - Sorted by popularity score
   - Applies basic filters if available (categories, locations)

4. **Error Handling**
   - All errors caught and logged
   - Returns empty arrays on failure
   - Component displays appropriate empty states

5. **Component Level**
   - Shows loading skeletons during fetch
   - Displays empty state with helpful message
   - No crashes if recommendations fail to load

## Usage

### In Server Components

```typescript
import { personalizeForUser } from '@/app/(authed)/home/actions/personalize';

const result = await personalizeForUser(userId);

if (result) {
  // Use result.classes and result.providers
  console.log(result.signals); // Debug info about signals used
}
```

### In Client Components

The `PersonalizedRecommendations` component automatically:
- Gets user ID from Supabase session
- Calls the server action
- Displays recommendations with loading states
- Handles errors gracefully

## Performance Considerations

1. **Efficient Queries**
   - Limits candidate classes to 100
   - Uses indexed columns (user_id, is_active)
   - Filters early by category/location/age

2. **Caching**
   - Recommendations can be cached in `recommendations` table (existing system)
   - Server action results can be cached at page level

3. **Lazy Loading**
   - Only fetches when user is authenticated
   - Component uses Suspense for gradual loading

## Future Enhancements

Potential improvements for more sophisticated personalization:

1. **Embeddings-Based Similarity**
   - Use vector embeddings for semantic category matching
   - Better handling of synonyms and related categories

2. **Time-Based Signals**
   - Weight recent searches more heavily
   - Decay older preferences over time

3. **Provider Preferences**
   - Track favorite providers
   - Recommend new classes from preferred providers

4. **Collaborative Filtering**
   - "Users who viewed X also viewed Y"
   - Recommend based on similar user behavior

5. **Machine Learning**
   - Train model on click-through rates
   - Optimize weights based on user engagement

## Configuration

Environment variables:

- `PERSONALIZATION_ENABLED`: Enable/disable personalization (default: false)
- `RECS_WEIGHTS`: JSON string with custom weights
- `RECS_MAX_RADIUS_KM`: Maximum radius for distance scoring (default: 20)

Example `RECS_WEIGHTS`:
```json
{
  "w_category": 0.35,
  "w_location": 0.25,
  "w_age_fit": 0.20,
  "w_pop": 0.15,
  "w_novelty": 0.05,
  "w_distance": 0.05
}
```

## Testing

To test the personalization:

1. **Create test user with**:
   - Family profile with location
   - Child profiles with ages
   - Saved searches in different categories
   - Some viewed/booked classes

2. **Verify signals extraction**:
   - Check `result.signals` in console
   - Verify categories, locations, ages are captured

3. **Test scoring**:
   - Check class scores and rationales
   - Verify top-scored classes match preferences

4. **Test fallbacks**:
   - Disable feature flag → should return null
   - Remove user data → should show fallback recommendations
   - Simulate error → should gracefully handle

## Files Changed

1. **Created**:
   - `app/(authed)/home/actions/personalize.ts` - Main personalization logic

2. **Updated**:
   - `components/home/PersonalizedRecommendationsWrapper.tsx` - Get user ID
   - `components/home/PersonalizedRecommendations.tsx` - Use server action

