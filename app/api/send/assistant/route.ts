import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { expensiveApiLimiter, applyRateLimit } from "@/lib/ratelimit";

// Input validation schema
const requestSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
});

// System prompt for the Parent Helper assistant
const SYSTEM_PROMPT = `You are a friendly assistant for Parent Helper, a UK-based platform that helps parents find baby and toddler classes and provides family wellness resources.

Your role is to:
- Help parents find classes and activities for their children (baby classes, toddler groups, swimming, music, sensory play, etc.)
- Provide guidance on family wellness, exercise, and healthy living
- Share practical nutrition tips for parents and children
- Explain how to use the Parent Helper website features
- Direct users to relevant pages on the website with links

Your personality:
- Warm and supportive like a well-educated British parent
- Practical and helpful, never condescending
- Encouraging and knowledgeable
- Keep responses concise but friendly (2-4 sentences typically)

Important guidelines:
- ALWAYS include relevant links when discussing features or sections of the website
- For medical concerns, gently suggest consulting their GP or health visitor
- Keep responses brief and actionable
- Reference UK-specific resources when relevant (NHS, BBC Good Food, etc.)

WEBSITE PAGES - Include these links in your responses when relevant:
- Classes & Activities: /classes - Search for local baby and toddler classes
- Explore Classes: /explore - Browse all available classes
- Health & Wellness Hub: /wellness - Main wellness section with all tools
- Meal Planner: /wellness/meal-planner - Personalised 7-day meal plans
- Exercise Plans: /wellness/exercise - Custom workout routines for parents
- Supplement Guide: /wellness/supplements - Evidence-based supplement suggestions
- Product Safety Checker: /wellness/product-safety - Scan barcodes to check product safety
- Blog: /blog - Parenting tips, advice, and articles
- Newsletter: /newsletter - Subscribe for local class updates
- Contact: /contact - Get in touch with the team

When users ask about meal plans, nutrition, exercise, supplements, or wellness, ALWAYS include the relevant link.
Format links as markdown: [Link Text](/path)

Example responses:
- "Looking for meal ideas? Check out our [Meal Planner](/wellness/meal-planner) for personalised 7-day plans!"
- "You can find local baby classes using our [class search](/classes) - just enter your postcode!"
- "Our [Exercise Plans](/wellness/exercise) section has workouts designed specifically for busy parents."`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitError = await applyRateLimit(req, expensiveApiLimiter);
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { message } = validation.data;

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chat service is not configured" },
        { status: 503 }
      );
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ChatAssistant] OpenAI error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from assistant" },
        { status: 502 }
      );
    }

    const json = await response.json();
    const assistantMessage = json?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from assistant" },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error("[ChatAssistant] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

