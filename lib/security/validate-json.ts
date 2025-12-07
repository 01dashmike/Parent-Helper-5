"use server";

/**
 * Safe JSON parsing with Zod validation
 * Prevents untyped JSON from being accepted in API routes
 */

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

/**
 * Safely parse and validate JSON request body with Zod schema
 * Returns validated data or error response
 */
export async function validateJsonBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        error: "Invalid request body",
        status: 400,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    // JSON parse error or other error
    return {
      success: false,
      error: "Invalid JSON",
      status: 400,
    };
  }
}

/**
 * Create error response for validation failures
 */
export function createValidationErrorResponse(
  result: ValidationResult<unknown>
): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}

