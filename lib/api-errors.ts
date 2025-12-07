/**
 * API Error Helper - Error Schema v2 (Internal) with Legacy Shape Support
 * 
 * This module provides a centralized way to create API error responses using
 * Error Schema v2 internally while maintaining backwards compatibility by
 * returning legacy error JSON shapes externally.
 * 
 * NOTE: This route uses ApiErrorShapeV2 internally but still returns legacy error JSON shapes.
 *       See docs/api-error-map.md for the design and migration plan.
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiErrorDetails {
  [key: string]: unknown;
}

export interface ApiFieldErrors {
  [field: string]: string[];
}

export interface ApiErrorShapeV2 {
  code: string;                // MACHINE-READABLE, e.g. "WALLET_NOT_FOUND"
  message: string;             // HUMAN-READABLE, safe to show to users
  status: number;              // HTTP status code (e.g. 404)
  details?: ApiErrorDetails;   // Optional extra context
  fieldErrors?: ApiFieldErrors;// Optional validation errors
  retryable?: boolean;         // Whether a client can safely retry
  requestId?: string;          // For logging/tracing, if available
  userId?: string;             // User ID associated with the error, if available
  meta?: Record<string, unknown>; // Additional metadata for future extensibility
}

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_REQUEST"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "FEATURE_DISABLED"
  | "WALLET_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "AUTH_REQUIRED"
  | "BOOKING_NOT_FOUND"
  | "CLASS_NOT_FOUND"
  | "REVIEW_NOT_FOUND"
  | "COUPON_INVALID"
  | "COUPON_EXPIRED"
  | "COUPON_LIMIT_REACHED"
  | "NO_SPOTS_AVAILABLE"
  | "OCCURRENCE_NOT_BOOKABLE"
  | "INVALID_PRICE"
  | "SERVER_ERROR"
  | "WEBHOOK_SECRET_MISSING"
  | "INVALID_SIGNATURE"
  | "NO_CUSTOMER_EMAIL"
  | "INVALID_OCCURRENCE_ID"
  // Keep open-ended for custom codes:
  | (string & {});

type LegacyErrorShape =
  | { error: string; [key: string]: unknown }
  | { message: string; [key: string]: unknown }
  | { errors: string[]; [key: string]: unknown };

// ============================================================================
// Versioning Types and Constants
// ============================================================================

export type ApiErrorVersion = "v1" | "v2";

export const DEFAULT_API_ERROR_VERSION: ApiErrorVersion = "v1";

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an internal Error Schema v2 shape
 */
export function createApiErrorShape(params: {
  code: ApiErrorCode;
  message: string;
  status: number;
  details?: ApiErrorDetails;
  fieldErrors?: ApiFieldErrors;
  retryable?: boolean;
  requestId?: string;
  userId?: string;
  meta?: Record<string, unknown>;
}): ApiErrorShapeV2 {
  return {
    code: params.code,
    message: params.message,
    status: params.status,
    details: params.details,
    fieldErrors: params.fieldErrors,
    retryable: params.retryable,
    requestId: params.requestId,
    userId: params.userId,
    meta: params.meta,
  };
}

/**
 * Create a legacy error response that maintains backwards compatibility
 * 
 * Maps internal Error Schema v2 to legacy JSON shapes based on the route's
 * existing pattern. This ensures no breaking changes while using v2 internally.
 */
export function createLegacyErrorResponse(
  shape: ApiErrorShapeV2,
  options?: {
    legacyShape?: "error" | "message" | "errors" | "custom";
    customPayload?: LegacyErrorShape;
    // For routes that include additional fields (e.g., { error: string, message: string })
    additionalFields?: Record<string, unknown>;
  }
): NextResponse {
  const { legacyShape = "error", customPayload, additionalFields } = options ?? {};

  let body: LegacyErrorShape;

  if (legacyShape === "custom" && customPayload) {
    body = customPayload;
  } else if (legacyShape === "message") {
    body = { message: shape.message };
  } else if (legacyShape === "errors") {
    body = { errors: [shape.message] };
  } else {
    // default: { error: string }
    body = { error: shape.message };
  }

  // Merge additional fields if provided (e.g., for { error: "AUTH_REQUIRED", message: "..." })
  if (additionalFields) {
    body = { ...body, ...additionalFields };
  }

  // Include details if present (for validation errors)
  if (shape.details && !customPayload) {
    body = { ...body, details: shape.details };
  }

  return NextResponse.json(body, { status: shape.status });
}

// ============================================================================
// Version Negotiation
// ============================================================================

/**
 * Determine the error version requested by the client
 * 
 * Checks:
 * 1. x-error-version header (if "2" or "v2" → v2)
 * 2. Accept header (if contains application/vnd.parenthelper.error+v2 → v2)
 * 3. Otherwise → v1 (default)
 */
