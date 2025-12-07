/**
 * AI Recommendations for Provider Analytics
 * Uses OpenAI if available, otherwise fallback rules
 */

import { calculateGrowthScore, type GrowthScoreFactors } from "./providerGrowthScore";

export interface AIRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
  category: "bookings" | "revenue" | "engagement" | "quality" | "growth";
}

/**
 * Get AI-powered recommendations
 */
export async function getAIRecommendations(
  factors: GrowthScoreFactors,
  providerId: number
): Promise<AIRecommendation[]> {
  // Try OpenAI first if available
  if (process.env.OPENAI_API_KEY) {
    try {
      return await getOpenAIRecommendations(factors, providerId);
    } catch (error) {
      console.error("OpenAI recommendation error:", error);
      // Fall through to fallback
    }
  }
  
  // Fallback to rule-based recommendations
  return getFallbackRecommendations(factors);
}

/**
 * Get recommendations from OpenAI
 */
async function getOpenAIRecommendations(
  factors: GrowthScoreFactors,
  providerId: number
): Promise<AIRecommendation[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a business growth advisor for class providers. Analyze the following metrics and provide 3 actionable recommendations. Be specific and practical.`,
        },
        {
          role: "user",
          content: `Provider metrics:
- Bookings: ${factors.bookings}
- Revenue: £${factors.revenue}
- Reviews: ${factors.reviews}
- Average Rating: ${factors.averageRating}/5
- Listings: ${factors.listings}
- Response Time: ${factors.responseTime} hours
- Conversion Rate: ${factors.conversionRate}%
- Repeat Bookings: ${factors.repeatBookings}
For context, the internal provider ID is ${providerId}.

Provide 3 specific, actionable recommendations in JSON format:
[
  {
    "title": "Recommendation title",
    "description": "Detailed explanation",
    "priority": "high|medium|low",
    "category": "bookings|revenue|engagement|quality|growth"
  }
]`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI API error");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content from OpenAI");
  }

  // Parse JSON from response
  try {
    const recommendations = JSON.parse(content);
    return Array.isArray(recommendations) ? recommendations.slice(0, 3) : [];
  } catch {
    // If parsing fails, fall back to rule-based
    return getFallbackRecommendations(factors);
  }
}

/**
 * Fallback rule-based recommendations
 */
function getFallbackRecommendations(
  factors: GrowthScoreFactors,
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  const growthScore = calculateGrowthScore(factors);
  
  // Use next best actions from growth score
  growthScore.nextBestActions.forEach((action) => {
    let category: AIRecommendation["category"] = "growth";
    let priority: AIRecommendation["priority"] = "medium";
    
    if (action.includes("bookings") || action.includes("visibility")) {
      category = "bookings";
      priority = "high";
    } else if (action.includes("revenue") || action.includes("pricing")) {
      category = "revenue";
      priority = "high";
    } else if (action.includes("review") || action.includes("engagement")) {
      category = "engagement";
      priority = "medium";
    } else if (action.includes("response") || action.includes("optimize")) {
      category = "quality";
      priority = "high";
    }
    
    recommendations.push({
      title: action,
      description: getRecommendationDescription(action, factors),
      priority,
      category,
    });
  });
  
  return recommendations;
}

/**
 * Get detailed description for a recommendation
 */
function getRecommendationDescription(
  action: string,
  _factors: GrowthScoreFactors,
): string {
  if (action.includes("Boost")) {
    return "Featured listings get 3x more views. Consider upgrading to increase visibility.";
  } else if (action.includes("Add more class times")) {
    return "More availability means more booking opportunities. Add evening or weekend slots.";
  } else if (action.includes("package deals")) {
    return "Offering multi-class packages can increase average booking value by 30%.";
  } else if (action.includes("pricing")) {
    return "Review competitor pricing in your area. You might be priced too high or too low.";
  } else if (action.includes("reviews")) {
    return "Reviews build trust. Send a follow-up email after classes asking for feedback.";
  } else if (action.includes("response time")) {
    return "Quick responses show professionalism. Set up email notifications for new inquiries.";
  } else if (action.includes("descriptions")) {
    return "Clear, detailed descriptions with good photos convert 2x better than basic listings.";
  } else {
    return "This action will help improve your overall performance and grow your business.";
  }
}

