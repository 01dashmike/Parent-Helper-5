"use client";

import { MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, type FocusEvent } from "react";

export default function SearchFields() {
  const [isFocused, setIsFocused] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("Geolocation is not available in this environment.");
      return;
    }

    setDetecting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      console.log("User location:", position.coords);
    } catch (err) {
      console.error("Location detection failed:", err);
    } finally {
      setTimeout(() => setDetecting(false), 1500);
    }
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  return (
    <motion.div
      className={`mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between space-y-2 rounded-full border border-cream bg-white/95 px-4 py-2 text-sm shadow-lg transition-all duration-300 backdrop-blur-md hover:shadow-xl hover:ring-sage/20 md:flex-nowrap md:space-y-0 md:space-x-2 ${
        isFocused ? "shadow-xl ring-1 ring-sage/30" : ""
      }`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative flex flex-1 items-center">
        <button
          type="button"
          className="absolute left-3 flex items-center gap-1 text-sage text-sm md:hidden"
          onClick={handleDetectLocation}
        >
          {detecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>Use my location</span>
            </>
          )}
        </button>

        <MapPin className="absolute left-3 hidden h-5 w-5 text-sage md:block" />

        <input
          id="location"
          name="location"
          type="text"
          placeholder="Enter town or postcode"
          aria-label="Enter town or postcode"
          className="w-full rounded-full pl-10 pr-4 py-2 text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-0"
        />

        <button
          type="button"
          onClick={handleDetectLocation}
          className="hidden items-center gap-1 text-sage text-sm hover:underline px-2 whitespace-nowrap md:inline-flex"
        >
          {detecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>Use my location</span>
            </>
          )}
        </button>
      </div>

      <input
        id="keyword"
        name="keyword"
        type="text"
        placeholder="Search activity (e.g. 'music', 'yoga')"
        className="flex-1 rounded-full px-4 py-2 text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-0"
      />

      <select
        id="age"
        name="age"
        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-charcoal focus:outline-none focus:ring-0"
      >
        <option>All Ages</option>
        <option>0–6 Months</option>
        <option>6–12 Months</option>
        <option>1–2 Years</option>
        <option>2–3 Years</option>
        <option>3–4 Years</option>
        <option>4–5 Years</option>
        <option>Antenatal/Parent Only</option>
      </select>

      <button
        type="submit"
        className="bg-sage px-6 py-2 font-medium text-white whitespace-nowrap rounded-full shadow-sm transition-all duration-200 hover:bg-sage/90 hover:text-[#C97C5C]"
      >
        Explore classes
      </button>
    </motion.div>
  );
}

function NavigatorGeolocationAvailable() {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}
