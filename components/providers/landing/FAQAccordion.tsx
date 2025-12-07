"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  // Generate stable IDs based on item index to avoid calling hooks conditionally
  // Using index-based IDs since we can't call useId in a loop
  const getItemId = (index: number, type: "content" | "button") => {
    return `faq-${index}-${type}`;
  };

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(index);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const contentId = getItemId(index, "content");
        const buttonId = getItemId(index, "button");
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-xl border border-sage/20 bg-white transition-all"
          >
            <button
              id={buttonId}
              onClick={() => toggle(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="flex w-full items-center justify-between p-6 text-left transition hover:bg-cream/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              aria-expanded={isOpen}
              aria-controls={contentId}
              aria-haspopup="false"
            >
              <span className="pr-8 font-semibold text-charcoal">{item.question}</span>
              <ChevronDown
                size={iconSize.md}
                className={`h-5 w-5 flex-shrink-0 text-sage transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div id={contentId} role="region" aria-labelledby={buttonId} className="px-6 pb-6">
                <p className="text-small leading-relaxed text-text-tertiary">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

