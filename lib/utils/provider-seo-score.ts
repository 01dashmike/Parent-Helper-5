export type SeoScoreResult = {
  score: number;
  issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
    field?: string;
  }>;
  quickFixes: Array<{
    action: string;
    description: string;
    impact: "low" | "medium" | "high";
  }>;
  keywordOpportunities: Array<{
    keyword: string;
    opportunityScore: number;
    reason: string;
  }>;
  breakdown: {
    titleQuality: number;
    descriptionClarity: number;
    keywordDensity: number;
    categoryMatch: number;
    imagePresence: number;
    localKeywordsMatch: number;
    reviewData: number;
    ctrScore: number;
    fieldCompletion: number;
  };
};

type ProviderData = {
  id: number;
  name: string;
  descriptionRaw: string | null;
  descriptionOverride: string | null;
  useDescriptionOverride: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  town: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ClassData = {
  id: number;
  name: string;
  description: string;
  category: string;
  town: string;
  ageGroupMin: number;
  ageGroupMax: number;
};

type ReviewData = {
  averageRating: number;
  reviewCount: number;
};

/**
 * Calculate SEO score for a provider (0-100)
 * @param provider - Provider data
 * @param classes - Array of class data
 * @param reviewData - Optional review data
 * @returns SEO score result with issues and recommendations
 */
export async function calculateProviderSeoScore(
  provider: ProviderData,
  classes: ClassData[],
  reviewData: ReviewData | null
): Promise<SeoScoreResult> {
  const issues: SeoScoreResult["issues"] = [];
  const quickFixes: SeoScoreResult["quickFixes"] = [];
  const keywordOpportunities: SeoScoreResult["keywordOpportunities"] = [];

  // 1. Title Quality (0-15 points)
  const titleQuality = calculateTitleQuality(provider.name, issues);

  // 2. Description Clarity (0-15 points)
  const description = provider.useDescriptionOverride
    ? provider.descriptionOverride || ""
    : provider.descriptionRaw || "";
  const descriptionClarity = calculateDescriptionClarity(description, issues);

  // 3. Keyword Density (0-10 points)
  const keywordDensity = calculateKeywordDensity(description, classes, issues);

  // 4. Category Match (0-10 points)
  const categoryMatch = calculateCategoryMatch(classes, issues);

  // 5. Image Presence (0-10 points)
  const imagePresence = calculateImagePresence(classes, issues);

  // 6. Local Keywords Match (0-15 points)
  const localKeywordsMatch = calculateLocalKeywordsMatch(
    provider,
    classes,
    issues,
    keywordOpportunities
  );

  // 7. Review Data (0-10 points)
  const reviewDataScore = calculateReviewDataScore(reviewData, issues);

  // 8. CTR Score (0-5 points) - placeholder, would need actual CTR data
  const ctrScore = 3; // Default middle score

  // 9. Field Completion (0-10 points)
  const fieldCompletion = calculateFieldCompletion(provider, issues, quickFixes);

  const totalScore = Math.round(
    titleQuality +
      descriptionClarity +
      keywordDensity +
      categoryMatch +
      imagePresence +
      localKeywordsMatch +
      reviewDataScore +
      ctrScore +
      fieldCompletion
  );

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    issues,
    quickFixes,
    keywordOpportunities,
    breakdown: {
      titleQuality,
      descriptionClarity,
      keywordDensity,
      categoryMatch,
      imagePresence,
      localKeywordsMatch,
      reviewData: reviewDataScore,
      ctrScore,
      fieldCompletion,
    },
  };
}

function calculateTitleQuality(name: string, issues: SeoScoreResult["issues"]): number {
  if (!name || name.length < 5) {
    issues.push({
      type: "title",
      severity: "high",
      message: "Provider name is too short or missing",
      field: "name",
    });
    return 0;
  }

  let score = 10;

  // Check length (optimal 30-60 chars)
  if (name.length < 30) {
    score -= 3;
    issues.push({
      type: "title",
      severity: "medium",
      message: "Provider name could be more descriptive",
      field: "name",
    });
  } else if (name.length > 60) {
    score -= 2;
    issues.push({
      type: "title",
      severity: "low",
      message: "Provider name is quite long",
      field: "name",
    });
  }

  // Check for keywords
  const hasKeywords = /(class|activity|baby|toddler|children|kids)/i.test(name);
  if (!hasKeywords) {
    score -= 2;
    issues.push({
      type: "title",
      severity: "medium",
      message: "Provider name doesn't include relevant keywords",
      field: "name",
    });
  }

  return Math.max(0, score);
}

function calculateDescriptionClarity(
  description: string,
  issues: SeoScoreResult["issues"]
): number {
  if (!description || description.length < 50) {
    issues.push({
      type: "description",
      severity: "high",
      message: "Description is missing or too short (minimum 50 characters)",
      field: "description",
    });
    return 0;
  }

  let score = 10;

  // Optimal length: 150-300 characters
  if (description.length < 150) {
    score -= 3;
    issues.push({
      type: "description",
      severity: "medium",
      message: "Description could be more detailed (aim for 150-300 characters)",
      field: "description",
    });
  } else if (description.length > 500) {
    score -= 2;
  }

  // Check for key information
  const hasAgeRange = /(baby|toddler|age|month|year|old)/i.test(description);
  const hasLocation = /(location|venue|address|town|city)/i.test(description);
  const hasBenefits = /(benefit|help|develop|learn|fun|enjoy)/i.test(description);

  if (!hasAgeRange) score -= 1;
  if (!hasLocation) score -= 1;
  if (!hasBenefits) score -= 1;

  return Math.max(0, score);
}

