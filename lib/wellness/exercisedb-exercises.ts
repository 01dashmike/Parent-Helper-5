/**
 * ExerciseDB Exercise Library Service
 * 
 * Fetches and caches exercises from the ExerciseDB API (via RapidAPI).
 * Used as the source of truth for exercise planning.
 * Provides 11,000+ exercises with GIFs, videos, and detailed instructions.
 * 
 * API Documentation: https://exercisedb.dev
 */

// ============================================================================
// Types
// ============================================================================

export interface ExerciseDBExerciseDetail {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
  instructions: string[];
  secondaryMuscles: string[];
}

export interface ExerciseDBExerciseSummary {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
}

// Alias types for backward compatibility with Gym-Fit interface
export type GymFitExerciseDetail = ExerciseDBExerciseDetail;
export type GymFitExerciseSummary = ExerciseDBExerciseSummary;

// ============================================================================
// Cache
// ============================================================================

let exerciseSummaryCache: ExerciseDBExerciseSummary[] | null = null;
let exerciseDetailCache: Map<string, ExerciseDBExerciseDetail> = new Map();
let cacheTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all exercises from ExerciseDB API
 * Returns exercises with GIF URLs for visual demonstrations
 */
export async function getAvailableExercises(): Promise<ExerciseDBExerciseSummary[]> {
  // Return from cache if still valid
  if (exerciseSummaryCache && Date.now() - cacheTime < CACHE_DURATION) {
    return exerciseSummaryCache;
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn("RAPIDAPI_KEY not configured");
    return [];
  }

  try {
    // ExerciseDB requires a high limit to get all exercises (they have 1300+)
    // Using limit=1500 to ensure we get all exercises
    const response = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises?limit=1500&offset=0",
      {
        headers: {
          "x-rapidapi-host": "exercisedb.p.rapidapi.com",
          "x-rapidapi-key": apiKey.trim(),
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`ExerciseDB API error: ${response.status} ${response.statusText}`, errorText);
      return [];
    }

    const exercises = await response.json();

    if (!Array.isArray(exercises)) {
      console.error("ExerciseDB API: Unexpected response format", exercises);
      return [];
    }

    // Map ExerciseDB response to our interface
    // GIF URLs are routed through our proxy which adds the API key server-side
    const mappedExercises: ExerciseDBExerciseSummary[] = exercises
      .filter((ex: any) => ex.id) // All exercises with IDs can have GIFs
      .map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        bodyPart: capitalizeFirst(ex.bodyPart) || "Other",
        equipment: capitalizeFirst(ex.equipment) || "Bodyweight",
        target: capitalizeFirst(ex.target) || "",
        // Use our proxy endpoint which handles authentication server-side
        gifUrl: `/api/wellness/exercise-image?exerciseId=${ex.id}`,
      }));

    console.log(`[ExerciseDB] Loaded ${mappedExercises.length} exercises`);

    // Cache the result
    exerciseSummaryCache = mappedExercises;
    cacheTime = Date.now();

    return mappedExercises;
  } catch (error) {
    console.error("Error fetching ExerciseDB exercises:", error);
    return [];
  }
}

/**
 * Get exercises grouped by body part (for AI prompt)
 */
export async function getExercisesByBodyPart(): Promise<Record<string, string[]>> {
  const exercises = await getAvailableExercises();
  
  const grouped: Record<string, string[]> = {};
  
  for (const exercise of exercises) {
    const bodyPart = exercise.bodyPart || "Other";
    if (!grouped[bodyPart]) {
      grouped[bodyPart] = [];
    }
    grouped[bodyPart].push(exercise.name);
  }

  return grouped;
}

/**
 * Get full exercise details by ID
 */
