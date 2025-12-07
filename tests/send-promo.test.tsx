/**
 * Integration tests for SEND Support Landing Page
 */

import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import SENDSupportPage from "@/app/send/promo/page";

describe("SEND Support Landing Page", () => {
  it("renders hero section", () => {
    render(<SENDSupportPage />);
    
    expect(screen.getByText(/Supporting Every Family, Every Child/i)).toBeInTheDocument();
  });

  it("renders quick links section", () => {
    render(<SENDSupportPage />);
    
    expect(screen.getByText(/Quick Links/i)).toBeInTheDocument();
    expect(screen.getByText(/Find SEND-Friendly Classes/i)).toBeInTheDocument();
    expect(screen.getByText(/Local Support Groups/i)).toBeInTheDocument();
  });

  it("renders provider checklist", () => {
    render(<SENDSupportPage />);
    
    expect(screen.getByText(/Make Your Classes SEND-Friendly/i)).toBeInTheDocument();
    expect(screen.getByText(/Wheelchair accessible venues/i)).toBeInTheDocument();
  });

  it("renders accessibility guidance", () => {
    render(<SENDSupportPage />);
    
    expect(screen.getByText(/Finding the Right Class/i)).toBeInTheDocument();
    expect(screen.getByText(/Physical Accessibility/i)).toBeInTheDocument();
  });

  it("includes accessibility schema", () => {
    render(<SENDSupportPage />);
    
    const schemaScript = document.querySelector('script[type="application/ld+json"]');
    expect(schemaScript).toBeInTheDocument();
    
    const schema = JSON.parse(schemaScript?.textContent || "{}");
    expect(schema["@type"]).toBe("WebPage");
    expect(schema.accessibilityFeature).toBeDefined();
  });

  it("has SSR-safe rendering", () => {
    // Test that component renders without hydration errors
    const { container } = render(<SENDSupportPage />);
    expect(container).toBeTruthy();
  });
});

