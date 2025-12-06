import PostMeta from "@/components/blog/PostMeta";
import Prose from "@/components/blog/Prose";
import { replaceInternalLinks } from "@/lib/links";
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
  const content = replaceInternalLinks(post.body_markdown ?? "");
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
      <div className="relative h-64 w-full md:h-80">
        <Image
          src={post.hero_image || "/images/categories/arts.webp"}
          alt={post.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </Prose>

        {post.sources?.length ? (
          <section className="rounded-2xl bg-white/80 p-4">
            <h2 className="text-lg font-semibold">Sources</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slateSoft">
              {post.sources.map((source: any, index: number) => (
                <li key={index}>
                  <a href={source.url ?? source} className="text-sage hover:text-[#C97C5C]" target="_blank" rel="noopener noreferrer">
                    {source.title ?? source.url ?? source}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-sage/20 bg-white/80 p-6 text-center">
          <h3 className="text-lg font-semibold">Enjoying the Journal?</h3>
          <p className="mt-2 text-sm text-slateSoft">
            Subscribe for gentle prompts and new guides straight to your inbox.
          </p>
          <button
            type="button"
            className="mt-4 rounded-full bg-sage px-6 py-2 text-sm font-medium text-white transition hover:bg-sage/90 hover:text-[#C97C5C]"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("newsletter:open", { detail: { source: "blog" } }));
              }
            }}
          >
            Open newsletter sign-up
          </button>
        </section>

        {related.length ? (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Related posts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {related.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="rounded-2xl border border-sage/20 bg-white p-4 transition hover:border-sage hover:shadow-sm"
                >
                  <h3 className="font-semibold text-charcoal">{item.title}</h3>
                  {item.excerpt && <p className="mt-2 text-sm text-slateSoft line-clamp-2">{item.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
