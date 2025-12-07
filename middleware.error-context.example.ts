/**
 * EXAMPLE: Error Context Middleware (Reference Implementation)
 * 
 * This file is a reference implementation showing how to attach requestId
 * and other context to requests for use in error responses.
 * 
 * IMPORTANT: This file is NOT imported or used anywhere in the codebase.
 * It is purely educational and serves as documentation for future implementation.
 * 
 * When ready to implement:
 * 1. Integrate requestId generation into the main middleware.ts
 * 2. Store requestId in a way that route handlers can access it
 * 3. Use withErrorContext() from lib/api-errors.ts to attach it to error shapes
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Example middleware function that generates and attaches a requestId
 * 
 * This would be integrated into the main middleware.ts when ready.
 * For now, this is just a reference implementation.
 */
export async function exampleErrorContextMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  // Generate a unique request ID for this request
  const requestId = randomUUID();

  // Create the response (this would be the actual NextResponse.next() in real usage)
  const response = NextResponse.next();

  // Attach requestId to response headers so clients can reference it
  // This is useful for support/debugging scenarios
  response.headers.set("x-request-id", requestId);

  // In a real implementation, you might also:
  // 1. Store requestId in request headers for route handlers to access:
  //    request.headers.set("x-request-id", requestId);
  //
  // 2. Or use a request context object (if using a context library):
  //    requestContext.set("requestId", requestId);
  //
  // 3. Or attach to the request object itself (if extending NextRequest):
  //    (request as ExtendedNextRequest).requestId = requestId;

  // Example: If you want to also attach userId from session:
  // const session = await getSession(request);
  // if (session?.user?.id) {
  //   response.headers.set("x-user-id", session.user.id);
  // }

  return response;
}

/**
 * Example: How route handlers would use the requestId
 * 
 * In a route handler:
 * 
 * ```typescript
 * import { withErrorContext } from "@/lib/api-errors";
 * 
 * export async function GET(req: NextRequest) {
 *   try {
 *     // ... handler logic
 *   } catch (error) {
 *     const requestId = req.headers.get("x-request-id");
 *     const userId = session?.user?.id;
 *     
 *     const errorShape = createApiErrorShape({
 *       code: "INTERNAL_ERROR",
 *       message: "Something went wrong",
 *       status: 500,
 *     });
 *     
 *     const errorWithContext = withErrorContext(errorShape, {
 *       requestId,
 *       userId,
 *       route: req.nextUrl.pathname,
 *     });
 *     
 *     return createLegacyErrorResponse(errorWithContext);
 *   }
 * }
 * ```
 */

