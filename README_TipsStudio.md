# Tips Studio - Complete Documentation

## Overview

Tips Studio is a comprehensive video management system that allows providers and editors to upload, process, and publish 30-second vertical "Short Tips Videos" for Parent Helper. The system includes upload workflows, background processing, moderation, and front-end integration.

## Architecture

### Technology Stack

- **Frontend**: Next.js 15 App Router + React + TypeScript
- **Backend**: Next.js API Routes + Supabase
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (bucket: `videos`)
- **UI Components**: Tailwind CSS + Radix UI + Framer Motion
- **Carousel**: Embla Carousel
- **Email**: SendGrid

## Data Model

### Tables

#### `videos`
- `id` (uuid, PK)
- `provider_id` (integer, nullable, FK → providers)
- `uploader_id` (uuid, FK → auth.users)
- `title` (text, required)
- `script` (text, nullable)
- `video_url` (text, nullable)
- `thumbnail_url` (text, nullable)
- `status` (text, default: 'draft') - Values: 'draft', 'ready', 'published'
- `tags` (text[], default: [])
- `duration_seconds` (integer, default: 30)
- `created_at` (timestamptz, default: now())
- `published_at` (timestamptz, nullable)

#### `video_jobs`
- `id` (uuid, PK)
- `video_id` (uuid, FK → videos)
- `type` (text) - Values: 'render', 'thumbnail', 'subtitle'
- `status` (text, default: 'pending') - Values: 'pending', 'processing', 'completed', 'failed'
- `log` (jsonb, default: {})
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### Row Level Security (RLS)

- **Service Role**: Full access
- **Uploaders**: Can read/write their own videos
- **Providers**: Can read/write videos associated with their provider_id
- **Public**: Can read published videos only

## API Endpoints

### GET `/api/videos`
Get published videos (public) or all videos for authenticated users.

**Query Parameters:**
- `status` - Filter by status (draft/ready/published)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "title": "string",
      "video_url": "string",
      "thumbnail_url": "string",
      "status": "published",
      "tags": ["tag1", "tag2"],
      "duration_seconds": 30,
      "created_at": "2024-01-20T00:00:00Z",
      "published_at": "2024-01-20T00:00:00Z"
    }
  ]
}
```

### POST `/api/videos`
Create a new video record and upload file.

**Form Data:**
- `title` (required) - Video title
- `script` (optional) - Script or notes
- `tags` (optional) - Comma-separated tags
- `file` (required) - Video file (MP4, MOV, AVI, max 100 MB)
- `add_branding` (optional) - Boolean, add opener/outro

**Response:**
```json
{
  "video": {
    "id": "uuid",
    "title": "string",
    "status": "draft",
    ...
  }
}
```

### GET `/api/videos/[id]`
Get a single video by ID.

**Response:**
```json
{
  "video": {
    "id": "uuid",
    "title": "string",
    ...
  }
}
```

### PATCH `/api/videos/[id]`
Update a video (uploader or admin only).

**Body:**
```json
{
  "title": "string",
  "script": "string",
  "tags": ["tag1", "tag2"],
  "status": "published"
}
```

### POST `/api/videos/render/[id]`
Trigger background video processing.

**Note**: Currently a stub implementation. In production, this should:
1. Download video from Supabase storage
2. Use FFmpeg to:
   - Add branded opener/outro from `/public/assets/branding`
   - Resize to 1080x1920 (vertical format)
   - Ensure 30fps
   - Trim to ~30 seconds
   - Generate thumbnail from first frame
3. Upload processed video and thumbnail back to storage
4. Update video record with new URLs
5. Update job status to completed

## User Interfaces

### Studio Dashboard (`/studio/videos`)

- Lists all videos uploaded by the authenticated user
- Filter by status (draft/ready/published)
- Link to upload new video
- Video cards with thumbnail, title, status, tags

### Upload Form (`/studio/videos/new`)

- Form fields:
  - Title (required)
  - Script (optional)
  - Tags (optional, comma-separated)
  - Video file (drag & drop or click to select)
  - "Add branded opener/outro" checkbox
- File validation:
  - Max size: 100 MB
  - Allowed types: MP4, MOV, AVI
- Progress bar during upload
- Video preview before upload

### Admin Moderation (`/admin/videos`)

- Lists all videos (admin access required)
- Filter by status
- Preview videos
- "Publish" button (sets status to "published" and `published_at` to now())
- Email notification sent to uploader on publish

## Front-end Integration

### VideoCarousel Component

Located at `components/videos/VideoCarousel.tsx`.

**Features:**
- Vertical video carousel (9:16 aspect ratio)
- Embla Carousel integration
- Framer Motion transitions
- Auto-play videos when visible
- Auto-advance carousel (configurable interval)
- Navigation buttons and dot indicators
- Lazy loading support

**Usage:**
```tsx
import VideoCarousel from "@/components/videos/VideoCarousel";

<VideoCarousel
  videos={publishedVideos}
  autoPlay={true}
  autoPlayInterval={5000}
/>
```

**Integration Example:**
Add to city pages (`/city/[slug]`) below Local Expert Tips section:

```tsx
import VideoCarousel from "@/components/videos/VideoCarousel";

