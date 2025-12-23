import type { Metadata } from "next";
import Image from "next/image";
import { MotionH1 } from "@/components/motion/MotionH1";
import { MotionP } from "@/components/motion/MotionP";
import MotionSection from "@/components/motion/MotionSection";
import LinkComponent from "@/components/ui/link";
import { NewsletterButton } from "@/components/about/NewsletterButton";
import NewsletterModal from "@/components/NewsletterModal";
import { safeImage } from "@/lib/images";
import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "About Us — Parent Helper",
  description:
    "Learn about Parent Helper, a family-founded platform dedicated to helping families across the nation discover amazing classes and resources for their little ones.",
};

const DEFAULT_IMPACT_STATS = [
  { value: "5,000+", label: "Classes Listed" },
  { value: "UK-Wide", label: "Coverage" },
  { value: "Growing", label: "Community" },
];

async function getAboutPageContent() {
  if (!hasSupabaseServerEnv()) {
    return null;
  }
  
  const supabase = getSupabaseServer();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("about_page_content")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching about page content:", error);
    return null;
  }

  return data;
}

export default async function AboutPage() {
  const content = await getAboutPageContent();
  
  // Use content from database or fallback to defaults
  const heroTitle = content?.hero_title || "About Parent Helper";
  const heroDescription = content?.hero_description || "A family-founded platform dedicated to helping families across the nation discover amazing classes, resources, and community connections for their little ones.";
  const storyTitle = content?.story_title || "Our Story";
  const storyContent = content?.story_content || "Parent Helper was born from a simple, heartfelt need: finding great classes for our own children shouldn't be so difficult...";
  const storyImageUrl = content?.story_image_url || "/images/categories/family-hero.png";
  const storyImageUrl2 = content?.story_image_url_2 || null;
  const impactTitle = content?.impact_title || "Making a Difference";
  const impactContent = content?.impact_content || "We're proud to be part of a community that values quality time with children and supports local businesses...";
  const impactStats = content?.impact_stats || DEFAULT_IMPACT_STATS;
  const ctaLabel = content?.cta_label || "Get started";
  const ctaTitle = content?.cta_title || "Ready to discover amazing classes?";
  const ctaContent = content?.cta_content || "Start exploring classes near you or get in touch if you have questions.";

  // Split story content into paragraphs
  const storyParagraphs = storyContent.split('\n\n').filter(p => p.trim());
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
            {heroTitle}
          </MotionH1>
          <MotionP
            className="mx-auto mb-8 max-w-2xl text-lg text-charcoal/70 sm:text-xl"
            animation="slideUp"
            delay={0.1}
            duration={0.6}
            distance={20}
          >
            {heroDescription}
          </MotionP>
        </div>
      </section>

      {/* Our Story Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-charcoal sm:text-4xl">
                {storyTitle}
              </h2>
              <div className="space-y-4 text-charcoal/80">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-sage/10">
                <Image
                  src={safeImage({ 
                    src: storyImageUrl, 
                    alt: "Family enjoying time together" 
                  }).src}
                  alt={safeImage({ 
                    src: storyImageUrl, 
                    alt: "Family enjoying time together" 
                  }).alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {storyImageUrl2 && (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-sage/10">
                  <Image
                    src={safeImage({ 
                      src: storyImageUrl2, 
                      alt: "Our story continues" 
                    }).src}
                    alt={safeImage({ 
                      src: storyImageUrl2, 
                      alt: "Our story continues" 
                    }).alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Impact Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-sage/30 bg-sage/5 px-8 py-12 shadow-soft">
          <h2 className="mb-6 text-center text-3xl font-bold text-charcoal sm:text-4xl">
            {impactTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-charcoal/80">
            {impactContent}
          </p>
          <div className={`grid gap-6 ${impactStats.length === 3 ? 'sm:grid-cols-3' : impactStats.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-4'}`}>
            {impactStats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="text-center">
                <div className="mb-2 text-4xl font-bold text-sage">{stat.value}</div>
                <div className="text-sm text-charcoal/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* Call to Action Section */}
      <MotionSection className="section my-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-sage/30 bg-muted/80 px-6 py-10 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-wide text-sage">
                {ctaLabel}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-charcoal">
                {ctaTitle}
              </h3>
              <p className="mt-2 text-charcoal/70">
                {ctaContent}
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

