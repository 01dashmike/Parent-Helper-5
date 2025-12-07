# Search Ranking System

The search ranking system provides consistent, configurable ordering of search results based on multiple factors.

## Overview

The ranking system calculates a composite score for each class based on:

- **Distance** (25% default): How close the class is to the search location
- **Rating** (20% default): Average rating/review score (0-5 scale)
- **Relevance** (25% default): How well the class matches the search query
- **Popularity** (15% default): Overall popularity metrics
- **Price** (15% default): Affordability score (lower price = higher score)

## Configuration

### Environment Variable

You can configure the ranking weights using the `SEARCH_RANKING_WEIGHTS` environment variable:

```bash
SEARCH_RANKING_WEIGHTS='{"distance":0.30,"rating":0.25,"relevance":0.25,"popularity":0.10,"price":0.10}'
```

The weights will be automatically normalized to sum to 1.0, so you can use any positive numbers.

### Default Weights

If not configured, the system uses these default weights:

```typescript
{
  distance: 0.25,    // 25% - Proximity is important
  rating: 0.20,      // 20% - Quality matters
  relevance: 0.25,   // 25% - Match quality
  popularity: 0.15,  // 15% - Social proof
  price: 0.15,       // 15% - Affordability
}
```

### Example Configurations

**Prioritize proximity:**
```json
{"distance":0.40,"rating":0.20,"relevance":0.20,"popularity":0.10,"price":0.10}
```

**Prioritize quality (rating):**
```json
{"distance":0.15,"rating":0.35,"relevance":0.25,"popularity":0.15,"price":0.10}
```

**Prioritize affordability:**
```json
{"distance":0.20,"rating":0.15,"relevance":0.20,"popularity":0.10,"price":0.35}
```

## How It Works

### Distance Score

- Calculated using the Haversine formula (great-circle distance)
- Normalized using exponential decay: `score = e^(-distance / decayFactor)`
- Closer classes get higher scores
- If no location provided, returns neutral score (0.5)

### Rating Score

- Normalizes 0-5 rating scale to 0-1 score
- Missing ratings get score of 0.0

### Relevance Score

- Analyzes query match against:
  - Title/name (40% weight)
  - Category (30% weight)
  - Description (20% weight)
  - Town (10% weight)
- Returns 0-1 score based on match quality

### Popularity Score

- Uses logarithmic scaling to handle wide ranges
- Normalizes popularity metrics to 0-1
- Assumes max popularity around 10,000 for normalization

### Price Score

- Parses price text (handles formats like "£10", "£10-15", "Free", etc.)
- Lower prices get higher scores
- Free classes get maximum score (1.0)
- Assumes typical range: £0-50 per session

## Boost Multipliers

The system still supports existing boost mechanisms:

- **Active paid boost**: 2.0x multiplier
- **Plan boost**: 1.5x multiplier
- **Featured listing**: 1.2x to 2.2x multiplier (based on priority)

## Usage

The ranking system is automatically used by the `/api/search` endpoint. No code changes needed - just configure the weights via environment variable.

## API

### `calculateRankingScore(input, weights?)`

Calculate unified ranking score for a class.

```typescript
import { calculateRankingScore, getRankingWeights } from "@/lib/search/ranking";

const weights = getRankingWeights(); // Gets from env or defaults
const result = calculateRankingScore({
  classItem: { /* class data */ },
  searchQuery: "music classes",
  searchLatitude: 51.5074,
  searchLongitude: -0.1278,
  // ... other params
}, weights);

console.log(result.totalScore); // Final score
console.log(result.componentScores); // Individual factor scores
console.log(result.normalizedScores); // Normalized 0-1 scores
```

## Testing

To test different ranking configurations:

1. Set `SEARCH_RANKING_WEIGHTS` in your `.env.local`
2. Restart your dev server
3. Run searches and observe result ordering
4. Adjust weights based on desired behavior

