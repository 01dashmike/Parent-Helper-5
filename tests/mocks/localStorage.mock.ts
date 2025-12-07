/**
 * Mock localStorage for browser-only features
 */

export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    _store: store,
  };
};

// Set up global localStorage mock
if (typeof window !== "undefined") {
  const mockStorage = createMockLocalStorage();
  Object.defineProperty(window, "localStorage", {
    value: mockStorage,
    writable: true,
  });
}

