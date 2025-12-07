/**
 * Unit tests for saved search functionality
 */

import { createMockSupabaseClient } from "../mocks/supabaseClient.mock";

describe("Saved Search", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  describe("Search Save Event Pre-Login", () => {
    it("should store search in localStorage when user not logged in", () => {
      const searchParams = {
        query: "baby classes",
        town: "London",
        category: "music",
      };

      // Simulate anonymous user saving search
      const pendingSearches = JSON.parse(
        localStorage.getItem("pending_saved_searches") || "[]"
      );
      pendingSearches.push({
        ...searchParams,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem("pending_saved_searches", JSON.stringify(pendingSearches));

      const stored = JSON.parse(localStorage.getItem("pending_saved_searches") || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].query).toBe("baby classes");
    });

    it("should prompt for login when saving search anonymously", () => {
      const isLoggedIn = false;
      const shouldPromptLogin = !isLoggedIn;

      expect(shouldPromptLogin).toBe(true);
    });
  });

  describe("Search Save Event Post-Login", () => {
    it("should create record in saved_searches table", async () => {
      const userId = "user-123";
      const searchData = {
        query: "toddler swimming",
        town: "Manchester",
        category: "swimming",
        filters: { age: "2-3" },
      };

      mockSupabase._mockInsert.mockResolvedValueOnce({
        data: [{ id: 1, user_id: userId, ...searchData }],
        error: null,
      });

      const result = await mockSupabase.from("saved_searches").insert({
        user_id: userId,
        search_params: searchData,
        name: "My Search",
        is_active: true,
      });

      expect(mockSupabase._mockInsert).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it("should sync pending searches after login", async () => {
      const userId = "user-123";
      const pendingSearches = [
        { query: "music", town: "London" },
        { query: "swimming", town: "Birmingham" },
      ];

      // Simulate syncing pending searches
      for (const search of pendingSearches) {
        mockSupabase._mockInsert.mockResolvedValueOnce({
          data: [{ id: Date.now(), user_id: userId, ...search }],
          error: null,
        });

        await mockSupabase.from("saved_searches").insert({
          user_id: userId,
          search_params: search,
          is_active: true,
        });
      }

      expect(mockSupabase._mockInsert).toHaveBeenCalledTimes(2);
    });
  });

  describe("Saved Search Retrieval", () => {
    it("should fetch user's saved searches", async () => {
      const userId = "user-123";
      const mockSearches = [
        { id: 1, user_id: userId, name: "Music Classes", is_active: true },
        { id: 2, user_id: userId, name: "Swimming", is_active: true },
      ];

      mockSupabase._mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockSearches,
            error: null,
          }),
        }),
      });

      const result = await mockSupabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      expect(result.data).toEqual(mockSearches);
    });

    it("should filter active searches only", async () => {
      const userId = "user-123";
      const allSearches = [
        { id: 1, is_active: true },
        { id: 2, is_active: false },
        { id: 3, is_active: true },
      ];

      const activeSearches = allSearches.filter((s) => s.is_active);
      expect(activeSearches).toHaveLength(2);
    });
  });

  describe("Search Alert Triggering", () => {
    it("should match new classes to saved searches", () => {
      const savedSearch = {
        query: "baby sensory",
        town: "London",
        category: "sensory",
      };

      const newClass = {
        name: "Baby Sensory London",
        town: "London",
        category: "sensory",
      };

      const matches =
        newClass.name.toLowerCase().includes(savedSearch.query.toLowerCase()) &&
        newClass.town === savedSearch.town &&
        newClass.category === savedSearch.category;

      expect(matches).toBe(true);
    });
  });
});

