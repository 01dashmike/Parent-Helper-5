"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PostMeta from "@/components/blog/PostMeta";
import Prose from "@/components/blog/Prose";
import MarkdownImage from "@/components/blog/MarkdownImage";
import CustomBlockquote from "@/components/blog/CustomBlockquote";
import { replaceInternalLinksSync } from "@/lib/links";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PreviewPost {
  title?: string;
  excerpt?: string;
  category?: string;
  hero_image?: string;
  body_markdown?: string;
  sources?: any[];
  reading_time_minutes?: number;
  created_at?: string;
  locality?: string;
}

export default function BlogPreviewPage() {
  const searchParams = useSearchParams();
  const [post, setPost] = useState<PreviewPost | null>(null);

  useEffect(() => {
    // Helper to safely get URL param without double-decoding
    // useSearchParams().get() already returns decoded values, so we never call decodeURIComponent()
    // IMPORTANT: Never call decodeURIComponent() on the result as it would cause:
    // - Double-decoding (useSearchParams already decodes once)
    // - URIError when content contains % sequences that aren't valid URL encoding
    // - Corrupted content when the query string is already decoded
    const getParam = (key: string): string | null => {
      return searchParams?.get(key) ?? null;
    };

    // Try to get post data from URL params
    const title = getParam("title");
    const excerpt = getParam("excerpt");
    const category = getParam("category");
    const hero_image = getParam("hero_image");
    const body_markdown = getParam("body_markdown");
    const reading_time_minutes = getParam("reading_time_minutes");
    const locality = getParam("locality");

    // Try to get from sessionStorage (for complex data)
    const storedPost = sessionStorage.getItem("blog_preview_data");
    
    if (storedPost) {
      try {
        setPost(JSON.parse(storedPost));
        return;
      } catch (e) {
        console.error("Failed to parse stored post data", e);
      }
    }

    // Fallback to URL params
    // Note: useSearchParams().get() already returns decoded values, so no need to decode again
    // DO NOT call decodeURIComponent() on these values as it would cause double-decoding
    if (title || body_markdown) {
      setPost({
        title: title || "Preview",
        excerpt: excerpt || undefined,
        category: category || "Parenting Advice",
        hero_image: hero_image || undefined,
        body_markdown: body_markdown || undefined,
        reading_time_minutes: reading_time_minutes ? parseInt(reading_time_minutes) : undefined,
        locality: locality || undefined,
        sources: [],
        created_at: new Date().toISOString(),
      });
    }
  }, [searchParams]);

  if (!post || !post.body_markdown) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal">No preview data available.</p>
          <Link href="/admin/blogs" className="text-[#9CAF88] hover:text-[#C97C5C] mt-4 inline-block">
            Back to Editor
          </Link>
        </div>
      </div>
    );
  }

  const content = replaceInternalLinksSync(post.body_markdown || "");

  function containsDevelopmentalAdvice(content: string): boolean {
    if (!content) return false;

    const lowerContent = content.toLowerCase();

    // Patterns that indicate developmental advice
    const agePatterns = [
      /\d+\s*(?:to|-|–|—)\s*\d+\s*(?:months?|weeks?|years?)/i,
      /(?:between|around|at|by)\s+\d+\s*(?:months?|weeks?|years?)/i,
      /\d+\s*(?:months?|weeks?|years?)\s+old/i,
    ];

    const milestonePatterns = [
      /milestone/i,
      /developmental stage/i,
      /baby.*sit.*up/i,
      /baby.*crawl/i,
      /baby.*walk/i,
      /baby.*talk/i,
      /first steps/i,
      /first words/i,
      /weaning/i,
      /solid foods/i,
      /sleep.*schedule/i,
      /sleep.*pattern/i,
      /feeding.*schedule/i,
    ];

    // Check for age-related patterns
    const hasAgePattern = agePatterns.some(pattern => pattern.test(content));

    // Check for milestone mentions
    const hasMilestonePattern = milestonePatterns.some(pattern => pattern.test(lowerContent));

    // Check for medical/developmental keywords in context
    const medicalKeywords = [
      /nhs/i,
      /who\s+\(world health organization\)/i,
      /american academy of pediatrics/i,
      /royal college/i,
      /developmental/i,
      /pediatric/i,
    ];

    const hasMedicalKeywords = medicalKeywords.some(pattern => pattern.test(lowerContent));

    return hasAgePattern || hasMilestonePattern || hasMedicalKeywords;
  }

  return (
    <article className="bg-cream pb-16 text-charcoal">
      {/* Preview Banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 py-2 px-4 text-center text-sm text-yellow-800">
        <strong>Preview Mode</strong> - This is how your blog post will appear when published
      </div>

      {/* Branded Header Bar */}
      <div className="bg-gradient-to-r from-[#9CAF88] via-[#9CAF88]/90 to-[#C97C5C]/30 py-3">
        <div className="mx-auto max-w-4xl px-4 flex items-center gap-3">
          <Link href="/blog" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/90 shadow-sm">
              <Image
                src="/images/logo.png"
                alt="Parent Helper"
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="text-white font-medium text-sm group-hover:text-cream transition">
              Parent Helper Blog
            </span>
          </Link>
        </div>
      </div>
      
      <div className="relative h-64 w-full md:h-80">
        <Image
          src={post.hero_image || "/images/categories/arts.webp"}
          alt={post.title || "Blog post"}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3A3A3A]/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 py-6 text-white">
          <h1 className="text-3xl font-semibold md:text-4xl">{post.title || "Untitled Post"}</h1>
          <div className="mt-4">
            <PostMeta
              category={post.category || "Parenting Advice"}
              readingTimeMinutes={post.reading_time_minutes || 5}
              createdAt={post.created_at || new Date().toISOString()}
              locality={post.locality || undefined}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <Prose>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              img: MarkdownImage,
              blockquote: CustomBlockquote,
            }}
          >
            {content}
          </ReactMarkdown>
        </Prose>

        {(() => {
          const contentText = post.body_markdown || "";
          const hasDevelopmentalAdvice = containsDevelopmentalAdvice(contentText);
          const hasSources = post.sources && post.sources.length > 0;

          if (!hasSources) return null;

          return (
            <section className={`rounded-2xl p-6 border-l-4 ${
              hasDevelopmentalAdvice 
                ? "bg-white shadow-md border-[#C97C5C]" 
                : "bg-white/80 border-[#9CAF88]"
            }`}>
              <h2 className={`text-xl font-semibold text-[#3A3A3A] mb-1 ${
                hasDevelopmentalAdvice ? "text-[#3A3A3A]" : ""
              }`}>
                {hasDevelopmentalAdvice ? "Information Sources" : "Sources & References"}
              </h2>
              {hasDevelopmentalAdvice && (
                <p className="text-sm text-[#3A3A3A]/70 mb-4">
                  The developmental milestones and age-related guidance referenced in this article are sourced from the following authoritative sources:
                </p>
              )}
              <ul className="space-y-3">
                {(post.sources ?? []).map((source: any, index: number) => {
                  const sourceUrl = typeof source === "string" ? source : source.url;
                  const sourceTitle = typeof source === "string" ? source : (source.title ?? source.url ?? "Source");
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#9CAF88] mt-1">•</span>
                      {sourceUrl ? (
                        <a 
                          href={sourceUrl} 
                          className="text-[#9CAF88] hover:text-[#C97C5C] transition underline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {sourceTitle}
                        </a>
                      ) : (
                        <span className="text-[#3A3A3A]/90">{sourceTitle}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })()}

        {/* Newsletter CTA with branded design */}
        <section className="rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#9CAF88] to-[#9CAF88]/80 p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/90 shadow-md">
                <Image
                  src="/images/logo.png"
                  alt="Parent Helper"
                  fill
                  className="object-contain p-1"
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white">Enjoying the Blog?</h3>
            <p className="mt-2 text-sm text-white/90">
              Subscribe for gentle prompts and new guides straight to your inbox.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#9CAF88] transition hover:bg-[#F5F3F0] hover:text-[#C97C5C] shadow-sm"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("newsletter:open", { detail: { source: "blog" } }));
                }
              }}
            >
              Join the Family
            </button>
          </div>
        </section>

        {/* Branded Footer */}
        <footer className="mt-8 pt-6 border-t border-[#9CAF88]/20">
          <div className="flex items-center justify-between">
            <Link href="/admin/blogs" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#9CAF88]/10">
                <Image
                  src="/images/logo.png"
                  alt="Parent Helper"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="text-sm text-[#3A3A3A]/70 group-hover:text-[#9CAF88] transition">
                Back to Editor
              </span>
            </Link>
            <div className="flex items-center gap-1 text-xs text-[#3A3A3A]/50">
              <span className="inline-block w-2 h-2 rounded-full bg-[#9CAF88]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#C97C5C]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#F5F3F0] border border-[#3A3A3A]/20"></span>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}



