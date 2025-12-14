import PostCard from "@/components/blog/PostCard";
import { hasSupabaseServerEnv } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase.server";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 3600;

interface SearchParams {
  category?: string;
  locality?: string;
  q?: string;
  page?: string;
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const category = params.category ?? "";
  const search = params.q ?? "";
  const locality = params.locality ?? "";
  const page = Math.max(1, Number(params.page ?? "1"));
  const supabase = hasSupabaseServerEnv() ? getSupabaseServer() : null;

  const limit = 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let data: any[] = [];
  let totalPages = 1;

  if (supabase) {
    let query = supabase
      .from("blog_posts_ai")
      .select(
        "id,title,slug,excerpt,category,hero_image,reading_time_minutes,locality,created_at",
        { count: "exact" },
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (category) query = query.eq("category", category);
    if (locality) query = query.eq("locality", locality);
    if (search) query = query.ilike("title", `%${search}%`);

    const response = await query;
    data = response.data ?? [];
    totalPages = Math.max(1, Math.ceil((response.count ?? 0) / limit));
  }

  return (
    <div className="bg-cream text-charcoal">
      {/* Branded Hero Header */}
      <div className="bg-gradient-to-r from-[#9CAF88] via-[#9CAF88]/90 to-[#C97C5C]/40 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/90 shadow-lg">
              <Image
                src="/images/logo.png"
                alt="Parent Helper"
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Parent Helper Blog</h1>
          <p className="mt-2 text-white/90 max-w-xl mx-auto">
            Stories, guides, and gentle advice for families exploring the UK together.
          </p>
          {/* Color palette display */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#9CAF88] shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#C97C5C] shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#F5F3F0] border border-white/30 shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#3A3A3A] shadow-sm"></span>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {!supabase && (
          <div className="mb-8 text-center">
            <p className="text-sm text-[#C97C5C]">
              Supabase environment variables are not configured, so articles will appear once the connection is set up.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <form className="flex flex-wrap gap-3">
            <input
              defaultValue={search}
              name="q"
              placeholder="Search posts"
              className="ph-input"
              type="search"
            />
            <select name="category" defaultValue={category} className="ph-input">
              <option value="">All categories</option>
              <option value="Parenting Advice">Parenting Advice</option>
              <option value="Local Guide">Local Guide</option>
              <option value="Activities">Activities</option>
            </select>
            <input
              defaultValue={locality}
              name="locality"
              placeholder="Locality"
              className="ph-input"
            />
            <button className="ph-btn" type="submit">
              Filter
            </button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-4 text-sm">
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const queryParams = new URLSearchParams(params as Record<string, string>);
              queryParams.set("page", String(pageNumber));
              return (
                <Link
                  key={pageNumber}
                  href={`/blog?${queryParams.toString()}`}
                  className={`rounded-full px-3 py-1 transition ${
                    pageNumber === page ? "bg-sage text-white" : "bg-white/70 text-charcoal hover:bg-cream"
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
