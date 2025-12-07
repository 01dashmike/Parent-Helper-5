/**
 * Rate limiting tests
 */

import { checkRateLimit, getRateLimitIdentifier, RATE_LIMIT_CONFIG } from "@/lib/security/rate-limit";

describe("Rate Limiting", () => {
  it("should have rate limit configs for all endpoint types", () => {
    expect(RATE_LIMIT_CONFIG.login).toBeDefined();
    expect(RATE_LIMIT_CONFIG.otp).toBeDefined();
    expect(RATE_LIMIT_CONFIG.provider).toBeDefined();
    expect(RATE_LIMIT_CONFIG.ai).toBeDefined();
    expect(RATE_LIMIT_CONFIG.booking).toBeDefined();
    expect(RATE_LIMIT_CONFIG.default).toBeDefined();
  });

  it("should generate identifier from IP address", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
      },
    } as any);

    const identifier = getRateLimitIdentifier(request);
    expect(identifier).toContain("ip:");
    expect(identifier).toContain("192.168.1.1");
  });

  it("should prefer user ID over IP address", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
      },
    } as any);

    const identifier = getRateLimitIdentifier(request, "user-123");
    expect(identifier).toBe("user:user-123");
  });

  it("should check rate limit (in-memory fallback)", async () => {
    const identifier = "test-identifier";
    const result = await checkRateLimit(identifier, "default");
    
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("reset");
  });
});

