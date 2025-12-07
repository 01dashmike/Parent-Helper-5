/**
 * AI Tools for Providers
 * 
 * High-level functions for each AI tool
 */

import { callAI, hashPrompt } from "./client";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getProviderEntitlements } from "@/lib/monetisation/entitlements";
import { sql } from "drizzle-orm";

// ========================================
// PROMPT BUILDERS
// ========================================

type ClassCopyParams = {
  ageRange?: string;
  category?: string;
  style?: string;
  city?: string;
  tone?: "calm" | "exciting" | "professional" | "friendly";
};

export function buildClassCopyPrompt(params: ClassCopyParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a helpful assistant for class providers on Parent Helper, a UK platform connecting parents with baby and toddler classes.

Your job is to write engaging, accurate, and family-friendly class descriptions. You must:
- Use inclusive, body-positive language
- Never make medical or health guarantees
- Never promise specific outcomes ("your child will definitely...")
- Focus on fun, learning, and social development
- Be honest about what the class offers
- Use UK English spelling and terminology

If asked for medical advice or guarantees, politely decline.`;

  const userPrompt = `Generate a complete class description for:
${params.ageRange ? `Age range: ${params.ageRange}` : ""}
${params.category ? `Category: ${params.category}` : ""}
${params.style ? `Style: ${params.style}` : ""}
${params.city ? `Location: ${params.city}` : ""}
${params.tone ? `Tone: ${params.tone}` : ""}

Provide:
1. A catchy title (max 60 characters)
2. A short subtitle (max 120 characters)
3. A detailed description (3-4 paragraphs)
4. 4-6 bullet points highlighting key benefits
5. Optional: Age-appropriate safety/appropriateness notes (but NO medical advice)

Return as JSON:
{
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "bullets": ["...", "..."],
  "safetyNotes": "..."
}`;

  return { systemPrompt, userPrompt };
}

type ImproveClassCopyParams = {
  existingText: string;
  tone?: "calm" | "exciting" | "professional" | "friendly";
};

export function buildImproveClassCopyPrompt(params: ImproveClassCopyParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a helpful assistant for class providers. Your job is to improve class descriptions to be more engaging, clear, and SEO-friendly while maintaining accuracy.

You must:
- Keep all factual information
- Improve clarity and flow
- Make it more engaging
- Use inclusive, family-friendly language
- Never add medical claims or guarantees
- Use UK English`;

  const userPrompt = `Improve this class description:
${params.existingText}

${params.tone ? `Make the tone more ${params.tone}.` : ""}

Return as JSON:
{
  "improved": "...",
  "changes": ["Change 1", "Change 2", ...]
}`;

  return { systemPrompt, userPrompt };
}

type ScheduleParams = {
  ageRange?: string;
  category?: string;
  city?: string;
};

export function buildScheduleSuggestionPrompt(params: ScheduleParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a helpful assistant for class providers. Suggest optimal class schedules based on parent behavior patterns.

You must:
- Base suggestions on typical parent schedules (e.g., mornings for babies, after school for older kids)
- Never provide financial advice, only benchmarks/suggestions
- Frame price suggestions as "typical range" not guarantees
- Use UK context`;

  const userPrompt = `Suggest optimal schedule and pricing for:
${params.ageRange ? `Age range: ${params.ageRange}` : ""}
${params.category ? `Category: ${params.category}` : ""}
${params.city ? `Location: ${params.city}` : ""}

Provide:
1. 3-5 schedule suggestions (day, time, duration in minutes, reasoning)
2. Optional: Typical price range for this type of class in the UK (min/max in GBP, reasoning)

Return as JSON:
{
  "suggestions": [
    {
      "day": "Tuesday",
      "time": "10:00",
      "duration": 45,
      "reasoning": "..."
    }
  ],
  "priceRange": {
    "min": 10,
    "max": 15,
    "currency": "GBP",
    "reasoning": "..."
  }
}`;

  return { systemPrompt, userPrompt };
}

type SeoParams = {
  currentTitle?: string;
  currentDescription?: string;
  category?: string;
  city?: string;
  ageRange?: string;
};

export function buildSeoAssistantPrompt(params: SeoParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an SEO expert helping class providers optimize their listings for search engines.

You must:
- Create SEO-friendly titles and descriptions
- Include location-specific hooks naturally
- Suggest relevant keywords/tags
- Keep content accurate and not misleading
- Use UK English`;

  const userPrompt = `Optimize SEO for:
${params.currentTitle ? `Current title: ${params.currentTitle}` : ""}
${params.currentDescription ? `Current description: ${params.currentDescription}` : ""}
${params.category ? `Category: ${params.category}` : ""}
${params.city ? `City: ${params.city}` : ""}
${params.ageRange ? `Age range: ${params.ageRange}` : ""}

Provide:
1. SEO-optimized title (max 60 characters)
2. SEO-optimized H1 (max 80 characters)
3. Meta description (max 160 characters)
4. 3-5 city/area-specific hooks (e.g., "in Camden", "in South Manchester")
5. 5-8 suggested tags/keywords
6. Optional: Improved description if current one was provided

Return as JSON:
{
  "seoTitle": "...",
  "seoH1": "...",
  "metaDescription": "...",
  "cityHooks": ["...", "..."],
  "suggestedTags": ["...", "..."],
  "improvedDescription": "..."
}`;

  return { systemPrompt, userPrompt };
}

