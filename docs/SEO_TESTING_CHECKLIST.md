# SEO Implementation - Testing Checklist

## ✅ Manual Testing Guide

Use this checklist to verify the SEO implementation is working correctly.

---

## 🧪 Test Scenarios

### 1. Category Page

**URL:** `/classes/baby-music`

**Checklist:**
- [ ] Page loads without errors
- [ ] Title in browser tab: "Baby Music Classes Across the UK | Parent Helper"
- [ ] H1: "Baby Music Classes Across the UK"
- [ ] Intro paragraph present (80-120 words)
- [ ] "Popular Locations" section shows top towns
- [ ] "Filter by Age" section with 3 age chips
- [ ] Class list displays (up to 20 classes)
- [ ] Each class card shows: name, description, category, town, age range, price
- [ ] "You might also like" section at bottom with related links
- [ ] All links are clickable and go to correct pages
- [ ] Page is responsive (mobile/tablet/desktop)

**Expected Behavior:**
- If category has <3 classes → 404
- If category doesn't exist → 404
- Classes sorted by: featured → popularity → reviews

---

### 2. Category + Age Page

**URL:** `/classes/baby-music/baby`

**Checklist:**
- [ ] Page loads without errors
- [ ] Title: "Baby (0–12 months) Baby Music Classes Across the UK | Parent Helper"
- [ ] H1: "Baby (0–12 months) Baby Music Classes Across the UK"
- [ ] Breadcrumb navigation: "Baby Music Classes / Baby"
- [ ] Intro copy mentions age group specifically
- [ ] "Popular Locations" shows towns with baby music classes
- [ ] Class list only shows classes for babies (0-12 months)
- [ ] Related links section present
- [ ] All links work

**Expected Behavior:**
- Only classes where age range overlaps with 0-12 months
- If combo has <3 classes → 404
- If age doesn't exist → 404

---

### 3. Category + Age + Town Page (Money Page)

**URL:** `/classes/baby-music/baby/london`

**Checklist:**
- [ ] Page loads without errors
- [ ] Title: "Baby (0–12 months) Baby Music Classes in London | Parent Helper"
- [ ] H1: "Baby (0–12 months) Baby Music Classes in London"
- [ ] Breadcrumb: "Baby Music Classes / Baby / London"
- [ ] Location-specific intro copy (mentions London)
- [ ] "Filter Classes" section with day/time filters
- [ ] Class list shows classes in London only
- [ ] All classes are for babies (0-12 months)
- [ ] View page source → JSON-LD schema present for top 3 classes
- [ ] Schema includes: Event, Course schemas
- [ ] Related links show sibling pages
- [ ] Links to other categories in London
- [ ] Links to other ages for baby-music in London
- [ ] Links to other towns for baby-music/baby

**Expected Behavior:**
- If combo has <3 classes → 404
- Schema markup validates in Google Rich Results Test
- All filters work (day, time)

---

### 4. Town + Category Page

**URL:** `/london/baby-music`

**Checklist:**
- [ ] Page loads without errors
- [ ] Title: "Baby Music Classes in London | Parent Helper"
- [ ] H1: "Baby Music Classes in London"
- [ ] Breadcrumb: "London / Baby Music Classes"
- [ ] Broader intro copy (mentions all age groups)
- [ ] "Filter by Age" section shows:
  - Baby Baby Music (X classes)
  - Toddler Baby Music (X classes)
  - Preschool Baby Music (X classes)
- [ ] Class list shows classes for all ages
- [ ] Related links present
- [ ] Links to age-specific combos work

**Expected Behavior:**
- If town doesn't exist → 404
- If category doesn't exist → 404
- If combo has <3 classes → 404
- Age filter chips only show if that age has classes

---

### 5. Sitemap

**URL:** `/sitemap.xml`

**Checklist:**
- [ ] Sitemap loads without errors
- [ ] Contains existing pages (home, blog, etc.)
- [ ] Contains SEO category pages (`/classes/[category]`)
- [ ] Contains SEO category+age pages (`/classes/[category]/[age]`)
- [ ] Contains SEO money pages (`/classes/[category]/[age]/[town]`)
- [ ] Contains town+category pages (`/[town]/[category]`)
- [ ] Total URL count is reasonable (< 20k)
- [ ] All URLs have valid `lastModified`, `changeFrequency`, `priority`
- [ ] Money pages have priority 0.9
- [ ] Other SEO pages have priority 0.8

**Expected Behavior:**
- Only includes combinations with ≥3-5 classes
- Limited to top 30 cities for combo pages
- No duplicate URLs
- All URLs are valid and accessible

---

### 6. Schema Markup Validation

**Test Pages:**
- `/classes/baby-music/baby/london`
- Any class detail page

