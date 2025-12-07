/**
 * Integration tests for Parents Landing Page
 */

import { describe, it, expect } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import ParentsPage from "@/app/parents/page";

describe("Parents Landing Page", () => {
  it("renders hero section with search input", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/Find Baby & Toddler Classes Near You/i)).toBeInTheDocument();
    // SearchFields component should be rendered
    expect(screen.getByPlaceholderText(/search/i) || screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("renders age explorer with 4 age groups", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/Explore by Age/i)).toBeInTheDocument();
    expect(screen.getByText(/Baby/i)).toBeInTheDocument();
    expect(screen.getByText(/Toddler/i)).toBeInTheDocument();
    expect(screen.getByText(/School Age/i)).toBeInTheDocument();
    expect(screen.getByText(/Teens/i)).toBeInTheDocument();
  });

  it("renders why families love section", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/Why Families Love Parent Helper/i)).toBeInTheDocument();
    expect(screen.getByText(/Local & Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/Trusted Reviews/i)).toBeInTheDocument();
  });

  it("renders this week near you section", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/This Week Near You/i)).toBeInTheDocument();
    expect(screen.getByText(/Baby Sensory Manchester/i)).toBeInTheDocument();
  });

  it("renders blog preview cards", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/Latest from Our Blog/i)).toBeInTheDocument();
    expect(screen.getByText(/10 Best Baby Classes/i)).toBeInTheDocument();
  });

  it("includes SEND section link", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/Supporting SEND Families/i)).toBeInTheDocument();
    const sendLink = screen.getByRole("link", { name: /Visit SEND Hub/i });
    expect(sendLink).toHaveAttribute("href", "/send");
  });

  it("renders newsletter signup banner", () => {
    render(<ParentsPage />);
    
    expect(screen.getByText(/Stay Updated/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
  });

  it("includes structured data", () => {
    render(<ParentsPage />);
    
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(schemaScripts.length).toBeGreaterThan(0);
    
    const schemas = Array.from(schemaScripts).map((script) => JSON.parse(script.textContent || "{}"));
    const hasLocalBusiness = schemas.some((s) => s["@type"] === "LocalBusiness");
    const hasWebSite = schemas.some((s) => s["@type"] === "WebSite");
    
    expect(hasLocalBusiness).toBe(true);
    expect(hasWebSite).toBe(true);
  });
});