type ReviewReplyParams = {
  reviewText: string;
  reviewRating?: number;
  tone: "grateful" | "neutral" | "professional" | "apologetic";
};

export function buildReviewReplyPrompt(params: ReviewReplyParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a helpful assistant for class providers responding to parent reviews.

You must:
- Always be polite and professional
- Never argue about facts
- Avoid legal, health, or medical statements
- Encourage offline resolution for issues ("please email us if...")
- Thank reviewers for positive feedback
- Acknowledge concerns without admitting fault
- Use UK English`;

  const userPrompt = `Generate a ${params.tone} reply to this review:
Rating: ${params.reviewRating || "N/A"}
Review: ${params.reviewText}

Return as JSON:
{
  "reply": "..."
}`;

  return { systemPrompt, userPrompt };
}

type InsightParams = {
  timeRange: "week" | "month";
  totalViews: number;
  totalBookings: number;
  totalRevenue: number;
  classes: Array<{ name: string; category: string; town: string }>;
};

export function buildInsightSummaryPrompt(params: InsightParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an analytics coach helping class providers understand their performance data.

You must:
- Explain metrics in plain English
- Provide actionable suggestions
- Be encouraging but honest
- Focus on growth opportunities
- Use UK English`;

  const userPrompt = `Analyze this provider's performance:

Time range: Last ${params.timeRange}
Total views: ${params.totalViews}
Total bookings: ${params.totalBookings}
Total revenue: £${params.totalRevenue.toFixed(2)}

Classes:
${params.classes.map((c) => `- ${c.name} (${c.category}, ${c.town})`).join("\n")}

Provide:
1. A plain-language summary (2-3 sentences)
2. Key changes/trends (3-5 items)
3. Actionable suggestions (3-5 items with impact estimates)

Return as JSON:
{
  "summary": "...",
  "keyChanges": [
    {
      "label": "...",
      "changeDescription": "..."
    }
  ],
  "suggestions": [
    {
      "title": "...",
      "description": "...",
      "impactEstimate": "..."
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

type SendAssistantParams = {
  message: string;
};

export function buildSendAssistantPrompt(params: SendAssistantParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a helpful SEND (Special Educational Needs and Disabilities) assistant for Parent Helper, a UK platform connecting families with classes and activities.

Your role:
- Help families find SEND-friendly classes and activities
- Provide accessibility guidance
- Explain legal rights and support options
- Recommend local resources and support groups
- Offer child-profile-based advice

Be empathetic, clear, and practical. Focus on UK-specific resources and regulations.`;

  return { systemPrompt, userPrompt: params.message };
}

type AnalyticsCoachParams = {
  context: string;
  query: string;
};

