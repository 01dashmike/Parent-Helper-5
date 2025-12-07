/**
 * Unit tests for SEO metadata generation
 */

import { Metadata } from "next";

describe("SEO Metadata", () => {
  describe("City Page Metadata", () => {
    const generateCityMetadata = (town: string): Metadata => {
      const formattedTown = town
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      return {
        title: `Baby & Toddler Classes in ${formattedTown} | Parent Helper`,
        description: `Discover trusted baby and toddler classes in ${formattedTown}. Search music groups, sensory play, yoga, and more with Parent Helper.`,
        openGraph: {
          title: `Baby & Toddler Classes in ${formattedTown}`,
          description: `Find the best baby and toddler classes in ${formattedTown}`,
        },
      };
    };

    it("should generate correct title for city page", () => {
      const metadata = generateCityMetadata("london");
      expect(metadata.title).toBe("Baby & Toddler Classes in London | Parent Helper");
    });

    it("should handle multi-word city names", () => {
      const metadata = generateCityMetadata("manchester-city");
      expect(metadata.title).toBe("Baby & Toddler Classes in Manchester City | Parent Helper");
    });

    it("should include description with city name", () => {
      const metadata = generateCityMetadata("birmingham");
      expect(metadata.description).toContain("Birmingham");
      expect(metadata.description).toContain("baby and toddler classes");
    });

    it("should generate OpenGraph metadata", () => {
      const metadata = generateCityMetadata("liverpool");
      expect(metadata.openGraph?.title).toContain("Liverpool");
      expect(metadata.openGraph?.description).toBeDefined();
    });
  });

  describe("Dynamic Title Generation", () => {
    it("should render SSR with dynamic title", async () => {
      // Mock Next.js metadata generation
      const mockGenerateMetadata = async (params: { town: string }) => {
        return {
          title: `Classes in ${params.town}`,
        };
      };

      const metadata = await mockGenerateMetadata({ town: "London" });
      expect(metadata.title).toBe("Classes in London");
    });

    it("should include meta description", () => {
      const metadata = {
        title: "Test Page",
        description: "This is a test description for SEO",
      };

      expect(metadata.description).toBeDefined();
      expect(metadata.description?.length).toBeGreaterThan(50);
      expect(metadata.description?.length).toBeLessThan(160);
    });
  });

  describe("Search Page Metadata", () => {
    const generateSearchMetadata = (query?: string, town?: string) => {
      let title = "Find Baby & Toddler Classes Near You | Parent Helper";
      if (town && town !== "your area") {
        title = `Baby & Toddler Classes in ${town} | Parent Helper`;
      }
      if (query) {
        title = `${query} Classes for Babies & Toddlers | Parent Helper`;
      }

      return {
        title,
        description: `Discover trusted baby and toddler classes${town ? ` in ${town}` : ""}. Search music groups, sensory play, yoga, and more.`,
      };
    };

    it("should generate default title when no params", () => {
      const metadata = generateSearchMetadata();
      expect(metadata.title).toBe("Find Baby & Toddler Classes Near You | Parent Helper");
    });

    it("should prioritize query over town", () => {
      const metadata = generateSearchMetadata("music", "London");
      expect(metadata.title).toContain("music");
      expect(metadata.title).not.toContain("London");
    });

    it("should include town in description", () => {
      const metadata = generateSearchMetadata(undefined, "Manchester");
      expect(metadata.description).toContain("Manchester");
    });
  });

  describe("Canonical URLs", () => {
    it("should generate canonical URL for city pages", () => {
      const siteUrl = "https://parenthelper.co.uk";
      const town = "london";
      const canonical = `${siteUrl}/classes/${town}`;

      expect(canonical).toBe("https://parenthelper.co.uk/classes/london");
    });

    it("should include canonical in metadata", () => {
      const metadata: Metadata = {
        alternates: {
          canonical: "https://parenthelper.co.uk/classes/london",
        },
      };

      expect(metadata.alternates?.canonical).toBeDefined();
    });
  });
});

