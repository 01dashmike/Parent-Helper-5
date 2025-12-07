/**
 * Mock Supabase client for unit tests
 */

export const createMockSupabaseClient = () => {
  const mockData: Record<string, any[]> = {};
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = jest.fn((table: string) => {
    if (!mockData[table]) {
      mockData[table] = [];
    }

    return {
      select: mockSelect.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        data: mockData[table],
        error: null,
      }),
      insert: mockInsert.mockResolvedValue({
        data: null,
        error: null,
        select: jest.fn().mockReturnThis(),
        single: mockSingle,
      }),
      update: mockUpdate.mockResolvedValue({
        data: null,
        error: null,
      }),
      delete: mockDelete.mockResolvedValue({
        data: null,
        error: null,
      }),
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    };
  });

  return {
    from: mockFrom,
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    _mockData: mockData,
    _mockFrom: mockFrom,
    _mockSelect: mockSelect,
    _mockInsert: mockInsert,
    _mockUpdate: mockUpdate,
    _mockDelete: mockDelete,
    _mockEq: mockEq,
    _mockSingle: mockSingle,
  };
};

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

