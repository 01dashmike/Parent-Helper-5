# Search Ranking v2 - QA Checklist

## ✅ Pre-Deployment Testing

### Database

- [ ] Migration runs successfully
- [ ] All ranking fields added to classes table
- [ ] Materialized view `class_daily_metrics_30d` created
- [ ] View `v_class_ranking_signals` works
- [ ] Indexes created and performant
- [ ] User preferences table created

### Ranking Engine

- [ ] All 11 signal functions implemented
- [ ] Weights sum to ~1.0
- [ ] Scores normalized to 0-1 range
- [ ] Deterministic (same input = same output)
- [ ] No errors in ranking logic

---

## 🧪 Signal Tests

### Text Relevance

- [ ] Exact phrase match scores high
- [ ] Word matches score appropriately
- [ ] Category match works
- [ ] Description match works
- [ ] Empty query returns neutral score

### Age Match

- [ ] Perfect age match = 1.0
- [ ] Close age match (within 6 months) = 0.5-0.7
- [ ] No age match = 0
- [ ] Age outside range = 0
- [ ] No age filter = neutral (0.5)

### Distance Score

- [ ] 0-1km = 1.0
- [ ] 1-5km = 0.8-1.0
- [ ] 5-10km = 0.5-0.8
- [ ] 10-20km = 0.2-0.5
- [ ] 50km+ = 0.05
- [ ] No location = neutral (0.5)

### Time Match

- [ ] Exact day match = +0.3
- [ ] Partial day match = +0.15
- [ ] Time within range = +0.2
- [ ] Time within 1 hour = +0.1
- [ ] No time filter = neutral (0.5)

### Popularity Score

- [ ] High views (1000+) = high score
- [ ] High saves (50+) = high score
- [ ] High bookings (20+) = high score
- [ ] New classes (0 metrics) = low score
- [ ] Existing popularity_score used

### Conversion Score

- [ ] High CTR (10%+) = high score
- [ ] High conversion (20%+) = high score
- [ ] Low CTR/conversion = low score
- [ ] No data = 0

### Recency Score

- [ ] Created 0-7 days = 1.0-0.7
- [ ] Updated 0-30 days = 0.7-0.3
- [ ] Booked 0-7 days = 0.5-0.8
- [ ] Old classes = 0.3

### Profile Quality Score

- [ ] 5+ images = high score
- [ ] Long description (500+ chars) = high score
- [ ] Many reviews (20+) = high score
- [ ] High rating (4.5+) = high score
- [ ] Existing profile_quality_score used

### Engagement Score

- [ ] 60s+ avg time = 1.0
- [ ] 30-60s = 0.7
- [ ] 10-30s = 0.4
- [ ] <10s = 0.2
- [ ] High views bonus works

### Monetisation Boost

- [ ] Sponsored (relevant) = +0.15
- [ ] Featured (relevant) = +0.08
- [ ] Sponsored (low relevance) = +0.05
- [ ] Enterprise tier = +0.02
- [ ] Guard works (text relevance < 0.2 reduces boost)
- [ ] Boost capped at 0.25

### Personalization Boost

- [ ] Category match = +0.1
- [ ] Age overlap = +0.1
- [ ] Recent class match = +0.15
- [ ] City match = +0.05
- [ ] Total capped at 0.3
- [ ] Logged-out users = 0

---

## 🔍 Integration Tests

### Search API

- [ ] Ranking v2 used by default
- [ ] `?ab=v1` forces legacy ranking
- [ ] `?ab=v2` forces v2 ranking
- [ ] `?debugRank=1` shows scores
- [ ] Results sorted by score descending
- [ ] No errors in API response

### A/B Testing

- [ ] Strategy selection works
- [ ] Analytics event fired
- [ ] Both strategies return results
- [ ] Results differ between strategies

### Debug Mode

- [ ] `?debugRank=1` includes scores
- [ ] `reasons` array populated
- [ ] All signals shown in reasons
- [ ] Scores match expectations

---

## 📊 Data Tests

### Materialized View

- [ ] `class_daily_metrics_30d` refreshes correctly
- [ ] Contains last 30 days of data
- [ ] Aggregations correct (sum, avg)
- [ ] CTR calculated correctly
- [ ] Conversion rate calculated correctly

### Ranking View

- [ ] `v_class_ranking_signals` returns data
- [ ] All fields populated
- [ ] Joins work correctly
- [ ] Only active classes included
- [ ] Performance acceptable (< 100ms)

### User Preferences

- [ ] Preferences created on first use
- [ ] Categories updated incrementally
- [ ] Recent class IDs tracked
- [ ] Age preferences stored
- [ ] City preferences stored

---

## 🎯 Search Scenario Tests

### Age-Only Search

**Query:** `?age=baby`

- [ ] Age match dominates ranking
- [ ] Classes outside age range ranked low
- [ ] Close age matches ranked appropriately

### Town-Only Search

**Query:** `?town=London`

- [ ] Distance score used if location provided
- [ ] Town match works
- [ ] Local classes ranked higher

### Category Search

**Query:** `?q=music`

- [ ] Text relevance high for music classes
- [ ] Category match boosts score
- [ ] Non-music classes ranked lower

### Sponsored vs Non-Sponsored

**Query:** `?q=music&debugRank=1`

- [ ] Sponsored classes have monetisation boost
- [ ] But still must be relevant (text >= 0.2)
- [ ] Non-sponsored can still rank high if very relevant

### Logged-In vs Logged-Out

**Query:** `?q=music`

- [ ] Logged-in users get personalization boost
- [ ] Logged-out users don't
- [ ] Both get same base signals

### Cold-Start Classes

**Query:** `?q=music`

- [ ] New classes (no metrics) still appear
- [ ] Recency boost helps
- [ ] Profile quality matters more
- [ ] Not completely buried

---

## 🔐 Security Tests

- [ ] No sensitive data in client
- [ ] All ranking logic server-side
- [ ] User preferences protected
- [ ] No SQL injection risks
- [ ] Input validation works

---

## 📈 Performance Tests

### Query Performance

- [ ] Ranking completes in < 100ms
- [ ] View queries fast (< 50ms)
- [ ] No N+1 queries
- [ ] Indexes used correctly

### Caching

- [ ] Results cached appropriately
- [ ] Cache invalidated on updates
- [ ] Debug mode bypasses cache

---

## 🐛 Edge Cases

### Empty Results

- [ ] No classes match = empty array
- [ ] No errors thrown
- [ ] Response valid JSON

### Missing Data

- [ ] Missing location = neutral distance
- [ ] Missing age = neutral age match
- [ ] Missing metrics = 0 scores
- [ ] Missing preferences = no personalization

### Invalid Inputs

- [ ] Invalid age = handled gracefully
- [ ] Invalid location = handled gracefully
- [ ] Invalid query = handled gracefully
- [ ] No crashes

---

## ✅ Sign-Off

**Tested by:** _______________

**Date:** _______________

**Status:** ☐ Pass  ☐ Fail  ☐ Needs Review

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 🔄 Regression Tests

After any changes, verify:

- [ ] Existing search still works
- [ ] No breaking changes to API
- [ ] Results still relevant
- [ ] Performance not degraded
- [ ] Analytics still track

---

## 📝 Known Issues

List any known issues or limitations:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________








