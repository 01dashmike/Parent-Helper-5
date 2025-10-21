import ContactSection from "@/components/ContactSection";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <div className="space-y-16">
      <HeroSection />
      <FeaturesCarousel />
      <ContactSection />
    </div>
  );
}
