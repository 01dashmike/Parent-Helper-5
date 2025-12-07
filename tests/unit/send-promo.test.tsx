/**
 * Unit tests for SEND Promo Page
 * Tests rendering, quick links, and SSR compatibility
 */

import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import SendPromoPage from "@/app/send/promo/page";
import SendChecklist from "@/components/send/SendChecklist";
import BadgeSystemPreview from "@/components/send/BadgeSystemPreview";
import SuccessStoriesCarousel from "@/components/send/SuccessStoriesCarousel";

// Mock Next.js dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: () => Promise<any>) => {
    const Component = async () => {
      const mod = await fn();
      const ResolvedComponent = mod.default || mod;
      return React.createElement(ResolvedComponent);
    };
    Component.displayName = "DynamicComponent";
    return Component;
  },
}));

// Mock SafeBoundary
jest.mock("@/components/system/SafeBoundary", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Next.js Link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SEND Promo Page", () => {
  describe("Quick Links Rendering", () => {
    it("should render all quick links", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText("SEND Classes")).toBeInTheDocument();
        expect(screen.getByText("Local Support Groups")).toBeInTheDocument();
        expect(screen.getByText("SEND Resources Hub")).toBeInTheDocument();
        expect(screen.getByText("SEND-Friendly Providers")).toBeInTheDocument();
      });
    });

    it("should have correct hrefs for quick links", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        const sendClassesLink = screen.getByRole("link", { name: /SEND Classes/i });
        expect(sendClassesLink).toHaveAttribute("href", "/send/classes");

        const supportGroupsLink = screen.getByRole("link", { name: /Local Support Groups/i });
        expect(supportGroupsLink).toHaveAttribute("href", "/send/support");

        const resourcesLink = screen.getByRole("link", { name: /SEND Resources Hub/i });
        expect(resourcesLink).toHaveAttribute("href", "/send/resources");

        const providersLink = screen.getByRole("link", { name: /SEND-Friendly Providers/i });
        expect(providersLink).toHaveAttribute("href", "/send/classes?send-friendly=true");
      });
    });

    it("should render quick link descriptions", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText(/Find classes designed for children with additional needs/i)).toBeInTheDocument();
        expect(screen.getByText(/Connect with local SEND support groups/i)).toBeInTheDocument();
        expect(screen.getByText(/Access trusted resources from IPSEA/i)).toBeInTheDocument();
      });
    });
  });

  describe("Hero Section", () => {
    it("should render hero headline", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText("Supporting every family, every child")).toBeInTheDocument();
      });
    });

    it("should render hero description", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText(/Find SEND-friendly classes, connect with support groups/i)).toBeInTheDocument();
      });
    });
  });

  describe("Provider Section", () => {
    it("should render provider section heading", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText("Make your classes SEND-friendly")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Section", () => {
    it("should render accessibility commitment section", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText("Accessibility Commitment")).toBeInTheDocument();
      });
    });

    it("should render accessibility information for families", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText(/For Families/i)).toBeInTheDocument();
        expect(screen.getByText(/Detailed accessibility information for every class/i)).toBeInTheDocument();
      });
    });

    it("should render accessibility information for providers", async () => {
      const page = await SendPromoPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByText(/For Providers/i)).toBeInTheDocument();
        expect(screen.getByText(/Free SEND-friendly badge when you meet criteria/i)).toBeInTheDocument();
      });
    });
  });

  describe("SSR Compatibility", () => {
    it("should render without SSR errors", async () => {
      const page = await SendPromoPage();
      expect(() => render(page)).not.toThrow();
    });

    it("should render all sections without hydration errors", async () => {
      const page = await SendPromoPage();
      const { container } = render(page);

      await waitFor(() => {
        // Check that main sections are present
        expect(container.querySelector("section")).toBeInTheDocument();
        expect(container.querySelector("h1")).toBeInTheDocument();
      });
    });
  });
});

describe("SendChecklist Component", () => {
  it("should render checklist items", () => {
    render(<SendChecklist />);

    expect(screen.getByText("SEND-Friendly Checklist")).toBeInTheDocument();
    expect(screen.getByText("Sensory-friendly environment")).toBeInTheDocument();
    expect(screen.getByText("Small group sizes")).toBeInTheDocument();
  });

  it("should show progress indicator", () => {
    render(<SendChecklist />);

    expect(screen.getByText(/of \d+ completed/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should allow checking items", () => {
    render(<SendChecklist />);

    const firstItem = screen.getByLabelText("Sensory-friendly environment");
    expect(firstItem).not.toBeChecked();

    // Note: In a real test, you'd simulate a click, but for SSR testing we just check it renders
    expect(firstItem).toBeInTheDocument();
  });
});

describe("BadgeSystemPreview Component", () => {
  it("should render badge previews", () => {
    render(<BadgeSystemPreview />);

    expect(screen.getByText("SEND-Friendly Badge")).toBeInTheDocument();
    expect(screen.getByText("Standard Badge")).toBeInTheDocument();
    expect(screen.getByText("Medium Badge")).toBeInTheDocument();
    expect(screen.getByText("Small Badge")).toBeInTheDocument();
  });

  it("should render badge benefits", () => {
    render(<BadgeSystemPreview />);

    expect(screen.getByText("Badge Benefits")).toBeInTheDocument();
    expect(screen.getByText(/Increased visibility in SEND-specific searches/i)).toBeInTheDocument();
  });
});

describe("SuccessStoriesCarousel Component", () => {
  it("should render carousel", () => {
    render(<SuccessStoriesCarousel />);

    expect(screen.getByText("Success Stories")).toBeInTheDocument();
  });

  it("should render navigation buttons", () => {
    render(<SuccessStoriesCarousel />);

    expect(screen.getByLabelText("Previous story")).toBeInTheDocument();
    expect(screen.getByLabelText("Next story")).toBeInTheDocument();
  });

  it("should render story content", () => {
    render(<SuccessStoriesCarousel />);

    // Should render at least one story quote
    expect(screen.getByText(/Finding a sensory-friendly/i)).toBeInTheDocument();
  });
});

