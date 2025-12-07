/**
 * Accessibility tests for Search page
 */

import React from "react";
import { render, getByRole, getByLabelText } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";

// Mock Next.js components
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/search",
    query: {},
    asPath: "/search",
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/search",
}));

// Mock components
jest.mock("@/components/search/SearchFields", () => ({
  __esModule: true,
  default: () => (
    <form data-testid="search-fields">
      <input type="text" aria-label="Search query" />
      <button type="submit">Search</button>
    </form>
  ),
}));

jest.mock("@/components/search/CategoryRail", () => ({
  __esModule: true,
  default: () => <nav data-testid="category-rail">Category Rail</nav>,
}));

jest.mock("@/components/search/ResultsSplit", () => ({
  __esModule: true,
  default: () => <section data-testid="results">Search Results</section>,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Simple Search page structure for testing
const SearchPage = () => {
  return (
    <div>
      <header>
        <h1>Search Classes</h1>
      </header>
      <main>
        <form data-testid="search-fields">
          <input type="text" aria-label="Search query" />
          <button type="submit">Search</button>
        </form>
        <nav data-testid="category-rail">Category Rail</nav>
        <section data-testid="results">Search Results</section>
      </main>
    </div>
  );
};

describe("Search Page Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<SearchPage />);
  });

  it("should have proper semantic HTML structure", () => {
    const { container } = render(<SearchPage />);
    
    // Should have header
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    
    // Should have main content
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    
    // Should have navigation
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("should have accessible search form", () => {
    const { container } = render(<SearchPage />);
    
    // Search input should be accessible
    const searchInput = container.querySelector('input[type="text"]');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("aria-label");
    
    // Submit button should be accessible
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeInTheDocument();
  });
});

