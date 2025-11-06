/**
 * Analytics Insights & Trending Topics
 * 
 * Extracts actionable insights from analytics data to guide content creation
 * and feature development based on real user behavior.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TrendingTopic {
  topic: string;
  score: number;
  source: "search" | "blog" | "category" | "location";
  metadata?: {
    category?: string;
    location?: string;
    searchCount?: number;
    viewCount?: number;
  };
}

/**
 * Get trending topics based on user search and blog view patterns
 * 
 * Analyzes the last 30 days of analytics to identify what parents
 * are searching for and reading most. Returns ranked topics that
 * can guide AI blog generation.
 * 
 * @param limit - Number of top topics to return (default: 5)
 * @param days - Number of days to analyze (default: 30)
 * @returns Array of trending topics with scores
 */
export async function getTrendingTopics(
  limit: number = 5,
  days: number = 30
): Promise<TrendingTopic[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Fetch analytics events from the specified period
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", cutoffDate.toISOString())
      .in("event_type", ["search", "blog_view"]);

    if (error) {
      console.error("Failed to fetch analytics for trending topics:", error);
      return [];
    }

    if (!events || events.length === 0) {
      return [];
    }

    // Aggregate data by topic
    const topicScores = new Map<string, TrendingTopic>();

    events.forEach((event) => {
      const { event_type, payload } = event;

      // Process search events
      if (event_type === "search" && payload) {
        // Category searches (high value)
        if (payload.category) {
          const category = payload.category.toLowerCase();
          const existing = topicScores.get(category) || {
            topic: category,
            score: 0,
            source: "category" as const,
            metadata: { category, searchCount: 0 },
          };
          existing.score += 3; // Categories are high-intent
          existing.metadata!.searchCount = (existing.metadata!.searchCount || 0) + 1;
          topicScores.set(category, existing);
        }

        // Location searches (medium value - helps with local content)
        if (payload.location && payload.location !== "your area") {
          const location = payload.location.toLowerCase();
          const existing = topicScores.get(location) || {
            topic: location,
            score: 0,
            source: "location" as const,
            metadata: { location, searchCount: 0 },
          };
          existing.score += 2; // Locations indicate local interest
          existing.metadata!.searchCount = (existing.metadata!.searchCount || 0) + 1;
          topicScores.set(location, existing);
        }
      }

      // Process blog view events
      if (event_type === "blog_view" && payload) {
        if (payload.title) {
          const title = payload.title.toLowerCase();
          const existing = topicScores.get(title) || {
            topic: payload.title, // Keep original case for display
            score: 0,
            source: "blog" as const,
            metadata: { viewCount: 0 },
          };
          existing.score += 1; // Views indicate interest but lower than searches
          existing.metadata!.viewCount = (existing.metadata!.viewCount || 0) + 1;
          topicScores.set(title, existing);
        }

        // Category from blog posts
        if (payload.category) {
          const category = payload.category.toLowerCase();
          const existing = topicScores.get(category) || {
            topic: category,
            score: 0,
            source: "category" as const,
            metadata: { category, viewCount: 0 },
          };
          existing.score += 1;
          existing.metadata!.viewCount = (existing.metadata!.viewCount || 0) + 1;
          topicScores.set(category, existing);
        }
      }
    });

    // Convert to array and sort by score
    const rankedTopics = Array.from(topicScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return rankedTopics;
  } catch (error) {
    console.error("Error getting trending topics:", error);
    return [];
  }
}

/**
 * Get topic suggestions for AI blog generation
 * 
 * Returns human-readable topic suggestions based on trends,
 * formatted for use in AI prompts.
 * 
 * @returns Array of topic strings ready for AI prompt
 */
export async function getTopicSuggestions(): Promise<string[]> {
  const trending = await getTrendingTopics(10, 30);

  // Convert trending topics to actionable blog ideas
  const suggestions = trending.map((t) => {
    if (t.source === "category") {
      return `${t.topic} classes and activities for babies and toddlers`;
    }
    if (t.source === "location") {
      return `Best baby and toddler activities in ${t.topic}`;
    }
    if (t.source === "blog") {
      // Extract key themes from popular blog titles
      return t.topic;
    }
    return t.topic;
  });

  return suggestions;
}

/**
 * Get engagement metrics for AI-generated blog posts
 * 
 * Compares performance of trend-based vs organic blog posts
 * to validate the effectiveness of trend-driven content.
 * 
 * @param days - Number of days to analyze (default: 30)
 */
export async function getAIContentPerformance(days: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get blog view events
    const { data: blogViews, error: viewsError } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("event_type", "blog_view")
      .gte("created_at", cutoffDate.toISOString());

    if (viewsError) {
      console.error("Failed to fetch blog performance:", viewsError);
      return null;
    }

    // Aggregate views by blog post
    const postViews = new Map<string, number>();
    blogViews?.forEach((event) => {
      const slug = event.payload?.slug;
      if (slug) {
        postViews.set(slug, (postViews.get(slug) || 0) + 1);
      }
    });

    // Get published blog posts to determine which were AI-generated
    const { data: posts, error: postsError } = await supabase
      .from("blog_posts_ai")
      .select("*")
      .eq("status", "published");

    if (postsError) {
      console.error("Failed to fetch published posts:", postsError);
      return null;
    }

    // Categorize by trend source
    const trendPosts: { slug: string; views: number; title: string }[] = [];
    const organicPosts: { slug: string; views: number; title: string }[] = [];

    posts?.forEach((post) => {
      const views = postViews.get(post.slug) || 0;
      const postData = { slug: post.slug, views, title: post.title };

      if (post.trend_source) {
        trendPosts.push(postData);
      } else {
        organicPosts.push(postData);
      }
    });

    // Calculate averages
    const trendAvgViews =
      trendPosts.length > 0
        ? trendPosts.reduce((sum, p) => sum + p.views, 0) / trendPosts.length
        : 0;

    const organicAvgViews =
      organicPosts.length > 0
        ? organicPosts.reduce((sum, p) => sum + p.views, 0) / organicPosts.length
        : 0;

    return {
      trendPosts: trendPosts.sort((a, b) => b.views - a.views).slice(0, 10),
      organicPosts: organicPosts.sort((a, b) => b.views - a.views).slice(0, 10),
      trendAvgViews: Math.round(trendAvgViews),
      organicAvgViews: Math.round(organicAvgViews),
      totalTrendPosts: trendPosts.length,
      totalOrganicPosts: organicPosts.length,
      improvementPercentage:
        organicAvgViews > 0
          ? Math.round(((trendAvgViews - organicAvgViews) / organicAvgViews) * 100)
          : 0,
    };
  } catch (error) {
    console.error("Error getting AI content performance:", error);
    return null;
  }
}

/**
 * Get recent search trends for display in admin dashboard
 * 
 * Returns a time series of search activity to show trending patterns
 */
export async function getSearchTrends(days: number = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: searches, error } = await supabase
      .from("analytics_events")
      .select("created_at, payload")
      .eq("event_type", "search")
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch search trends:", error);
      return [];
    }

    // Group by date
    const dailyCounts = new Map<string, number>();
    searches?.forEach((search) => {
      const date = new Date(search.created_at).toLocaleDateString();
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    return Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      searches: count,
    }));
  } catch (error) {
    console.error("Error getting search trends:", error);
    return [];
  }
}


