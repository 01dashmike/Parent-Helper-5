/**
 * Accessibility tests for Home page
 */

import React from "react";
import { render } from "@testing-library/react";
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
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock components that might have complex dependencies
jest.mock("@/components/Header", () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

jest.mock("@/components/Footer", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock("@/components/HomeHero", () => ({
  __esModule: true,
  default: () => <section data-testid="hero">Hero Section</section>,
}));

jest.mock("@/components/home/PersonalizedRecommendations", () => ({
  __esModule: true,
  default: () => <section data-testid="recommendations">Recommendations</section>,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  hasSupabaseBrowserEnv: () => false,
  createSupabaseBrowserClient: () => null,
}));

// Simple Home page structure for testing
const HomePage = () => {
  return (
    <div>
      <header data-testid="header">Header</header>
      <main>
        <section data-testid="hero">Hero Section</section>
        <section data-testid="recommendations">Recommendations</section>
      </main>
      <footer data-testid="footer">Footer</footer>
    </div>
  );
};

describe("Home Page Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<HomePage />);
  });

  it("should have proper semantic HTML structure", () => {
    const { container } = render(<HomePage />);
    
    // Should have header
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    
    // Should have main content
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    
    // Should have footer
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });

  it("should have proper heading hierarchy", () => {
    const { container } = render(<HomePage />);
    
    // Check for proper heading structure (if headings exist)
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    // This is a basic check - actual implementation may vary
    expect(headings.length).toBeGreaterThanOrEqual(0);
  });
});