export function getRequestedErrorVersion(req: NextRequest): ApiErrorVersion {
  // Check custom header first
  const versionHeader = req.headers.get("x-error-version");
  if (versionHeader === "2" || versionHeader === "v2") {
    return "v2";
  }

  // Check Accept header
  const acceptHeader = req.headers.get("accept");
  if (acceptHeader?.includes("application/vnd.parenthelper.error+v2")) {
    return "v2";
  }

  // Default to v1
  return "v1";
}

// ============================================================================
// Version-Aware Error Building
// ============================================================================

/**
 * Build error body based on requested version
 * 
 * For now (infra only), always returns legacyShape to maintain backwards compatibility.
 * When routes are migrated to v2, this will return v2Shape for v2 requests.
 */
export function buildErrorBody(options: {
  version: ApiErrorVersion;
  legacyShape: unknown;
  v2Shape: ApiErrorShapeV2;
}): unknown {
  if (options.version === "v1") {
    return options.legacyShape;
  }

  // TODO: When we flip a route to v2, this branch should return v2Shape instead of legacyShape.
  // For now, we return legacyShape to ensure no breaking changes.
  return options.legacyShape;
}

/**
 * Build a version-aware error response
 * 
 * This is the standardized helper for future route migrations.
 * It automatically handles version negotiation and response formatting.
 * 
 * Note: This helper is not yet used by any routes. Existing routes continue
 * to use createLegacyErrorResponse or NextResponse.json directly.
 */
export function buildErrorResponse(opts: {
  req?: NextRequest | null;
  status: number;
  legacyBody: unknown;
  v2Body: ApiErrorShapeV2;
  headers?: Record<string, string>;
}): NextResponse {
  // Determine version
  const version = opts.req ? getRequestedErrorVersion(opts.req) : DEFAULT_API_ERROR_VERSION;

  // Build body based on version
  const body = buildErrorBody({
    version,
    legacyShape: opts.legacyBody,
    v2Shape: opts.v2Body,
  });

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-error-version": version,
    ...(opts.headers || {}),
  };

  return NextResponse.json(body, {
    status: opts.status,
    headers,
  });
}

// ============================================================================
// Error Context Helpers
// ============================================================================

/**
 * Context information that can be attached to error shapes
 */
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  route?: string;
}

/**
 * Attach context information to an error shape
 * 
 * Returns a new error shape with context fields merged in (only if defined).
 * This is infrastructure-only and does not change existing behavior.
 */
export function withErrorContext(
  errorShape: ApiErrorShapeV2,
  ctx: ErrorContext
): ApiErrorShapeV2 {
  return {
    ...errorShape,
    ...(ctx.requestId !== undefined && { requestId: ctx.requestId }),
    ...(ctx.userId !== undefined && { userId: ctx.userId }),
    // Note: route is not part of ApiErrorShapeV2, but can be included in meta
    ...(ctx.route !== undefined && {
      meta: {
        ...errorShape.meta,
        route: ctx.route,
      },
    }),
  };
}

// ============================================================================
// Error Reporting (Development Only)
// ============================================================================

/**
 * Report an API error to the error sandbox for debugging (development only)
 * 
 * This helper forwards errors to /api/error-sandbox in development mode only.
 * It is designed to be non-invasive and never throw, so it can be safely called
 * from catch blocks without affecting error handling flow.
 * 
 * @param route - The route path where the error occurred (e.g., "api/wallet/summary")
 * @param error - The error object to report
 * @param context - Optional context including request, userId, and metadata
 */
export async function reportApiError(
  route: string,
  error: unknown,
  context?: {
    request?: Request | NextRequest | null;
    userId?: string | null;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  // Only forward errors in development
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  try {
    // Build serializable error info
    const errorInfo: {
      route: string;
      message: string;
      name?: string;
      stack?: string;
      requestId?: string;
      userId?: string | null;
      meta?: Record<string, unknown>;
    } = {
      route,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "UnknownError",
    };

    // Include stack only in development
    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      errorInfo.stack = error.stack;
    }

    // Extract requestId from context
    if (context?.meta?.requestId) {
      errorInfo.requestId = String(context.meta.requestId);
    } else if (context?.request) {
      const requestId = context.request.headers.get("x-request-id");
      if (requestId) {
        errorInfo.requestId = requestId;
      }
    }

    // Include userId if provided
    if (context?.userId !== undefined) {
      errorInfo.userId = context.userId;
    }

    // Include meta if provided
    if (context?.meta) {
      errorInfo.meta = context.meta;
    }

    // Forward to error sandbox
    await fetch("/api/error-sandbox", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-error-sandbox-source": "forwarded-api-error",
      },
      body: JSON.stringify({
        scenario: "FORWARDED_API_ERROR",
        error: errorInfo,
      }),
    });
  } catch {
    // Swallow all failures - this helper must never throw
    return;
  }
}

