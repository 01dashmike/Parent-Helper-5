/**
 * Accessibility tests for SearchFields component
 */

import React from "react";
import { render, getByRole, getAllByRole } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";
import SearchFields from "@/components/SearchFields";

// Mock Next.js router
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
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
}));

describe("SearchFields Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<SearchFields />);
  });

  it("should have accessible form elements", () => {
    const { container } = render(<SearchFields />);
    
    // Form should be accessible
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    
    // Should have accessible buttons
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

