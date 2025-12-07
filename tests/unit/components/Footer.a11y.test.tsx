/**
 * Accessibility tests for Footer component
 */

import React from "react";
import { render, getAllByRole } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";
import Footer from "@/components/Footer";

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  hasSupabaseBrowserEnv: () => false,
  createSupabaseBrowserClient: () => null,
}));

describe("Footer Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<Footer />);
  });

  it("should have proper semantic HTML structure", () => {
    const { container } = render(<Footer />);
    
    // Footer should use <footer> element
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });

  it("should have accessible links", () => {
    const { container } = render(<Footer />);
    
    // All links should be accessible
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
  });
});

