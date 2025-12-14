"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Audience } from "@/lib/wellness/types";

const audiences: { value: Audience; label: string; emoji: string }[] = [
  { value: "mum", label: "Mum", emoji: "👩" },
  { value: "dad", label: "Dad", emoji: "👨" },
  { value: "couples", label: "Couples", emoji: "💑" },
  { value: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { value: "grandparents", label: "Grandparents", emoji: "👴👵" },
];

interface AudienceSelectorProps {
  currentAudience: Audience;
  basePath?: string; // e.g., "/wellness" or "/wellness/[audience]/diet"
}

export default function AudienceSelector({
  currentAudience,
  basePath = "/wellness",
}: AudienceSelectorProps) {
  const pathname = usePathname();
  
  // Extract the sub-path after the audience (e.g., "/diet" from "/wellness/mum/diet")
  const subPath = pathname.split("/").slice(3).join("/");
  const fullSubPath = subPath ? `/${subPath}` : "";

  return (
    <div className="mb-8 flex flex-wrap justify-center gap-2">
      {audiences.map((audience) => {
        const isActive = currentAudience === audience.value;
        const href = `${basePath}/${audience.value}${fullSubPath}`;

        return (
          <Link
            key={audience.value}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-sage text-white shadow-md"
                : "bg-white text-charcoal hover:bg-sage/10 hover:text-sage"
            )}
          >
            <span>{audience.emoji}</span>
            <span>{audience.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
