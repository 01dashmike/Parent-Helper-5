export const DEFAULT_FALLBACK = "/images/categories/arts.webp";

export type SafeImage = {
  src?: string | null;
  alt?: string | null;
};

export function safeImage({ src, alt }: SafeImage, fallbackAlt = "Parent Helper") {
  const cleanedSrc = typeof src === "string" ? src.trim() : "";
  const cleanedAlt = typeof alt === "string" ? alt.trim() : "";

  return {
    src: cleanedSrc ? cleanedSrc : DEFAULT_FALLBACK,
    alt: cleanedAlt ? cleanedAlt : fallbackAlt,
  };
}

