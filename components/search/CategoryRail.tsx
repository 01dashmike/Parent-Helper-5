"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATS = [
  { key: "Sensory", label: "Sensory", icon: "🧸" },
  { key: "Music", label: "Music", icon: "🎵" },
  { key: "Dance", label: "Dance", icon: "💃" },
  { key: "Yoga", label: "Yoga", icon: "🧘" },
  { key: "STEM", label: "STEM", icon: "🔬" },
  { key: "Outdoors", label: "Outdoors", icon: "🌲" },
  { key: "Arts", label: "Arts", icon: "🎨" },
  { key: "Storytime", label: "Story", icon: "📚" },
  { key: "Sports", label: "Sports", icon: "⚽" },
];

export default function CategoryRail() {
  const params = useSearchParams();
  const router = useRouter();
  const active = params?.get("category") ?? "";

  const setCategory = (key: string) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (active === key) next.delete("category");
    else next.set("category", key);
    router.push(`/search?${next.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {CATS.map((cat) => {
        const isActive = cat.key === active;
        return (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            aria-pressed={isActive}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors ${
              isActive
                ? "bg-sage text-white border-sage"
                : "border-sage/30 bg-white/70 text-charcoal hover:bg-cream"
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
