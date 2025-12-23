# Search Ranking v2 - Overview

## 🎯 Purpose

RankBrain-style ranking engine that prioritizes:
- **Relevance** - Text, age, distance, time matching
- **Performance** - Classes that get clicks & bookings
- **Monetisation** - Featured/sponsored listings (controlled boosts)
- **Personalisation** - User history and preferences

---

## 🧠 Ranking Model

### Scoring Formula

```
score = 
  w_text * textRelevance +
  w_age * ageMatch +
  w_distance * distanceScore +
  w_time * timeMatch +
  w_popularity * popularityScore +
  w_conversion * conversionScore +
  w_recency * recencyScore +
  w_profile * profileQualityScore +
  w_engagement * engagementScore +
  w_monetisation * monetisationBoost +
  w_personal * personalizationBoost
```

### Default Weights

```typescript
{
  text: 0.25,        // Text relevance (title, description, category)
  age: 0.15,        // Age match
  distance: 0.15,   // Distance from user
  time: 0.10,       // Day/time match
  popularity: 0.10, // Views, saves, bookings
  conversion: 0.10, // Click → booking rate
  recency: 0.05,    // Newly added/updated classes
  profile: 0.05,    // Profile quality (images, reviews)
  engagement: 0.03, // Time on page, scroll depth
  monetisation: 0.05, // Featured, sponsored boosts
  personalization: 0.07, // User history, preferences
}
```

---

## 📊 Signal Functions

### 1. Text Relevance (0-1)

**Inputs:**
- Query string
- Class title, description, category

**Logic:**
- Exact phrase match in title: +0.4
- Word matches in title: +0.3 (proportional)
- Category match: +0.2
- Description match: +0.1

**Normalization:** Sum capped at 1.0

---

### 2. Age Match (0-1)

**Inputs:**
- Desired child age (months)
- Class age range (min/max months)

**Logic:**
- Perfect match (within range): 1.0 (with slight penalty for edge of range)
- Close match (within 6 months): 0.5 - 0.7
- No match: 0

---

### 3. Distance Score (0-1)

**Inputs:**
- User location (lat/lng)
- Class location (lat/lng)

**Logic:**
- 0-1km: 1.0
- 1-5km: 0.8-1.0 (linear decay)
- 5-10km: 0.5-0.8
- 10-20km: 0.2-0.5
- 20-50km: 0.05-0.2
- 50km+: 0.05

**Uses:** Haversine distance formula

---

### 4. Time Match (0-1)

**Inputs:**
- Desired day (e.g., "Monday")
- Desired time range (e.g., "09:00-12:00")
- Class day of week
- Class time

**Logic:**
- Day match: +0.3 (exact) or +0.15 (partial)
- Time match: +0.2 (within range) or +0.1 (within 1 hour)
- Default: 0.5 (neutral)

---

### 5. Popularity Score (0-1)

**Inputs:**
- Views (30 days)
- Saves (30 days)
- Bookings (30 days)
- Existing popularity_score

**Logic:**
- View score: min(1, views / 1000) * 0.4
- Save score: min(1, saves / 50) * 0.3
- Booking score: min(1, bookings / 20) * 0.3
- Combined: weighted sum * 0.7 + existing_score * 0.3

---

### 6. Conversion Score (0-1)

**Inputs:**
- CTR (30 days)
- Conversion rate (30 days)

**Logic:**
- CTR score: min(1, ctr / 0.1) * 0.6
- Conversion score: min(1, conversion_rate / 0.2) * 0.4
- Combined: weighted sum

---

### 7. Recency Score (0-1)

**Inputs:**
- Created date
- Updated date
- Last booked date

**Logic:**
- Created 0-7 days ago: 1.0 → 0.7
- Updated 0-30 days ago: 0.7 → 0.3
- Booked 0-7 days ago: 0.5 → 0.8
- Default: 0.3

---

### 8. Profile Quality Score (0-1)

**Inputs:**
- Image count
- Description length
- Review count & rating
- Existing profile_quality_score

**Logic:**
- Images: min(0.3, count/5 * 0.3)
- Description: 0.2 (500+ chars), 0.15 (200+), 0.1 (50+)
- Reviews: min(0.2, count/20 * 0.2) + min(0.1, rating/5 * 0.1)
- Existing score: * 0.2

---

### 9. Engagement Score (0-1)

**Inputs:**
- Average time on page (30 days)
- Total views (30 days)

**Logic:**
- 60s+: 1.0
- 30-60s: 0.7
- 10-30s: 0.4
- <10s: 0.2
- Bonus: +0.1 per 100 views (capped)

---

### 10. Monetisation Boost (0-0.25)

**Inputs:**
- Featured until date
- Sponsored until date
- Monetisation tier
- Search rank boost
- Text relevance (for guard)

**Logic:**
- Sponsored (if relevant): +0.15
- Featured (if relevant): +0.08
- Enterprise tier: +0.02
- Sponsored tier: +0.01
- Featured tier: +0.005
- Search rank boost: +0.05 (capped)

**Guard:** If text relevance < 0.2, reduce boost by 50%

---

### 11. Personalization Boost (0-0.3)

**Inputs:**
- User preferred categories
- User preferred age range
- User recent class IDs
- User last city

**Logic:**
- Category match: +0.1
- Age overlap: +0.1
- Recent class match: +0.15
- City match: +0.05

**Cap:** 0.3 total (to avoid overwhelming relevance)

---

## 🔄 Integration

### Search API

Ranking v2 is integrated into `/api/search`:
- Fetches candidates with signals from `v_class_ranking_signals` view
- Builds `RankingContext` from query params
- Calls `rankClassesV2()` to score and sort
- Returns ranked results

### A/B Testing

- `?ab=v1` - Force legacy ranking
- `?ab=v2` - Force v2 ranking
- Default: v2

### Debug Mode

- `?debugRank=1` - Include score and reasons in response
- Shows breakdown of all signal contributions

---

## 📈 Performance Considerations

### Database

- Materialized view `class_daily_metrics_30d` refreshed periodically
- Indexes on ranking fields for fast queries
- View `v_class_ranking_signals` combines classes + metrics

### Caching

- Ranking results can be cached (with short TTL)
- Signals update incrementally (not full recompute)

---

## 🎛️ Tuning

See `docs/SEARCH_RANKING_V2_TUNING.md` for:
- How to adjust weights
- Using debug mode
- A/B testing strategies
- Performance optimization

---

## 🔐 Security

- All ranking logic server-side
- No sensitive data in client
- Deterministic (no randomness)
- Testable and auditable

---

## 📚 Related Documentation

- [Tuning Guide](./SEARCH_RANKING_V2_TUNING.md)
- [QA Checklist](./SEARCH_RANKING_V2_QA.md)