export function buildAnalyticsCoachPrompt(params: AnalyticsCoachParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an analytics assistant for Parent Helper, a UK platform connecting parents with baby and toddler classes. Given the following data, answer concisely and with actionable advice. Be specific, practical, and encouraging. Use UK English and focus on actionable insights.`;

  const userPrompt = `Context Data:\n${params.context}\n\nUser Question: ${params.query}\n\nProvide a concise, actionable answer:`;

  return { systemPrompt, userPrompt };
}

const DAILY_AI_LIMIT = parseInt(process.env.AI_DAILY_LIMIT_PER_PROVIDER || "20", 10);

/**
 * Check if provider has exceeded daily AI usage limit
 */
async function checkRateLimit(providerId: number): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { allowed: false, remaining: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: events, error } = await supabase
    .from("ai_usage_events")
    .select("id")
    .eq("provider_id", providerId)
    .gte("created_at", today.toISOString());

  if (error) {
    console.error("[AI Tools] Error checking rate limit:", error);
    return { allowed: false, remaining: 0 };
  }

  const count = events?.length || 0;
  const remaining = Math.max(0, DAILY_AI_LIMIT - count);

  return {
    allowed: count < DAILY_AI_LIMIT,
    remaining,
  };
}

/**
 * Log AI usage event
 */
async function logAIUsage(params: {
  userId?: string;
  providerId: number;
  toolType: string;
  inputTokens?: number;
  outputTokens?: number;
  promptHash?: string;
}): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase.from("ai_usage_events").insert({
    user_id: params.userId || null,
    provider_id: params.providerId,
    tool_type: params.toolType,
    input_tokens: params.inputTokens || null,
    output_tokens: params.outputTokens || null,
    prompt_hash: params.promptHash || null,
  });
}

/**
 * Check cache for existing suggestion
 */
async function getCachedSuggestion(
  providerId: number,
  toolType: string,
  inputFingerprint: string
): Promise<any | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ai_cached_suggestions")
    .select("output_json, last_used_at")
    .eq("provider_id", providerId)
    .eq("tool_type", toolType)
    .eq("input_fingerprint", inputFingerprint)
    .single();

  if (data) {
    // Update last_used_at
    await supabase
      .from("ai_cached_suggestions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("provider_id", providerId)
      .eq("tool_type", toolType)
      .eq("input_fingerprint", inputFingerprint);

    return data.output_json;
  }

  return null;
}

/**
 * Cache suggestion
 */
type CachedOutput = Record<string, unknown> | string;

async function cacheSuggestion(params: {
  userId?: string;
  providerId: number;
  contextType: string;
  contextId?: number;
  toolType: string;
  inputFingerprint: string;
  outputJson: CachedOutput;
}): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase
    .from("ai_cached_suggestions")
    .upsert(
      {
        user_id: params.userId || null,
        provider_id: params.providerId,
        context_type: params.contextType,
        context_id: params.contextId || null,
        tool_type: params.toolType,
        input_fingerprint: params.inputFingerprint,
        output_json: params.outputJson,
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: "input_fingerprint",
      }
    );
}

/**
 * Base AI call with rate limiting, caching, and logging
 */
async function callAIWithSafety(params: {
  userId?: string;
  providerId: number;
  toolType: string;
  systemPrompt: string;
  userPrompt: string;
  schema?: Record<string, any>;
  contextType?: string;
  contextId?: number;
}): Promise<{ content: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }; fromCache: boolean }> {
  // Check rate limit
  const rateLimit = await checkRateLimit(params.providerId);
  if (!rateLimit.allowed) {
    throw new Error(
      `You've reached today's AI usage limit (${DAILY_AI_LIMIT} calls). Try again tomorrow or upgrade to Premium Analytics for unlimited access.`
    );
  }

  // Check cache
  const promptHash = hashPrompt(params.systemPrompt + params.userPrompt);
  const cached = await getCachedSuggestion(params.providerId, params.toolType, promptHash);
  if (cached) {
    return {
      content: typeof cached === "string" ? cached : JSON.stringify(cached),
      fromCache: true,
    };
  }

  // Call AI using unified callAI
  const aiResult = await callAI({
    model: "gpt-4o-mini",
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    metadata: {
      useCase: params.toolType,
      userId: params.userId,
      providerId: params.providerId,
    },
  });

  if (!aiResult.success || !aiResult.text) {
    throw new Error(aiResult.error || "AI call failed");
  }

  // Handle schema parsing if provided
  let content = aiResult.text;
  if (params.schema) {
    try {
      const parsed = JSON.parse(content);
      content = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch (e) {
      console.warn("Failed to parse AI response as JSON:", e);
    }
  }

  // Log usage
  await logAIUsage({
    userId: params.userId,
    providerId: params.providerId,
    toolType: params.toolType,
    inputTokens: aiResult.tokens?.prompt,
    outputTokens: aiResult.tokens?.completion,
    promptHash,
  });

  // Cache result
  if (params.contextType) {
    const outputJson = params.schema ? JSON.parse(content) : { content };
    await cacheSuggestion({
      userId: params.userId,
      providerId: params.providerId,
      contextType: params.contextType,
      contextId: params.contextId,
      toolType: params.toolType,
      inputFingerprint: promptHash,
      outputJson,
    });
  }

  return {
    content,
    usage: aiResult.tokens
      ? {
          promptTokens: aiResult.tokens.prompt,
          completionTokens: aiResult.tokens.completion,
          totalTokens: aiResult.tokens.total,
        }
      : undefined,
    fromCache: false,
  };
}

/**
 * Generate class copy from scratch
 */
export async function generateClassCopy(params: {
  userId?: string;
  providerId: number;
  ageRange?: string;
  category?: string;
  style?: string;
  city?: string;
  tone?: "calm" | "exciting" | "professional" | "friendly";
}): Promise<{
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  safetyNotes?: string;
}> {
  const { systemPrompt, userPrompt } = buildClassCopyPrompt({
    ageRange: params.ageRange,
    category: params.category,
    style: params.style,
    city: params.city,
    tone: params.tone,
  });

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      subtitle: { type: "string" },
      description: { type: "string" },
      bullets: { type: "array", items: { type: "string" } },
      safetyNotes: { type: "string" },
    },
    required: ["title", "subtitle", "description", "bullets"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "class_copy",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "class",
  });

  return JSON.parse(response.content);
}

/**
 * Improve existing class copy
 */
export async function improveClassCopy(params: {
  userId?: string;
  providerId: number;
  existingText: string;
  tone?: "calm" | "exciting" | "professional" | "friendly";
}): Promise<{
  improved: string;
  changes: string[];
}> {
  const { systemPrompt, userPrompt } = buildImproveClassCopyPrompt({
    existingText: params.existingText,
    tone: params.tone,
  });

  const schema = {
    type: "object",
    properties: {
      improved: { type: "string" },
      changes: { type: "array", items: { type: "string" } },
    },
    required: ["improved", "changes"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "class_copy",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "class",
  });

  return JSON.parse(response.content);
}

/**
 * Generate schedule suggestions
 */
export async function generateScheduleSuggestions(params: {
  userId?: string;
  providerId: number;
  ageRange?: string;
  category?: string;
  city?: string;
}): Promise<{
  suggestions: Array<{
    day: string;
    time: string;
    duration: number;
    reasoning: string;
  }>;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
    reasoning: string;
  };
}> {
  const { systemPrompt, userPrompt } = buildScheduleSuggestionPrompt({
    ageRange: params.ageRange,
    category: params.category,
    city: params.city,
  });

  const schema = {
    type: "object",
    properties: {
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "string" },
            time: { type: "string" },
            duration: { type: "number" },
            reasoning: { type: "string" },
          },
        },
      },
      priceRange: {
        type: "object",
        properties: {
          min: { type: "number" },
          max: { type: "number" },
          currency: { type: "string" },
          reasoning: { type: "string" },
        },
      },
    },
    required: ["suggestions"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "schedule",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "class",
  });

  return JSON.parse(response.content);
}

/**
 * Generate SEO suggestions
 */
export async function generateSeoSuggestions(params: {
  userId?: string;
  providerId: number;
  currentTitle?: string;
  currentDescription?: string;
  category?: string;
  city?: string;
  ageRange?: string;
}): Promise<{
  seoTitle: string;
  seoH1: string;
  metaDescription: string;
  cityHooks: string[];
  suggestedTags: string[];
  improvedDescription?: string;
}> {
  const { systemPrompt, userPrompt } = buildSeoAssistantPrompt({
    currentTitle: params.currentTitle,
    currentDescription: params.currentDescription,
    category: params.category,
    city: params.city,
    ageRange: params.ageRange,
  });

  const schema = {
    type: "object",
    properties: {
      seoTitle: { type: "string" },
      seoH1: { type: "string" },
      metaDescription: { type: "string" },
      cityHooks: { type: "array", items: { type: "string" } },
      suggestedTags: { type: "array", items: { type: "string" } },
      improvedDescription: { type: "string" },
    },
    required: ["seoTitle", "seoH1", "metaDescription", "cityHooks", "suggestedTags"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "seo",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "class",
  });

  return JSON.parse(response.content);
}

/**
 * Generate review reply
 */
export async function generateReviewReply(params: {
  userId?: string;
  providerId: number;
  reviewText: string;
  reviewRating?: number;
  tone: "grateful" | "neutral" | "professional" | "apologetic";
}): Promise<{
  reply: string;
}> {
  const { systemPrompt, userPrompt } = buildReviewReplyPrompt({
    reviewText: params.reviewText,
    reviewRating: params.reviewRating,
    tone: params.tone,
  });

  const schema = {
    type: "object",
    properties: {
      reply: { type: "string" },
    },
    required: ["reply"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "review_reply",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "review",
  });

  return JSON.parse(response.content);
}

/**
 * Generate parent email copy
 */
export async function generateParentEmailCopy(params: {
  userId?: string;
  providerId: number;
  eventType: "class_update" | "schedule_change" | "term_announcement" | "holiday_special" | "new_class";
  tone: "friendly" | "professional" | "casual";
  targetAge?: string;
  city?: string;
  keyPoints: string[];
  holidayType?: "easter" | "summer" | "christmas" | "half_term";
}): Promise<{
  subjectLines: string[];
  emailBody: string;
  smsVariant?: string;
}> {
  const systemPrompt = `You are a helpful assistant for class providers writing emails to parents.

You must:
- Write clear, engaging copy
- Be family-friendly and inclusive
- Use UK English
- Keep it concise but informative`;

  const eventTypeMap: Record<string, string> = {
    class_update: "class update",
    schedule_change: "schedule change",
    term_announcement: "term announcement",
    holiday_special: `${params.holidayType || "holiday"} special`,
    new_class: "new class announcement",
  };

  const userPrompt = `Generate email copy for: ${eventTypeMap[params.eventType]}

Tone: ${params.tone}
${params.targetAge ? `Target age: ${params.targetAge}` : ""}
${params.city ? `City: ${params.city}` : ""}

Key points to include:
${params.keyPoints.map((p) => `- ${p}`).join("\n")}

Provide:
1. 3 subject line options
2. Email body (2-3 paragraphs)
3. Optional: SMS-friendly short version (max 160 characters)

Return as JSON:
{
  "subjectLines": ["...", "...", "..."],
  "emailBody": "...",
  "smsVariant": "..."
}`;

  const schema = {
    type: "object",
    properties: {
      subjectLines: { type: "array", items: { type: "string" } },
      emailBody: { type: "string" },
      smsVariant: { type: "string" },
    },
    required: ["subjectLines", "emailBody"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "email_copy",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "email_campaign",
  });

  return JSON.parse(response.content);
}

/**
 * Generate insight summary from analytics
 */
export async function generateInsightSummary(params: {
  userId?: string;
  providerId: number;
  timeRange: "week" | "month";
}): Promise<{
  summary: string;
  keyChanges: Array<{ label: string; changeDescription: string }>;
  suggestions: Array<{ title: string; description: string; impactEstimate: string }>;
}> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Fetch analytics data
  const endDate = new Date();
  const startDate = new Date();
  if (params.timeRange === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  // Get provider's classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, category, town")
    .eq("provider_id", params.providerId)
    .eq("is_active", true);

  if (!classes || classes.length === 0) {
    return {
      summary: "No active classes found.",
      keyChanges: [],
      suggestions: [],
    };
  }

  const classIds = classes.map((c: { id: number }) => c.id);

  // Get metrics
  const { data: metrics } = await supabase
    .from("provider_daily_metrics")
    .select("date, views, bookings, revenue")
    .eq("provider_id", params.providerId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Calculate changes
  const totalViews = metrics?.reduce((sum: number, m: { views?: number | null }) => sum + (m.views || 0), 0) || 0;
  const totalBookings = metrics?.reduce((sum: number, m: { bookings?: number | null }) => sum + (m.bookings || 0), 0) || 0;
  const totalRevenue = metrics?.reduce((sum: number, m: { revenue?: number | string | null }) => sum + (parseFloat(m.revenue?.toString() || "0") || 0), 0) || 0;

  const { systemPrompt, userPrompt } = buildInsightSummaryPrompt({
    timeRange: params.timeRange,
    totalViews,
    totalBookings,
    totalRevenue,
    classes: classes.map((c: { name: string; category: string; town: string }) => ({
      name: c.name,
      category: c.category,
      town: c.town,
    })),
  });

  const schema = {
    type: "object",
    properties: {
      summary: { type: "string" },
      keyChanges: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            changeDescription: { type: "string" },
          },
        },
      },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            impactEstimate: { type: "string" },
          },
        },
      },
    },
    required: ["summary", "keyChanges", "suggestions"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "insight_coach",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "provider_profile",
  });

  return JSON.parse(response.content);
}

/**
 * Generate onboarding text
 */
export async function generateOnboardingText(params: {
  userId?: string;
  providerId: number;
  step: "tagline" | "description" | "captions";
  existingData?: Record<string, any>;
}): Promise<{
  text: string;
}> {
  const systemPrompt = `You are a helpful assistant for class providers setting up their profile on Parent Helper.

You must:
- Write engaging, accurate copy
- Use inclusive, family-friendly language
- Use UK English
- Keep it concise`;

  let userPrompt = "";
  if (params.step === "tagline") {
    userPrompt = `Generate a catchy tagline for a class provider.
${params.existingData?.businessName ? `Business name: ${params.existingData.businessName}` : ""}
${params.existingData?.category ? `Category: ${params.existingData.category}` : ""}
${params.existingData?.city ? `City: ${params.existingData.city}` : ""}

Return as JSON:
{
  "text": "..."
}`;
  } else if (params.step === "description") {
    userPrompt = `Generate a class description.
${params.existingData?.ageRange ? `Age range: ${params.existingData.ageRange}` : ""}
${params.existingData?.category ? `Category: ${params.existingData.category}` : ""}
${params.existingData?.style ? `Style: ${params.existingData.style}` : ""}

Return as JSON:
{
  "text": "..."
}`;
  } else if (params.step === "captions") {
    userPrompt = `Suggest captions for class photos.
${params.existingData?.category ? `Category: ${params.existingData.category}` : ""}
${params.existingData?.ageRange ? `Age range: ${params.existingData.ageRange}` : ""}

Provide 3-5 caption suggestions.

Return as JSON:
{
  "text": "..."
}`;
  }

  const schema = {
    type: "object",
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
  };

  const response = await callAIWithSafety({
    userId: params.userId,
    providerId: params.providerId,
    toolType: "onboarding",
    systemPrompt,
    userPrompt,
    schema,
    contextType: "onboarding_step",
  });

  return JSON.parse(response.content);
}

// ========================================
// ADDITIONAL PROMPT BUILDERS
// ========================================

type SeoQuickFixParams = {
  action: "generate_description" | "suggest_categories" | "generate_alt_text" | "generate_local_copy";
  providerName: string;
  town?: string;
  description?: string;
  classes?: Array<{ name?: string | null; category?: string | null }>;
  context?: Record<string, unknown>;
};

export function buildSeoQuickFixPrompt(params: SeoQuickFixParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a marketing expert helping UK baby and toddler class providers improve their online presence. Be concise, practical, and SEO-focused.`;

  let userPrompt = "";
  
  switch (params.action) {
    case "generate_description": {
      userPrompt = `Generate a compelling, SEO-optimized description (150-300 characters) for a UK baby/toddler class provider called "${params.providerName}"${params.town ? ` located in ${params.town}` : ""}. 

Include:
- What makes them special
- Age ranges they serve
- Key benefits for parents
- Location context if applicable

Make it engaging and include relevant keywords naturally. Return only the description text, no extra formatting.`;
      break;
    }
    case "suggest_categories": {
      const currentCategories = params.classes?.map((c) => c.category).filter((cat): cat is string => typeof cat === "string") || [];
      userPrompt = `Based on this provider: "${params.providerName}"${params.description ? ` - ${params.description}` : ""}, suggest 3-5 relevant class categories they should consider adding. 

Current categories: ${currentCategories.join(", ") || "none"}

Return a JSON array of category names only, like: ["Music & Movement", "Sensory Play", "Swimming"]`;
      break;
    }
    case "generate_alt_text": {
      const classNames = params.classes?.map((c) => c.name).filter((name): name is string => typeof name === "string").join(", ") || "classes";
      userPrompt = `Generate 5-7 concise, descriptive alt text suggestions for images of baby/toddler classes. 

Provider: ${params.providerName}
Classes: ${classNames}

Each alt text should be:
- Under 125 characters
- Descriptive and specific
- Include relevant keywords naturally
- Accessible and clear

Return as a JSON array of strings.`;
      break;
    }
    case "generate_local_copy": {
      const town = (params.context?.town as string) || params.town || "your area";
      userPrompt = `Generate 3-5 short, engaging social media posts or ad copy variations (50-100 characters each) for "${params.providerName}" targeting parents in ${town}.

Each should:
- Include the location naturally
- Be engaging and action-oriented
- Include relevant keywords
- Have a clear call-to-action

Return as a JSON array of strings.`;
      break;
    }
  }

  return { systemPrompt, userPrompt };
}

