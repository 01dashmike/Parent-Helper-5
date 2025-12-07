"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { CLASS_CATEGORIES } from "@/lib/constants/categories";

type FiltersBarProps = {
  onFilterChange: () => void;
};

export default function FiltersBar({ onFilterChange }: FiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();
  
  const [age, setAge] = useState<string>(safeSearchParams.get("age") ?? "");
  const [category, setCategory] = useState<string>(safeSearchParams.get("category") ?? "");
  const [day, setDay] = useState<string>(safeSearchParams.get("day") ?? "");
  const [timeOfDay, setTimeOfDay] = useState<string>(safeSearchParams.get("timeOfDay") ?? "");
  const [radiusKm, setRadiusKm] = useState<number>(parseInt(safeSearchParams.get("radiusKm") ?? "5", 10));

  const updateURL = useCallback(() => {
    const params = new URLSearchParams(safeSearchParams.toString());
    
    if (age) params.set("age", age);
    else params.delete("age");
    
    if (category) params.set("category", category);
    else params.delete("category");
    
    if (day) params.set("day", day);
    else params.delete("day");
    
    if (timeOfDay) params.set("timeOfDay", timeOfDay);
    else params.delete("timeOfDay");
    
    params.set("radiusKm", radiusKm.toString());
    
    router.push(`/search?${params.toString()}`, { scroll: false });
    onFilterChange();
  }, [age, category, day, timeOfDay, radiusKm, router, safeSearchParams, onFilterChange]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL();
    }, 300);

    return () => clearTimeout(timer);
  }, [age, category, day, timeOfDay, radiusKm, updateURL]);

  return (
    <div className="space-y-4 rounded-lg border border-sage/20 bg-white p-4">
      {/* Age Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-charcoal">Age</label>
        <div className="flex flex-wrap gap-2">
          {["baby", "toddler", "preschool"].map((ageOption) => (
            <button
              key={ageOption}
              type="button"
              onClick={() => setAge(age === ageOption ? "" : ageOption)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                age === ageOption
                  ? "bg-sage text-white"
                  : "bg-cream text-charcoal hover:bg-cream/80"
              }`}
            >
              {ageOption.charAt(0).toUpperCase() + ageOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-charcoal">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {CLASS_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Day Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-charcoal">Day</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "monday", label: "Mon" },
            { value: "tuesday", label: "Tue" },
            { value: "wednesday", label: "Wed" },
            { value: "thursday", label: "Thu" },
            { value: "friday", label: "Fri" },
            { value: "saturday", label: "Sat" },
            { value: "sunday", label: "Sun" },
          ].map((dayOption) => (
            <button
              key={dayOption.value}
              type="button"
              onClick={() => setDay(day === dayOption.value ? "" : dayOption.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                day === dayOption.value
                  ? "bg-sage text-white"
                  : "bg-cream text-charcoal hover:bg-cream/80"
              }`}
            >
              {dayOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time of Day Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-charcoal">Time of Day</label>
        <div className="flex flex-wrap gap-2">
          {["morning", "afternoon", "evening"].map((timeOption) => (
            <button
              key={timeOption}
              type="button"
              onClick={() => setTimeOfDay(timeOfDay === timeOption ? "" : timeOption)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                timeOfDay === timeOption
                  ? "bg-sage text-white"
                  : "bg-cream text-charcoal hover:bg-cream/80"
              }`}
            >
              {timeOption.charAt(0).toUpperCase() + timeOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Radius Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-charcoal">
          Distance: {radiusKm} km
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>
    </div>
  );
}

