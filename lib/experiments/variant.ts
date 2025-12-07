"use server";

import { cookies } from "next/headers";

const EXPERIMENTS_ENABLED = process.env.NEXT_PUBLIC_EXPERIMENTS_ENABLED === "true";

export type Variant = "A" | "B";

export interface ExperimentConfig {
  name: string;
  enabled: boolean;
  variants: {
    A: Record<string, unknown>;
    B: Record<string, unknown>;
  };
}

const HERO_EXPERIMENT: ExperimentConfig = {
  name: "hero_copy_cta",
  enabled: EXPERIMENTS_ENABLED,
  variants: {
    A: {
      headline: "Find baby and toddler classes near you",
      subheadline: "Discover local activities perfect for your little one",
      ctaPlacement: "below", // Current placement
    },
    B: {
      headline: "Find classes for your little one",
      subheadline: "Local activities, trusted providers",
      ctaPlacement: "above", // New placement
    },
  },
};

/**
 * Get or assign a variant for a user based on cookie
 * Returns variant A if experiments are disabled
 */
export async function getVariant(experiment: ExperimentConfig): Promise<Variant> {
  if (!experiment.enabled) {
    return "A";
  }

  const cookieStore = await cookies();
  const cookieName = `exp_${experiment.name}`;
  const existingVariant = cookieStore.get(cookieName)?.value as Variant | undefined;

  if (existingVariant === "A" || existingVariant === "B") {
    return existingVariant;
  }

  // Assign variant: 50/50 split
  const variant: Variant = Math.random() < 0.5 ? "A" : "B";

  // Set cookie for 30 days
  cookieStore.set(cookieName, variant, {
    httpOnly: false, // Needs to be readable by client for analytics
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return variant;
}

/**
 * Get hero variant configuration
 */
export async function getHeroVariant(): Promise<{
  variant: Variant;
  config: Record<string, unknown>;
}> {
  const variant = await getVariant(HERO_EXPERIMENT);
  return {
    variant,
    config: HERO_EXPERIMENT.variants[variant],
  };
}

export { HERO_EXPERIMENT };

