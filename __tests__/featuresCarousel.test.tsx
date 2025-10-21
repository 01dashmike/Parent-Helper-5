import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeaturesCarousel from "@/components/FeaturesCarousel";

jest.mock("@/data/featuresData", () => ({
  features: [
    { title: "Baby & Toddler", description: "Fun classes for little ones." },
    { title: "After School Clubs", description: "Activities for kids 5–12." },
  ],
}));

test("renders all features from data", () => {
  render(<FeaturesCarousel />);
  expect(screen.getByText("Baby & Toddler")).toBeInTheDocument();
  expect(screen.getByText("After School Clubs")).toBeInTheDocument();
});
