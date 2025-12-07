import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv, isMarketingAutomationEnabled } from "@/lib/env";

export type AutomationTrigger =
  | "user_signup"
  | "first_booking"
  | "inactivity"
  | "saved_search"
  | "wallet_balance"
  | "referral_pending";

export interface AutomationContext {
  userId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  walletBalance?: number;
  localCity?: string;
  [key: string]: unknown;
}

// Cache for automation rules (5 min TTL)
let rulesCache: {
  data: AutomationRule[] | null;
  timestamp: number;
} | null = null;
const RULES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Log user activity for inactivity tracking
 * PERF: Made async fire-and-forget, doesn't block caller
 */
export function logUserActivity(
  userId: string,
  activityType: "signup" | "booking" | "search" | "login",
  metadata?: Record<string, unknown>
): void {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) return;

  // Fire and forget - don't block caller
  Promise.resolve().then(async () => {
    try {
      const supabase = getSupabaseServer();
      if (!supabase) return;

      await supabase.from("user_activity_log").insert({
        user_id: userId,
        activity_type: activityType,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error("[logUserActivity] Error:", error);
    }
  });
}

/**
 * Trigger automation based on event type
 * PERF: Optimized with caching, batching, and parallel execution
 */
export async function triggerAutomation(
  triggerType: AutomationTrigger,
  context: AutomationContext
): Promise<void> {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) return;

  try {
    const supabase = getSupabaseServer();
    if (!supabase) return;

    // PERF: Use cached rules if available
    const rules = await getCachedAutomationRules(supabase, triggerType);
    if (!rules || rules.length === 0) return;

    // PERF: Check conditions and execute actions in parallel
    const actions = await Promise.all(
      rules.map(async (rule) => {
        const conditionsMet = await checkTriggerConditions(rule, context);
        return conditionsMet ? rule : null;
      })
    );

    // PERF: Execute all valid actions in parallel
    const validActions = actions.filter((rule): rule is AutomationRule => rule !== null);
    if (validActions.length > 0) {
      await Promise.all(
        validActions.map((rule) => executeAutomationAction(rule, context))
      );
    }
  } catch (error) {
    console.error("[triggerAutomation] Error:", error);
  }
}

/**
 * PERF: Get cached automation rules to avoid repeated DB queries
 */
async function getCachedAutomationRules(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  triggerType: AutomationTrigger
): Promise<AutomationRule[] | null> {
  const now = Date.now();

  // Check if cache is valid
  if (rulesCache && now - rulesCache.timestamp < RULES_CACHE_TTL) {
    return rulesCache.data?.filter(
      (rule) => rule.trigger_type === triggerType && rule.enabled
    ) || null;
  }

  // Fetch all rules at once (more efficient than per-trigger queries)
  const { data: rules } = await supabase
    .from("automation_rules")
    .select("id, trigger_type, trigger_config, campaign_id, action_type, enabled, created_at")
    .eq("enabled", true);

  // Update cache
  rulesCache = {
    data: rules,
    timestamp: now,
  };

  return rules?.filter((rule: AutomationRule) => rule.trigger_type === triggerType) || null;
}

/**
 * Check if trigger conditions are met
 * PERF: Optimized queries with single-purpose functions
 */
type AutomationRule = {
  trigger_type?: string;
  trigger_config?: Record<string, unknown>;
  campaign_id?: string;
  action_type?: string;
  enabled?: boolean;
};

