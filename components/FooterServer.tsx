'use server';

import { getSupabaseServer } from "@/lib/supabase.server";
import FooterClient from "./FooterClient";

/**
 * Server component that fetches footer data
 * Passes data to client component for interactivity
 */
export default async function FooterServer() {
  // Fetch latest blog posts server-side
  let latestPosts: Array<{ title: string; slug: string }> = [];
  
  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data } = await supabase
        .from("blog_posts_ai")
        .select("title,slug")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (Array.isArray(data)) {
        latestPosts = data as Array<{ title: string; slug: string }>;
      }
    }
  } catch (error) {
    // Silently handle error - footer should still render
    console.error("[Footer] Error fetching latest posts:", error);
  }

  return <FooterClient latestPosts={latestPosts} />;
}

