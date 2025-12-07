/**
 * Accessibility test index - runs all component accessibility tests
 * 
 * This file serves as a central entry point for running all accessibility tests
 * when you run `npm test`. Individual component tests are in separate files.
 */

import { testA11yBatch } from "../../utils/a11y-test-utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CategoryRail from "@/components/search/CategoryRail";
import { BookingButton } from "@/components/BookingButton";

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js router
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

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock SearchAutocomplete
jest.mock("@/components/search/SearchAutocomplete", () => ({
  SearchAutocomplete: ({ value, onChange, placeholder, className, onSubmit }: any) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSubmit) {
          onSubmit(value);
        }
      }}
      placeholder={placeholder}
      className={className}
      aria-label="Search for classes or locations"
    />
  ),
}));

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  hasSupabaseBrowserEnv: () => false,
  createSupabaseBrowserClient: () => null,
}));

// Mock analytics
jest.mock("@/lib/analytics/index", () => ({
  track: jest.fn(),
}));

describe("Component Accessibility Test Suite", () => {
  it("should test all major components for accessibility violations", async () => {
    const components = [
      <Header key="header" />,
      <Footer key="footer" />,
      <SearchBar key="searchbar" />,
      <CategoryRail key="categoryrail" />,
      <BookingButton 
        key="bookingbutton"
        paymentLinkUrl="https://example.com/book"
        occurrenceId={123}
      />,
    ];

    await testA11yBatch(components);
  }, 30000); // Increased timeout for batch testing
});

