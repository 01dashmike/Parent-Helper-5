export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getSupabaseServer } from "@/lib/supabase.server";
import { NextResponse } from "next/server";
import { processMarkdownImages, addImagesToHeadings } from "@/lib/blog-images";

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
            content: `You are an expert blog editor for Parent Helper, a UK parenting platform. Your brand uses warm, supportive tones with sage green (#9CAF88), terracotta (#C97C5C), and cream (#F5F3F0) colors. The voice is that of a well-educated British parent - supportive, practical, never condescending. Always maintain the brand's warm, encouraging tone.

STYLE REFERENCES TO EMULATE:
- Greatist: Modern, conversational, scannable formatting with catchy subheadings
- Wellness Mama: Practical DIY tips with personal, authentic voice
- Fatherly: Magazine-quality, smart, balances practical advice with storytelling

CRITICAL FORMATTING REQUIREMENTS:
1. HEADINGS: H2 headings MUST be conversational questions or statements, NOT generic labels.
   - GOOD: "What to Expect in the First Week", "How to Create a Sleep-Friendly Environment"
   - BAD: "Introduction", "Overview", "Conclusion"
2. PARAGRAPHS: Keep to 2-3 sentences maximum. Break up long blocks.
3. CALLOUT BOXES: Use blockquotes (>) for key tips: > **Tip:** [advice]
4. PULL QUOTES: Use blockquotes: > "[quote]" - [source]. IMPORTANT: Always include source attribution for quotes, especially for developmental milestones or medical advice.
5. LISTS: Use numbered lists for steps, bullets for tips/checklists
6. STRUCTURE: Hook intro → 4-6 H2 sections → Actionable closing checklist

Apply these principles: hook readers immediately, use conversational subheadings, break up text with lists and callouts, include practical takeaways, cite experts accessibly, end with actionable next steps.`,
          },
          {
            role: "user",
            content: `Edit the following blog post according to these instructions: "${instructions}"

Current blog post:
Title: ${post.title || "Untitled"}
Category: ${post.category || "Parenting Advice"}
Tags: ${Array.isArray(post.tags) ? post.tags.join(", ") : ""}

Content (Markdown):
${post.body_markdown || ""}

Return strictly valid JSON matching:
{
  "body_markdown": "edited markdown content",
  "title": "edited title if changed, otherwise original",
  "excerpt": "edited excerpt if changed, otherwise original"
}

Apply the instructions while maintaining:
- The warm, supportive Parent Helper brand voice
- UK parenting context and references
- Proper markdown formatting with conversational H2 headings
- Short paragraphs (2-3 sentences max)
- Use of callout boxes (blockquotes) for key tips
- Lists (numbered for steps, bullets for tips)
- Source attribution for developmental milestones and age-related guidance (e.g., "According to the NHS..." or "NHS recommends...")
- All existing structure unless specifically asked to change it

When editing, ensure the content follows the formatting requirements: conversational headings, short paragraphs, callout boxes, and lists. When discussing developmental milestones or medical advice, always cite authoritative sources.`,
          },
        ],
        temperature: 0.7,
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

    // Process images in edited markdown to replace placeholders with real Unsplash images
    if (edited.body_markdown) {
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



