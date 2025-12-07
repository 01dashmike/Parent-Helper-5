"use client";

import { useState, useEffect } from "react";
import { getExperimentVariant } from "@/lib/actions/experiments";
import type { ExperimentVariant } from "@/lib/actions/experiments";

/**
 * Client hook to get experiment variant
 * Handles both authenticated and anonymous users
 * For anonymous users, uses localStorage for consistent assignment
 */
export function useExperiment(experimentName: string): ExperimentVariant {
  const [variant, setVariant] = useState<ExperimentVariant>("control");

  useEffect(() => {
    let mounted = true;

    async function fetchVariant() {
      try {
        // Call server action which handles userId internally
        // Pass null as userId - server action will get it from session
        const serverVariant = await getExperimentVariant(null, experimentName);
        
        // If server returns control, try localStorage for anonymous users
        if (serverVariant === "control" && typeof window !== "undefined") {
          const storageKey = `exp_${experimentName}`;
          let storedVariant = localStorage.getItem(storageKey) as ExperimentVariant | null;

          if (!storedVariant || (storedVariant !== "A" && storedVariant !== "B")) {
            // Generate consistent hash based on session ID or generate new
            const sessionId = getOrCreateSessionId();
            const hashInput = `${sessionId}:${experimentName}`;
            const hashValue = simpleHash(hashInput);
            
            // 50/50 split
            storedVariant = hashValue % 2 === 0 ? "A" : "B";
            localStorage.setItem(storageKey, storedVariant);
          }

          if (mounted) {
            setVariant(storedVariant);
          }
        } else if (mounted) {
          setVariant(serverVariant);
        }
      } catch (error) {
        console.error(`Error fetching experiment variant for ${experimentName}:`, error);
        if (mounted) {
          setVariant("control");
        }
      }
    }

    fetchVariant();

    return () => {
      mounted = false;
    };
  }, [experimentName]);

  return variant;
}

/**
 * Get or create a session ID for anonymous users
 */
function getOrCreateSessionId(): string {
  const SESSION_KEY = "ph_session_id";
  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // Fallback if localStorage is not available
    return `${Date.now()}-${Math.random()}`;
  }
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

