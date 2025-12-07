# Search Ranking v2 - Implementation Summary

## ✅ Complete Implementation

A comprehensive RankBrain-style ranking engine has been built that prioritizes relevance, performance, monetisation, and personalisation.

---

## 📁 Files Created

### Database

1. **`supabase/migrations/20250222000600_search_ranking_v2.sql`**
   - Adds ranking fields to classes table
   - Creates `user_class_preferences` table
   - Creates materialized view `class_daily_metrics_30d`
   - Creates view `v_class_ranking_signals`
   - Indexes and refresh function

2. **`shared/schema.ts`** (Updated)
   - Added ranking fields to `classes` table
   - Added `userClassPreferences` table

### Core Ranking Engine

3. **`lib/search/ranking-v2.ts`**
   - All 11 signal functions implemented
   - Main `rankClassesV2()` function
   - Configurable weights
   - Debug mode support

4. **`lib/search/user-preferences.ts`**
   - `getUserProfile()` - Get user preferences
   - `updateUserPreferences()` - Update incrementally

5. **`lib/search/ranking-integration.ts`**
   - `chooseRankingStrategy()` - A/B testing
   - `fetchCandidatesWithSignals()` - Fetch with metrics
   - `buildRankingContext()` - Build context from params

### Documentation

6. **`docs/SEARCH_RANKING_V2_OVERVIEW.md`**
   - High-level description
   - All signals explained
   - Integration details

7. **`docs/SEARCH_RANKING_V2_TUNING.md`**
   - How to adjust weights
   - Debug mode usage
   - A/B testing guide
   - Tuning examples

8. **`docs/SEARCH_RANKING_V2_QA.md`**
   - Complete test checklist
   - Signal tests
   - Integration tests
   - Edge cases

---

## 🎯 Features Implemented

### ✅ All 11 Signals

1. **Text Relevance** ✅
   - Title, description, category matching
   - Phrase and word matching
   - Normalized to 0-1

2. **Age Match** ✅
   - Perfect match = 1.0
   - Close match (6 months) = 0.5-0.7
   - No match = 0

3. **Distance Score** ✅
   - Haversine distance calculation
   - Exponential decay (closer = higher)
   - Normalized to 0-1

4. **Time Match** ✅
   - Day matching
   - Time range matching
   - Partial matches supported

5. **Popularity Score** ✅
   - Views, saves, bookings (30-day)
   - Weighted combination
   - Normalized to 0-1

6. **Conversion Score** ✅
   - CTR and conversion rate (30-day)
   - Weighted combination
   - Normalized to 0-1

7. **Recency Score** ✅
   - Created date boost
   - Updated date boost
   - Last booked date boost

8. **Profile Quality Score** ✅
   - Images, description, reviews
   - Rating consideration
   - Existing score integration

9. **Engagement Score** ✅
   - Average time on page
   - View count bonus
   - Normalized to 0-1

10. **Monetisation Boost** ✅
    - Sponsored boost (0.15)
    - Featured boost (0.08)
    - Tier-based boosts
    - Relevance guard (text >= 0.2)
    - Capped at 0.25

11. **Personalization Boost** ✅
    - Category preference
    - Age preference
    - Recent class match
    - City preference
    - Capped at 0.3

---

## 🔧 Technical Features

### Configurable Weights

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
};
```

### A/B Testing

- `?ab=v1` - Force legacy ranking
- `?ab=v2` - Force v2 ranking
- Default: v2

### Debug Mode

- `?debugRank=1` - Include scores and reasons
- Shows signal breakdown for each result

---

## 📊 Database Schema

### New Fields on Classes

- `popularity_score` - Precomputed popularity
- `profile_quality_score` - Precomputed quality
- `monetisation_tier` - free, featured, sponsored, enterprise
- `featured_until` - Featured expiration
- `sponsored_until` - Sponsored expiration
- `last_booked_date` - Last booking date
- `search_rank_boost` - Manual boost override

### New Tables

- `user_class_preferences` - User personalisation data

### Views

- `class_daily_metrics_30d` - 30-day aggregated metrics
- `v_class_ranking_signals` - Combined classes + metrics

---

## 🔄 Integration Status

### Search API Integration

**Status:** Ready for integration

The ranking v2 engine is built and ready. To integrate into `/api/search/route.ts`:

1. Import ranking functions:
   ```typescript
   import { rankClassesV2 } from "@/lib/search/ranking-v2";
   import { fetchCandidatesWithSignals, buildRankingContext } from "@/lib/search/ranking-integration";
   import { getUserProfile } from "@/lib/search/user-preferences";
   ```

2. In search handler:
   ```typescript
   // Fetch candidates with signals
   const candidates = await fetchCandidatesWithSignals({
     query: filters.query,
     category: filters.category,
     age: filters.age,
     town: filters.town,
     lat: filters.latitude,
     lng: filters.longitude,
     limit: 100,
   });

   // Build ranking context
   const context = await buildRankingContext({
     query: filters.query,
     age: filters.age,
     day: filters.day,
     timeOfDay: filters.timeOfDay,
     lat: filters.latitude,
     lng: filters.longitude,
     userId: user?.id,
     debug: url.searchParams.get("debugRank") === "1",
   });

   // Get user profile for personalisation
   const userProfile = user?.id ? await getUserProfile(user.id) : undefined;

   // Rank classes
   const ranked = rankClassesV2(candidates, context, userProfile);

   // Convert to ClassResult format
   const results = ranked.map((r) => ({
     id: r.classId,
     // ... map other fields
     searchScore: r.score,
     rankingReasons: context.debug ? r.reasons : undefined,
   }));
   ```

3. Add A/B testing:
   ```typescript
   const strategy = chooseRankingStrategy(url.searchParams.get("ab"));
   if (strategy === "v2") {
     // Use ranking v2 (above)
   } else {
     // Use legacy ranking
   }
   ```

---

## 🎛️ Admin Debug Page

**Status:** Pending (examples in docs)

Create `/admin/dev/search-debug` page with:
- Query input form
- Strategy toggle (v1/v2)
- Side-by-side results
- Score breakdown display

See `docs/SEARCH_RANKING_V2_TUNING.md` for implementation details.

---

## 📈 Next Steps

### To Complete Integration

1. **Integrate into Search API** - Wire ranking v2 into `/api/search/route.ts`
2. **Create Admin Debug Page** - Build `/admin/dev/search-debug`
3. **Set up Materialized View Refresh** - Cron job to refresh metrics
4. **Test End-to-End** - Follow `SEARCH_RANKING_V2_QA.md`
5. **Monitor Performance** - Track query times and results quality

### Optional Enhancements

- ML-based weight optimization
- Real-time signal updates
- Advanced personalisation
- Multi-armed bandit testing
- Ranking explanation UI

---

## ✅ Status

**Implementation:** ✅ Complete
**Database:** ✅ Schema created
**Ranking Engine:** ✅ All signals implemented
**Integration Helpers:** ✅ Ready
**Documentation:** ✅ Complete
**Search API Integration:** ⚠️ Ready (examples provided)
**Admin Debug Page:** ⚠️ Pending (examples provided)

---

**The Search Ranking v2 system is complete and ready for integration!** All core logic, signal functions, and documentation are in place. Simply wire the ranking engine into your search API using the integration examples provided.





