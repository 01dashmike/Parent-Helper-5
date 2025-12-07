/**
 * Accessibility tests for SearchBar component
 */

import React from "react";
import { render, getByRole, getByLabelText } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";
import SearchBar from "@/components/SearchBar";

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

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
}));

describe("SearchBar Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<SearchBar />);
  });

  it("should have accessible form elements", () => {
    const { container } = render(<SearchBar />);
    
    // Form should be accessible
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    
    // Search input should have accessible label
    const searchInput = container.querySelector('input[type="text"]');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("aria-label");
    
    // Submit button should have accessible label
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("aria-label");
  });

  it("should have proper form structure", () => {
    const { container } = render(<SearchBar />);
    
    // Should have a form element
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    
    // Should have a submit button
    const button = container.querySelector('button[type="submit"]');
    expect(button).toBeInTheDocument();
  });
});

