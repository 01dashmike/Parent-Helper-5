# Search Ranking v2 - Tuning Guide

## 🎛️ Adjusting Weights

### Location

Weights are defined in `lib/search/ranking-v2.ts`:

```typescript
export const RANKING_WEIGHTS = {
  text: 0.25,
  age: 0.15,
  distance: 0.15,
  time: 0.10,
  popularity: 0.10,
  conversion: 0.10,
  recency: 0.05,
  profile: 0.05,
  engagement: 0.03,
  monetisation: 0.05,
  personalization: 0.07,
} as const;
```

### How to Adjust

1. **Edit weights directly** in `lib/search/ranking-v2.ts`
2. **Ensure weights sum to ~1.0** (they don't need to sum exactly, but should be close)
3. **Test changes** using debug mode (see below)
4. **Deploy and monitor** analytics

### Common Adjustments

#### More Local Bias

```typescript
distance: 0.25,  // Increase from 0.15
text: 0.20,      // Decrease from 0.25
```

#### More Performance-Focused

```typescript
popularity: 0.15,  // Increase from 0.10
conversion: 0.15,  // Increase from 0.10
text: 0.20,        // Decrease from 0.25
```

#### More Monetisation Boost

```typescript
monetisation: 0.10,  // Increase from 0.05
text: 0.20,          // Decrease from 0.25
```

#### More Personalisation

```typescript
personalization: 0.12,  // Increase from 0.07
text: 0.20,             // Decrease from 0.25
```

---

## 🔍 Debug Mode

### Using `?debugRank=1`

Add `?debugRank=1` to any search query to see ranking breakdown:

```
/api/search?q=music&age=baby&debugRank=1
```

**Response includes:**
- `score` - Total ranking score
- `reasons` - Array of signal contributions

Example:
```json
{
  "results": [
    {
      "id": 123,
      "name": "Baby Music Class",
      "score": 0.723,
      "reasons": [
        "Text: 0.85 (0.213)",
        "Age: 1.00 (0.150)",
        "Distance: 0.92 (0.138)",
        "Popularity: 0.65 (0.065)",
        "..."
      ]
    }
  ]
}
```

---

## 🧪 A/B Testing

### Strategy Selection

Use `?ab=v1` or `?ab=v2` to force a strategy:

```
/api/search?q=music&ab=v1  # Force legacy ranking
/api/search?q=music&ab=v2  # Force v2 ranking
```

### Implementation

The search API checks the `ab` parameter:

```typescript
const strategy = chooseRankingStrategy(url.searchParams.get("ab"));
```

### Analytics

Track which strategy was used:

```typescript
await track("search_rank_strategy_used", {
  strategy: "v1" | "v2",
  query: "...",
});
```

---

## 📊 Admin Debug Page

### Access

Navigate to `/admin/dev/search-debug` (admin-only)

### Features

1. **Query Input**
   - Search query
   - Age filter
   - Location (lat/lng)
   - Day/time filters

2. **Strategy Toggle**
   - Switch between v1 and v2
   - Side-by-side comparison

3. **Results Display**
   - Ranked list with scores
   - Signal breakdown (reasons)
   - Highlight differences

### Usage

1. Enter search parameters
2. Toggle between v1/v2
3. Compare results
4. Inspect score breakdowns
5. Identify ranking issues

---

## 🎯 Tuning Examples

### Example 1: Increase Local Bias

**Problem:** Users want more local results

**Solution:**
```typescript
// In ranking-v2.ts
export const RANKING_WEIGHTS = {
  text: 0.20,      // Reduced
  age: 0.15,
  distance: 0.25,  // Increased
  time: 0.10,
  popularity: 0.10,
  conversion: 0.10,
  recency: 0.05,
  profile: 0.03,   // Reduced
  engagement: 0.02,
  monetisation: 0.05,
  personalization: 0.05,
};
```

**Test:**
```
/api/search?q=music&lat=51.5074&lng=-0.1278&debugRank=1
```

Check that distance scores are higher in top results.

---

### Example 2: Boost New Classes

**Problem:** New classes not appearing in results

**Solution:**
```typescript
export const RANKING_WEIGHTS = {
  text: 0.25,
  age: 0.15,
  distance: 0.15,
  time: 0.10,
  popularity: 0.08,  // Reduced
  conversion: 0.08,   // Reduced
  recency: 0.10,      // Increased
  profile: 0.05,
  engagement: 0.04,
  monetisation: 0.05,
  personalization: 0.05,
};
```

**Test:**
```
/api/search?q=music&debugRank=1
```

Check that classes with high recency scores appear higher.

---

### Example 3: More Monetisation Visibility

**Problem:** Featured/sponsored classes not ranking high enough

**Solution:**
```typescript
export const RANKING_WEIGHTS = {
  text: 0.20,         // Reduced
  age: 0.15,
  distance: 0.15,
  time: 0.10,
  popularity: 0.10,
  conversion: 0.10,
  recency: 0.05,
  profile: 0.05,
  engagement: 0.03,
  monetisation: 0.10,  // Increased
  personalization: 0.07,
};
```

**Also check:** `computeMonetisationBoost()` function - may need to increase boost values.

---

## 📈 Performance Optimization

### Materialized View Refresh

The `class_daily_metrics_30d` view should be refreshed periodically:

```sql
SELECT refresh_class_ranking_signals();
```

**Recommended:** Run every hour via cron job

### Index Maintenance

Ensure indexes are up to date:

```sql
ANALYZE classes;
ANALYZE class_daily_metrics;
```

### Query Performance

Monitor query times:
- Target: < 100ms for ranking
- If slow: Check index usage
- Consider caching ranked results

---

## 🐛 Troubleshooting

### Issue: Scores seem wrong

1. **Check debug mode** - See signal breakdown
2. **Verify data** - Check `v_class_ranking_signals` view
3. **Check weights** - Ensure they're loaded correctly
4. **Test individual signals** - Isolate the problem

### Issue: Featured classes not ranking high

1. **Check featured_until** - Is it in the future?
2. **Check text relevance** - Must be >= 0.2 for full boost
3. **Check monetisation weight** - Is it too low?
4. **Use debug mode** - See monetisation boost value

### Issue: Personalisation not working

1. **Check user logged in** - Personalisation only for logged-in users
2. **Check user preferences** - Do they exist in database?
3. **Check boost cap** - Personalisation capped at 0.3
4. **Use debug mode** - See personalization boost value

---

## 📝 Best Practices

1. **Test before deploying** - Use debug mode extensively
2. **Monitor analytics** - Track conversion rates after changes
3. **A/B test major changes** - Compare v1 vs v2 performance
4. **Document changes** - Note why weights were adjusted
5. **Incremental changes** - Don't change all weights at once
6. **Preserve relevance** - Don't let monetisation overwhelm relevance

---

## 🔄 Rollback Plan

If ranking v2 performs poorly:

1. **Set default to v1:**
   ```typescript
   export function chooseRankingStrategy(abParam?: string | null): "v1" | "v2" {
     if (abParam === "v1") return "v1";
     if (abParam === "v2") return "v2";
     return "v1"; // Rollback to v1
   }
   ```

2. **Or adjust weights** - Return to original values

3. **Monitor** - Check analytics for impact

---

## 📚 Related Documentation

- [Overview](./SEARCH_RANKING_V2_OVERVIEW.md)
- [QA Checklist](./SEARCH_RANKING_V2_QA.md)





