/**
 * Minimal API test helper for testing Next.js route handlers
 * Provides utilities to call route handlers with mocked Request objects
 */

import { NextRequest } from "next/server";

export interface TestResponse {
  status: number;
  body: unknown;
}

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}): NextRequest {
  const {
    method = "GET",
    url = "http://localhost:3000/api/test",
    body,
    headers = {},
    searchParams = {},
  } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const request = {
    method,
    url: urlObj.toString(),
    nextUrl: urlObj,
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body || {})),
  } as unknown as NextRequest;

  return request;
}

/**
 * Call a route handler and return status + parsed JSON body
 */
export async function callRouteHandler(
  handler: (req: NextRequest, ...args: any[]) => Promise<Response>,
  request: NextRequest,
  ...args: any[]
): Promise<TestResponse> {
  const response = await handler(request, ...args);
  const body = await response.json().catch(() => null);
  return {
    status: response.status,
    body,
  };
}

