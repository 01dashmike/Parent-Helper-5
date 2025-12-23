'use client';

import { MotionArticle } from '@/components/motion/MotionArticle';

const CATEGORIES = [
  {
    title: "Sensory & Messy Play",
    description:
      "Textured explorations, gentle lights, and music for curious little hands.",
    icon: "",
    tags: ["Multi-sensory", "0-18 months"],
  },
  {
    title: "Music & Rhythm",
    description:
      "Sing-alongs, percussion circles, and rhythm adventures to spark confidence.",
    icon: "",
    tags: ["Baby choirs", "Toddler bands"],
  },
  {
    title: "Movement & Yoga",
    description:
      "Stretch, balance, and giggle through family yoga and mini dance classes.",
    icon: "",
    tags: ["Mindful movement", "Parent-child"],
  },
  {
    title: "Outdoor Explorers",
    description:
      "Forest school sessions and buggy meetups to celebrate the changing seasons.",
    icon: "",
    tags: ["Nature trails", "Fresh air"],
  },
  {
    title: "Creative Studios",
    description:
      "Art, drama, and storytelling guided by inspiring local facilitators.",
    icon: "",
    tags: ["Confidence building", "Small groups"],
  },
  {
    title: "Community Support",
    description:
      "Warm hubs with peer conversations, feeding support, and expert advice.",
    icon: "",
    tags: ["Drop-in", "Supportive"],
  },
];

export default function AnimatedCategoryGrid() {
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-display-2 text-slateSoft">
          Explore categories that families love
        </h2>
        <p className="mt-3 text-body text-slateSoft/70">
          Every Parent Helper collection arrives with curated notes, age guides,
          and accessibility insights to help you choose the perfect session.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category, index) => (
          <MotionArticle
            key={category.title}
            className="group rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60 transition-shadow duration-200 hover:shadow-soft-lg"
            animation="fadeInSlideUp"
            delay={index * 0.05}
            duration={0.5}
            distance={20}
            viewportAnimation={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-title text-slateSoft">
                {category.title}
              </h3>
            </div>
            <p className="mt-3 text-small text-slateSoft/75">
              {category.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-3 py-1 text-small font-semibold text-primary/80 shadow-inner"
                >
                  {tag}
                </span>
              ))}
            </div>
          </MotionArticle>
        ))}
      </div>
    </div>
  );
}