type AdsAdviceParams = {
  platform: "meta" | "tiktok" | "google" | "general";
  providerName: string;
  town?: string;
  description: string;
  classes?: Array<{ name?: string | null }>;
};

export function buildAdsAdvicePrompt(params: AdsAdviceParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a digital marketing expert specializing in UK baby and toddler class providers. Return structured JSON data.`;

  const classNames = params.classes?.map((c) => c.name).filter((name): name is string => typeof name === "string").join(", ") || "Various";
  const descriptionSnippet = params.description.substring(0, 200);

  let userPrompt = "";
  
  if (params.platform === "meta") {
    userPrompt = `Generate Meta (Facebook/Instagram) ad strategy for "${params.providerName}"${params.town ? ` in ${params.town}` : ""}.

Return JSON with:
- targeting: object with demographics (age_range, gender, interests, locations)
- ad_copy: main ad copy (150-200 characters)
- sample_headlines: array of 3-5 headline variations
- recommended_budget_cents: suggested weekly budget in pence (e.g., 5000 for £50)
- hashtags: array of 5-10 relevant hashtags
- posting_schedule: object with best_days (array) and best_times (array)

Classes: ${classNames}
Description: ${descriptionSnippet}`;
  } else if (params.platform === "tiktok") {
    userPrompt = `Generate TikTok marketing strategy for "${params.providerName}"${params.town ? ` in ${params.town}` : ""}.

Return JSON with:
- targeting: object with interests, behaviors, locations
- ad_copy: short hook text (under 100 characters)
- sample_headlines: array of 3-5 video title ideas
- recommended_budget_cents: suggested weekly budget in pence
- hashtags: array of 8-12 trending/relevant hashtags
- video_scripts: array of 3-5 short video script ideas (each under 60 seconds)
- posting_schedule: object with best_days and best_times

Classes: ${classNames}
Description: ${descriptionSnippet}`;
  } else if (params.platform === "google") {
    userPrompt = `Generate Google Ads strategy for "${params.providerName}"${params.town ? ` in ${params.town}` : ""}.

Return JSON with:
- targeting: object with keywords (array), locations, demographics
- ad_copy: main ad copy (under 90 characters)
- sample_headlines: array of 3 headline variations (each under 30 characters)
- recommended_budget_cents: suggested daily budget in pence
- hashtags: [] (not applicable for Google)
- video_scripts: [] (not applicable for Google)
- posting_schedule: {} (not applicable for Google)

Classes: ${classNames}
Description: ${descriptionSnippet}`;
  } else {
    userPrompt = `Generate general marketing advice for "${params.providerName}"${params.town ? ` in ${params.town}` : ""}.

Return JSON with:
- targeting: object with general audience insights
- ad_copy: versatile ad copy (150 characters)
- sample_headlines: array of 5 headline variations
- recommended_budget_cents: suggested weekly budget in pence
- hashtags: array of 10 relevant hashtags
- video_scripts: array of 2-3 video script ideas
- posting_schedule: object with best_days and best_times

Classes: ${classNames}
Description: ${descriptionSnippet}`;
  }

  return { systemPrompt, userPrompt };
}

type NextActionParams = {
  providerName: string;
  town?: string;
  description: string;
  classesCount: number;
  reviewsCount: number;
  growthScore: number;
  recentViews: number;
};

export function buildNextActionPrompt(params: NextActionParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a business growth advisor for UK baby and toddler class providers. Provide concise, actionable advice.`;

  const userPrompt = `Based on this provider's current state, suggest ONE specific, actionable next step to grow their business.

Provider: ${params.providerName}${params.town ? ` in ${params.town}` : ""}
Description: ${params.description.substring(0, 200)}
Classes: ${params.classesCount} active classes
Reviews: ${params.reviewsCount} reviews
Growth Score: ${params.growthScore}/100
Recent Views: ${params.recentViews} (last 7 days)

Provide ONE specific action they should take next (max 100 characters). Be specific and actionable.`;

  return { systemPrompt, userPrompt };
}

