import ContactSection from "@/components/ContactSection";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";

export default function Home() {
  return (
    <div className="space-y-12 md:space-y-14">
      <HeroSection />
      <section className="mt-6 md:mt-4">
        <FeaturesCarousel />
      </section>
      <HowItWorksSection />
      <ContactSection />
    </div>
  );
}
