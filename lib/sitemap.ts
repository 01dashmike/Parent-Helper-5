import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAbsoluteUrl } from "@/lib/siteUrl";

export type SitemapEntry = {
    url: string;
    lastmod?: string;
    changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
};

type SupabaseLike = ReturnType<typeof import("@/lib/supabase/server").createClient> | null;

export async function fetchSitemapEntries(supabase: SupabaseLike): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [
        { url: buildAbsoluteUrl("/"), changefreq: "daily", priority: 1.0 },
        { url: buildAbsoluteUrl("/search"), changefreq: "daily", priority: 0.9 },
        { url: buildAbsoluteUrl("/providers"), changefreq: "weekly", priority: 0.7 },
        { url: buildAbsoluteUrl("/blog"), changefreq: "weekly", priority: 0.6 },
        { url: buildAbsoluteUrl("/about"), changefreq: "monthly", priority: 0.5 },
        { url: buildAbsoluteUrl("/faqs"), changefreq: "monthly", priority: 0.5 },
        { url: buildAbsoluteUrl("/contact"), changefreq: "monthly", priority: 0.4 },
        { url: buildAbsoluteUrl("/privacy"), changefreq: "yearly", priority: 0.2 },
        { url: buildAbsoluteUrl("/terms"), changefreq: "yearly", priority: 0.2 },
    ];

    if (!supabase) {
        return entries;
    }

    try {
        const { data: blogRows } = await supabase
            .from("blog_posts_ai")
            .select("slug, updated_at, created_at, status")
            .eq("status", "published")
            .order("updated_at", { ascending: false })
            .limit(200);

        type BlogRow = { slug?: string | null; updated_at?: string | null; created_at?: string | null };
        (blogRows as BlogRow[] | null)
            ?.filter((row: BlogRow) => row?.slug)
            .forEach((row: BlogRow) => {
                entries.push({
                    url: buildAbsoluteUrl(`/blog/${row.slug}`),
                    lastmod: row.updated_at ?? row.created_at ?? new Date().toISOString(),
                    changefreq: "weekly",
                    priority: 0.55,
                });
            });
    } catch (error) {
        console.warn("[sitemap] Failed to fetch blog posts:", error);
    }

    try {
        const { data: providerRows } = await supabase
            .from("providers")
            .select("slug, updated_at, is_active")
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .limit(200);

        type ProviderRow = { slug?: string | null; updated_at?: string | null };
        providerRows
            ?.filter((row: ProviderRow) => row?.slug)
            .forEach((row: ProviderRow) => {
                entries.push({
                    url: buildAbsoluteUrl(`/providers/${row.slug}`),
                    lastmod: row.updated_at ?? new Date().toISOString(),
                    changefreq: "weekly",
                    priority: 0.5,
                });
            });
    } catch (error) {
        console.warn("[sitemap] Failed to fetch providers:", error);
    }

    try {
        const { data: cityRows } = await supabase
            .from("cities")
            .select("slug, updated_at")
            .order("updated_at", { ascending: false })
            .limit(500);

        type CityRow = { slug?: string | null; updated_at?: string | null };
        cityRows?.forEach((row: CityRow) => {
            entries.push({
                url: buildAbsoluteUrl(`/${row.slug}`),
                lastmod: row.updated_at ?? new Date().toISOString(),
                changefreq: "weekly",
                priority: 0.8,
            });
        });
    } catch (error) {
        console.warn("[sitemap] Failed to fetch cities:", error);
    }

    // Add active classes with SEO metadata to sitemap
    try {
        const { data: classRows } = await supabase
            .from("classes")
            .select("id, meta_title, updated_at, created_at")
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .limit(1000); // Limit to prevent sitemap from being too large

        type ClassRow = { id?: number | null; meta_title?: string | null; updated_at?: string | null; created_at?: string | null };
        classRows?.forEach((row: ClassRow) => {
            // Use meta_title if available for better SEO, otherwise use ID
            const url = buildAbsoluteUrl(`/class/${row.id}`);
            entries.push({
                url,
                lastmod: row.updated_at ?? row.created_at ?? new Date().toISOString(),
                changefreq: "weekly",
                priority: row.meta_title ? 0.7 : 0.5, // Higher priority if SEO metadata exists
            });
        });
    } catch (error) {
        console.warn("[sitemap] Failed to fetch classes:", error);
    }

    return dedupeEntries(entries);
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
    const unique = dedupeEntries(entries);
    const urls = unique
        .map((entry) => {
            const lastmod = entry.lastmod ? `<lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>` : "";
            const changefreq = entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : "";
            const priority =
                typeof entry.priority === "number"
                    ? `<priority>${Math.max(0, Math.min(1, entry.priority)).toFixed(1)}</priority>`
                    : "";

            return `  <url>\n    <loc>${entry.url}</loc>\n    ${lastmod}${changefreq}${priority}\n  </url>`;
        })
        .join("\n");

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        "</urlset>",
    ]
        .filter(Boolean)
        .join("\n");
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
    const seen = new Set<string>();
    const result: SitemapEntry[] = [];
    entries.forEach((entry) => {
        if (!entry.url) return;
        if (seen.has(entry.url)) return;
        seen.add(entry.url);
        result.push(entry);
    });
    return result;
}