export async function getExerciseDetail(exerciseId: string): Promise<ExerciseDBExerciseDetail | null> {
  // Check cache first
  if (exerciseDetailCache.has(exerciseId)) {
    return exerciseDetailCache.get(exerciseId)!;
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn("RAPIDAPI_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/exercise/${exerciseId}`,
      {
        headers: {
          "x-rapidapi-host": "exercisedb.p.rapidapi.com",
          "x-rapidapi-key": apiKey.trim(),
        },
        cache: "force-cache",
      }
    );

    if (!response.ok) {
      console.error(`ExerciseDB API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Use our proxy endpoint which handles authentication server-side
    const gifUrl = `/api/wellness/exercise-image?exerciseId=${data.id || exerciseId}`;

    const detail: ExerciseDBExerciseDetail = {
      id: data.id || exerciseId,
      name: data.name || "",
      bodyPart: capitalizeFirst(data.bodyPart) || "Other",
      equipment: capitalizeFirst(data.equipment) || "Bodyweight",
      target: capitalizeFirst(data.target) || "",
      gifUrl: gifUrl,
      instructions: data.instructions || [],
      secondaryMuscles: (data.secondaryMuscles || []).map((m: string) => capitalizeFirst(m)),
    };

    // Cache the detail
    exerciseDetailCache.set(exerciseId, detail);

    return detail;
  } catch (error) {
    console.error(`Error fetching exercise detail for ${exerciseId}:`, error);
    return null;
  }
}

/**
 * Get exercise by name (case-insensitive match)
 */
export async function getExerciseByName(name: string): Promise<ExerciseDBExerciseSummary | null> {
  const exercises = await getAvailableExercises();
  const normalizedName = name.toLowerCase().trim();
  
  // Try exact match first
  let match = exercises.find(ex => ex.name.toLowerCase() === normalizedName);
  
  // If no exact match, try partial match
  if (!match) {
    match = exercises.find(ex => ex.name.toLowerCase().includes(normalizedName));
  }
  
  // If still no match, try matching individual words
  if (!match) {
    const words = normalizedName.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      match = exercises.find(ex => {
        const exName = ex.name.toLowerCase();
        return words.some(word => exName.includes(word));
      });
    }
  }
  
  return match || null;
}

/**
 * Search exercises by name using ExerciseDB API
 */
export async function searchExercisesByName(name: string): Promise<ExerciseDBExerciseSummary[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn("RAPIDAPI_KEY not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name.toLowerCase())}`,
      {
        headers: {
          "x-rapidapi-host": "exercisedb.p.rapidapi.com",
          "x-rapidapi-key": apiKey.trim(),
        },
        cache: "force-cache",
      }
    );

    if (!response.ok) {
      return [];
    }

    const exercises = await response.json();
    
    if (!Array.isArray(exercises)) {
      return [];
    }

    return exercises.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: capitalizeFirst(ex.bodyPart) || "Other",
      equipment: capitalizeFirst(ex.equipment) || "Bodyweight",
      target: capitalizeFirst(ex.target) || "",
      gifUrl: ex.gifUrl || "",
    }));
  } catch (error) {
    console.error("Error searching ExerciseDB:", error);
    return [];
  }
}

/**
 * Get full details for multiple exercises by name
 */
export async function getExerciseDetailsByNames(names: string[]): Promise<Map<string, ExerciseDBExerciseDetail | null>> {
  const exercises = await getAvailableExercises();
  const results = new Map<string, ExerciseDBExerciseDetail | null>();

  for (const name of names) {
    const normalizedName = name.toLowerCase().trim();
    const summary = exercises.find(ex => ex.name.toLowerCase() === normalizedName);
    if (summary) {
      const detail = await getExerciseDetail(summary.id);
      results.set(name, detail);
    } else {
      results.set(name, null);
    }
  }

  return results;
}

/**
 * Format exercise list for AI prompt
 * Groups exercises by body part for easier selection
 */
export async function formatExercisesForPrompt(): Promise<string> {
  const grouped = await getExercisesByBodyPart();
  
  let prompt = "AVAILABLE EXERCISES (you MUST select from these exact names):\n\n";
  
  // Sort body parts alphabetically for consistency
  const sortedBodyParts = Object.keys(grouped).sort();
  
  for (const bodyPart of sortedBodyParts) {
    const exercises = grouped[bodyPart];
    // Limit to 50 exercises per body part to keep prompt manageable
    const limitedExercises = exercises.slice(0, 50);
    prompt += `${bodyPart}: ${limitedExercises.join(", ")}\n`;
    if (exercises.length > 50) {
      prompt += `  (and ${exercises.length - 50} more)\n`;
    }
  }

  return prompt;
}

/**
 * Clear the cache (useful for testing)
 */
export function clearExerciseDBCache(): void {
  exerciseSummaryCache = null;
  exerciseDetailCache.clear();
  cacheTime = 0;
}

// Alias for backward compatibility
export const clearGymFitCache = clearExerciseDBCache;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
