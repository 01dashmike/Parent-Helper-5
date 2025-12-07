/**
 * API Response Validation Utilities
 * Provides graceful fallback on schema mismatch
 */

import { z, ZodError, ZodSchema } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

/**
 * Validate API response with graceful fallback
 * Returns validated data or safe defaults on schema mismatch
 */
export function validateApiResponse<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: {
    fallback?: T;
    logErrors?: boolean;
    strict?: boolean;
  } = {}
): ValidationResult<T> {
  const { fallback, logErrors = true, strict = false } = options;

  try {
    // Attempt strict validation
    if (strict) {
      const parsed = schema.parse(data);
      return {
        success: true,
        data: parsed,
      };
    }

    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      // Handle validation errors
      const errors = result.error.errors;
      const errorMessages = errors.map((err: { path: (string | number)[]; message: string }) => `${err.path.join(".")}: ${err.message}`);

      if (logErrors) {
        console.warn("[API Validation] Schema mismatch:", {
          errors: errorMessages,
          data: data,
        });
      }

      // Try to use fallback or partial data
      if (fallback) {
        return {
          success: false,
          data: fallback,
          error: `Schema validation failed: ${errorMessages.join(", ")}`,
          warnings: [`Using fallback data due to validation errors`],
        };
      }

      // Try to extract partial data (only valid fields)
      const partial = extractPartialData(schema, data);
      if (partial) {
        return {
          success: false,
          data: partial as T,
          error: `Partial validation: ${errorMessages.join(", ")}`,
          warnings: [`Some fields may be missing or invalid`],
        };
      }

      return {
        success: false,
        error: `Validation failed: ${errorMessages.join(", ")}`,
      };
    }

    // This shouldn't happen, but TypeScript needs it
    return {
      success: false,
      error: "Unknown validation error",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (logErrors) {
      console.error("[API Validation] Unexpected error:", error);
    }

    if (fallback) {
      return {
        success: false,
        data: fallback,
        error: errorMessage,
        warnings: ["Using fallback data due to validation error"],
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract partial data from failed validation
 * Attempts to keep valid fields and provide defaults for invalid ones
 */
function extractPartialData<T>(schema: ZodSchema<T>, data: unknown): Partial<T> | null {
  try {
    // Use passthrough to get all valid fields
    const passthroughSchema = schema instanceof z.ZodObject
      ? schema.passthrough()
      : schema;

    const result = passthroughSchema.safeParse(data);
    if (result.success) {
      return result.data as Partial<T>;
    }

    // If data is an object, try to extract known valid fields
    if (typeof data === "object" && data !== null) {
      const dataObj = data as Record<string, unknown>;
      const partial: Record<string, unknown> = {};

      // Try to extract basic fields that are likely valid
      for (const [key, value] of Object.entries(dataObj)) {
        // Only include primitive types or arrays
        if (
          value === null ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          Array.isArray(value)
        ) {
          partial[key] = value;
        }
      }

      return partial as Partial<T>;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate array response with individual item validation
 * Returns array of valid items, skipping invalid ones
 */
export function validateArrayResponse<T>(
  itemSchema: ZodSchema<T>,
  data: unknown,
  options: {
    minItems?: number;
    logErrors?: boolean;
  } = {}
): ValidationResult<T[]> {
  const { minItems = 0, logErrors = true } = options;

  if (!Array.isArray(data)) {
    return {
      success: false,
      data: [],
      error: "Expected array response",
    };
  }

  const validItems: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = validateApiResponse(itemSchema, data[i], { logErrors });
    if (result.success && result.data) {
      validItems.push(result.data);
    } else {
      errors.push(`Item ${i}: ${result.error ?? "Invalid"}`);
    }
  }

  if (validItems.length < minItems) {
    return {
      success: false,
      data: validItems,
      error: `Only ${validItems.length} valid items (expected at least ${minItems})`,
      warnings: errors,
    };
  }

  return {
    success: validItems.length === data.length,
    data: validItems,
    warnings: errors.length > 0 ? errors : undefined,
  };
}

