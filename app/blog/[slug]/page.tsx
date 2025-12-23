import PostMeta from "@/components/blog/PostMeta";
import Prose from "@/components/blog/Prose";
import MarkdownImage from "@/components/blog/MarkdownImage";
import CustomBlockquote from "@/components/blog/CustomBlockquote";
import { replaceInternalLinks } from "@/lib/links.server";
import { hasSupabaseServerEnv } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase.server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const revalidate = 3600;

async function getPost(slug: string) {
  if (!hasSupabaseServerEnv()) return null;
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("blog_posts_ai")
    .select("*, sources")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ?? null;
}

async function getRelated(category: string, id: string, locality?: string | null) {
  if (!hasSupabaseServerEnv()) return [];
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  let query = supabase
    .from("blog_posts_ai")
    .select("id,title,slug,excerpt,hero_image,reading_time_minutes,locality,category,created_at")
    .eq("status", "published")
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (locality) query = query.eq("locality", locality);
  else query = query.eq("category", category);

  const { data } = await query;
  return data ?? [];
}

async function getAllOtherBlogs(id: string) {
  if (!hasSupabaseServerEnv()) return [];
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  
  const { data } = await supabase
    .from("blog_posts_ai")
    .select("id,title,slug,excerpt,hero_image,reading_time_minutes,locality,category,created_at")
    .eq("status", "published")
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(30); // Reasonable limit to avoid overwhelming the page

  return data ?? [];
}

/**
 * Detects if blog content contains developmental advice or milestones.
 * Looks for patterns like age ranges, milestone mentions, developmental stages, etc.
 */
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

export async function generateStaticParams() {
  if (!hasSupabaseServerEnv()) return [];
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blog_posts_ai")
    .select("slug")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((row: any) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return {};
  const schemaJson = post.schema_json
    ? typeof post.schema_json === "string"
      ? post.schema_json
      : JSON.stringify(post.schema_json)
    : null;
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt,
      images: post.og_image ? [post.og_image] : post.hero_image ? [post.hero_image] : undefined,
    },
    other: schemaJson
      ? {
          "script:ld+json": schemaJson,
        }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const related = await getRelated(post.category, post.id, post.locality);
  const allOtherBlogs = await getAllOtherBlogs(post.id);
  const content = await replaceInternalLinks(post.body_markdown ?? "");
  const schemaJson = post.schema_json
    ? typeof post.schema_json === "string"
      ? post.schema_json
      : JSON.stringify(post.schema_json)
    : null;

  return (
    <article className="bg-cream pb-16 text-charcoal">
      {schemaJson ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      ) : null}
      
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
          alt={post.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3A3A3A]/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 py-6 text-white">
          <h1 className="text-3xl font-semibold md:text-4xl">{post.title}</h1>
          <div className="mt-4">
            <PostMeta
              category={post.category}
              readingTimeMinutes={post.reading_time_minutes}
              createdAt={post.created_at}
              locality={post.locality}
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
          const content = post.body_markdown ?? "";
          const hasDevelopmentalAdvice = containsDevelopmentalAdvice(content);
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
                {post.sources.map((source: any, index: number) => {
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

        {related.length ? (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-[#3A3A3A]">More from the Blog</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {related.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group rounded-2xl border border-[#9CAF88]/20 bg-white p-4 transition hover:border-[#9CAF88] hover:shadow-md"
                >
                  <h3 className="font-semibold text-[#3A3A3A] group-hover:text-[#9CAF88] transition">{item.title}</h3>
                  {item.excerpt && <p className="mt-2 text-sm text-slateSoft line-clamp-2">{item.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* All Other Blog Posts */}
        {allOtherBlogs.length > 0 && (
          <section className="space-y-4 mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#3A3A3A]">All Blog Posts</h2>
              <Link 
                href="/blog" 
                className="text-sm text-[#9CAF88] hover:text-[#C97C5C] transition"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {allOtherBlogs.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group rounded-xl border border-[#9CAF88]/20 bg-white p-3 transition hover:border-[#9CAF88] hover:shadow-sm"
                >
                  <h3 className="font-medium text-sm text-[#3A3A3A] group-hover:text-[#9CAF88] transition line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="mt-1.5 text-xs text-slateSoft line-clamp-2">{item.excerpt}</p>
                  )}
                  {item.category && (
                    <span className="mt-2 inline-block text-xs text-[#9CAF88]">{item.category}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Branded Footer */}
        <footer className="mt-8 pt-6 border-t border-[#9CAF88]/20">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#9CAF88]/10">
                <Image
                  src="/images/logo.png"
                  alt="Parent Helper"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="text-sm text-[#3A3A3A]/70 group-hover:text-[#9CAF88] transition">
                Back to Blog
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
