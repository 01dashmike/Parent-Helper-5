# Provider Photo Upload Tracking for Growth Score

This document describes how provider photo uploads are tracked for the growth score system.

## Overview

The growth score system tracks whether a provider has uploaded at least one photo to any of their classes. This metric is stored in the `provider_growth_score` table's `metrics_json` field as `hasPhotos`.

## Implementation Details

### 1. Photo Detection

The system checks if a provider has photos by:
- Querying all classes belonging to the provider
- Checking if any class has at least one image in the `images` table
- The `hasPhotos` boolean is set to `true` if any class has images

### 2. Growth Score Calculation

The `hasPhotos` metric is calculated in `/app/api/providers/growth-score/route.ts`:
- It queries classes with their associated images
- Checks if any class has at least one image
- Stores the result in `metrics_json.hasPhotos`
- Used in `calculateProfileCompletionScore()` with a weight of 25 points

### 3. Dashboard Display

The `ImproveScoreChecklist` component displays:
- **Completed**: "Upload at least one photo" (when `hasImages` is `true`)
- **Incomplete**: "Upload at least one photo" with a link to `/provider/settings` (when `hasImages` is `false`)

## Recomputing Growth Score

When a provider uploads or deletes a photo, the growth score should be recomputed to reflect the change.

### Option 1: Call the Recompute Endpoint

```typescript
// After uploading or deleting an image
const response = await fetch('/api/providers/growth-score/recompute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ provider_id: providerId }),
});
```

### Option 2: Use the Helper Function

```typescript
import { recomputeProviderGrowthScore } from '@/lib/growth-score/recompute';

// After uploading or deleting an image
await recomputeProviderGrowthScore(providerId);
```

### Option 3: Database Trigger (Future Enhancement)

A database trigger could be added to automatically recompute when images are inserted or deleted:

```sql
CREATE OR REPLACE FUNCTION trigger_provider_growth_score_recompute()
RETURNS TRIGGER AS $$
DECLARE
  provider_id_val INTEGER;
BEGIN
  -- Get provider_id from the class
  IF TG_TABLE_NAME = 'images' THEN
    SELECT provider_id INTO provider_id_val
    FROM classes
    WHERE id = COALESCE(NEW.class_id, OLD.class_id);
    
    -- Invalidate cached growth score
    DELETE FROM provider_growth_score
    WHERE provider_id = provider_id_val
      AND week_start = DATE_TRUNC('week', CURRENT_DATE)::date;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER images_change_recompute_growth_score
  AFTER INSERT OR DELETE ON images
  FOR EACH ROW
  EXECUTE FUNCTION trigger_provider_growth_score_recompute();
```

## Integration Points

To integrate photo upload/deletion tracking:

1. **Find your image upload endpoint** (e.g., `/api/classes/[id]/images` or similar)
2. **After successful upload**, call the recompute endpoint:
   ```typescript
   // After image upload
   if (uploadSuccess) {
     await fetch('/api/providers/growth-score/recompute', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ provider_id: providerId }),
     });
   }
   ```

3. **After successful deletion**, call the recompute endpoint:
   ```typescript
   // After image deletion
   if (deleteSuccess) {
     await fetch('/api/providers/growth-score/recompute', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ provider_id: providerId }),
     });
   }
   ```

## Helper Functions

### `checkProviderHasPhotos(supabase, providerId)`

Located in `/lib/growth-score/checkHasPhotos.ts`

Checks if a provider has at least one uploaded photo by querying all their classes.

### `recomputeProviderGrowthScore(providerId)`

Located in `/lib/growth-score/recompute.ts`

Invalidates the cached growth score for the current week, forcing a fresh calculation on the next request.

## Notes

- The recomputation is non-blocking and happens asynchronously
- The cached score is invalidated immediately, ensuring the next dashboard load shows updated data
- The system uses the existing `images` table relationship with `classes`
- No schema changes are required - `hasPhotos` is stored in the JSONB `metrics_json` field

