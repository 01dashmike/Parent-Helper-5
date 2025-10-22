import ContactSection from "@/components/ContactSection";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";

export default function Home() {
  return (
    <div className="space-y-14 md:space-y-16">
      <HeroSection />
      <FeaturesCarousel />
      <HowItWorksSection />
      <ContactSection />
    </div>
  );
}
