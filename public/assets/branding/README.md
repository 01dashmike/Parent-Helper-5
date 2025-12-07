# Branding Assets

This directory contains branding assets for video processing:

- `opener.mp4` - 2-second branded opener video (1080x1920, 30fps)
- `outro.mp4` - 2-second branded outro video (1080x1920, 30fps)

## Placeholder Files

Currently, these files are placeholders. In production, replace them with actual branded videos:

1. **Opener**: Should include Parent Helper logo/branding, fade in/out effects
2. **Outro**: Should include Parent Helper logo/branding, call-to-action, fade out

## Video Specifications

- Resolution: 1080x1920 (vertical/portrait)
- Frame rate: 30 fps
- Duration: 2 seconds each
- Format: MP4 (H.264)
- Audio: Optional (can be silent)

## Usage

These assets are referenced in the video processing pipeline (`/api/videos/render/[id]`). The FFmpeg processing script will:

1. Concatenate: opener.mp4 + user_video.mp4 + outro.mp4
2. Ensure consistent resolution and frame rate
3. Trim total duration to ~30 seconds
4. Export final video