**Checklist:**
- [ ] View page source
- [ ] Find `<script type="application/ld+json">` tags
- [ ] Copy JSON-LD content
- [ ] Test in [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test in [Schema.org Validator](https://validator.schema.org/)
- [ ] Verify Event schema is valid
- [ ] Verify Course schema is valid
- [ ] Verify LocalBusiness schema (if present) is valid
- [ ] No validation errors

**Expected Schema Fields:**
- `@context`: "https://schema.org"
- `@type`: "Event" or "Course"
- `name`: Class name
- `description`: Class description
- `image`: Array of image URLs
- `location`: Place with address
- `organizer`: Organization (provider)
- `offers`: Pricing information
- `aggregateRating`: If reviews exist

---

### 7. Internal Linking

**Test Pages:**
- Any SEO page

**Checklist:**
- [ ] "You might also like" section appears
- [ ] Links to sibling categories (e.g., "Baby Sensory in London")
- [ ] Links to sibling ages (e.g., "Toddler Music in London")
- [ ] Links to sibling towns (e.g., "Baby Music in Manchester")
- [ ] Links to parent pages (broader scope)
- [ ] All links are valid (no 404s)
- [ ] Links only appear if that combo has classes
- [ ] Maximum 8 related links shown

**Expected Behavior:**
- Related links are contextual
- No broken links
- Links help with SEO crawlability

---

### 8. Performance & Caching

**Test:**
- Visit same SEO page multiple times
- Check response headers

**Checklist:**
- [ ] First load: Page renders correctly
- [ ] Subsequent loads: Fast (cached)
- [ ] Response headers include cache directives
- [ ] No slow queries (check server logs)
- [ ] Page loads in < 2 seconds

**Expected Behavior:**
- `revalidate = 3600` (1 hour cache)
- Static generation for common combos
- Efficient database queries

---

### 9. Edge Cases

**Test Cases:**

1. **Invalid Category**
   - Visit `/classes/invalid-category`
   - Expected: 404

2. **Invalid Age**
   - Visit `/classes/baby-music/invalid-age`
   - Expected: 404

3. **Invalid Town**
   - Visit `/classes/baby-music/baby/invalid-town`
   - Expected: 404

4. **Thin Content (No Classes)**
   - Visit combo with <3 classes
   - Expected: 404

5. **Excluded Routes**
   - Visit `/search/baby-music` (should not match town route)
   - Expected: Goes to search page, not town+category page

6. **Case Sensitivity**
   - Visit `/classes/BABY-MUSIC` (uppercase)
   - Expected: Handles gracefully (redirect or 404)

---

### 10. Mobile Responsiveness

**Test on:**
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1920px width)

**Checklist:**
- [ ] Layout adapts correctly
- [ ] Text is readable
- [ ] Buttons/links are tappable
- [ ] Images load correctly
- [ ] No horizontal scrolling
- [ ] Navigation works

---

## 🔍 Schema Validation Tools

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Paste URL or HTML

2. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - Paste JSON-LD

3. **Google Search Console**
   - Submit sitemap
   - Monitor indexing

---

## 📊 Expected Results

### Sitemap Size
- **Category pages**: ~20-30 URLs
- **Category+age pages**: ~60-90 URLs
- **Money pages**: ~150-300 URLs (top combos only)
- **Town+category pages**: ~150-300 URLs
- **Total SEO URLs**: ~500-1000 (well under 10k limit)

### Page Load Times
- **First load**: < 2 seconds
- **Cached load**: < 500ms
- **Database queries**: < 200ms each

### Schema Coverage
- **Top 3 classes** on money pages have schema
- **All class detail pages** have schema
- **Provider pages** have schema (if implemented)

---

## ✅ Success Criteria

The SEO implementation is successful if:

1. ✅ All 4 route types work correctly
2. ✅ Schema markup validates in Google's tools
3. ✅ Sitemap includes SEO pages (reasonable count)
4. ✅ Internal linking works and is contextual
5. ✅ Pages load fast (< 2s)
6. ✅ No 404s for valid combinations
7. ✅ Mobile responsive
8. ✅ SEO copy is present and relevant

---

## 🐛 Common Issues

### Issue: 404 for valid combinations
**Fix:** Check `categoryHasEnoughClasses()` threshold (should be 3, not 5)

### Issue: Schema validation errors
**Fix:** Check JSON-LD structure, ensure all required fields present

### Issue: Sitemap too large
**Fix:** Reduce city limit or increase minimum class threshold

### Issue: Slow page loads
**Fix:** Check database indexes, add caching, optimize queries

### Issue: Related links not showing
**Fix:** Check `getClassCountForCombo()` is working correctly

---

**Last Updated:** [Current Date]
**Status:** ✅ Ready for testing








