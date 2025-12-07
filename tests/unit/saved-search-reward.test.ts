/**
 * Unit tests for saved search reward awarding (25 points)
 * 
 * Tests:
 * - Award is triggered only on FIRST saved search
 * - No duplicate rewards for subsequent searches
 * - Correct reward metadata (milestone: "first_saved_search", search_id)
 * - Correct points (25) and value_cents (0)
 * - Reward eligibility check works with RLS policies
 * - Handles errors gracefully
 */

import { awardSavedSearchReward } from "@/lib/rewards/integrations";
import { getSupabaseServer } from "@/lib/supabase.server";

// Mock dependencies
jest.mock("@/lib/supabase.server");

const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;

describe("Saved Search Reward Awarding", () => {
  const mockUserId = "user-123-abc";
  const mockSearchId1 = "search-456-def";
  const mockSearchId2 = "search-789-ghi";
  const mockRewardId = "reward-999-xyz";

  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment
    process.env.REWARDS_ENABLED = "true";

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    mockGetSupabaseServer.mockReturnValue(mockSupabase as any);
  });

  describe("First Saved Search - Award Creation", () => {
    it("should award 25 points on first saved search", async () => {
      // Mock: No existing reward found
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" }, // Not found error code
      });

      // Mock: Reward insert
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      // Verify eligibility check query
      expect(mockSupabase.from).toHaveBeenCalledWith("rewards");
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockEq).toHaveBeenCalledWith("source", "milestone");
      expect(mockEq).toHaveBeenCalledWith("metadata->>milestone", "first_saved_search");

      // Verify reward insert
      expect(mockInsert).toHaveBeenCalledTimes(1);
      const insertCall = mockInsert.mock.calls[0][0];
      
      expect(insertCall.user_id).toBe(mockUserId);
      expect(insertCall.source).toBe("milestone");
      expect(insertCall.points).toBe(25);
      expect(insertCall.value_cents).toBe(0);
      expect(insertCall.status).toBe("available");
      expect(insertCall.metadata).toMatchObject({
        source: "milestone",
        milestone: "first_saved_search",
        search_id: mockSearchId1,
      });
    });

    it("should create reward with correct metadata structure", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      const insertCall = mockInsert.mock.calls[0][0];
      const metadata = insertCall.metadata;

      // Verify metadata structure
      expect(metadata.source).toBe("milestone");
      expect(metadata.milestone).toBe("first_saved_search");
      expect(metadata.search_id).toBe(mockSearchId1);
    });

    it("should set value_cents to 0 (points-only reward)", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.value_cents).toBe(0);
      expect(insertCall.points).toBe(25);
    });

    it("should set status to 'available'", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.status).toBe("available");
    });
  });

  describe("Duplicate Prevention", () => {
    it("should NOT award reward if user already received saved search reward", async () => {
      // Mock: Existing reward found
      const existingReward = {
        id: mockRewardId,
        user_id: mockUserId,
        source: "milestone",
        metadata: {
          milestone: "first_saved_search",
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: existingReward,
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      // Verify eligibility check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith("rewards");
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockEq).toHaveBeenCalledWith("source", "milestone");
      expect(mockEq).toHaveBeenCalledWith("metadata->>milestone", "first_saved_search");

      // Verify insert was NOT called
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only the select query
    });

    it("should NOT award reward on second saved search", async () => {
      // First call: award reward
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect1.mockReturnValue({
          eq: mockEq1.mockReturnValue({
            eq: mockEq1,
            single: mockSingle1,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      // Second call: should not award (existing reward found)
      const existingReward = {
        id: mockRewardId,
        user_id: mockUserId,
        source: "milestone",
        metadata: {
          milestone: "first_saved_search",
        },
      };

      const mockSelect2 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle2 = jest.fn().mockResolvedValue({
        data: existingReward,
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect2.mockReturnValue({
          eq: mockEq2.mockReturnValue({
            eq: mockEq2,
            single: mockSingle2,
          }),
        }),
      });

      await awardSavedSearchReward(mockUserId, mockSearchId2);

      // Verify insert was only called once (first search)
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it("should check for existing reward using correct query filters", async () => {
      const existingReward = {
        id: mockRewardId,
        user_id: mockUserId,
        source: "milestone",
        metadata: {
          milestone: "first_saved_search",
          search_id: mockSearchId1,
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: existingReward,
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      await awardSavedSearchReward(mockUserId, mockSearchId2);

      // Verify query filters match RLS policy expectations
      const calls = mockEq.mock.calls;
      expect(calls).toContainEqual(["user_id", mockUserId]);
      expect(calls).toContainEqual(["source", "milestone"]);
      expect(calls).toContainEqual(["metadata->>milestone", "first_saved_search"]);
    });
  });

  describe("RLS Policy Compatibility", () => {
    it("should work with RLS policies by filtering on user_id", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      // Verify user_id filter is applied (required for RLS)
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUserId);
    });

    it("should handle RLS policy errors gracefully", async () => {
      const rlsError = {
        code: "42501",
        message: "permission denied for table rewards",
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: rlsError,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      // Should not throw, should handle gracefully
      await expect(awardSavedSearchReward(mockUserId, mockSearchId1)).resolves.not.toThrow();

      // Should not attempt insert if query fails
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });
  });

  describe("Feature Flag", () => {
    it("should return early if REWARDS_ENABLED is false", async () => {
      process.env.REWARDS_ENABLED = "false";

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should return early if REWARDS_ENABLED is undefined", async () => {
      delete process.env.REWARDS_ENABLED;

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle Supabase connection errors gracefully", async () => {
      mockGetSupabaseServer.mockReturnValueOnce(null);

      await expect(awardSavedSearchReward(mockUserId, mockSearchId1)).resolves.not.toThrow();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should handle insert errors gracefully", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const insertError = {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      };

      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: insertError,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      // Should not throw, should handle gracefully
      await expect(awardSavedSearchReward(mockUserId, mockSearchId1)).resolves.not.toThrow();
    });

    it("should handle query errors gracefully", async () => {
      const queryError = {
        code: "42P01",
        message: "relation rewards does not exist",
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: queryError,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      // Should not throw, should handle gracefully
      await expect(awardSavedSearchReward(mockUserId, mockSearchId1)).resolves.not.toThrow();
    });
  });

  describe("Reward Metadata Validation", () => {
    it("should include search_id in metadata", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.search_id).toBe(mockSearchId1);
    });

    it("should use correct source type in metadata", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: mockRewardId }],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await awardSavedSearchReward(mockUserId, mockSearchId1);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.source).toBe("milestone");
      expect(insertCall.source).toBe("milestone");
    });
  });
});