function calculateKeywordDensity(
  description: string,
  classes: ClassData[],
  issues: SeoScoreResult["issues"]
): number {
  if (!description || description.length < 50) {
    return 0;
  }

  const keywords = [
    "baby",
    "toddler",
    "class",
    "activity",
    "children",
    "kids",
    "music",
    "swimming",
    "sensory",
    "play",
  ];

  const descriptionLower = description.toLowerCase();
  let keywordCount = 0;
  keywords.forEach((keyword) => {
    const regex = new RegExp(keyword, "gi");
    const matches = descriptionLower.match(regex);
    if (matches) keywordCount += matches.length;
  });

  const density = (keywordCount / description.length) * 100;

  if (density < 1) {
    issues.push({
      type: "keywords",
      severity: "medium",
      message: "Low keyword density in description",
      field: "description",
    });
    return 3;
  } else if (density < 2) {
    return 6;
  } else if (density < 4) {
    return 8;
  } else {
    return 10;
  }
}

function calculateCategoryMatch(
  classes: ClassData[],
  issues: SeoScoreResult["issues"]
): number {
  if (classes.length === 0) {
    issues.push({
      type: "categories",
      severity: "high",
      message: "No classes found for this provider",
    });
    return 0;
  }

  const categories = new Set(classes.map((c) => c.category));
  const score = Math.min(10, categories.size * 2);

  if (categories.size < 2) {
    issues.push({
      type: "categories",
      severity: "low",
      message: "Consider adding more diverse class categories",
    });
  }

  return score;
}

function calculateImagePresence(
  classes: ClassData[],
  issues: SeoScoreResult["issues"]
): number {
  // Placeholder - would need actual image data
  // Assume 70% of classes have images
  const estimatedImageCoverage = classes.length > 0 ? 0.7 : 0;

  if (estimatedImageCoverage < 0.5) {
    issues.push({
      type: "images",
      severity: "medium",
      message: "Add more images to your class listings",
    });
    return 3;
  } else if (estimatedImageCoverage < 0.8) {
    return 7;
  } else {
    return 10;
  }
}

function calculateLocalKeywordsMatch(
  provider: ProviderData,
  classes: ClassData[],
  issues: SeoScoreResult["issues"],
  keywordOpportunities: SeoScoreResult["keywordOpportunities"]
): number {
  let score = 0;

  // Check if town is mentioned
  if (provider.town) {
    score += 5;
    const townLower = provider.town.toLowerCase();
    const townInDescription = classes.some((c) =>
      c.description.toLowerCase().includes(townLower)
    );
    if (!townInDescription) {
      issues.push({
        type: "local",
        severity: "medium",
        message: `Include "${provider.town}" in your class descriptions`,
        field: "description",
      });
      keywordOpportunities.push({
        keyword: `${provider.town} baby classes`,
        opportunityScore: 75,
        reason: "High local search volume",
      });
    } else {
      score += 5;
    }
  } else {
    issues.push({
      type: "local",
      severity: "high",
      message: "Town/location information is missing",
      field: "town",
    });
  }

  // Check for local keywords
  const localKeywords = ["near me", "in", "local", "area"];
  const hasLocalKeywords = classes.some((c) =>
    localKeywords.some((kw) => c.description.toLowerCase().includes(kw))
  );

  if (hasLocalKeywords) {
    score += 5;
  } else {
    issues.push({
      type: "local",
      severity: "low",
      message: "Consider adding location-specific keywords",
    });
  }

  return Math.min(15, score);
}

function calculateReviewDataScore(
  reviewData: ReviewData | null,
  issues: SeoScoreResult["issues"]
): number {
  if (!reviewData || reviewData.reviewCount === 0) {
    issues.push({
      type: "reviews",
      severity: "high",
      message: "No reviews found. Encourage customers to leave reviews",
    });
    return 0;
  }

  let score = 5;

  // Rating score (0-5 points)
  if (reviewData.averageRating >= 4.5) {
    score += 5;
  } else if (reviewData.averageRating >= 4.0) {
    score += 3;
  } else if (reviewData.averageRating >= 3.5) {
    score += 1;
  }

  // Review count bonus
  if (reviewData.reviewCount >= 20) {
    score += 2;
  } else if (reviewData.reviewCount >= 10) {
    score += 1;
  } else {
    issues.push({
      type: "reviews",
      severity: "medium",
      message: `Only ${reviewData.reviewCount} reviews. Aim for 10+ reviews`,
    });
  }

  return Math.min(10, score);
}

function calculateFieldCompletion(
  provider: ProviderData,
  issues: SeoScoreResult["issues"],
  quickFixes: SeoScoreResult["quickFixes"]
): number {
  let completed = 0;
  const total = 8;

  if (provider.name) completed++;
  if (provider.descriptionRaw || provider.descriptionOverride) completed++;
  if (provider.contactEmail) completed++;
  if (provider.contactPhone) completed++;
  if (provider.website) completed++;
  if (provider.town) completed++;
  if (provider.postcode) completed++;
  if (provider.latitude && provider.longitude) completed++;

  const completionRate = completed / total;

  if (completionRate < 0.75) {
    issues.push({
      type: "completion",
      severity: "high",
      message: "Complete your provider profile to improve visibility",
    });

    const missingFields: string[] = [];
    if (!provider.contactEmail) missingFields.push("email");
    if (!provider.contactPhone) missingFields.push("phone");
    if (!provider.website) missingFields.push("website");
    if (!provider.town) missingFields.push("town");

    if (missingFields.length > 0) {
      quickFixes.push({
        action: "complete_profile",
        description: `Add missing fields: ${missingFields.join(", ")}`,
        impact: "high",
      });
    }
  }

  return Math.round(completionRate * 10);
}

