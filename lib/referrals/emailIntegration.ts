import { getSupabaseServer } from "@/lib/supabase.server";
import { getABVariant, getReferralCTAText } from "./getABVariant";

/**
 * Generate referral section for weekly growth email
 */
export async function generateReferralEmailSection(providerId: number): Promise<{
  html: string;
  text: string;
  hasActivity: boolean;
  variant: "A" | "B";
}> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      html: "",
      text: "",
      hasActivity: false,
      variant: "A",
    };
  }

  // Get analytics
  const { data: analytics } = await supabase
    .from("provider_referral_analytics")
    .select("provider_id, clicks, registrations, listings_created, conversions, last_updated")
    .eq("provider_id", providerId)
    .maybeSingle();

  // Get recent rewards (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: recentRewards } = await supabase
    .from("provider_rewards")
    .select("id, provider_id, reward_type, reward_value, status, created_at")
    .eq("provider_id", providerId)
    .gte("created_at", weekAgo.toISOString())
    .limit(10); // Reasonable limit for recent rewards

  // Get referral code
  const { data: referral } = await supabase
    .from("provider_referrals")
    .select("referral_code")
    .eq("provider_id", providerId)
    .limit(1)
    .maybeSingle();

  const variant = getABVariant(providerId);
  const ctaText = getReferralCTAText(variant);
  const referralUrl = referral?.referral_code
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/ref/${referral.referral_code}`
    : null;

  const stats = analytics || {
    clicks: 0,
    registrations: 0,
    listings_created: 0,
    conversions: 0,
  };

  const hasActivity = stats.clicks > 0;
  const hasRewards = recentRewards && recentRewards.length > 0;

  let html = "";
  let text = "";

  // Celebration banner for rewards
  if (hasRewards) {
    const rewardText = recentRewards!
      .map((r) => {
        if (r.reward_type === "free_boost") {
          return `${r.reward_value} free boost${r.reward_value > 1 ? "s" : ""}`;
        } else if (r.reward_type === "credit") {
          return `£${(r.reward_value / 100).toFixed(2)} credit`;
        }
        return "reward";
      })
      .join(", ");

    html += `
      <div style="background: linear-gradient(135deg, #9CAF88 0%, #7A9A6A 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; color: white;">
        <h3 style="margin: 0 0 10px 0; font-size: 20px;">🎉 You earned a reward!</h3>
        <p style="margin: 0; font-size: 16px;">${rewardText}</p>
      </div>
    `;
    text += `🎉 You earned a reward! ${rewardText}\n\n`;
  }

  // Referral stats section
  if (hasActivity) {
    html += `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px;">Your Referral Performance</h3>
        <p style="margin: 0 0 15px 0;">Your referral link was clicked <strong>${stats.clicks}</strong> times this week.</p>
    `;
    text += `Your Referral Performance\nYour referral link was clicked ${stats.clicks} times this week.\n`;

    if (stats.conversions === 0 && stats.clicks > 0) {
      html += `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;"><strong>💡 Tip:</strong> Try sharing your link in local Facebook groups. Providers see 2–4 new leads after posting.</p>
        </div>
      `;
      text += "💡 Tip: Try sharing your link in local Facebook groups. Providers see 2–4 new leads after posting.\n";
    }

    html += `</div>`;
  } else {
    html += `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px;">Start Earning Rewards</h3>
        <p style="margin: 0 0 15px 0;">You haven't shared your referral link yet. Earn free boosts by inviting local class providers.</p>
    `;
    text += `Start Earning Rewards\nYou haven't shared your referral link yet. Earn free boosts by inviting local class providers.\n`;
  }

  // CTA button
  if (referralUrl) {
    html += `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${referralUrl}" style="display: inline-block; background: #9CAF88; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          ${ctaText}
        </a>
      </div>
    `;
    text += `\n${ctaText}\n${referralUrl}\n`;
  }

  if (!hasActivity) {
    html += `</div>`;
  }

  return {
    html,
    text,
    hasActivity,
    variant,
  };
}

/**
 * Record email test event
 */
export async function recordEmailTest(
  providerId: number,
  emailType: string,
  variant: "A" | "B",
  event: "sent" | "opened" | "clicked" | "converted",
  metadata?: Record<string, unknown>
) {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  const updateData: Record<string, unknown> = {
    [`${event}_at`]: new Date().toISOString(),
  };

  if (metadata) {
    updateData.metadata = metadata;
  }

  // Find or create test record
  const { data: existing } = await supabase
    .from("provider_email_tests")
    .select("id")
    .eq("provider_id", providerId)
    .eq("email_type", emailType)
    .eq("variant", variant)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("provider_email_tests")
      .update(updateData)
      .eq("id", existing.id);
  } else if (event === "sent") {
    await supabase.from("provider_email_tests").insert({
      provider_id: providerId,
      email_type: emailType,
      variant,
      sent_at: new Date().toISOString(),
      metadata: metadata || {},
    });
  }
}

