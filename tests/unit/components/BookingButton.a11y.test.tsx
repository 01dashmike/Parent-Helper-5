/**
 * Accessibility tests for BookingButton component
 */

import React from "react";
import { render, getByRole } from "@testing-library/react";
import { testA11y } from "../../utils/a11y-test-utils";
import { BookingButton } from "@/components/BookingButton";

// Mock analytics
jest.mock("@/lib/analytics/index", () => ({
  track: jest.fn(),
}));

describe("BookingButton Accessibility", () => {
  const defaultProps = {
    paymentLinkUrl: "https://example.com/book",
    occurrenceId: 123,
  };

  it("should have no accessibility violations", async () => {
    await testA11y(<BookingButton {...defaultProps} />);
  });

  it("should have accessible link with proper attributes", () => {
    const { container } = render(<BookingButton {...defaultProps} />);
    
    // Should be a link (anchor tag)
    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent(/book now/i);
    
    // Should have proper ARIA label
    expect(link).toHaveAttribute("aria-label", "Book now (opens in new tab)");
    
    // Should have proper rel attributes for external links
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should have accessible icon with aria-hidden", () => {
    const { container } = render(<BookingButton {...defaultProps} />);
    
    // Icon should be marked as decorative
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("should work with custom className", () => {
    const { container } = render(
      <BookingButton {...defaultProps} className="custom-class" />
    );
    
    const link = container.querySelector("a");
    expect(link).toHaveClass("custom-class");
  });
});

