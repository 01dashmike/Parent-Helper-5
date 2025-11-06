"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function QuickFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const paramsKey = useMemo(() => params?.toString() ?? "", [params]);

  const [day, setDay] = useState(() => params?.get("day") ?? "");
  const [fromTime, setFromTime] = useState(() => params?.get("fromTime") ?? "");
  const [toTime, setToTime] = useState(() => params?.get("toTime") ?? "");
  const [radiusKm, setRadiusKm] = useState(() => Number(params?.get("radiusKm") ?? "20"));

  useEffect(() => {
    const next = new URLSearchParams(paramsKey);
    const id = setTimeout(() => {
      if (day) next.set("day", day);
      else next.delete("day");
      if (fromTime) next.set("fromTime", fromTime);
      else next.delete("fromTime");
      if (toTime) next.set("toTime", toTime);
      else next.delete("toTime");
      next.set("radiusKm", String(radiusKm));
      router.replace(`/search?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [day, fromTime, toTime, radiusKm, paramsKey, router]);

  return (
    <fieldset 
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
      aria-label="Quick filters for class search"
    >
      <legend className="sr-only">Refine your class search</legend>
      
      <div className="flex items-center gap-2">
        <label htmlFor="day-filter" className="text-sm text-slateSoft">Day</label>
        <select 
          id="day-filter"
          value={day} 
          onChange={(e) => setDay(e.target.value)} 
          className="ph-input"
          aria-label="Filter by day of the week"
        >
          <option value="">Any</option>
          {DAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="from-time-filter" className="text-sm text-slateSoft">From</label>
        <input 
          id="from-time-filter"
          type="time" 
          value={fromTime} 
          onChange={(e) => setFromTime(e.target.value)} 
          className="ph-input"
          aria-label="Filter by start time"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="to-time-filter" className="text-sm text-slateSoft">To</label>
        <input 
          id="to-time-filter"
          type="time" 
          value={toTime} 
          onChange={(e) => setToTime(e.target.value)} 
          className="ph-input"
          aria-label="Filter by end time"
        />
      </div>
      
      <div className="flex items-center gap-3">
        <label htmlFor="radius-filter" className="text-sm text-slateSoft">Distance</label>
        <input
          id="radius-filter"
          type="range"
          min={1}
          max={40}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          aria-label={`Search radius: ${radiusKm} kilometres`}
          aria-valuemin={1}
          aria-valuemax={40}
          aria-valuenow={radiusKm}
          aria-valuetext={`${radiusKm} kilometres`}
        />
        <span className="w-12 text-sm" aria-live="polite">{radiusKm}km</span>
      </div>
    </fieldset>
  );
}
