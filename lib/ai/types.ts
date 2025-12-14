/**
 * Unified AI Types
 * 
 * Central type definitions for all AI operations
 */

export type AIModel = "gpt-4o-mini" | "gpt-4o" | "gpt-4-turbo" | "gpt-3.5-turbo";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIRequest = {
  model: AIModel;
  systemPrompt?: string;
  userPrompt: string;
  messages?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  metadata?: {
    useCase: string;
    userId?: string | null;
    providerId?: number;
    context?: Record<string, unknown>;
  };
};

export type AIResponse = {
  success: boolean;
  text?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  raw?: unknown;
  error?: string;
};







