"use client";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedClasses from "@/components/FeaturedClasses";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <FeaturedClasses />
        <CategoryGrid />
      </main>
      <Footer />
    </div>
  );
}
