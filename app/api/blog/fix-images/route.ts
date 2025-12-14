export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { processMarkdownImages } from "@/lib/blog-images";

/**
 * API endpoint to fix placeholder images in markdown content
 * Replaces placeholder URLs with real Unsplash images based on alt text
 */
export async function POST(req: Request) {
  const { markdown } = await req.json().catch(() => ({}));

  if (!markdown) {
    return NextResponse.json(
      { error: "markdown is required" },
      { status: 400 }
    );
  }

  try {
    const processedMarkdown = await processMarkdownImages(markdown);
    return NextResponse.json({ ok: true, markdown: processedMarkdown });
  } catch (error: any) {
    console.error("Error fixing images:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fix images" },
      { status: 500 }
    );
  }
}



