/**
 * Integration tests for Venue Marketplace Page
 */

import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import VenueMarketplacePage from "@/app/providers/venues/info/page";

describe("Venue Marketplace Page", () => {
  it("renders hero section", () => {
    render(<VenueMarketplacePage />);
    
    expect(screen.getByText(/Find the Perfect Venue/i)).toBeInTheDocument();
  });

  it("renders benefits for providers", () => {
    render(<VenueMarketplacePage />);
    
    expect(screen.getByText(/Benefits for Providers/i)).toBeInTheDocument();
    expect(screen.getByText(/Perfect Locations/i)).toBeInTheDocument();
  });

  it("renders lead capture form", () => {
    render(<VenueMarketplacePage />);
    
    expect(screen.getByText(/Register Your Interest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it("form validation works", async () => {
    render(<VenueMarketplacePage />);
    
    const submitButton = screen.getByRole("button", { name: /Register Interest/i });
    expect(submitButton).toBeDisabled(); // Should be disabled until required fields filled
  });
});

