import AdminBlogsClient from "@/components/blog/AdminBlogsClient";
import { hasSupabaseServerEnv } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase.server";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";

export const revalidate = 0;

async function getPosts() {
  if (!hasSupabaseServerEnv()) return [];
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  // Try with scheduled_for first, fall back without it if column doesn't exist yet
  const { data, error } = await supabase
    .from("blog_posts_ai")
    .select(
      "id,title,slug,status,category,tags,excerpt,locality,created_at,hero_image,seo_title,seo_description,postcode_prefix,body_markdown,scheduled_for"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  
  // If scheduled_for column doesn't exist yet, retry without it
  if (error?.message?.includes("scheduled_for")) {
    const { data: fallbackData } = await supabase
      .from("blog_posts_ai")
      .select(
        "id,title,slug,status,category,tags,excerpt,locality,created_at,hero_image,seo_title,seo_description,postcode_prefix,body_markdown"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    return fallbackData ?? [];
  }
  
  return data ?? [];
}

export default async function AdminBlogsPage() {
  await requireAdminServerComponent();

  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">AI Drafts & Blog</h1>
          <p className="text-slateSoft text-sm">
            Review AI-generated drafts, tweak metadata, and approve once ready for parents.
          </p>
        </header>
        <AdminBlogsClient posts={posts} />
      </div>
    </div>
  );
}
