# AI-Powered SEO Metadata Generation

This feature automatically generates SEO metadata (meta_title, meta_description, keywords) for classes using OpenAI GPT models.

## Overview

- **Background Processing**: Metadata generation runs asynchronously via cron job
- **Admin API**: Manual batch generation endpoint for admins
- **Non-blocking**: All processing happens in background, never blocks page loads
- **Model**: Uses GPT-4o-mini by default (configurable via `OPENAI_MODEL` env var)

## Database Schema

The following columns have been added to the `classes` table:

- `meta_title` (TEXT): SEO-optimized title (50-60 characters)
- `meta_description` (TEXT): SEO meta description (150-160 characters)
- `keywords` (TEXT[]): Array of relevant keywords

## Migration

Run the migration to add the columns:

```sql
-- See drizzle/migrations/0000_add_seo_metadata_to_classes.sql
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[];
```

## API Endpoints

### POST /api/admin/seo/generate

Admin-only endpoint to trigger batch SEO metadata generation.

**Query Parameters:**
- `limit` (optional): Number of classes to process (default: 10, max: 100)
- `force` (optional): Force regeneration even if metadata exists (default: false)

**Example:**
```bash
curl -X POST "https://your-domain.com/api/admin/seo/generate?limit=50" \
  -H "ADMIN_SECRET: your-secret"
```

**Response:**
```json
{
  "success": true,
  "processed": 50,
  "succeeded": 48,
  "failed": 2,
  "errors": ["Class 123: Update failed: ..."],
  "message": "Processed 50 classes: 48 succeeded, 2 failed"
}
```

### POST /api/cron/seo-metadata

Background cron job endpoint for async metadata generation.

**Authentication:** Requires `ADMIN_SECRET` or `X-Cron-Secret` header

**Usage:** Set up a cron job to call this endpoint periodically:

```bash
# Example cron job (runs daily at 2 AM)
0 2 * * * curl -X POST "https://your-domain.com/api/cron/seo-metadata" \
  -H "X-Cron-Secret: your-secret"
```

## Usage in Code

### Extract Metadata for a Single Class

```typescript
import { extractClassMetadata } from "@/lib/seo/extractClassMetadata";

const metadata = await extractClassMetadata(
  classDescription,
  className,
  category,
  town
);

// Returns:
// {
//   meta_title: "Baby Sensory Classes in Southampton | Parent Helper",
//   meta_description: "Discover engaging baby sensory classes...",
//   keywords: ["baby classes", "sensory play", "Southampton", ...]
// }
```

### Check SEO Status

```typescript
import { getSeoStatus } from "@/lib/seo/getSeoStatus";

const status = getSeoStatus(classItem);
// Returns: "ready" | "missing" | "outdated"
```

### Display SEO Status Badge

```tsx
import { SeoStatusBadge } from "@/components/admin/SeoStatusBadge";

<SeoStatusBadge classItem={classItem} />
```

## Integration Points

### Class Page Metadata

The class page (`app/class/[id]/page.tsx`) automatically uses AI-generated metadata when available:

- Uses `meta_title` for page title
- Uses `meta_description` for meta description and OG tags
- Uses `keywords` for meta keywords
- Falls back to default values if metadata is missing

### Sitemap

The sitemap (`lib/sitemap.ts`) includes classes with higher priority if they have SEO metadata:

- Classes with `meta_title` get priority 0.7
- Classes without metadata get priority 0.5

## Status Indicators

SEO status is determined as follows:

- **ready**: All metadata fields present and updated within last 90 days
- **missing**: One or more metadata fields are missing
- **outdated**: Metadata exists but hasn't been updated in 90+ days

## Environment Variables

- `OPENAI_API_KEY`: Required - Your OpenAI API key
- `OPENAI_MODEL`: Optional - Model to use (default: "gpt-4o-mini")
- `ADMIN_SECRET`: Required for admin endpoints

## Performance

- Uses GPT-4o-mini by default for faster, cost-effective processing
- Processes classes in batches to avoid rate limiting
- Includes delays between API calls to respect rate limits
- All processing is async and non-blocking

## Error Handling

- Failed extractions are logged but don't stop batch processing
- Individual class failures are reported in the API response
- Missing OpenAI API key returns clear error messages

