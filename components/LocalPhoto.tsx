"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { isWeatherWidgetEnabled } from "@/lib/env";
import { safeFetch } from "@/lib/client/safeFetch";

// Type extension for requestIdleCallback (not in all browsers)
interface WindowWithIdleCallback {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
}

type LocalPhotoProps = {
  city: string;
};

type PhotoData = {
  url: string;
  alt: string;
  blurDataURL?: string;
  attribution: {
    name: string;
    username: string;
    url: string;
  };
};

export default function LocalPhoto({ city }: LocalPhotoProps) {
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isWeatherWidgetEnabled() || !city) {
      return;
    }

    // Load photo after LCP using requestIdleCallback (non-blocking)
    const loadPhoto = async () => {
      setLoading(true);
      
      // Check Supabase cache first
      const cacheResult = await safeFetch<{ cached_url?: string; attribution?: PhotoData["attribution"] }>(
        `/api/photos/cache?city=${encodeURIComponent(city)}`
      );
      
      if (cacheResult.ok && cacheResult.data?.cached_url) {
        setPhoto({
          url: cacheResult.data.cached_url,
          alt: `Photo of ${city}`,
          attribution: cacheResult.data.attribution || {
            name: "Unsplash",
            username: "",
            url: "https://unsplash.com",
          },
        });
        setLoading(false);
        return;
      }

      // Fetch from Unsplash if not cached
      const photoData = await fetchLocalPhoto(city);
      if (photoData) {
        setPhoto(photoData);
        // Cache via API (fire and forget - don't wait for response)
        safeFetch("/api/photos/cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: photoData.url,
            city,
            attribution: photoData.attribution,
          }),
        }).catch(() => {
          // Silently handle cache save error
        });
      }
      
      setLoading(false);
    };

    if (typeof window !== "undefined") {
      // Wait for LCP, then use requestIdleCallback
      const windowWithIdle = window as WindowWithIdleCallback;
      if (windowWithIdle.requestIdleCallback) {
        const timeout = setTimeout(() => {
          const idleCallback = windowWithIdle.requestIdleCallback!(loadPhoto, { timeout: 3000 });
          // Store cleanup function for later cancellation
          return () => {
            if (windowWithIdle.cancelIdleCallback) {
              windowWithIdle.cancelIdleCallback(idleCallback);
            }
          };
        }, 2000);

        return () => {
          clearTimeout(timeout);
        };
      } else {
        // Fallback: delay by 2 seconds (after LCP)
        const timeout = setTimeout(loadPhoto, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [city]);

  if (!isWeatherWidgetEnabled() || (!photo && !loading)) {
    return null;
  }

  return (
    <div className="relative inline-block h-24 w-32 overflow-hidden rounded-lg border border-sage/20 bg-white/80 backdrop-blur-sm aspect-[4/3]">
      {loading ? (
        <div className="h-24 w-32 skeleton aspect-[4/3]" aria-hidden="true" />
      ) : photo ? (
        <>
          <Image
            src={photo.url}
            alt={photo.alt}
            width={128}
            height={96}
            className="h-24 w-32 object-cover"
            loading="lazy"
            placeholder={photo.blurDataURL ? "blur" : "empty"}
            blurDataURL={photo.blurDataURL}
            unoptimized
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-small text-white">
            <a
              href={photo.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              aria-label={`View ${photo.attribution.name}'s Unsplash profile (opens in new tab)`}
            >
              Photo by {photo.attribution.name}
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}

async function fetchLocalPhoto(city: string): Promise<PhotoData | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(city)}&orientation=landscape&w=400&h=300&client_id=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      url: data.urls?.small || data.urls?.regular || "",
      alt: data.alt_description || `Photo of ${city}`,
      blurDataURL: data.blur_hash
        ? `data:image/svg+xml;base64,${data.blur_hash}`
        : undefined,
      attribution: {
        name: data.user?.name || "Unknown",
        username: data.user?.username || "",
        url: data.user?.links?.html || `https://unsplash.com/@${data.user?.username}`,
      },
    };
  } catch (error) {
    console.error("[LocalPhoto] Photo fetch error:", error);
    return null;
  }
}

