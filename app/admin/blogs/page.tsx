import AdminBlogsClient from "@/components/blog/AdminBlogsClient";
import { hasSupabaseServerEnv, supabaseServer } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const revalidate = 0;

async function getPosts() {
  if (!hasSupabaseServerEnv()) return [];
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("blog_posts_ai")
    .select(
      "id,title,slug,status,category,tags,excerpt,locality,created_at,hero_image,seo_title,seo_description,postcode_prefix"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

function Gate() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-[50vh] bg-cream px-4 py-20 text-center text-charcoal">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="mt-4 text-slateSoft">Admin access required.</p>
      </div>
    );
  }

  async function setCookie(formData: FormData) {
    "use server";
    const secret = formData.get("secret");
    if (secret && secret === process.env.ADMIN_SECRET) {
      const cookieStore = (await cookies()) as unknown as {
        set: (name: string, value: string, options: { httpOnly?: boolean; path?: string; maxAge?: number }) => void;
      };
      cookieStore.set("ph_admin", String(secret), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      redirect("/admin/blogs");
    }
  }

  return (
    <form action={setCookie} className="min-h-[50vh] bg-cream px-4 py-20 text-center text-charcoal">
      <h1 className="text-2xl font-semibold">Admin access</h1>
      <p className="mt-4 text-slateSoft">Enter secret to continue.</p>
      <input name="secret" className="ph-input mt-6 inline-block w-64" type="password" />
      <button className="ph-btn mt-4" type="submit">
        Unlock
      </button>
    </form>
  );
}

export default async function AdminBlogsPage() {
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("ph_admin")?.value;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || cookieSecret !== adminSecret) {
    return <Gate />;
  }

  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">AI Drafts & Journal</h1>
          <p className="text-slateSoft text-sm">
            Review AI-generated drafts, tweak metadata, and approve once ready for parents.
          </p>
        </header>
        <AdminBlogsClient posts={posts} />
      </div>
    </div>
  );
}
