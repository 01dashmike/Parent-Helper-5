/**
 * Integration tests for Provider Landing Page
 */

import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import ProviderLandingPage from "@/app/providers/landing/page";

expect.extend(toHaveNoViolations);

describe("Provider Landing Page", () => {
  it("renders hero section with headline and CTA", () => {
    render(<ProviderLandingPage />);
    
    expect(screen.getByText(/List Your Classes. Reach More Families./i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get Started Free/i })).toBeInTheDocument();
  });

  it("renders benefits grid with 6 items", () => {
    render(<ProviderLandingPage />);
    
    expect(screen.getByText(/Why Providers Choose Parent Helper/i)).toBeInTheDocument();
    expect(screen.getByText(/Reach Thousands of Families/i)).toBeInTheDocument();
    expect(screen.getByText(/Grow Your Business/i)).toBeInTheDocument();
    expect(screen.getByText(/Trusted Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Powerful Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Free to List/i)).toBeInTheDocument();
  });

  it("renders how it works section with 3 steps", () => {
    render(<ProviderLandingPage />);
    
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    expect(screen.getByText(/List Your Classes/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Getting Bookings/i)).toBeInTheDocument();
  });

  it("renders FAQ accordion that toggles", async () => {
    render(<ProviderLandingPage />);
    
    const firstQuestion = screen.getByText(/How much does it cost/i);
    expect(firstQuestion).toBeInTheDocument();
    
    // Click to expand
    firstQuestion.click();
    
    // Check answer is visible
    expect(await screen.findByText(/completely free to list/i)).toBeInTheDocument();
  });

  it("has accessible CTA links", () => {
    render(<ProviderLandingPage />);
    
    const ctaLink = screen.getByRole("link", { name: /Get Started Free/i });
    expect(ctaLink).toHaveAttribute("href", "/provider/signup");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProviderLandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("includes FAQ schema markup", () => {
    render(<ProviderLandingPage />);
    
    const schemaScript = document.querySelector('script[type="application/ld+json"]');
    expect(schemaScript).toBeInTheDocument();
    
    const schema = JSON.parse(schemaScript?.textContent || "{}");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(6);
  });
});

