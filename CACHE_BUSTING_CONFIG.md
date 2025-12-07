# Cache Busting Configuration

**Last Updated:** 2025-01-16  
**Purpose:** Ensure deployments always fetch fresh JS/CSS/assets

## Configuration Overview

### 1. Build ID Generation (`next.config.mjs`)

Added `generateBuildId` hook that creates unique build identifiers:

```javascript
generateBuildId: async () => {
  // Uses git commit hash + timestamp
  // Format: "abc1234-1705430400000"
  return generateBuildId();
}
```

**How it works:**
- Attempts to use git commit hash (short format) + timestamp
- Falls back to timestamp-only if git is unavailable
- Ensures every build has a unique ID
- Next.js automatically includes buildId in asset paths

**Example build IDs:**
- `a1b2c3d-1705430400000` (with git)
- `build-1705430400000` (fallback)

---

### 2. Automatic Asset Hashing

Next.js automatically handles filename hashing for:

#### JavaScript & CSS Bundles
- **Pattern:** `_next/static/chunks/[name]-[hash].js`
- **Example:** `_next/static/chunks/main-a1b2c3d.js`
- **Cache Control:** `public, max-age=31536000, immutable` (1 year)

#### Images (via Next.js Image Component)
- **Pattern:** `_next/image?url=...&w=...&q=...`
- **Automatic optimization** with query parameters
- **Cache Control:** `public, max-age=31536000, immutable` (1 year)

#### Fonts
- **Pattern:** `_next/static/media/[hash]-[name].woff2`
- **Example:** `_next/static/media/48b06d5330ded355-s.p.woff2`
- **Cache Control:** `public, max-age=31536000, immutable` (1 year)

---

### 3. Cache Headers Configuration

Current cache strategy in `next.config.mjs`:

```javascript
headers: [
  {
    source: "/_next/static/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
    ],
  },
  {
    source: "/images/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
    ],
  },
  {
    source: "/fonts/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
    ],
  },
]
```

**Strategy:**
- **Static assets** (`/_next/static/**`): 1 year cache, immutable
- **Images** (`/images/**`): 1 year cache, immutable
- **Fonts** (`/fonts/**`): 1 year cache, immutable
- **HTML pages**: No cache headers (fetched fresh on each request)

---

## How Cache Busting Works

### On Build Time

1. **Build ID Generated**
   - Unique ID created using git commit + timestamp
   - Stored in `.next/BUILD_ID` file

2. **Asset Hashing**
   - Next.js automatically hashes all JS/CSS filenames
   - Hash is based on file content (content-based hashing)
   - Same content = same hash (enables long-term caching)

3. **HTML Generation**
   - HTML pages reference hashed asset filenames
   - Example: `<script src="/_next/static/chunks/main-a1b2c3d.js">`

### On Deployment

1. **New Build = New Hashes**
   - Changed code → new content hash → new filename
   - Old cached files become orphaned (safe to ignore)

2. **HTML Always Fresh**
   - HTML pages have no cache headers
   - Browser always fetches latest HTML
   - HTML contains references to new hashed assets

3. **Asset Fetching**
   - Browser requests new hashed filename
   - If file doesn't exist in cache → fetches from server
   - If file exists in cache → uses cached version (same hash = same content)

---

## Caching Behavior by Asset Type

### ✅ JavaScript & CSS (Automatic Hashing)
- **Filename includes hash:** `main-[hash].js`
- **Cache:** 1 year, immutable
- **Busting:** Automatic via content hash
- **Status:** ✅ Fully handled by Next.js

### ✅ Images via Next.js Image
- **URL includes query params:** `/_next/image?url=...&w=...&q=...`
- **Cache:** 1 year, immutable
- **Busting:** Automatic via Next.js Image optimization
- **Status:** ✅ Fully handled by Next.js Image component

### ✅ Fonts (Automatic Hashing)
- **Filename includes hash:** `[hash]-[name].woff2`
- **Cache:** 1 year, immutable
- **Busting:** Automatic via content hash
- **Status:** ✅ Fully handled by Next.js

### ⚠️ Static Images in `/public`
- **Path:** `/images/logo.png` (no hash)
- **Cache:** 1 year, immutable
- **Busting:** Manual (change filename or add query param)
- **Recommendation:** Use Next.js Image component for automatic hashing

### ⚠️ Manifest & Favicon
- **Path:** `/manifest.json`, `/favicon.ico`
- **Cache:** Browser default (varies)
- **Busting:** Manual (add version query param if needed)
- **Current:** No versioning (acceptable for rarely-changing files)

---

## Verification

### Check Build ID
```bash
cat .next/BUILD_ID
# Output: a1b2c3d-1705430400000
```

### Check Asset Hashes
```bash
ls .next/static/chunks/
# Output: main-a1b2c3d.js, framework-xyz789.js, etc.
```

### Verify Cache Headers
```bash
curl -I https://parenthelper.co.uk/_next/static/chunks/main-*.js
# Should see: Cache-Control: public, max-age=31536000, immutable
```

---

## Best Practices

1. **Always use Next.js Image component** for images
   - Automatic optimization and hashing
   - Avoids manual cache busting

2. **Don't manually version static assets**
   - Next.js handles hashing automatically
   - Manual versioning is redundant

3. **Use buildId in API responses** (if needed)
   - Access via `process.env.NEXT_PUBLIC_BUILD_ID` (if exposed)
   - Or read from `.next/BUILD_ID` file

4. **Monitor cache hit rates**
   - Check CDN/edge cache statistics
   - Verify assets are being cached correctly

---

## Troubleshooting

### Issue: Users seeing old assets after deployment

**Solution:**
1. Verify build ID changed: `cat .next/BUILD_ID`
2. Check asset hashes changed: `ls .next/static/chunks/`
3. Verify HTML has no cache headers
4. Clear CDN cache if using one

### Issue: Build ID not unique

**Solution:**
- Ensure git is available in build environment
- Or use CI/CD environment variables for version

### Issue: Images not updating

**Solution:**
- Use Next.js Image component instead of `<img>` tags
- Or manually add query param: `?v=${buildId}`

---

## Summary

✅ **JavaScript/CSS:** Automatic hashing via Next.js  
✅ **Images:** Automatic via Next.js Image component  
✅ **Fonts:** Automatic hashing via Next.js  
✅ **Build ID:** Unique per build (git hash + timestamp)  
✅ **Cache Headers:** Optimized for long-term caching with automatic busting  

**Result:** Every deployment automatically busts caches for changed assets while maintaining optimal caching for unchanged assets.