type AdminCoachParams = {
  message: string;
  metrics?: {
    total_revenue_cents?: number;
    revenue_last_7_days_cents?: number;
    bookings_last_7_days?: number;
    signups_last_7_days?: number;
    conversion_rate_percent?: number;
    total_users?: number;
    total_providers?: number;
    referrals_converted_last_7_days?: number;
  };
};

export function buildAdminCoachPrompt(params: AdminCoachParams): { systemPrompt: string; userPrompt: string } {
  const context = params.metrics
    ? `
Current Metrics:
- Total Revenue: £${((params.metrics.total_revenue_cents || 0) / 100).toFixed(2)}
- Last 7 Days Revenue: £${((params.metrics.revenue_last_7_days_cents || 0) / 100).toFixed(2)}
- Last 7 Days Bookings: ${params.metrics.bookings_last_7_days || 0}
- Last 7 Days Signups: ${params.metrics.signups_last_7_days || 0}
- Conversion Rate: ${params.metrics.conversion_rate_percent || 0}%
- Total Users: ${params.metrics.total_users || 0}
- Total Providers: ${params.metrics.total_providers || 0}
- Referrals Converted (7d): ${params.metrics.referrals_converted_last_7_days || 0}
`
    : "";

  const systemPrompt = `You are an AI Performance Coach for Parent Helper, a UK baby and toddler class booking platform. Provide helpful, data-driven insights about growth metrics, trends, and opportunities. Be concise and actionable.${context}`;

  return { systemPrompt, userPrompt: params.message };
}

