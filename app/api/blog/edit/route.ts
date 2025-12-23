export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getSupabaseServer } from "@/lib/supabase.server";
import { NextResponse } from "next/server";
import { processMarkdownImages, addImagesToHeadings } from "@/lib/blog-images";

/**
 * Detects if user instructions mention images
 * Used to conditionally process images only when requested
 */
function instructionsMentionImages(instructions: string): boolean {
  const imageKeywords = [
    'image', 'photo', 'picture', 'img', 'visual', 'illustration',
    'add image', 'change image', 'replace image', 'remove image',
    'new image', 'update image', 'fix image', 'broken image'
  ];
  const lower = instructions.toLowerCase();
  return imageKeywords.some(keyword => lower.includes(keyword));
}

/**
 * AI-powered blog editing endpoint
 * Accepts free-text instructions to modify blog content, formatting, etc.
 */
export async function POST(req: Request) {
  const { postId, instructions } = await req.json().catch(() => ({}));

  if (!postId || !instructions) {
    return NextResponse.json(
      { error: "postId and instructions are required" },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch current post
    const { data: post, error: fetchError } = await sb
      .from("blog_posts_ai")
      .select("title, body_markdown, excerpt, category, tags")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Call OpenAI to apply edits
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a CONSERVATIVE blog editor for Parent Helper, a UK parenting platform. Your PRIMARY goal is to make ONLY the specific changes requested - nothing more.

CRITICAL EDITING RULES:
1. MINIMAL CHANGES ONLY: Make ONLY the changes explicitly requested in the instructions. Do not rewrite, restructure, or "improve" anything else.
2. PRESERVE EVERYTHING ELSE: Keep all existing content, structure, formatting, and images exactly as they are unless specifically asked to change them.
3. PRESERVE IMAGES: Do NOT modify, add, or remove any image markdown tags (![alt](url)) unless the instructions explicitly request image changes.
4. SMALL EDITS = SMALL CHANGES: If asked to "fix a typo" or "change one word", change ONLY that and return everything else unchanged.
5. DO NOT ADD CONTENT: Unless explicitly asked to add something, do not add new sections, paragraphs, callouts, or images.

BRAND VOICE (apply only to new/changed content):
- Warm, supportive tone of a well-educated British parent
- Practical, never condescending
- UK parenting context

FORMATTING (apply only when creating NEW content or when explicitly asked to reformat):
- H2 headings should be conversational questions/statements
- Short paragraphs (2-3 sentences)
- Blockquotes for tips: > **Tip:** [advice]
- Source attribution for medical/developmental advice`,
          },
          {
            role: "user",
            content: `INSTRUCTIONS: "${instructions}"

CURRENT BLOG POST:
Title: ${post.title || "Untitled"}
Category: ${post.category || "Parenting Advice"}
Tags: ${Array.isArray(post.tags) ? post.tags.join(", ") : ""}

Content (Markdown):
${post.body_markdown || ""}

---

CRITICAL: Make ONLY the changes described in the instructions above. Do NOT:
- Rewrite or restructure content that wasn't mentioned
- Add new sections, images, or callouts unless explicitly asked
- Change images or image URLs unless explicitly asked
- "Improve" or "enhance" anything beyond what was requested

Return strictly valid JSON:
{
  "body_markdown": "the content with ONLY the requested changes applied",
  "title": "${post.title || "Untitled"}",
  "excerpt": "${post.excerpt || ""}"
}

IMPORTANT: For title and excerpt, return the ORIGINAL values shown above unless the instructions specifically ask to change them.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${error}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from AI");
    }

    const edited = JSON.parse(content);

    // Only process images if the user explicitly requested image changes
    // This prevents unwanted image additions/changes during text-only edits
    if (edited.body_markdown && instructionsMentionImages(instructions)) {
      edited.body_markdown = await processMarkdownImages(edited.body_markdown);
      // Automatically add images for headings that don't have them
      edited.body_markdown = await addImagesToHeadings(edited.body_markdown);
    }

    // Update the post
    const updates: Record<string, any> = {};
    if (edited.body_markdown) updates.body_markdown = edited.body_markdown;
    if (edited.title && edited.title !== post.title) updates.title = edited.title;
    if (edited.excerpt && edited.excerpt !== post.excerpt) updates.excerpt = edited.excerpt;

    const { data: updatedPost, error: updateError } = await sb
      .from("blog_posts_ai")
      .update(updates)
      .eq("id", postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true, post: updatedPost });
  } catch (error: any) {
    console.error("Error editing blog post:", error);
    return NextResponse.json(
      { error: error?.message ?? "Editing failed" },
      { status: 500 }
    );
  }
}



