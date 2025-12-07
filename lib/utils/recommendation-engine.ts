import type { SupabaseClient } from "@supabase/supabase-js";

type FamilyProfile = {
  id: string;
  user_id: string;
  home_town: string | null;
  home_postcode: string | null;
  interests: string[];
  allergies: string[];
};

type Child = {
  id: string;
  family_id: string;
  first_name: string;
  age_years: number | null;
  age_months: number;
  interests: string[];
  allergies: string[];
};

type Recommendation = {
  classId: number;
  score: number;
  reason: string;
};

/**
 * Calculate personalized recommendations for a family
 * @param children - Array of child profiles
 * @param limit - Maximum number of recommendations to return (default: 10)
 * @param profile - Family profile with location and interests
 * @param supabase - Supabase client instance
 * @returns Array of recommendations sorted by score
 */
export async function calculateRecommendations(
  supabase: SupabaseClient,
  profile: FamilyProfile,
  children: Child[],
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get active classes with optimized select (only needed fields)
  // Limit to reasonable number for scoring performance
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, description, category, age_group_min, age_group_max, town, postcode, latitude, longitude")
    .eq("is_active", true)
    .limit(500); // Reasonable limit for scoring

  if (error || !classes) {
    console.error("Error fetching classes:", error);
    return [];
  }

  // Score each class for each child
  for (const child of children) {
    const childAgeMonths = (child.age_years || 0) * 12 + child.age_months;

    for (const classItem of classes) {
      // Age match score (0-40 points)
      const ageScore = calculateAgeScore(
        childAgeMonths,
        classItem.age_group_min,
        classItem.age_group_max
      );

      // Location score (0-30 points)
      const locationScore = calculateLocationScore(
        profile.home_town,
        profile.home_postcode,
        classItem.town,
        classItem.postcode
      );

      // Interest match score (0-20 points)
      const interestScore = calculateInterestScore(
        child.interests,
        profile.interests,
        classItem.category,
        classItem.description
      );

      // Category match score (0-10 points)
      const categoryScore = calculateCategoryScore(
        classItem.category,
        child.interests,
        profile.interests
      );

      const totalScore = ageScore + locationScore + interestScore + categoryScore;

      if (totalScore > 30) {
        // Only include classes with meaningful scores
        const reason = generateReason(
          ageScore,
          locationScore,
          interestScore,
          categoryScore,
          child.first_name
        );

        recommendations.push({
          classId: classItem.id,
          score: totalScore,
          reason,
        });
      }
    }
  }

  // Sort by score and deduplicate (keep highest score per class)
  const deduplicated = new Map<number, Recommendation>();
  for (const rec of recommendations) {
    const existing = deduplicated.get(rec.classId);
    if (!existing || rec.score > existing.score) {
      deduplicated.set(rec.classId, rec);
    }
  }

  // Sort by score descending and limit
  return Array.from(deduplicated.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function calculateAgeScore(
  childAgeMonths: number,
  classMinMonths: number | null,
  classMaxMonths: number | null
): number {
  if (!classMinMonths || !classMaxMonths) return 20; // Default score if age range missing

  if (childAgeMonths >= classMinMonths && childAgeMonths <= classMaxMonths) {
    // Perfect match
    return 40;
  } else if (childAgeMonths < classMinMonths) {
    // Too young - lower score
    const monthsOff = classMinMonths - childAgeMonths;
    return Math.max(0, 40 - monthsOff * 2);
  } else {
    // Too old - lower score
    const monthsOff = childAgeMonths - classMaxMonths;
    return Math.max(0, 40 - monthsOff * 2);
  }
}

function calculateLocationScore(
  homeTown: string | null,
  homePostcode: string | null,
  classTown: string | null,
  classPostcode: string | null
): number {
  if (!homeTown && !homePostcode) return 15; // Default if no location

  // Exact town match
  if (homeTown && classTown && homeTown.toLowerCase() === classTown.toLowerCase()) {
    return 30;
  }

  // Postcode area match (first part of UK postcode)
  if (homePostcode && classPostcode) {
    const homeFirstPart = homePostcode.split(" ")[0];
    const classFirstPart = classPostcode.split(" ")[0];
    if (homeFirstPart && classFirstPart) {
      const homeArea = homeFirstPart.substring(0, 2);
      const classArea = classFirstPart.substring(0, 2);
      if (homeArea && classArea && homeArea === classArea) {
        return 25;
      }
    }
  }

  // Partial town match
  if (homeTown && classTown) {
    const homeLower = homeTown.toLowerCase();
    const classLower = classTown.toLowerCase();
    if (homeLower.includes(classLower) || classLower.includes(homeLower)) {
      return 20;
    }
  }

  return 10; // Default location score
}

function calculateInterestScore(
  childInterests: string[],
  familyInterests: string[],
  category: string,
  description: string
): number {
  const allInterests = [...childInterests, ...familyInterests];
  const descriptionLower = description.toLowerCase();
  const categoryLower = category.toLowerCase();

  let score = 0;

  for (const interest of allInterests) {
    const interestLower = interest.toLowerCase();
    if (categoryLower.includes(interestLower) || descriptionLower.includes(interestLower)) {
      score += 5;
    }
  }

  return Math.min(20, score);
}

function calculateCategoryScore(
  category: string,
  childInterests: string[],
  familyInterests: string[]
): number {
  const allInterests = [...childInterests, ...familyInterests];
  const categoryLower = category.toLowerCase();

  for (const interest of allInterests) {
    if (categoryLower.includes(interest.toLowerCase())) {
      return 10;
    }
  }

  return 5; // Default category score
}

function generateReason(
  ageScore: number,
  locationScore: number,
  interestScore: number,
  categoryScore: number,
  childName: string
): string {
  const reasons: string[] = [];

  if (ageScore >= 35) {
    reasons.push(`Perfect age match for ${childName}`);
  }

  if (locationScore >= 25) {
    reasons.push("Located near you");
  }

  if (interestScore >= 15) {
    reasons.push("Matches your interests");
  }

  if (categoryScore >= 8) {
    reasons.push("Popular category");
  }

  if (reasons.length === 0) {
    return `Recommended based on ${childName}'s profile`;
  }

  return reasons.join(" • ");
}