async function checkTriggerConditions(
  rule: AutomationRule,
  context: AutomationContext
): Promise<boolean> {
  const config = rule.trigger_config || {};

  switch (rule.trigger_type) {
    case "inactivity": {
      const days = typeof config.days === "number" ? config.days : 30;
      const lastActivity = await getLastActivityDate(context.userId);
      if (!lastActivity) return false;
      const daysSinceActivity =
        (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity >= days;
    }

    case "wallet_balance": {
      const minBalance = typeof config.balance_cents === "number" ? config.balance_cents : 1000;
      return (context.walletBalance || 0) >= minBalance;
    }

    case "referral_pending": {
      const daysPending = typeof config.days === "number" ? config.days : 14;
      const referralDate = await getReferralDate(context.userId);
      if (!referralDate) return false;
      const daysSinceReferral =
        (Date.now() - new Date(referralDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceReferral >= daysPending;
    }

    case "saved_search": {
      const daysSinceSearch = typeof config.days === "number" ? config.days : 7;
      const searchDate = await getLastSavedSearchDate(context.userId);
      if (!searchDate) return false;
      const daysSince =
        (Date.now() - new Date(searchDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= daysSinceSearch;
    }

    default:
      return true; // user_signup, first_booking always trigger
  }
}

/**
 * Execute automation action (send email/SMS)
 * PERF: Optimized template variable building with minimal DB queries
 */
async function executeAutomationAction(
  rule: AutomationRule,
  context: AutomationContext
): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  // PERF: Only fetch campaign if we have a campaign_id
  let campaign = null;
  if (rule.campaign_id) {
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("id, name, template_id, metadata, status, created_at")
      .eq("id", rule.campaign_id)
      .single();
    campaign = data;
  }

  // PERF: Build template variables with context data (avoid extra queries when possible)
  const variables = await buildTemplateVariables(context);

  // PERF: Send email and SMS in parallel
  const actions: Promise<void>[] = [];

  if ((rule.action_type === "send_email" || rule.action_type === "both") && context.email) {
    const campaignId = typeof rule.campaign_id === "string" ? rule.campaign_id : undefined;
    const templateId = campaign && typeof campaign.template_id === "string" ? campaign.template_id : undefined;
    const metadata = campaign?.metadata as Record<string, unknown> | undefined;
    const subject = metadata && typeof metadata.subject === "string" ? metadata.subject : "Update from Parent Helper";
    const htmlContent = metadata && typeof metadata.html_content === "string" ? metadata.html_content : "";
    const textContent = metadata && typeof metadata.text_content === "string" ? metadata.text_content : undefined;

    actions.push(
      queueEmail({
        userId: context.userId,
        email: context.email,
        campaignId,
        templateId,
        subject,
        htmlContent,
        textContent,
        variables,
      })
    );
  }

  if ((rule.action_type === "send_sms" || rule.action_type === "both") && context.phone) {
    const campaignId = typeof rule.campaign_id === "string" ? rule.campaign_id : undefined;
    const metadata = campaign?.metadata as Record<string, unknown> | undefined;
    const message = metadata && typeof metadata.sms_message === "string" ? metadata.sms_message : "Hello from Parent Helper!";
    
    actions.push(
      queueSMS({
        userId: context.userId,
        phone: context.phone,
        campaignId,
        message: replaceTemplateVariables(message, variables),
      })
    );
  }

  if (actions.length > 0) {
    await Promise.all(actions);
  }
}

/**
 * Queue email for sending
 * PERF: Optimized variable replacement
 */
export async function queueEmail(params: {
  userId: string;
  email: string;
  campaignId?: string;
  templateId?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: Record<string, unknown>;
  scheduledFor?: Date;
}): Promise<void> {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) return;

  try {
    const supabase = getSupabaseServer();
    if (!supabase) return;

    const vars = params.variables || {};

    await supabase.from("email_queue").insert({
      user_id: params.userId,
      email: params.email,
      campaign_id: params.campaignId,
      template_id: params.templateId,
      subject: replaceTemplateVariables(params.subject, vars),
      html_content: replaceTemplateVariables(params.htmlContent, vars),
      text_content: params.textContent ? replaceTemplateVariables(params.textContent, vars) : null,
      variables: vars,
      scheduled_for: params.scheduledFor?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error("[queueEmail] Error:", error);
  }
}

/**
 * Queue SMS for sending
 */
export async function queueSMS(params: {
  userId: string;
  phone: string;
  campaignId?: string;
  message: string;
  scheduledFor?: Date;
}): Promise<void> {
  if (!hasSupabaseServerEnv() || !isMarketingAutomationEnabled()) return;

  try {
    const supabase = getSupabaseServer();
    if (!supabase) return;

    await supabase.from("sms_queue").insert({
      user_id: params.userId,
      phone: params.phone,
      campaign_id: params.campaignId,
      message: params.message,
      scheduled_for: params.scheduledFor?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    console.error("[queueSMS] Error:", error);
  }
}

/**
 * Build template variables from context
 * PERF: Optimized to use context data first, only query DB when needed
 */
async function buildTemplateVariables(
  context: AutomationContext
): Promise<Record<string, unknown>> {
  const variables: Record<string, unknown> = {
    first_name: context.firstName || "there",
    wallet_balance: formatCurrency(context.walletBalance || 0),
    local_city: context.localCity || "your area",
  };

  // PERF: Only fetch additional data if not provided in context
  const supabase = getSupabaseServer();
  if (!supabase || !context.userId) return variables;

  // PERF: Batch queries in parallel only if data is missing
  const queries: Promise<void>[] = [];

  // Get wallet balance if not provided
  if (context.walletBalance === undefined) {
    queries.push(
      (async () => {
        try {
          const walletId = await getUserWallet(context.userId);
          if (!walletId) return;

          const { data: transactions } = await supabase
            .from("wallet_transactions")
            .select("type, amount_cents")
            .eq("wallet_id", walletId);

          if (transactions) {
            const balance = transactions.reduce(
              (sum: number, t: { type?: string | null; amount_cents?: number | null }) => {
                if (t.type === "credit" || t.type === "bonus") return sum + (t.amount_cents || 0);
                return sum - (t.amount_cents || 0);
              },
              0
            );
            variables.wallet_balance = formatCurrency(balance);
          }
        } catch {
          // Ignore errors
        }
      })()
    );
  }

  // Get user's town/city if not provided
  if (!context.localCity && context.email) {
    queries.push(
      (async () => {
        try {
          const { data: bookings } = await supabase
            .from("simple_bookings")
            .select("classes(town)")
            .eq("email", context.email || "")
            .limit(1);

          if (bookings?.[0]?.classes?.town) {
            variables.local_city = bookings[0].classes.town;
          }
        } catch {
          // Ignore errors
        }
      })()
    );
  }

  // PERF: Execute all queries in parallel
  if (queries.length > 0) {
    await Promise.all(queries);
  }

  return variables;
}

/**
 * Replace Handlebars-style template variables
 * PERF: Optimized with compiled regex and reduced iterations
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, unknown>
): string {
  if (!template) return "";
  
  let result = template;
  
  // PERF: Single pass replacement for all variables
  for (const [key, value] of Object.entries(variables)) {
    if (result.includes(`{{${key}}}`)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, String(value ?? ""));
    }
  }
  
  return result;
}

/**
 * Format currency (pence to pounds)
 * PERF: Optimized with cached formatter
 */
const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/**
 * Helper functions to fetch data
 * PERF: Optimized with minimal selects
 */
async function getLastActivityDate(userId: string): Promise<string | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("user_activity_log")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.created_at || null;
}

async function getReferralDate(userId: string): Promise<string | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("referrals")
    .select("created_at")
    .eq("referrer_id", userId)
    .is("converted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.created_at || null;
}

async function getLastSavedSearchDate(userId: string): Promise<string | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("saved_searches")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.created_at || null;
}

// PERF: Cache wallet ID to avoid repeated queries
const walletCache = new Map<string, { id: string | null; timestamp: number }>();
const WALLET_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getUserWallet(userId: string): Promise<string | null> {
  const now = Date.now();
  const cached = walletCache.get(userId);

  if (cached && now - cached.timestamp < WALLET_CACHE_TTL) {
    return cached.id;
  }

  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("family_wallets")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  const walletId = data?.id || null;
  walletCache.set(userId, { id: walletId, timestamp: now });

  return walletId;
}

/**
 * PERF: Clear all caches (useful for testing or manual refresh)
 */
export function clearMarketingCaches(): void {
  rulesCache = null;
  walletCache.clear();
}
