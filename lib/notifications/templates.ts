/**
 * Notification Templates
 * 
 * Functions to fetch and render notification templates
 * Optimized with in-memory caching for better performance
 */

import { getSupabaseServer } from "@/lib/supabase/server";

export type NotificationTemplate = {
  id: number;
  key: string;
  channel: "email" | "in_app" | "sms";
  audience: "parent" | "provider" | "admin";
  subject: string | null;
  bodyMarkdown: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RenderedNotification = {
  subject: string;
  html: string;
  text: string;
};

// In-memory cache for templates (5 minute TTL)
const templateCache = new Map<string, { template: NotificationTemplate; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get notification template by key (with caching)
 */
export async function getTemplate(key: string): Promise<NotificationTemplate | null> {
  // Check cache first
  const cached = templateCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.template;
  }

  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: template, error } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("key", key)
    .eq("is_active", true)
    .single();

  if (error || !template) {
    console.warn(`[getTemplate] Template not found: ${key}`, error);
    return null;
  }

  const result: NotificationTemplate = {
    id: template.id,
    key: template.key,
    channel: template.channel as NotificationTemplate["channel"],
    audience: template.audience as NotificationTemplate["audience"],
    subject: template.subject,
    bodyMarkdown: template.body_markdown,
    isActive: template.is_active,
    createdAt: new Date(template.created_at),
    updatedAt: new Date(template.updated_at),
  };

  // Cache the template
  templateCache.set(key, {
    template: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

/**
 * Optimized placeholder replacement
 * Supports {{variable}} and {{#array}}...{{/array}} for loops
 * Pre-compiles regex patterns for better performance
 */
function replacePlaceholders(
  text: string,
  context: Record<string, unknown>
): string {
  let result = text;

  // Handle array loops first (before simple variables)
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const array = context[key];
    if (!Array.isArray(array) || array.length === 0) {
      return "";
    }
    
    // Pre-compile property patterns for the array content
    const propertyMatches = new Set<string>();
    const propertyRegex = /\{\{(\w+)\}\}/g;
    let propMatch;
    while ((propMatch = propertyRegex.exec(content)) !== null) {
      propertyMatches.add(propMatch[1]);
    }
    
    // Build result with optimized replacements
    const results: string[] = [];
    for (const item of array) {
      let itemContent = content;
      for (const prop of propertyMatches) {
        if (item[prop] !== undefined && item[prop] !== null) {
          // Direct string replacement is faster than regex for single replacements
          itemContent = itemContent.split(`{{${prop}}}`).join(String(item[prop]));
        }
      }
      results.push(itemContent);
    }
    return results.join("");
  });

  // Replace simple variables {{variable}} - use direct replacement for better performance
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined && value !== null ? String(value) : match;
  });

  return result;
}

/**
 * Optimized markdown to HTML conversion
 * Pre-compiled regex patterns for better performance
 */
const markdownPatterns = {
  h3: /^### (.*$)/gim,
  h2: /^## (.*$)/gim,
  h1: /^# (.*$)/gim,
  bold: /\*\*(.*?)\*\*/g,
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
  doubleNewline: /\n\n/g,
  singleNewline: /\n/g,
};

function markdownToHtml(markdown: string): string {
  // Apply transformations in optimized order
  let html = markdown
    .replace(markdownPatterns.h3, "<h3>$1</h3>")
    .replace(markdownPatterns.h2, "<h2>$1</h2>")
    .replace(markdownPatterns.h1, "<h1>$1</h1>")
    .replace(markdownPatterns.bold, "<strong>$1</strong>")
    .replace(markdownPatterns.link, '<a href="$2">$1</a>')
    .replace(markdownPatterns.doubleNewline, "</p><p>")
    .replace(markdownPatterns.singleNewline, "<br>");

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return html;
}

/**
 * Optimized markdown to plain text conversion
 * Pre-compiled regex patterns for better performance
 */
const textPatterns = {
  link: /\[([^\]]+)\]\([^)]+\)/g,
  bold: /\*\*(.*?)\*\*/g,
  headers: /#{1,6}\s+/g,
};

function markdownToText(markdown: string): string {
  return markdown
    .replace(textPatterns.link, "$1")
    .replace(textPatterns.bold, "$1")
    .replace(textPatterns.headers, "")
    .trim();
}

/**
 * Render template with context
 */
export async function renderTemplate(
  template: NotificationTemplate,
  context: Record<string, unknown>
): Promise<RenderedNotification> {
  // Replace placeholders in subject
  const subject = template.subject
    ? replacePlaceholders(template.subject, context)
    : "Notification from Parent Helper";

  // Replace placeholders in body
  const bodyWithContext = replacePlaceholders(template.bodyMarkdown, context);

  // Convert to HTML and text
  const html = markdownToHtml(bodyWithContext);
  const text = markdownToText(bodyWithContext);

  return {
    subject,
    html,
    text,
  };
}

/**
 * Get or create default template (fallback)
 */
export async function getOrCreateDefaultTemplate(
  key: string,
  channel: "email" | "in_app" | "sms",
  audience: "parent" | "provider" | "admin"
): Promise<NotificationTemplate | null> {
  const existing = await getTemplate(key);
  if (existing) return existing;

  // Create a minimal default template
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const defaultSubject = `Notification from Parent Helper`;
  const defaultBody = `Hello {{first_name}},\n\nThis is a notification from Parent Helper.\n\n{{message}}`;

  const { data: template, error } = await supabase
    .from("notification_templates")
    .insert({
      key,
      channel,
      audience,
      subject: defaultSubject,
      body_markdown: defaultBody,
      is_active: true,
    })
    .select()
    .single();

  if (error || !template) {
    console.error(`[getOrCreateDefaultTemplate] Failed to create: ${key}`, error);
    return null;
  }

  return {
    id: template.id,
    key: template.key,
    channel: template.channel as NotificationTemplate["channel"],
    audience: template.audience as NotificationTemplate["audience"],
    subject: template.subject,
    bodyMarkdown: template.body_markdown,
    isActive: template.is_active,
    createdAt: new Date(template.created_at),
    updatedAt: new Date(template.updated_at),
  };
}


