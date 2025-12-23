import { Metadata } from "next";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv } from "@/lib/env";
import AboutPageEditor from "@/components/admin/about/AboutPageEditor";

export const metadata: Metadata = {
  title: "Edit About Page | Parent Helper Admin",
  description: "Edit the about page content and images",
  robots: "noindex, nofollow",
};

export const revalidate = 0;

async function getAboutPageContent() {
  if (!hasSupabaseServerEnv()) {
    return null;
  }
  
  const supabase = getSupabaseServer();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("about_page_content")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching about page content:", error);
    return null;
  }

  return data;
}

export default async function AdminAboutPage() {
  await requireAdminServerComponent();

  const content = await getAboutPageContent();

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Edit About Page</h1>
          <p className="text-slateSoft text-sm">
            Update the content and images for the About Parent Helper page.
          </p>
        </header>
        {content ? (
          <AboutPageEditor initialContent={content} />
        ) : (
          <div className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
            <p className="text-charcoal/70">
              Unable to load about page content. Please check your database connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
