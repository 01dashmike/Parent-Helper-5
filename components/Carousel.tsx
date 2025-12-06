"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { HOMEPAGE_CATEGORIES } from "@/components/home/categories";

type CarouselItem = {
  title: string;
  image: string;
  description: string;
  position?: string;
};

type CarouselProps = {
  items?: CarouselItem[];
};

const fallbackItems: CarouselItem[] = HOMEPAGE_CATEGORIES.map(({ title, description, image }) => {
  // Map category titles to their optimal object-position values
  const positionMap: Record<string, string> = {
    "Music & Movement": "center top",
    "Baby Yoga": "center top",
    "Drama & Play": "center center",
    "Outdoor Play": "center center",
    "Postnatal Wellness": "center top",
    "Storytime": "center center",
    "Kids Photography": "center center",
    "Mindfulness": "center center",
    "Arts & Crafts": "center center",
  };

  return {
    title,
    description,
    image,
    position: positionMap[title] || "center center",
  };
});

const AUTO_PLAY_INTERVAL = 4000; // 4 seconds feels more alive on desktop

export default function Carousel({ items = fallbackItems }: CarouselProps) {
  const slides = items?.length ? items : fallbackItems;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const slideWidth = container.scrollWidth / slides.length;
    container.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
    setCurrentIndex(index);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    scrollToIndex(nextIndex);
  }, [currentIndex, slides.length, scrollToIndex]);

  // Detect slides per view for responsive behavior
  const [slidesPerView, setSlidesPerView] = useState(1);

  useEffect(() => {
    const updateSlidesPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) setSlidesPerView(4);
      else if (width >= 768) setSlidesPerView(3);
      else if (width >= 640) setSlidesPerView(2);
      else setSlidesPerView(1);
    };

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  // Autoplay effect
  useEffect(() => {
    if (slides.length <= slidesPerView || isHovered) {
      return;
    }

    const id = window.setInterval(handleNext, AUTO_PLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [handleNext, isHovered, slides.length, slidesPerView]);

  return (
    <div
      className="relative mt-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={scrollContainerRef}
        className="flex gap-section overflow-x-auto scroll-smooth snap-x snap-mandatory snap-center pb-4 carousel-transition"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {slides.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="relative aspect-[4/3] w-[85%] shrink-0 overflow-hidden rounded-3xl bg-cream shadow-card transition-standard hover:shadow-md snap-center sm:w-[50%] lg:w-[25%]"
          >
            <div
              className="relative w-full aspect-[4/3] overflow-hidden"
              style={{ "--pos": item.position || "center center" } as React.CSSProperties}
            >
              <Image
                src={item.image}
                alt={item.title || "Carousel image"}
                fill
                className="w-full h-full object-cover rounded-xl"
                style={{ objectPosition: item.position || "center center" }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-4 text-white pointer-events-none">
              <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
              <p className="text-sm opacity-90">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}








