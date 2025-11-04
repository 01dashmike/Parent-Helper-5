"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";

function deriveAgeValue(params: ReadonlyURLSearchParams | null) {
  const min = params?.get("minAge");
  const max = params?.get("maxAge");
  if (!min || !max) return "";
  return `${min}-${max}`;
}

export default function SearchBarSticky() {
  const router = useRouter();
  const params = useSearchParams();
  const paramsKey = useMemo(() => params?.toString() ?? "", [params]);

  const [loc, setLoc] = useState(() => params?.get("loc") ?? "");
  const [q, setQ] = useState(() => params?.get("q") ?? "");
  const [age, setAge] = useState(() => deriveAgeValue(params));

  useEffect(() => {
    setLoc(params?.get("loc") ?? "");
    setQ(params?.get("q") ?? "");
    setAge(deriveAgeValue(params));
  }, [params]);

  useEffect(() => {
    const next = new URLSearchParams(paramsKey);
    const id = setTimeout(() => {
      if (loc) next.set("loc", loc);
      else next.delete("loc");
      if (q) next.set("q", q);
      else next.delete("q");
      if (age) {
        const [min, max] = age.split("-").map((n) => Number(n.trim()));
        if (!Number.isNaN(min)) next.set("minAge", String(min));
        else next.delete("minAge");
        if (!Number.isNaN(max)) next.set("maxAge", String(max));
        else next.delete("maxAge");
      } else {
        next.delete("minAge");
        next.delete("maxAge");
      }
      router.replace(`/search?${next.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(id);
  }, [loc, q, age, paramsKey, router]);

  return (
    <div className="sticky top-16 z-30 border-b border-sage/20 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-2">
        <input
          className="ph-input flex-1"
          placeholder="Enter town or postcode"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
        />
        <input
          className="ph-input flex-1"
          placeholder="Search activity (e.g. 'music', 'yoga')"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="ph-input md:w-48" value={age} onChange={(e) => setAge(e.target.value)}>
          <option value="">All Ages</option>
          <option value="0-12">0–12 months</option>
          <option value="12-24">1–2 years</option>
          <option value="24-36">2–3 years</option>
          <option value="36-60">3–5 years</option>
        </select>
        <button className="ph-btn" onClick={() => router.refresh()}>
          Explore
        </button>
      </div>
    </div>
  );
}
