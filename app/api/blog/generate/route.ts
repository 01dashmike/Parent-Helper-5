export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase.server";
import { slugify } from "@/lib/slug";
import { NextResponse } from "next/server";

type Topic = {
  id: number;
  topic: string;
  intent?: string | null;
  category?: string | null;
  target_locality?: string | null;
  target_postcode_prefix?: string | null;
};

type GeneratedPayload = {
  meta?: {
    title?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    hero_image?: string | null;
    heroImageHint?: string | null;
    readingTime?: number | null;
    wordCount?: number | null;
    sources?: any;
    seoTitle?: string | null;
    seoDescription?: string | null;
    locality?: string | null;
    postcodePrefix?: string | null;
    lat?: number | null;
    lon?: number | null;
    ogImage?: string | null;
  };
  content?: string;
  markdown?: string;
};

const MIN_WORDS = 900;

function buildUserPrompt(topic: Topic) {
  return `Write a long-form UK parenting article for the Parent Helper Journal.\nAudience: UK parents and carers. Voice: warm, well-educated British parent; supportive, practical, never condescending.\nLength: 1,200-1,700 words (minimum ${MIN_WORDS} words).\nStructure: punchy hook intro; H2/H3 subheads; short paragraphs; bullet lists; one pull quote; finish with an actionable checklist.\nInclude 2-4 internal link placeholders like [link:classes/sensory] or [link:blog/sleep].\nInclude 4-7 reputable UK sources (NHS, BBC, GOV.UK, universities) and return them as an array of objects in the JSON payload.\nIf locality is provided (${topic.target_locality ?? "none"}), include a short "Getting started in ${topic.target_locality}" box with universally helpful tips (no invented venues).\nReturn strictly valid JSON matching:\n{\n  "meta": {"title": string, "excerpt": string, "category": string, "tags": string[], "hero_image": string | null, "seoTitle": string, "seoDescription": string, "locality": string | null, "postcodePrefix": string | null, "sources": [{"title": string, "url": string}] },\n  "content": "Markdown here"\n}.\nDo not include backticks or extra text.`;
}

async function callOpenAI(topic: Topic, attempt = 1): Promise<GeneratedPayload> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

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
          content:
            "You are a British parent writing for Parent Helper. Never mention AI, cite NHS/BBC/GOV.UK sources, keep tone supportive and practical.",
        },
        {
          role: "user",
          content: buildUserPrompt(topic),
        },
      ],
      temperature: 0.7,
      max_tokens: 3200,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned");
  let parsed: GeneratedPayload;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    if (attempt === 1) {
      return callOpenAI(topic, attempt + 1);
    }
    throw new Error("Failed to parse model response as JSON");
  }
  return parsed;
}

async function pickTopic(sb: SupabaseClient<any>, topicId?: number) {
  if (topicId) {
    const { data } = await sb
      .from("blog_topics_queue")
      .select("*")
      .eq("id", topicId)
      .maybeSingle();
    return data as Topic | null;
  }
  const { data } = await sb
    .from("blog_topics_queue")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("scheduled_for", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Topic | null) ?? null;
}

function countWords(markdown: string) {
  return markdown
    .replace(/[#*_`>\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

async function ensureUniqueSlug(
  sb: SupabaseClient<any>,
  desired: string,
  excludeId?: string,
) {
  let candidate = desired;
  let suffix = 1;
  while (true) {
    const { data } = await sb
      .from("blog_posts_ai")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) {
      return candidate;
    }
    suffix += 1;
    candidate = `${desired}-${suffix}`;
  }
}

function normaliseSources(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return { title: entry, url: entry };
      }
      if (entry && typeof entry === "object") {
        const { title, url } = entry as Record<string, string>;
        if (!url) return null;
        return {
          title: title ?? url,
          url,
        };
      }
      return null;
    })
    .filter(Boolean);
}

export async function POST(req: Request) {
  const { topicId } = await req.json().catch(() => ({}));
  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const topic = await pickTopic(sb, topicId);

  if (!topic) {
    return NextResponse.json({ error: "No topics pending" }, { status: 404 });
  }

  await sb.from("blog_topics_queue").update({ status: "in_progress" }).eq("id", topic.id);

  try {
    const result = await callOpenAI(topic);
    const markdown = (result.content ?? result.markdown ?? "").trim();
    if (!markdown) {
      throw new Error("Model returned empty content");
    }

    const wordCount = result.meta?.wordCount ?? countWords(markdown);
    if (wordCount < MIN_WORDS) {
      // attempt one retry
      const retry = await callOpenAI(topic, 2);
      const retryContent = (retry.content ?? retry.markdown ?? "").trim();
      if (!retryContent) {
        throw new Error("Model returned empty content on retry");
      }
      const retryWords = retry.meta?.wordCount ?? countWords(retryContent);
      if (retryWords > wordCount) {
        result.meta = retry.meta;
        result.content = retryContent;
        result.markdown = retryContent;
      }
    }

    const meta = result.meta ?? {};
    const title = meta.title?.trim() || topic.topic;
    const excerpt = (meta.excerpt || result.content?.slice(0, 240) || "")
      .replace(/\s+/g, " ")
      .trim();
    const category = meta.category || topic.category || "Parenting Advice";
    const baseSlug = slugify(title) || `post-${topic.id}-${Date.now()}`;
    const slug = await ensureUniqueSlug(sb, baseSlug);
    const resolvedMarkdown = result.content ?? result.markdown ?? "";
    const finalWordCount = countWords(resolvedMarkdown);
    const readingTime = meta.readingTime ?? Math.max(1, Math.round(finalWordCount / 225));

    const { data, error } = await sb
      .from("blog_posts_ai")
      .insert({
        status: "draft",
        title,
        slug,
        excerpt,
        category,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        hero_image: meta.hero_image ?? meta.heroImageHint ?? null,
        body_markdown: resolvedMarkdown,
        reading_time_minutes: readingTime,
        word_count: finalWordCount,
        sources: normaliseSources(meta.sources),
        locality: meta.locality ?? topic.target_locality ?? null,
        postcode_prefix: meta.postcodePrefix ?? topic.target_postcode_prefix ?? null,
        lat: meta.lat ?? null,
        lon: meta.lon ?? null,
        seo_title: meta.seoTitle ?? title,
        seo_description: meta.seoDescription ?? excerpt,
        og_image: meta.ogImage ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    await sb
      .from("blog_topics_queue")
      .update({ status: "done", scheduled_for: null })
      .eq("id", topic.id);

    return NextResponse.json({ ok: true, post: data });
  } catch (error: any) {
    await sb
      .from("blog_topics_queue")
      .update({ status: "error" })
      .eq("id", topic.id);
    return NextResponse.json({ error: error?.message ?? "Generation failed" }, { status: 500 });
  }
}
