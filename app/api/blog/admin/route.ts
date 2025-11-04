import { supabaseServer } from "@/lib/supabase";
import { slugify } from "@/lib/slug";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

async function ensureUniqueSlug(
  supabase: ReturnType<typeof supabaseServer>,
  desired: string,
  excludeId?: string,
) {
  let candidate = desired || `post-${Date.now()}`;
  let suffix = 1;
  while (true) {
    const { data } = await supabase
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

async function validateAdmin() {
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("ph_admin")?.value;
  if (!process.env.ADMIN_SECRET || cookieSecret !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorised");
  }
}

export async function POST(req: Request) {
  try {
    await validateAdmin();
  } catch (error) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, id, updates } = body as { action?: string; id?: string; updates?: any };
  if (!action || !id) return NextResponse.json({ error: "Missing action or id" }, { status: 400 });

  const supabase = supabaseServer();

  if (action === "delete") {
    await supabase.from("blog_posts_ai").delete().eq("id", id);
    revalidatePath("/blog");
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (typeof payload.title === "string" && !payload.slug) {
      const desired = slugify(payload.title);
      payload.slug = await ensureUniqueSlug(supabase, desired, id);
    }
    await supabase.from("blog_posts_ai").update(payload).eq("id", id);
    if (payload.status === "published") {
      revalidatePath("/blog");
      if (payload.slug) {
        revalidatePath(`/blog/${payload.slug}`);
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "publish") {
    const { data, error } = await supabase
      .from("blog_posts_ai")
      .select("title, slug, seo_title, seo_description, category, locality, hero_image, created_at, updated_at")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = await ensureUniqueSlug(supabase, data.slug || slugify(data.title), id);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://parenthelper.example";
    const heroImage = data.hero_image
      ? data.hero_image.startsWith("http")
        ? data.hero_image
        : `${baseUrl}${data.hero_image}`
      : undefined;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.seo_title || data.title,
      description: data.seo_description || data.seo_title,
      author: {
        "@type": "Person",
        name: "Parent Helper",
      },
      publisher: {
        "@type": "Organization",
        name: "Parent Helper",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/images/logo.png`,
        },
      },
      url: `${baseUrl}/blog/${slug}`,
      image: heroImage ? [heroImage] : undefined,
      datePublished: data.created_at ?? new Date().toISOString(),
      dateModified: new Date().toISOString(),
      articleSection: data.category,
      about: data.locality ?? undefined,
    };

    await supabase
      .from("blog_posts_ai")
      .update({
        status: "published",
        slug,
        schema_json: schema,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
