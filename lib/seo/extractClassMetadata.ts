/**
 * Extract SEO metadata from class description using OpenAI GPT
 * Returns meta_title, meta_description, and keywords array
 */

type ClassMetadata = {
  meta_title: string;
  meta_description: string;
  keywords: string[];
};

export async function extractClassMetadata(
  description: string,
  className?: string,
  category?: string,
  town?: string
): Promise<ClassMetadata> {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";

  const prompt = `Extract SEO metadata from this class description for a UK parent and child activity directory.

Class Name: ${className || "Not provided"}
Category: ${category || "Not provided"}
Location: ${town || "Not provided"}
Description: ${description}

Generate:
1. meta_title: A compelling SEO title (50-60 characters) that includes the class name and location if available
2. meta_description: A concise meta description (150-160 characters) that summarizes the class and encourages clicks
3. keywords: An array of 5-10 relevant keywords (e.g., ["baby classes", "toddler activities", "sensory play", "music groups", "Southampton"])

Return ONLY valid JSON in this format:
{
  "meta_title": "string",
  "meta_description": "string",
  "keywords": ["keyword1", "keyword2", ...]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["OPENAI_API_KEY"]}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert specializing in UK parent and child activity directories. Generate concise, compelling metadata that helps parents find relevant classes.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent SEO output
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  try {
    const parsed = JSON.parse(content);
    
    // Validate and normalize the response
    return {
      meta_title: String(parsed.meta_title || className || "Class").slice(0, 60),
      meta_description: String(parsed.meta_description || description.slice(0, 160)).slice(0, 160),
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.slice(0, 10).map((k: unknown) => String(k))
        : [],
    };
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}

