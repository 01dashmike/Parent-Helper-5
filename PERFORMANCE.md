# Performance Optimization Guide

## Running Performance Tests

### 1. Build and Analyze

```bash
npm run analyze
```

This will:
- Build the production bundle
- Start the server on port 4000
- Allow you to run Lighthouse tests

### 2. Run Lighthouse

**Option A - Chrome DevTools:**
1. Open Chrome and navigate to `http://localhost:4000`
2. Open DevTools (F12 or Cmd+Option+I)
3. Click on the "Lighthouse" tab
4. Select categories: Performance, Accessibility, Best Practices, SEO
5. Click "Generate report"

**Option B - CLI:**
```bash
npm install -g lighthouse
lighthouse http://localhost:4000 --view
```

### 3. Target Scores

| Category | Target | Current Optimizations |
|----------|--------|---------------------|
| **Performance** | >90 | WebP/AVIF, lazy loading, code splitting, cache headers |
| **Accessibility** | >90 | ARIA labels, semantic HTML, keyboard nav, contrast fixes |
| **Best Practices** | >95 | HTTPS, no console logs, security headers |
| **SEO** | 100 | Meta tags, structured data, semantic HTML, alt text |

---

## Image Optimization

### Compress Images

```bash
npm run images:opt
```

**What it does:**
- Converts all images in `/public/images` to AVIF and WebP
- Only keeps converted files if they're smaller than originals
- Skips files < 150KB
- Logs savings

**Before/After Example:**
```
✅ AVIF: hero.jpg 2.4MB → 380KB (2.02MB saved)
✅ WebP: hero.jpg 2.4MB → 520KB (1.88MB saved)
```

### Generate Blur Placeholders

```bash
npm run images:blur
```

**What it does:**
- Creates 10x10px blurred thumbnails for Next.js `placeholder="blur"`
- Saves as `*-blur.jpg` alongside originals
- Outputs base64 data URLs for immediate use

**Usage:**
```tsx
<Image
  src="/images/categories/arts.jpg"
  alt="Arts classes"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="/images/categories/arts-blur.jpg"
/>
```

---

## Performance Features Enabled

### Next.js Configuration (`next.config.mjs`)

**Image Optimization:**
- ✅ AVIF format (best compression)
- ✅ WebP fallback (wide compatibility)
- ✅ 1-year cache TTL for images
- ✅ Responsive image sizes

**Cache Headers:**
- `/images/*` - 1 year immutable
- `/_next/static/*` - 1 year immutable
- `/fonts/*` - 1 year immutable

**Code Optimization:**
- ✅ SWC minifier enabled
- ✅ Console logs removed in production (keeps errors/warnings)
- ✅ Modular imports for lucide-react and recharts
- ✅ Tree-shaking enabled

### Map Lazy Loading

Leaflet-heavy components are isolated behind client-only wrappers so that server components never import them directly. This keeps the server tree minimal while still deferring map execution until the browser is ready.

**Benefits:**
- Map code only loads when needed
- Doesn't block initial page render
- Improves Time to Interactive (TTI)

### Analytics Deferring

Non-critical scripts load during idle time:

```tsx
import { defer } from '@/lib/defer';

useEffect(() => {
  defer(() => {
    // Analytics loads when browser is idle
    import('@/lib/analytics');
  });
}, []);
```

---

## Core Web Vitals Targets

| Metric | Target | How We Achieve It |
|--------|--------|-------------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Image optimization, lazy loading, preconnects |
| **FID** (First Input Delay) | < 100ms | Code splitting, deferred scripts, memoization |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Fixed dimensions, skeleton loaders, font optimization |
| **INP** (Interaction to Next Paint) | < 200ms | React.memo, debouncing, efficient re-renders |

---

## Optimization Checklist

### Images
- [x] WebP/AVIF formats enabled
- [x] Blur placeholders generated
- [x] Next/Image components used
- [x] Lazy loading below the fold
- [x] Proper alt text
- [x] Cache headers (1 year)

### JavaScript
- [x] SWC minifier enabled
- [x] Console logs removed (production)
- [x] Dynamic imports for heavy components
- [x] Modular imports (tree-shaking)
- [x] Deferred analytics
- [x] Memoized components

### CSS
- [x] Tailwind purged
- [x] Critical CSS inlined
- [x] Font optimization (font-display: swap)
- [x] Custom Leaflet styles minimized

### Accessibility
- [x] ARIA labels on all inputs
- [x] Semantic HTML
- [x] Keyboard navigation
- [x] Focus indicators
- [x] Screen reader support
- [x] Contrast ratios (WCAG AA)

### SEO
- [x] Dynamic meta tags
- [x] JSON-LD structured data
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Canonical URLs
- [x] Sitemap

---

## Monitoring

### Development
```bash
npm run dev
# Check browser console for warnings
# Use React DevTools Profiler
```

### Production Analysis
```bash
npm run analyze
# Run Lighthouse
# Check Network tab for bundle sizes
```

### Key Metrics to Watch
- Bundle size (aim for < 200KB initial)
- Image sizes (should be < 200KB per image)
- Total page weight (aim for < 1MB)
- Number of requests (aim for < 50)

---

## Troubleshooting

### Slow Build Times
```bash
rm -rf .next
npm run build
```

### Images Not Optimizing
```bash
# Reinstall Sharp
npm install sharp --force
npm run images:opt
```

### Lighthouse Scores Low
1. Check Network throttling is enabled
2. Clear cache and hard reload
3. Test in Incognito mode
4. Check for blocking scripts

---

## Before Deployment

Run this checklist:

```bash
# 1. Optimize images
npm run images:opt
npm run images:blur

# 2. Clean build
rm -rf .next
npm run build

# 3. Test locally
npm start

# 4. Run Lighthouse
# Open http://localhost:3000 in Chrome
# DevTools > Lighthouse > Generate report

# 5. Verify scores >90 in all categories

# 6. Deploy!
```

---

## Additional Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

