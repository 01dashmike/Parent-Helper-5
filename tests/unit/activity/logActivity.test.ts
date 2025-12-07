/**
 * Unit tests for activity logging
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { logActivity, getRecentActivity } from "@/lib/activityLog";

// Mock Supabase
vi.mock("@/lib/supabase.server", () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

describe("logActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs an event successfully", async () => {
    await expect(
      logActivity({
        eventType: "provider.signup",
        scope: "provider",
        title: "Test event",
        description: "Test description",
      })
    ).resolves.not.toThrow();
  });

  it("handles Supabase error gracefully (no throw)", async () => {
    const { getSupabaseServer } = await import("@/lib/supabase.server");
    const mockSupabase = getSupabaseServer() as any;
    
    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: new Error("Database error") })),
    }));

    // Should not throw
    await expect(
      logActivity({
        eventType: "provider.signup",
        scope: "provider",
        title: "Test event",
      })
    ).resolves.not.toThrow();
  });

  it("handles missing Supabase gracefully", async () => {
    vi.mocked(await import("@/lib/supabase.server")).getSupabaseServer = vi.fn(() => null);

    // Should not throw
    await expect(
      logActivity({
        eventType: "provider.signup",
        scope: "provider",
        title: "Test event",
      })
    ).resolves.not.toThrow();
  });
});

describe("getRecentActivity", () => {
  it("returns empty array on error", async () => {
    const { getSupabaseServer } = await import("@/lib/supabase.server");
    const mockSupabase = getSupabaseServer() as any;
    
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: null, error: new Error("Query failed") })),
        })),
      })),
    }));

    const result = await getRecentActivity();
    expect(result).toEqual([]);
  });
});

