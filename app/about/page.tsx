import type { Metadata } from "next";
import Image from "next/image";
import { MotionH1 } from "@/components/motion/MotionH1";
import { MotionP } from "@/components/motion/MotionP";
import MotionSection from "@/components/motion/MotionSection";
import LinkComponent from "@/components/ui/link";
import { NewsletterButton } from "@/components/about/NewsletterButton";
import NewsletterModal from "@/components/NewsletterModal";
import { safeImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "About Us — Parent Helper",
  description:
    "Learn about Parent Helper, a family-founded platform dedicated to helping families across the nation discover amazing classes and resources for their little ones.",
};

const VALUES = [
  {
    title: "Family First",
    description:
      "We understand the challenges parents face because we're parents too. Every decision we make is guided by what's best for families.",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    title: "Community Connection",
    description:
      "We believe in the power of local communities. We're here to help families connect with amazing local providers and build lasting relationships.",
    icon: "🤝",
  },
  {
    title: "Trust & Quality",
    description:
      "We carefully curate our listings to ensure families can trust the quality of classes and services they discover through our platform.",
    icon: "✨",
  },
  {
    title: "Accessibility",
    description:
      "Every family deserves access to great classes and resources. We work to make finding and booking classes as easy and accessible as possible.",
    icon: "♿",
  },
];

const FEATURES = [
  {
    title: "Discover Classes",
    description:
      "Search through thousands of carefully curated baby and toddler classes across the UK. Find the perfect activity for your little one.",
    icon: "🔍",
  },
  {
    title: "Easy Booking",
    description:
      "Book classes directly through our platform. Simple, secure, and designed with busy parents in mind.",
    icon: "📅",
  },
  {
    title: "Helpful Resources",
    description:
      "Access guides, tips, and expert advice to support your parenting journey every step of the way.",
    icon: "📚",
  },
  {
    title: "Local Insights",
    description:
      "Get recommendations tailored to your area, with real reviews and insights from other local families.",
    icon: "📍",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-cream text-charcoal">
      {/* Hero Section */}
      <section className="section py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <MotionH1
            className="mb-6 text-4xl font-bold tracking-tight text-charcoal sm:text-5xl md:text-6xl"
            animation="slideUp"
            delay={0}
            duration={0.6}
            distance={20}
          >
            About Parent Helper
          </MotionH1>
          <MotionP
            className="mx-auto mb-8 max-w-2xl text-lg text-charcoal/70 sm:text-xl"
            animation="slideUp"
            delay={0.1}
            duration={0.6}
            distance={20}
          >
            A family-founded platform dedicated to helping families across the nation discover amazing classes, 
            resources, and community connections for their little ones.
          </MotionP>
        </div>
      </section>

      {/* Our Story Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-charcoal sm:text-4xl">
                Our Story
              </h2>
              <div className="space-y-4 text-charcoal/80">
                <p>
                  Parent Helper was born from a simple, heartfelt need: finding great classes for our own children 
                  shouldn't be so difficult. As parents ourselves, we experienced the frustration of searching 
                  through countless websites, social media groups, and word-of-mouth recommendations just to find 
                  the perfect activity for our little ones.
                </p>
                <p>
                  Founded in [FOUNDING_YEAR] by [FAMILY_MEMBER_NAMES], Parent Helper started as a personal project 
                  to help our own family navigate the world of baby and toddler classes. [SPECIFIC_STORY - e.g., 
                  "After spending countless weekends searching for the right music class for our daughter, we 
                  realized there had to be a better way to connect families with amazing local providers."]
                </p>
                <p>
                  What began as a solution for our family quickly grew into something bigger. We saw how many 
                  other parents were facing the same challenges, and we wanted to create a platform that would 
                  make it easier for families everywhere to discover, compare, and book classes that would bring 
                  joy and enrichment to their children's lives.
                </p>
                <p>
                  Today, Parent Helper is a trusted resource for thousands of families across the UK, helping them 
                  find everything from sensory play sessions to music classes, from outdoor adventures to creative 
                  workshops. But at our core, we're still that same family-founded business, committed to making 
                  parenting just a little bit easier, one class at a time.
                </p>
              </div>
            </div>
            <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-sage/10 md:h-80">
              <Image
                src={safeImage({ 
                  src: "/images/family-hero.png", 
                  alt: "Family enjoying time together" 
                }).src}
                alt={safeImage({ 
                  src: "/images/family-hero.png", 
                  alt: "Family enjoying time together" 
                }).alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Mission Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-sage/30 bg-muted/80 px-8 py-12 shadow-soft">
          <h2 className="mb-6 text-center text-3xl font-bold text-charcoal sm:text-4xl">
            Our Mission
          </h2>
          <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-charcoal/80 sm:text-xl">
            To support families across the nation by making it easier than ever to discover, compare, and book 
            amazing classes and resources for their children. We believe every family deserves access to quality 
            activities that help their little ones learn, grow, and thrive.
          </p>
        </div>
      </MotionSection>

      {/* What We Do Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-charcoal sm:text-4xl">
            What We Do
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal/70">
            We're here to make finding and booking classes simple, so you can focus on what matters most—spending 
            quality time with your little ones.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="ph-card rounded-2xl shadow-soft hover-glow"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-charcoal">
                  {feature.title}
                </h3>
                <p className="text-sm text-charcoal/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* Our Values Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-charcoal sm:text-4xl">
            Our Values
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal/70">
            These core principles guide everything we do at Parent Helper.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="ph-card rounded-2xl border-l-4 border-sage shadow-soft hover-glow"
              >
                <div className="mb-4 text-4xl">{value.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-charcoal">
                  {value.title}
                </h3>
                <p className="text-sm text-charcoal/70">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* Impact Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-sage/30 bg-sage/5 px-8 py-12 shadow-soft">
          <h2 className="mb-6 text-center text-3xl font-bold text-charcoal sm:text-4xl">
            Making a Difference
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-charcoal/80">
            We're proud to be part of a community that values quality time with children and supports local 
            businesses. Every booking, every search, and every connection made through Parent Helper helps 
            strengthen the fabric of our communities.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-sage">5,000+</div>
              <div className="text-sm text-charcoal/70">Classes Listed</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-sage">UK-Wide</div>
              <div className="text-sm text-charcoal/70">Coverage</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-sage">Growing</div>
              <div className="text-sm text-charcoal/70">Community</div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Call to Action Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-sage/30 bg-muted/80 px-6 py-10 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-wide text-sage">
                Get started
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-charcoal">
                Ready to discover amazing classes?
              </h3>
              <p className="mt-2 text-charcoal/70">
                Start exploring classes near you or get in touch if you have questions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkComponent
                href="/search"
                className="btn btn-primary hover:text-[#C97C5C]"
              >
                Explore Classes
              </LinkComponent>
              <LinkComponent
                href="/contact"
                className="btn btn-accent"
              >
                Get in Touch
              </LinkComponent>
              <NewsletterButton className="btn btn-secondary" />
            </div>
          </div>
        </div>
      </MotionSection>
      <NewsletterModal />
    </div>
  );
}