// In CityPageClient component
const { data } = await fetch("/api/videos?status=published&limit=10");
const videos = data.videos || [];

{videos.length > 0 && (
  <section className="py-8">
    <h2 className="mb-6 text-2xl font-semibold">Watch Quick Local Tips</h2>
    <VideoCarousel videos={videos} />
  </section>
)}
```

## Processing Pipeline

### Current Implementation (Stub)

The render endpoint (`/api/videos/render/[id]`) currently:
1. Creates a `video_jobs` record with status "pending"
2. Updates status to "processing"
3. Simulates processing delay
4. Updates video status to "ready"
5. Marks job as "completed"

### Production Implementation (TODO)

To implement actual video processing:

1. **Option A: Edge Function** (Recommended)
   - Create Supabase Edge Function
   - Use FFmpeg via `@ffmpeg/ffmpeg` or similar
   - Process video asynchronously
   - Update database on completion

2. **Option B: Vercel Serverless Job**
   - Use Vercel Cron Jobs or Background Functions
   - Process videos in background
   - Update database via API

3. **Option C: External Service**
   - Use services like Cloudinary, Mux, or AWS MediaConvert
   - Webhook callback on completion
   - Update database via webhook handler

**FFmpeg Commands (Reference):**
```bash
# Add opener
ffmpeg -i opener.mp4 -i user_video.mp4 -i outro.mp4 \
  -filter_complex "[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -s 1080x1920 -r 30 -t 30 \
  -c:v libx264 -preset medium -crf 23 \
  output.mp4

# Generate thumbnail
ffmpeg -i user_video.mp4 -ss 00:00:01 -vframes 1 \
  -s 1080x1920 thumbnail.jpg
```

## Social Posting Adapters

### Meta Reels (`lib/social/postToReel.ts`)

Stub implementation for Meta Reels API integration.

**Usage:**
```typescript
import { postToReel } from "@/lib/social/postToReel";

await postToReel({
  videoUrl: "https://...",
  caption: "Your tip video caption",
  thumbnailUrl: "https://...",
  accessToken: "meta_access_token",
});
```

**To Implement:**
1. Set up Meta Developer App
2. Obtain access token with reels permissions
3. Use Meta Graph API: `POST /{page-id}/video_reels`

### TikTok (`lib/social/postToTikTok.ts`)

Stub implementation for TikTok API integration.

**Usage:**
```typescript
import { postToTikTok } from "@/lib/social/postToTikTok";

await postToTikTok({
  videoUrl: "https://...",
  title: "Your tip title",
  description: "Optional description",
  privacyLevel: "PUBLIC_TO_EVERYONE",
  accessToken: "tiktok_access_token",
});
```

**To Implement:**
1. Set up TikTok Developer Portal account
2. Create app and obtain client key/secret
3. Use TikTok Content API: `POST /v2/post/publish/video/init/`

## Security & Performance

### File Validation

- **MIME Types**: `video/mp4`, `video/quicktime`, `video/x-msvideo`
- **Max Size**: 100 MB
- **Validation**: Server-side validation in API routes

### Signed URLs

- Unpublished videos use signed URLs (1-hour expiry)
- Published videos use public URLs
- Signed URLs generated on-demand for authenticated users

### Performance

- Lazy loading of video thumbnails
- Pagination for video lists (default: 20 per page)
- Indexed database queries (status, published_at, uploader_id)
- Async processing to avoid blocking requests

## Feature Flag

Enable/disable Tips Studio via environment variable:

```bash
TIPS_STUDIO_ENABLED=true
```

Checked via `isTipsStudioEnabled()` in `lib/env.ts`.

## Testing

### Unit Tests (TODO)

- Video record creation
- Status transitions (draft → ready → published)
- File validation
- RLS policy enforcement

### E2E Tests (TODO)

- Provider uploads video → status becomes ready
- Admin publishes video → visible in carousel
- Video appears on city page

## Deployment Checklist

1. ✅ Run migration: `supabase/migrations/20250120_tips_studio.sql`
2. ✅ Create Supabase Storage bucket: `videos` (public)
3. ✅ Set environment variable: `TIPS_STUDIO_ENABLED=true`
4. ✅ Add branding assets: `/public/assets/branding/opener.mp4` and `outro.mp4`
5. ⚠️ Implement video processing (currently stub)
6. ⚠️ Set up email notifications (uploader email lookup)
7. ⚠️ Add VideoCarousel to city pages

## Future Enhancements

- [ ] Auto-subtitle generation (OpenAI Whisper or Web Speech API)
- [ ] Video analytics (views, engagement)
- [ ] Video editing tools (trim, filters)
- [ ] Batch upload support
- [ ] Video scheduling (publish at specific time)
- [ ] Social media auto-posting (when published)
- [ ] Video comments/reactions
- [ ] Provider video analytics dashboard

## Support

For issues or questions, contact the development team or refer to:
- API Documentation: `/api/videos` endpoints
- Component Documentation: `components/videos/VideoCarousel.tsx`
- Database Schema: `supabase/migrations/20250120_tips_studio.sql`

