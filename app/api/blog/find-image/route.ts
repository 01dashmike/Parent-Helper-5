export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { searchUnsplashImage, generateImageQuery } from "@/lib/blog-images";

/**
 * API endpoint to search for images from Unsplash
 * Allows client-side image search without exposing API key
 */
export async function POST(req: Request) {
  const { title, topic } = await req.json().catch(() => ({}));

  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  try {
    const imageQuery = generateImageQuery(title, topic);
    const imageUrl = await searchUnsplashImage(imageQuery, "landscape");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No suitable image found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, imageUrl });
  } catch (error: any) {
    console.error("Error finding image:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to find image" },
      { status: 500 }
    );
  }
}



