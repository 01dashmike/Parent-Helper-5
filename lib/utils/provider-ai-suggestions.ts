/**
 * AI-powered "Next Best Action" suggestions for providers
 */

// TODO: Confirm external usage of this export before removing (lib/utils cleanup)
export interface ProviderMetrics {
  views: number;
  bookings: number;
  conversions: number;
  reviews: number;
  profile_completion: number;
  review_average: number;
  growth_score: number;
}

/**
 * OpenAI API response structure
 */
interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

/**
 * Generate next best action suggestion using OpenAI
 * @param metrics - Provider metrics
 * @param providerName - Optional provider name
 * @returns Suggestion string
 */
export async function generateNextBestAction(
  metrics: ProviderMetrics,
  providerName?: string
): Promise<string> {
  const openaiKey = process.env["OPENAI_API_KEY"];

  if (!openaiKey) {
    // Fallback to rule-based suggestions
    return generateRuleBasedSuggestion(metrics);
  }

  try {
    const prompt = `You are a growth advisor for Parent Helper, a UK baby and toddler class booking platform.

Provider: ${providerName || "A provider"}
Current Metrics:
- Profile completeness: ${metrics.profile_completion}%
- Views this week: ${metrics.views}
- Bookings this week: ${metrics.bookings}
- Conversion rate: ${metrics.conversions > 0 && metrics.views > 0 ? ((metrics.conversions / metrics.views) * 100).toFixed(1) : 0}%
- Average review rating: ${metrics.review_average.toFixed(1)}/5
- Growth score: ${metrics.growth_score.toFixed(1)}/100

Provide ONE actionable, specific suggestion (1-2 sentences) to help this provider improve their performance. Focus on the biggest opportunity. Be concise and actionable.

Examples:
- "Add evening slots — families book most after 6pm"
- "Complete your profile — providers with photos get 3x more bookings"
- "Respond to reviews — engaged providers see 40% more conversions"

Suggestion:`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful growth advisor providing actionable, specific suggestions for business improvement.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = (await response.json()) as OpenAIResponse;
    const suggestion = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (suggestion) {
      return suggestion;
    }
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
  }

  // Fallback to rule-based
  return generateRuleBasedSuggestion(metrics);
}

/**
 * Rule-based fallback suggestion generator
 * @param metrics - Provider metrics
 * @returns Suggestion string
 */
function generateRuleBasedSuggestion(metrics: ProviderMetrics): string {
  // Profile completeness is low
  if (metrics.profile_completion < 60) {
    return "Complete your profile — providers with photos and full details get 3x more bookings";
  }

  // Low conversion rate
  if (metrics.views > 0 && metrics.conversions / metrics.views < 0.05) {
    return "Improve your class descriptions and add photos — clear information increases bookings by 40%";
  }

  // Low review count
  if (metrics.reviews < 3) {
    return "Ask satisfied families for reviews — providers with 5+ reviews see 2x more bookings";
  }

  // Low review average
  if (metrics.review_average < 4.0 && metrics.reviews > 0) {
    return "Respond to reviews and address feedback — engaged providers see higher conversion rates";
  }

  // Low views
  if (metrics.views < 10) {
    return "Add more class times and locations — variety increases visibility in search results";
  }

  // Good metrics - suggest growth
  if (metrics.growth_score >= 70) {
    return "Consider adding evening or weekend slots — families book most outside work hours";
  }

  // Default
  return "Focus on completing your profile and adding class photos to increase visibility";
}

