/**
 * Recommendation Engine
 * 
 * Algorithm:
 * 1. Match class tags with child age, interests, allergies (exclude)
 * 2. Score: Age fit (40%), Interest match (40%), Distance (20%)
 * 3. Return top 10 classes
 */

interface ChildProfile {
  id: string;
  age_years?: number | null;
  age_months: number;
  interests?: string[] | null;
  allergies?: string[] | null;
}

interface FamilyProfile {
  id: string;
  home_town?: string | null;
  home_postcode?: string | null;
  interests?: string[] | null;
  allergies?: string[] | null;
}

interface ClassRecord {
  id: number;
  name: string;
  description: string;
  age_group_min: number; // in months
  age_group_max: number; // in months
  category: string;
  subcategory?: string | null;
  town: string;
  postcode: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  is_active: boolean;
}

interface ScoredClass extends ClassRecord {
  score: number;
  ageFitScore: number;
  interestScore: number;
  distanceScore: number;
  reason: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function _calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if class should be excluded based on allergies
 */
export function _shouldExcludeClass(
  classRecord: ClassRecord,
  childAllergies: string[],
  familyAllergies: string[]
): boolean {
  const allAllergies = [...childAllergies, ...familyAllergies].map((a) =>
    a.toLowerCase()
  );
  const classText = `${classRecord.name} ${classRecord.description} ${classRecord.category} ${classRecord.subcategory || ""}`.toLowerCase();

  // Check for allergy keywords in class description
  const allergyKeywords: Record<string, string[]> = {
    nuts: ["nut", "peanut", "almond", "hazelnut", "walnut"],
    dairy: ["dairy", "milk", "cheese", "yogurt"],
    eggs: ["egg"],
    gluten: ["gluten", "wheat", "bread"],
    shellfish: ["shellfish", "seafood", "fish"],
  };

  for (const allergy of allAllergies) {
    const keywords = allergyKeywords[allergy] || [allergy];
    if (keywords.some((keyword) => classText.includes(keyword))) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate age fit score (0-1)
 * Perfect match = 1.0, outside range = 0
 */
export function calculateAgeFitScore(
  childAgeMonths: number,
  classMinMonths: number,
  classMaxMonths: number
): number {
  if (childAgeMonths < classMinMonths || childAgeMonths > classMaxMonths) {
    return 0;
  }

  // Perfect match = 1.0
  // Closer to center of range = higher score
  const rangeCenter = (classMinMonths + classMaxMonths) / 2;
  const rangeSize = classMaxMonths - classMinMonths;
  const distanceFromCenter = Math.abs(childAgeMonths - rangeCenter);
  const normalizedDistance = distanceFromCenter / (rangeSize / 2);

  return Math.max(0, 1 - normalizedDistance * 0.5); // Slight penalty for being away from center
}

/**
 * Calculate interest match score (0-1)
 */
export function calculateInterestScore(
  classRecord: ClassRecord,
  childInterests: string[],
  familyInterests: string[]
): number {
  const allInterests = [...childInterests, ...familyInterests].map((i) =>
    i.toLowerCase()
  );
  if (allInterests.length === 0) {
    return 0.5; // Neutral score if no interests specified
  }

  const classText = `${classRecord.name} ${classRecord.description} ${classRecord.category} ${classRecord.subcategory || ""}`.toLowerCase();

  let matches = 0;
  for (const interest of allInterests) {
    if (classText.includes(interest)) {
      matches++;
    }
  }

  return Math.min(1, matches / allInterests.length);
}

/**
 * Calculate distance score (0-1)
 * Closer = higher score
 */
export function calculateDistanceScore(
  classRecord: ClassRecord,
  homeLat: number | null,
  homeLon: number | null
): number {
  if (!homeLat || !homeLon || !classRecord.latitude || !classRecord.longitude) {
    return 0.5; // Neutral score if no coordinates
  }

  const classLat = parseFloat(String(classRecord.latitude));
  const classLon = parseFloat(String(classRecord.longitude));

  if (isNaN(classLat) || isNaN(classLon)) {
    return 0.5;
  }

  const distanceKm = _calculateDistance(homeLat, homeLon, classLat, classLon);

  // Score based on distance:
  // 0-5km = 1.0
  // 5-10km = 0.8
  // 10-20km = 0.6
  // 20-30km = 0.4
  // 30-50km = 0.2
  // 50km+ = 0.1
  if (distanceKm <= 5) return 1.0;
  if (distanceKm <= 10) return 0.8;
  if (distanceKm <= 20) return 0.6;
  if (distanceKm <= 30) return 0.4;
  if (distanceKm <= 50) return 0.2;
  return 0.1;
}

/**
 * Generate reason text for recommendation
 */
function generateReason(
  classRecord: ClassRecord,
  ageFitScore: number,
  interestScore: number,
  distanceScore: number,
  _childAgeMonths: number
): string {
  const reasons: string[] = [];

  if (ageFitScore > 0.8) {
    reasons.push("perfect age match");
  } else if (ageFitScore > 0.5) {
    reasons.push("good age fit");
  }

  if (interestScore > 0.7) {
    reasons.push("matches your interests");
  } else if (interestScore > 0.4) {
    reasons.push("related to your interests");
  }

  if (distanceScore > 0.8) {
    reasons.push("very close to you");
  } else if (distanceScore > 0.5) {
    reasons.push("nearby location");
  }

  if (reasons.length === 0) {
    return `Recommended based on ${classRecord.category} classes in ${classRecord.town}`;
  }

  return `Recommended because: ${reasons.join(", ")}`;
}

/**
 * Get coordinates from postcode (simplified - in production, use a postcode API)
 */
async function getCoordinatesFromPostcode(
  _postcode: string
): Promise<{ lat: number | null; lon: number | null }> {
  // In production, integrate with a postcode lookup API
  // For now, return null to use neutral distance score
  return { lat: null, lon: null };
}

/**
 * Main recommendation function
 * 
 * @param children - Array of child profiles
 * @param familyProfile - Family profile with location
 * @param classes - Array of active classes
 * @returns Top 10 scored classes
 */
export async function buildRecommendations(
  children: ChildProfile[],
  familyProfile: FamilyProfile | null,
  classes: ClassRecord[]
): Promise<ScoredClass[]> {
  if (children.length === 0) {
    return [];
  }

  // Get home coordinates if available
  let homeLat: number | null = null;
  let homeLon: number | null = null;

  if (familyProfile?.home_postcode) {
    const coords = await getCoordinatesFromPostcode(familyProfile.home_postcode);
    homeLat = coords.lat;
    homeLon = coords.lon;
  }

  // Filter active classes
  const activeClasses = classes.filter((c) => c.is_active);

  // Score each class for each child, then aggregate
  const scoredClassesMap = new Map<number, ScoredClass>();

  for (const child of children) {
    const childAgeMonths = child.age_months;
    const childInterests = child.interests || [];
    const childAllergies = child.allergies || [];
    const familyInterests = familyProfile?.interests || [];
    const familyAllergies = familyProfile?.allergies || [];

    for (const classRecord of activeClasses) {
      // Skip if excluded by allergies
      if (
        _shouldExcludeClass(classRecord, childAllergies, familyAllergies)
      ) {
        continue;
      }

      // Calculate scores
      const ageFitScore = calculateAgeFitScore(
        childAgeMonths,
        classRecord.age_group_min,
        classRecord.age_group_max
      );

      // Skip if age doesn't match at all
      if (ageFitScore === 0) {
        continue;
      }

      const interestScore = calculateInterestScore(
        classRecord,
        childInterests,
        familyInterests
      );

      const distanceScore = calculateDistanceScore(
        classRecord,
        homeLat,
        homeLon
      );

      // Weighted total score: Age (40%), Interest (40%), Distance (20%)
      const totalScore =
        ageFitScore * 0.4 + interestScore * 0.4 + distanceScore * 0.2;

      // Update or add to map (take highest score if class appears multiple times)
      const existing = scoredClassesMap.get(classRecord.id);
      if (!existing || totalScore > existing.score) {
        scoredClassesMap.set(classRecord.id, {
          ...classRecord,
          score: totalScore,
          ageFitScore,
          interestScore,
          distanceScore,
          reason: generateReason(
            classRecord,
            ageFitScore,
            interestScore,
            distanceScore,
            childAgeMonths
          ),
        });
      }
    }
  }

  // Sort by score descending and return top 10
  return Array.from(scoredClassesMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

