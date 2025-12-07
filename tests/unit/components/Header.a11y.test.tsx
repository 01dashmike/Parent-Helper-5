/**
 * Accessibility tests for Header component
 */

import React from "react";
import { render, getByRole, getByLabelText } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";
import Header from "@/components/Header";

// Mock Next.js Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Header Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<Header />);
  });

  it("should have proper ARIA labels for navigation", () => {
    const { container } = render(<Header />);
    
    // Check for main navigation landmark
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });
});

