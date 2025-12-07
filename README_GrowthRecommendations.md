# AI Growth Recommendations - Complete Documentation

## Overview

The AI Growth Recommendations system analyzes provider analytics and booking data to generate actionable growth insights using OpenAI. It suggests top 3 improvements based on data patterns and displays them in the admin dashboard with action buttons.

## Architecture

### Components

1. **API Route**: `/api/growth-recommendations` - Analyzes data and calls OpenAI
2. **Component**: `GrowthRecommendations.tsx` - Displays recommendations with action buttons
3. **Admin Page**: `/admin/insights` - Shows recommendations section
4. **Tests**: E2E tests with sample data

## API Endpoint

### GET `/api/growth-recommendations`

Analyzes platform data and generates AI-powered recommendations.

**Response:**
```json
{
  "ok": true,
  "recommendations": [
    {
      "title": "Add more classes on Sundays",
      "description": "Sunday has low class coverage compared to other days...",
      "actionType": "add_classes",
      "actionData": {
        "dayOfWeek": "Sunday"
      },
      "priority": 1,
      "expectedImpact": "High"
    },
    ...
  ],
  "analysis": {
    "totalProviders": 50,
    "totalBookings": 200,
    ...
  },
  "generatedAt": "2024-01-20T00:00:00Z"
}
```

**Action Types:**
- `add_classes` - Suggest adding classes on specific days
- `feature_location` - Suggest featuring classes in specific locations
- `optimize_schedule` - Suggest schedule optimizations
- `improve_listing` - Suggest listing improvements
- `expand_coverage` - Suggest expanding geographic coverage

## Data Analysis

The system analyzes:

1. **Provider Metrics** - From `v_provider_metrics` view
2. **Booking Patterns** - Last 30 days of bookings
3. **Class Distribution** - Categories, locations, days of week
4. **Search Analytics** - Popular search terms
5. **Low Performing Areas** - Under-served days/locations

## OpenAI Integration

**Model**: `gpt-4o-mini` (configurable via `OPENAI_MODEL` env var)

**Prompt Structure:**
- System message: Defines role as growth analyst
- User message: Contains formatted data analysis
- Response format: JSON with exactly 3 recommendations

**Fallback**: If OpenAI fails, system uses rule-based recommendations based on data patterns.

## UI Component

### `GrowthRecommendations.tsx`

**Features:**
- Fetches recommendations on mount (if not provided)
- Displays 3 recommendation cards
- Action buttons for each recommendation
- Loading and error states
- Refresh button to regenerate

**Action Button Behavior:**
- `add_classes` → Navigate to `/provider/classes/new?day={dayOfWeek}`
- `feature_location` → Navigate to `/admin/featured?location={location}`
- `optimize_schedule` → Navigate to `/provider/classes`
- `improve_listing` → Navigate to `/provider/classes`
- `expand_coverage` → Navigate to `/providers/register`

## Admin Dashboard Integration

The recommendations appear at `/admin/insights`:
- Located above A/B Testing Controls
- Shows 3 cards in a responsive grid
- Each card shows priority, impact level, and action button

## Testing

### E2E Test: `tests/e2e/growth-recommendations.test.ts`

**Test Cases:**
1. ✅ Returns 3 actionable insights with sample data
2. ✅ Uses fallback recommendations when OpenAI fails
3. ✅ Handles empty data gracefully
4. ✅ Verifies recommendations are actionable

**Sample Data Structure:**
```typescript
{
  providerMetrics: [...],
  bookings: [...],
  classes: [...],
  searchEvents: [...]
}
```

### Running Tests

```bash
npm run test:e2e tests/e2e/growth-recommendations.test.ts
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for generating recommendations
- `OPENAI_MODEL` (optional) - Model to use (default: `gpt-4o-mini`)

## Usage

### Manual Testing

1. **Seed Sample Data** (optional):
   ```sql
   -- Add sample bookings, classes, and analytics events
   -- See test file for example data structure
   ```

2. **Call API**:
   ```bash
   curl http://localhost:3000/api/growth-recommendations
   ```

3. **View in Admin Dashboard**:
   - Navigate to `/admin/insights`
   - Recommendations appear automatically
   - Click "Refresh" to regenerate

### Production Usage

- Recommendations are generated on-demand when admin visits `/admin/insights`
- Click "Refresh" to regenerate with latest data
- Recommendations are cached client-side (refresh to update)

## Recommendation Examples

### Example 1: Add Classes
```json
{
  "title": "Add more classes on Sundays",
  "description": "Sunday has 5 classes compared to an average of 15. Adding classes could capture weekend demand.",
  "actionType": "add_classes",
  "actionData": { "dayOfWeek": "Sunday" },
  "priority": 1,
  "expectedImpact": "High"
}
```

### Example 2: Feature Location
```json
{
  "title": "Feature classes in SW11",
  "description": "SW11 has 20 classes but only 2 are featured. Featuring more could increase visibility.",
  "actionType": "feature_location",
  "actionData": { "location": "SW11" },
  "priority": 2,
  "expectedImpact": "Medium"
}
```

### Example 3: Optimize Schedule
```json
{
  "title": "Optimize sensory class schedules",
  "description": "Sensory classes have high search volume but low booking rates. Optimizing schedules could improve conversion.",
  "actionType": "optimize_schedule",
  "actionData": { "category": "sensory" },
  "priority": 3,
  "expectedImpact": "Medium"
}
```

## Error Handling

- **OpenAI API failure**: Falls back to rule-based recommendations
- **Missing data**: Returns generic recommendations
- **Invalid response**: Parses and validates, falls back if needed
- **Network errors**: Shows error message with retry button

## Performance Considerations

- API call takes ~2-5 seconds (OpenAI latency)
- Data queries are limited (1000 bookings, 500 classes, 500 search events)
- Recommendations are not cached server-side (regenerate on refresh)
- Consider adding caching for production use

## Future Enhancements

- [ ] Cache recommendations for 1 hour
- [ ] Store recommendations in database
- [ ] Track which recommendations were acted upon
- [ ] A/B test recommendation effectiveness
- [ ] Provider-specific recommendations
- [ ] Historical recommendation tracking
- [ ] Export recommendations to CSV
- [ ] Email digest of top recommendations

## Troubleshooting

### No recommendations shown
- Check `OPENAI_API_KEY` is set
- Verify Supabase connection
- Check browser console for errors
- Try clicking "Refresh" button

### OpenAI errors
- Verify API key is valid
- Check API quota/limits
- Review error logs in console
- System will fallback to rule-based recommendations

### Recommendations not actionable
- Verify `actionType` is one of the supported types
- Check `actionData` contains required fields
- Ensure navigation routes exist