type ForecastParams = {
  metrics: {
    revenue_last_7_days_cents?: number;
    bookings_last_7_days?: number;
    signups_last_7_days?: number;
    referrals_converted_last_7_days?: number;
    conversion_rate_percent?: number;
    revenue_last_30_days_cents?: number;
    bookings_last_30_days?: number;
    signups_last_30_days?: number;
  };
};

export function buildForecastPrompt(params: ForecastParams): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a growth analytics assistant. Provide accurate forecasts based on historical data.`;

  const userPrompt = `Given the following growth metrics for Parent Helper (a UK baby and toddler class booking platform), forecast next week's metrics and provide a brief summary:

Current Metrics (Last 7 Days):
- Revenue: £${((params.metrics.revenue_last_7_days_cents || 0) / 100).toFixed(2)}
- Bookings: ${params.metrics.bookings_last_7_days || 0}
- Signups: ${params.metrics.signups_last_7_days || 0}
- Referrals Converted: ${params.metrics.referrals_converted_last_7_days || 0}
- Conversion Rate: ${params.metrics.conversion_rate_percent || 0}%

Last 30 Days:
- Revenue: £${((params.metrics.revenue_last_30_days_cents || 0) / 100).toFixed(2)}
- Bookings: ${params.metrics.bookings_last_30_days || 0}
- Signups: ${params.metrics.signups_last_30_days || 0}

Provide:
1. Forecasted metrics for next week (revenue, bookings, signups)
2. Expected growth percentage
3. A brief 2-3 sentence summary of expected trends

Format as JSON:
{
  "revenue_forecast_cents": number,
  "bookings_forecast": number,
  "signups_forecast": number,
  "revenue_growth_percent": number,
  "bookings_growth_percent": number,
  "signups_growth_percent": number,
  "summary": "brief summary text"
}`;

  return { systemPrompt, userPrompt };
}

