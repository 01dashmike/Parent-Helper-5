"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/ssr";
import { readFileSync } from "fs";
import { join } from "path";

// Load experiments config
const experimentsConfigPath = join(process.cwd(), "experiments.json");

function loadExperimentsConfig(): ExperimentsConfig {
  try {
    const raw = readFileSync(experimentsConfigPath, "utf-8");
    if (!raw.trim()) {
      return { experiments: {} };
    }
    const parsed = JSON.parse(raw) as ExperimentsConfig;
    return parsed && typeof parsed === "object" ? parsed : { experiments: {} };
  } catch (error) {
    console.warn("[experiments] Unable to read experiments.json, using defaults:", error);
    return { experiments: {} };
  }
}

const experimentsConfig = loadExperimentsConfig();

export type ExperimentVariant = "A" | "B" | "control";

interface ExperimentConfig {
  enabled: boolean;
  variants: string[];
  description: string;
}

interface ExperimentsConfig {
  experiments: Record<string, ExperimentConfig>;
}

/**
 * Get experiment variant for a user
 * Uses consistent hashing based on userId + experimentName for stable assignments
 * Falls back to control if userId is not available (client will handle localStorage)
 */
export async function getExperimentVariant(
  userId: string | null,
  experimentName: string,
): Promise<ExperimentVariant> {
  const config = (experimentsConfig as ExperimentsConfig).experiments[experimentName];

  // If experiment doesn't exist or is disabled, return control
  if (!config || !config.enabled) {
    return "control";
  }

  // If no variants defined, return control
  if (!config.variants || config.variants.length === 0) {
    return "control";
  }

  // Try to get userId from session if not provided
  let actualUserId = userId;
  if (!actualUserId) {
    actualUserId = await getUserId();
  }

  // If still no userId, return control (client hook will handle localStorage)
  if (!actualUserId) {
    return "control";
  }

  // Generate a stable hash from userId + experimentName
  const hashInput = `${actualUserId}:${experimentName}`;
  const hashValue = simpleHash(hashInput);

  // Map hash to variant (50/50 split for A/B)
  const variantIndex = hashValue % config.variants.length;
  const variant = config.variants[variantIndex] as ExperimentVariant;

  // Validate variant is valid
  if (variant === "A" || variant === "B") {
    return variant;
  }

  return "control";
}

/**
 * Simple hash function for consistent variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get user ID from Supabase session
 */
export async function getUserId(): Promise<string | null> {
  try {
    const supabase = createSupabaseServerActionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

