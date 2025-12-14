"use client";

import Image from "next/image";
import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";

interface MarkdownImageProps extends ComponentPropsWithoutRef<"img"> {
  src?: string;
  alt?: string;
  title?: string;
}

// List of whitelisted domains that are configured in next.config.mjs
const WHITELISTED_DOMAINS = ["images.unsplash.com"];

/**
 * Custom image component for ReactMarkdown
 * Handles both Next.js Image (for whitelisted external URLs) and regular img tags (for others)
 */
export default function MarkdownImage({ src, alt, title, ...props }: MarkdownImageProps) {
  const [error, setError] = useState(false);

  if (!src) {
    return null;
  }

  // Check if it's an external URL (http/https)
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  // Check if the domain is whitelisted for Next.js Image
  let isWhitelisted = false;
  if (isExternal) {
    try {
      const url = new URL(src);
      isWhitelisted = WHITELISTED_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
    } catch {
      // Invalid URL, treat as not whitelisted
      isWhitelisted = false;
    }
  }

  // For whitelisted external images (like Unsplash), use Next.js Image component
  if (isWhitelisted && !error) {
    return (
      <span className="block my-4">
        <Image
          src={src}
          alt={alt || title || ""}
          width={800}
          height={600}
          className="rounded-lg w-full h-auto"
          style={{ objectFit: "contain" }}
          onError={() => setError(true)}
          unoptimized={false}
        />
      </span>
    );
  }

  // For local/relative images or non-whitelisted external images, use regular img tag
  return (
    <span className="block my-4">
      <img
        src={src}
        alt={alt || title || ""}
        className="rounded-lg w-full h-auto"
        onError={() => setError(true)}
        {...props}
      />
    </span>
  );
}



