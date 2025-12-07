/**
 * Accessibility tests for CategoryRail component
 */

import React from "react";
import { render, getAllByRole } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";
import CategoryRail from "@/components/search/CategoryRail";

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
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe("CategoryRail Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<CategoryRail />);
  });

  it("should have accessible category buttons", () => {
    const { container } = render(<CategoryRail />);
    
    // All category buttons should be accessible
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    
    // Each button should have accessible text
    buttons.forEach((button) => {
      expect(button.textContent).toBeTruthy();
    });
  });

  it("should have proper ARIA attributes for filter state", () => {
    const { container } = render(<CategoryRail />);
    
    // Buttons should be properly labeled
    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-label");
    });
  });
});

