"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import Image from "next/image";

type Story = {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  image?: string;
};

const placeholderStories: Story[] = [
  {
    id: "1",
    name: "Sarah M.",
    role: "Parent",
    location: "Manchester",
    quote:
      "Finding a sensory-friendly music class through Parent Helper changed everything for us. My son finally feels comfortable and included.",
  },
  {
    id: "2",
    name: "Little Stars Music",
    role: "Provider",
    location: "Birmingham",
    quote:
      "Getting the SEND-friendly badge helped us reach families who really need our support. Our classes are now more inclusive and welcoming.",
  },
  {
    id: "3",
    name: "Emma T.",
    role: "Parent",
    location: "London",
    quote:
      "The detailed accessibility information helped us find the perfect class for our daughter. We felt confident before even visiting.",
  },
  {
    id: "4",
    name: "Rainbow Play",
    role: "Provider",
    location: "Leeds",
    quote:
      "The checklist helped us identify areas we could improve. Now we're proud to be SEND-friendly and support more families.",
  },
];

export default function SuccessStoriesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % placeholderStories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + placeholderStories.length) % placeholderStories.length);
  };

  const currentStory = placeholderStories[currentIndex];

  return (
    <div className="relative rounded-xl border border-sage/20 bg-surface-alt p-8 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-title font-semibold text-text-primary">Success Stories</h3>
        <div className="flex gap-2">
          <button
            onClick={prevStory}
            aria-label="Previous story"
            className="rounded-full p-2 text-text-tertiary transition hover:bg-brand/10 hover:text-brand"
          >
            <ChevronLeft size={iconSize.md} aria-hidden="true" />
          </button>
          <button
            onClick={nextStory}
            aria-label="Next story"
            className="rounded-full p-2 text-text-tertiary transition hover:bg-brand/10 hover:text-brand"
          >
            <ChevronRight size={iconSize.md} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[200px]">
        <div
          key={currentStory.id}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-4 flex items-center gap-2 text-brand">
            <Quote size={iconSize.lg} aria-hidden="true" />
          </div>
          <blockquote className="mb-6 text-body text-text-primary">
            &quot;{currentStory.quote}&quot;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              {currentStory.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{currentStory.name}</p>
              <p className="text-small text-text-tertiary">
                {currentStory.role} • {currentStory.location}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {/* No stable ID available; index key acceptable here - placeholder carousel indicators */}
        {placeholderStories.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to story ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-brand" : "w-2 bg-text-primary/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

