/**
 * Visibility Boost Assignment Logic
 * 
 * Growth Score Tier → Boost:
 * - <40 → No boost (1.0x)
 * - 40–59 → Bronze (1.05×)
 * - 60–79 → Silver (1.15×)
 * - 80+ → Gold (1.30×)
 */

export interface VisibilityBoost {
  boostType: "Bronze" | "Silver" | "Gold" | "None";
  multiplier: number;
}

export function getBoostFromScore(growthScore: number): VisibilityBoost {
  if (growthScore >= 80) {
    return { boostType: "Gold", multiplier: 1.30 };
  } else if (growthScore >= 60) {
    return { boostType: "Silver", multiplier: 1.15 };
  } else if (growthScore >= 40) {
    return { boostType: "Bronze", multiplier: 1.05 };
  } else {
    return { boostType: "None", multiplier: 1.0 };
  }
}

/**
 * Calculate search ranking score with visibility boost
 */
export function applyVisibilityBoost(baseScore: number, multiplier: number): number {
  return baseScore * multiplier;
}

