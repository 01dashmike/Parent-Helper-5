/**
 * Unified AI Client
 * 
 * Single entry point for all AI operations with observability and safety
 * Supports OpenAI-compatible APIs (OpenAI, OpenRouter, etc.)
 */

import type { AIRequest, AIResponse, AIModel, ChatMessage } from "./types";

/**
 * AI Observability Wrapper
 */
async function withAiLogging<T>(
  meta: {
    useCase: string;
    model: string;
    userId?: string | null;
    context?: Record<string, unknown>;
  },
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const useCase = meta.useCase;
  const model = meta.model;

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === "development") {
      console.log(`[AI] ${useCase} (${model}) - Success in ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[AI] ${useCase} (${model}) - Failed in ${duration}ms: ${errorMessage}`);

    throw error;
  }
}

/**
 * Get AI configuration from environment
 */
function getAIConfig() {
  const model = (process.env.AI_MODEL as AIModel) || "gpt-4o-mini";
  const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    throw new Error("AI_PROVIDER_API_KEY or OPENAI_API_KEY must be set");
  }

  return {
    model,
    apiKey,
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "2000", 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  };
}

/**
 * Unified AI Call Function
 * 
 * Single entry point for all AI operations with observability and safety
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const config = getAIConfig();
  const {
    model: requestedModel,
    systemPrompt,
    userPrompt,
    messages: providedMessages,
    maxTokens: requestedMaxTokens,
    temperature: requestedTemperature,
    metadata,
  } = request;

  // Use requested model or fallback to config
  const model = requestedModel || config.model;
  const maxTokens = requestedMaxTokens || config.maxTokens;
  const temperature = requestedTemperature ?? config.temperature;

  // Safety: Truncate extremely long prompts
  const MAX_PROMPT_LENGTH = 50000;
  const safeUserPrompt = userPrompt.length > MAX_PROMPT_LENGTH
    ? userPrompt.substring(0, MAX_PROMPT_LENGTH) + "\n\n[Prompt truncated for safety]"
    : userPrompt;

  // Build messages array
  let messages: ChatMessage[];
  if (providedMessages) {
    messages = providedMessages;
  } else {
    messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: safeUserPrompt });
  }

  const useCase = metadata?.useCase || "unknown";
  const userId = metadata?.userId ?? null;

  return withAiLogging(
    {
      useCase,
      model,
      userId,
      context: metadata?.context,
    },
    async () => {
      const baseUrl = config.baseUrl || "https://api.openai.com/v1";
      const url = `${baseUrl}/chat/completions`;

      type RequestBody = {
        model: string;
        messages: ChatMessage[];
        max_tokens: number;
        temperature: number;
      };

      const body: RequestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMessage = error.error?.message || JSON.stringify(error);
          
          return {
            success: false,
            error: `AI API error: ${errorMessage}`,
            raw: error,
          };
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "";

        if (!text) {
          return {
            success: false,
            error: "No text content returned from AI",
            raw: data,
          };
        }

        return {
          success: true,
          text,
          tokens: data.usage
            ? {
                prompt: data.usage.prompt_tokens,
                completion: data.usage.completion_tokens,
                total: data.usage.total_tokens,
              }
            : undefined,
          raw: data,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }
  );
}

/**
 * Helper: Call fast/cheap model
 */
export async function callFastModel(request: Omit<AIRequest, "model">): Promise<AIResponse> {
  return callAI({
    ...request,
    model: "gpt-4o-mini",
  });
}

/**
 * Helper: Call quality model
 */
export async function callQualityModel(request: Omit<AIRequest, "model">): Promise<AIResponse> {
  return callAI({
    ...request,
    model: "gpt-4o",
  });
}

/**
 * Legacy: callAIModel (deprecated, use callAI instead)
 * @deprecated Use callAI instead
 */
export async function callAIModel(options: {
  systemPrompt: string;
  userPrompt: string;
  schema?: Record<string, any>;
}): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const result = await callAI({
    model: "gpt-4o-mini",
    systemPrompt: options.systemPrompt,
    userPrompt: options.userPrompt,
    metadata: { useCase: "legacy-call" },
  });

  if (!result.success || !result.text) {
    throw new Error(result.error || "AI call failed");
  }

  // Handle schema parsing if provided
  let content = result.text;
  if (options.schema) {
    try {
      const parsed = JSON.parse(content);
      content = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch (e) {
      console.warn("Failed to parse AI response as JSON:", e);
    }
  }

  return {
    content,
    usage: result.tokens
      ? {
          promptTokens: result.tokens.prompt,
          completionTokens: result.tokens.completion,
          totalTokens: result.tokens.total,
        }
      : undefined,
  };
}

/**
 * Generate a hash for prompt deduplication
 */
export function hashPrompt(prompt: string): string {
  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
