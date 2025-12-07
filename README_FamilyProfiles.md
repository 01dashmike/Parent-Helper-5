# Family Profiles System

A comprehensive personalized class discovery system that allows families to create profiles, add children, and receive AI-powered class recommendations based on age, interests, allergies, and location.

## Overview

The Family Profiles system enables parents to:
- Create and manage family profiles with location and preferences
- Add multiple children with ages, interests, and allergies
- Receive personalized class recommendations on the homepage
- View recommendations sorted by relevance score

## Architecture

### Database Schema

**Tables:**
- `family_profiles` - Stores family-level information (location, interests, allergies)
- `children` - Stores individual child profiles linked to families
- `saved_recommendations` - Caches recommendation results for quick access

**Key Features:**
- Row Level Security (RLS) ensures users can only access their own data
- Unique constraints prevent duplicate profiles
- Indexes optimize recommendation queries

### Recommendation Algorithm

The recommendation engine (`lib/recommendations/buildRecommendations.ts`) uses a weighted scoring system:

1. **Age Fit Score (40%)**
   - Perfect match at center of age range = 1.0
   - Outside age range = 0
   - Penalty for being away from center

2. **Interest Match Score (40%)**
   - Matches child and family interests against class name, description, category
   - Higher score for more matches

3. **Distance Score (20%)**
   - Calculated using Haversine formula
   - 0-5km = 1.0, 5-10km = 0.8, 10-20km = 0.6, etc.

4. **Allergy Exclusion**
   - Classes mentioning allergens are automatically excluded
   - Checks both child and family allergies

### API Routes

- `GET /api/recommendations` - Get personalized recommendations for logged-in user
- `POST /api/family` - Create family profile
- `PATCH /api/family/[id]` - Update family profile
- `POST /api/family/children` - Add child profile
- `PATCH /api/family/children/[id]` - Update child profile

### UI Pages

**Family Management:**
- `/family` - View family profile and children list
- `/family/new` - Create new family profile
- `/family/[id]/edit` - Edit family profile

**Child Management:**
- `/family/children/new` - Add new child
- `/family/children/[id]/edit` - Edit child profile

**Homepage Integration:**
- Personalized recommendations section appears when user is logged in
- Uses Suspense and SafeBoundary to prevent homepage crashes
- Dynamically imported to avoid SSR issues

## Features

### 1. Family Profiles
- Home town and postcode for location-based recommendations
- Family-level interests and allergies
- One profile per user (unique constraint)

### 2. Child Profiles
- First name, age (years + months, stored as total months)
- Individual interests and allergies
- Multiple children per family

### 3. Recommendation Engine
- Scores classes based on multiple factors
- Returns top 10 recommendations
- Saves results to `saved_recommendations` for caching
- Excludes classes with allergen keywords

### 4. Homepage Personalization
- "Recommended for your family" section
- Only visible to logged-in users
- Shows top 6 recommendations with scores and reasons
- Link to manage family profile

## Testing

### Unit Tests (`tests/unit/recommendation-scoring.test.ts`)
- Age fit score calculation
- Interest match scoring
- Distance score calculation
- Allergy exclusion logic
- Weighted score combination

### E2E Tests (`tests/e2e/family-recommendations.spec.ts`)
- Full flow: register → create family → add child → see recommendations
- Allergy exclusion verification
- API endpoint testing
- Database persistence verification

## Usage

### For Users

1. **Create Family Profile:**
   - Navigate to `/family/new`
   - Enter home town and postcode (optional)
   - Select family interests and allergies
   - Submit form

2. **Add Children:**
   - Go to `/family`
   - Click "Add Child"
   - Enter child's name, age, interests, allergies
   - Submit form

3. **View Recommendations:**
   - Visit homepage (`/`)
   - Scroll to "Recommended for your family" section
   - Click on classes to view details
   - Click "Manage family profile" to update preferences

### For Developers

**Running Tests:**
```bash
# Unit tests
npm run test tests/unit/recommendation-scoring.test.ts

# E2E tests
npm run test:e2e tests/e2e/family-recommendations.spec.ts
```

**Database Migration:**
```bash
# Apply migration
supabase migration up 20250120_family_profiles
```

**API Usage:**
```typescript
// Get recommendations
const response = await fetch('/api/recommendations');
const { recommendations } = await response.json();

// Create family profile
await fetch('/api/family', {
  method: 'POST',
  body: JSON.stringify({
    home_town: 'London',
    home_postcode: 'SW11 1AA',
    interests: ['music', 'dance'],
    allergies: []
  })
});
```

## Security

- **RLS Policies:** All tables have Row Level Security enabled
- **User Isolation:** Users can only access their own family profiles and children
- **Authentication Required:** All API routes require authenticated users
- **Input Validation:** Zod schemas validate all form inputs

## Performance

- **Caching:** Recommendations are saved to `saved_recommendations` table
- **Indexes:** Database indexes on `user_id`, `family_id`, `score`, `created_at`
- **Lazy Loading:** Recommendations component is dynamically imported
- **Safe Boundaries:** Homepage uses SafeBoundary to prevent crashes

## Future Enhancements

- Postcode lookup API integration for accurate coordinates
- Machine learning model for improved recommendations
- Recommendation history and feedback
- Email notifications for new matching classes
- Social sharing of recommendations
- A/B testing different scoring algorithms

## Troubleshooting

**No recommendations appearing:**
- Verify user has created family profile and added children
- Check that classes exist in database with matching age ranges
- Verify API endpoint returns data: `/api/recommendations`

**Recommendations not updating:**
- Clear `saved_recommendations` table for user
- Call `/api/recommendations` endpoint to regenerate

**Distance not working:**
- Ensure classes have `latitude` and `longitude` set
- Consider integrating postcode lookup API (currently returns neutral score)

## Files Created

- `supabase/migrations/20250120_family_profiles.sql` - Database schema
- `lib/recommendations/buildRecommendations.ts` - Recommendation engine
- `app/api/recommendations/route.ts` - Recommendations API
- `app/api/family/route.ts` - Family CRUD API
- `app/api/family/[id]/route.ts` - Family update API
- `app/api/family/children/route.ts` - Children CRUD API
- `app/api/family/children/[id]/route.ts` - Child update API
- `app/family/page.tsx` - Family dashboard
- `app/family/new/page.tsx` - Create family page
- `app/family/[id]/edit/page.tsx` - Edit family page
- `app/family/children/new/page.tsx` - Add child page
- `app/family/children/[id]/edit/page.tsx` - Edit child page
- `components/family/FamilyProfileForm.tsx` - Family form component
- `components/family/ChildProfileForm.tsx` - Child form component
- `components/home/PersonalizedRecommendations.tsx` - Homepage recommendations
- `tests/unit/recommendation-scoring.test.ts` - Unit tests
- `tests/e2e/family-recommendations.spec.ts` - E2E tests

## Notes

- Age is stored in months for consistency with class age ranges
- Recommendations are recalculated on each API call (can be optimized with caching)
- Distance calculation requires postcode lookup API for production use
- Algorithm weights can be adjusted in `buildRecommendations.ts`

