/**
 * Exercise Media Provider (Fallback)
 * 
 * This is now a simplified fallback service for exercises that weren't enriched
 * with ExerciseDB data during plan generation. The primary exercise enrichment
 * happens in lib/wellness/actions.ts using lib/wellness/exercisedb-exercises.ts.
 * 
 * This service is used by ExerciseMediaDisplay as a last resort.
 */

export interface ExerciseMedia {
  gifUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  exerciseName: string;
  source: string;
}

// Simple in-memory cache
const mediaCache = new Map<string, ExerciseMedia>();

/**
 * Get exercise media (fallback for exercises without ExerciseDB enrichment)
 * 
 * Note: The primary method for exercise images is through ExerciseDB API enrichment
 * in the generateExercisePlan action. This function serves as a fallback for:
 * 1. Exercises that weren't matched during enrichment
 * 2. Legacy exercises displayed outside of generated plans
 */
export async function getExerciseMedia(exerciseName: string): Promise<ExerciseMedia> {
  // Check cache first
  const cacheKey = exerciseName.toLowerCase().trim();
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  // Return null media - actual images come from ExerciseDB enrichment in actions.ts
  // This prevents unnecessary API calls since exercises should already have imageUrl
  // from the enrichment process
  const fallbackMedia = createFallbackMedia(exerciseName);
  mediaCache.set(cacheKey, fallbackMedia);
  return fallbackMedia;
}

/**
 * Batch fetch media for multiple exercises
 */
export async function getExerciseMediaBatch(
  exerciseNames: string[]
): Promise<Map<string, ExerciseMedia>> {
  const results = new Map<string, ExerciseMedia>();
  
  for (const name of exerciseNames) {
    const media = await getExerciseMedia(name);
    results.set(name, media);
  }

  return results;
}

/**
 * Create fallback media when no match is found
 */
function createFallbackMedia(exerciseName: string): ExerciseMedia {
  return {
    gifUrl: null,
    imageUrl: null,
    videoUrl: null,
    exerciseName,
    source: "fallback",
  };
}

/**
 * Clear the media cache (useful for testing or forced refresh)
 */
export function clearMediaCache(): void {
  mediaCache.clear();
}
