"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

const SCREENSHOTS = [
  {
    id: 1,
    title: "Provider Dashboard",
    description: "Manage your classes, bookings, and analytics all in one place",
    placeholder: "Dashboard showing class listings, booking stats, and growth metrics",
  },
  {
    id: 2,
    title: "Class Management",
    description: "Update schedules, prices, and descriptions with ease",
    placeholder: "Interface for editing class details and availability",
  },
  {
    id: 3,
    title: "Analytics & Insights",
    description: "Track views, enquiries, and bookings to optimize your offerings",
    placeholder: "Charts and graphs showing performance metrics",
  },
  {
    id: 4,
    title: "Enquiry Management",
    description: "Respond to parents quickly and efficiently",
    placeholder: "Inbox view with enquiry messages and response tools",
  },
];

export function ScreenshotGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  };

  const currentScreenshot = SCREENSHOTS[currentIndex];

  return (
    <div className="relative">
      {/* Screenshot Display */}
      <div className="mb-6 overflow-hidden rounded-2xl border-2 border-sage/20 bg-white shadow-elevated">
        <div className="aspect-video bg-gradient-to-br from-sage/10 to-cream flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 text-display-2">📊</div>
            <p className="text-small font-medium text-charcoal/60">
              {currentScreenshot.placeholder}
            </p>
          </div>
        </div>
      </div>

      {/* Screenshot Info */}
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-title font-semibold text-charcoal">{currentScreenshot.title}</h3>
        <p className="text-small text-text-tertiary">{currentScreenshot.description}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-sage/20 bg-white text-sage transition hover:bg-sage/10 md:min-h-0 md:min-w-0 md:h-10 md:w-10"
          aria-label="Previous screenshot"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Dots indicator */}
        <div className="flex gap-2">
          {SCREENSHOTS.map((screenshot, index) => (
            <button
              key={screenshot.id}
              onClick={() => setCurrentIndex(index)}
              className={`min-h-11 min-w-11 rounded-full transition-all flex items-center justify-center md:min-h-0 md:min-w-0 ${
                index === currentIndex ? "w-8 bg-sage" : "w-2 bg-sage/30"
              }`}
              aria-label={`Go to screenshot ${index + 1}`}
              aria-describedby={`screenshot-dot-desc-${index}`}
            >
              <VisuallyHidden id={`screenshot-dot-desc-${index}`}>
                {SCREENSHOTS[index].title}: {SCREENSHOTS[index].description}
              </VisuallyHidden>
            </button>
          ))}
        </div>

        <button
          onClick={next}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-sage/20 bg-white text-sage transition hover:bg-sage/10 md:min-h-0 md:min-w-0 md:h-10 md:w-10"
          aria-label="Next screenshot"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

