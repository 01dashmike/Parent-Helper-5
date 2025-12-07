"use client";

import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon?: string;
}

interface DocsNavigationProps {
  sections: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function DocsNavigation({
  sections,
  activeSection,
  onSectionChange,
}: DocsNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-4 rounded border border-gray-300 bg-white px-4 py-2 text-small font-medium text-charcoal lg:hidden"
      >
        {isOpen ? "Close Menu" : "Menu"}
      </button>

      {/* Sidebar */}
      <nav
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block lg:sticky lg:top-4 h-fit rounded-lg border border-gray-200 bg-white p-4`}
      >
        <h2 className="mb-4 text-small font-semibold text-charcoal">Sections</h2>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => {
                  onSectionChange(section.id);
                  setIsOpen(false);
                  document.getElementById(section.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`w-full rounded px-3 py-2 text-left text-small transition ${
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-charcoal hover:bg-gray-50"
                }`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

