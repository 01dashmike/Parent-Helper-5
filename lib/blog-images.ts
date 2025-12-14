/**
 * Unsplash image search utility for blog posts
 * Automatically finds free-to-use images matching blog content
 */

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description?: string;
  description?: string;
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
    links: string;
  };
}

/**
 * Search Unsplash for free-to-use images
 * @param query - Search query (e.g., "baby sleep", "parenting")
 * @param orientation - Image orientation: "landscape" | "portrait" | "squarish"
 * @returns Promise with image URL or null if not found
 */
export async function searchUnsplashImage(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY not configured, skipping image search");
    return null;
  }

  try {
    const searchUrl = new URL("https://api.unsplash.com/search/photos");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("orientation", orientation);
    searchUrl.searchParams.set("per_page", "1");
    searchUrl.searchParams.set("content_filter", "high");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.results as UnsplashImage[];

    if (results && results.length > 0) {
      // Return the regular size URL (good quality, reasonable size)
      return results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error("Error searching Unsplash:", error);
    return null;
  }
}

/**
 * Generate a search query from blog title and topic
 */
export function generateImageQuery(title: string, topic?: string): string {
  // Extract key terms from title
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !["the", "and", "for", "with", "your"].includes(word))
    .slice(0, 3)
    .join(" ");

  // Combine with topic if provided
  if (topic) {
    const topicWords = topic.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
    return `${titleWords} ${topicWords}`.trim();
  }

  return titleWords || "parenting family";
}

/**
 * Scans markdown content for images and replaces placeholders with real Unsplash images
 * @param markdown - The markdown content to process
 * @returns Promise with the processed markdown
 */
export async function processMarkdownImages(markdown: string): Promise<string> {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];

  if (matches.length === 0) {
    return markdown;
  }

  let processedMarkdown = markdown;

  // Process matches sequentially to avoid race conditions or rate limits
  for (const match of matches) {
    const [fullMatch, altText, url] = match;
    
    // Skip if it's already an Unsplash image
    if (url.includes("images.unsplash.com")) {
      continue;
    }

    // Determine orientation based on context if possible, otherwise default to landscape
    // (could be enhanced later to parse width/height hints if we add them to prompt)
    const orientation = "landscape";
    
    // Use alt text as search query, fallback to generic term if empty
    const searchQuery = altText || "parenting";
    
    // Find a real image
    const realImageUrl = await searchUnsplashImage(searchQuery, orientation);
    
    if (realImageUrl) {
      // Replace the placeholder with the real URL
      processedMarkdown = processedMarkdown.replace(url, realImageUrl);
    } else {
      // If we can't find an image, remove the image tag to avoid broken images
      // Or we could leave it, but broken images are bad UX. 
      // Let's remove the tag but keep the alt text as a description/caption if suitable, 
      // but simpler to just remove the tag for now or leave it as is if it might be a valid external URL we just didn't recognize.
      // Actually, if it's not unsplash and not a valid URL (e.g. "image_placeholder"), we should probably remove it.
      // But if it's a valid URL from elsewhere, we should keep it.
      
      try {
        new URL(url);
        // It's a valid URL, keep it
      } catch {
        // Invalid URL (likely a placeholder), remove the image tag
        processedMarkdown = processedMarkdown.replace(fullMatch, "");
      }
    }
  }

  return processedMarkdown;
}

/**
 * Automatically adds images after H2 and H3 headings that don't already have images
 * @param markdown - The markdown content to process
 * @returns Promise with the processed markdown
 */
export async function addImagesToHeadings(markdown: string): Promise<string> {
  const lines = markdown.split('\n');
  const processed: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    processed.push(line);
    
    // Check if this is an H2 or H3 heading (## or ###)
    const headingMatch = line.match(/^(##{1,2})\s+(.+)$/);
    if (headingMatch) {
      const headingText = headingMatch[2].trim();
      
      // Check if there's already an image in the next 2 lines
      let hasImage = false;
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j].match(/^!\[.*\]\(.+\)$/)) {
          hasImage = true;
          break;
        }
      }
      
      // If no image exists, find and add one
      if (!hasImage && headingText) {
        // Generate search query from heading text
        const searchQuery = headingText
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((word) => word.length > 2 && !["the", "and", "for", "with", "your", "what", "how", "why", "when"].includes(word))
          .slice(0, 4)
          .join(" ") || headingText.toLowerCase().slice(0, 30);
        
        // Find an image
        const imageUrl = await searchUnsplashImage(searchQuery, "landscape");
        
        if (imageUrl) {
          // Add image after heading with a blank line before and after
          processed.push("");
          processed.push(`![${headingText}](${imageUrl})`);
          processed.push("");
        }
      }
    }
  }
  
  return processed.join('\n');
}



