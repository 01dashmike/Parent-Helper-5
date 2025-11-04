import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Carousel from "@/components/Carousel";
import NewsletterModal from "@/components/NewsletterModal";
import HeroSection from "@/components/HeroSection";

export const metadata: Metadata = {
  title: "Parent Helper — Discover magical days",
  description:
    "Search inspiring parent-and-child classes, compare warm community spaces, and save the experiences that light up your little one's world.",
};

const CATEGORIES = [
  {
    title: "Sensory & Messy Play",
    description:
      "Textured explorations, gentle lights, and music for curious little hands.",
    tags: ["Multi-sensory", "0–18 months"],
    image: "/images/categories/messy-play.png",
  },
  {
    title: "Music & Rhythm",
    description:
      "Sing-alongs, percussion circles, and rhythm adventures to spark confidence.",
    tags: ["Baby choirs", "Toddler bands"],
    image: "/images/categories/music.jpg",
  },
  {
    title: "Movement & Yoga",
    description:
      "Stretch, balance, and giggle through family yoga and mini dance classes.",
    tags: ["Mindful movement", "Parent-child"],
    image: "/images/categories/yoga.jpg",
  },
  {
    title: "Outdoor Explorers",
    description:
      "Forest school sessions and buggy meetups to celebrate the changing seasons.",
    tags: ["Nature trails", "Fresh air"],
    image: "/images/categories/explorer.jpg",
  },
  {
    title: "Creative Studios",
    description:
      "Art, drama, and storytelling guided by inspiring local facilitators.",
    tags: ["Confidence building", "Small groups"],
    image: "/images/categories/arts.jpg",
  },
  {
    title: "Community Support",
    description:
      "Warm hubs with peer conversations, feeding support, and expert advice.",
    tags: ["Drop-in", "Supportive"],
    image: "/images/categories/outdoor.jpg",
  },
  {
    title: "Family Photography",
    description:
      "Capture timeless moments with your loved ones through warm, family-focused photography sessions.",
    tags: ["Photo shoots", "Milestones"],
    image: "/images/categories/photographer.jpg",
  },
  {
    title: "Postnatal Fitness",
    description:
      "Join gentle fitness sessions to regain strength, balance, and confidence after birth.",
    tags: ["Rebuild core", "Mother & baby"],
    image: "/images/categories/postnatal.jpg",
  },
  {
    title: "Storytime",
    description:
      "Engaging story sessions that spark imagination and early literacy skills.",
    tags: ["Reading fun", "Language growth"],
    image: "/images/categories/storytime.jpg",
  },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <HeroSection />

      {/* CAROUSEL */}
      <div className="relative z-20 mt-4 sm:mt-6 lg:mt-4">
        <Carousel />
      </div>

      {/* CATEGORIES GRID (simple version) */}
      <section className="section my-14">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
          Explore categories that families love
        </h2>
        <p className="mb-6 max-w-2xl text-charcoal/70">
          Every Parent Helper collection arrives with curated notes, age guides, and accessibility insights to help you
          choose the perfect session.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <article
              key={category.title}
              className="ph-card rounded-2xl shadow-soft hover-glow"
            >
              <div className="-mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl">
                <Image
                  src={category.image}
                  alt={category.title}
                  width={400}
                  height={260}
                  className={`h-48 w-full transition duration-300 ease-out ${
                    category.title === "Family Photography"
                      ? "bg-cream object-contain"
                      : "object-cover"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold text-charcoal">{category.title}</h3>
              <p className="mt-2 text-sm text-charcoal/70">
                {category.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <span
                    key={`${category.title}-${tag}`}
                    className="rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* RESOURCE LINKS */}
      <section className="section my-16 rounded-2xl border border-sage/30 bg-muted/80 px-6 py-10 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-wide text-sage">
              Stay connected
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-charcoal">
              Join the Parent Helper community for weekly inspiration
            </h3>
            <p className="mt-2 text-charcoal/70">
              Helpful resources and gentle reminders straight to your inbox.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-secondary hover:text-[#C97C5C]">
              About Parent Helper
            </Link>
            <Link href="/contact" className="btn btn-accent">
              Get in touch
            </Link>
            <Link href="/privacy" className="btn btn-primary">
              Privacy Promise
            </Link>
          </div>
        </div>
      </section>
      <NewsletterModal />
    </>
  );
}
