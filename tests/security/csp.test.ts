/**
 * Content Security Policy tests
 */

import { generateCSP } from "@/lib/security/csp";

describe("Content Security Policy", () => {
  it("should generate CSP with required directives", () => {
    const csp = generateCSP();
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("style-src");
    expect(csp).toContain("img-src");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("frame-src");
  });

  it("should include Stripe in frame-src", () => {
    const csp = generateCSP();
    expect(csp).toContain("js.stripe.com");
    expect(csp).toContain("checkout.stripe.com");
  });

  it("should include Supabase in connect-src", () => {
    const csp = generateCSP();
    // Supabase URL is from env, so we check for the pattern
    expect(csp).toMatch(/connect-src.*supabase/);
  });

  it("should include nonce when provided", () => {
    const nonce = "test-nonce-123";
    const csp = generateCSP(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it("should include upgrade-insecure-requests in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    
    const csp = generateCSP();
    expect(csp).toContain("upgrade-insecure-requests");
    
    process.env.NODE_ENV = originalEnv;
  });
});

