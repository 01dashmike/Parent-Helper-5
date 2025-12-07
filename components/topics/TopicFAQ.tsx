"use client";

import { useState } from "react";

interface Props {
  topicSlug: string;
  topicTitle: string;
}

// Default FAQ questions - can be customized per topic or fetched from DB
const DEFAULT_FAQS = [
  {
    question: "What is this topic about?",
    answer: "This topic hub brings together expert articles and local classes to help you find everything you need in one place.",
  },
  {
    question: "How do I find classes near me?",
    answer: "Use the search function or browse the classes listed above. You can filter by location, age group, and other preferences.",
  },
  {
    question: "Are the articles written by experts?",
    answer: "Yes, all articles are written by our team of parent experts and reviewed for accuracy and helpfulness.",
  },
];

export default function TopicFAQ({ topicSlug: _topicSlug, topicTitle: _topicTitle }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // In the future, this could fetch FAQs from the database based on topicSlug
  const faqs = DEFAULT_FAQS;

  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question} className="rounded-xl border border-sage/20 bg-white">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition hover:bg-cream/50"
            >
              <span className="font-semibold text-charcoal">{faq.question}</span>
              <span className="ml-4 text-sage">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-sage/10 p-4 text-small text-slateSoft">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

