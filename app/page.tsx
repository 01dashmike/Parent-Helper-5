"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedClasses from "@/components/FeaturedClasses";
import HowItWorks from "@/components/HowItWorks";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <section className="bg-gradient-to-br from-teal via-teal-dark to-lavender py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-0">
          <HeroSection />
        </div>
      </section>
      <section className="bg-white py-16">
        <FeaturedClasses />
        <CategoryGrid />
      </section>
      <section className="bg-cream pb-20">
        <HowItWorks />
      </section>
      <Footer />
    </div>
  );
}
