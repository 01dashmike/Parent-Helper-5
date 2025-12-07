"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { rewriteClassContent } from "./actions";

type AIContentSuggestionProps = {
  currentTitle: string;
  currentSummary: string | null;
  onApply: (title: string, summary: string) => void;
};

export function AIContentSuggestion({
  currentTitle,
  currentSummary,
  onApply,
}: AIContentSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    title: string;
    summary: string;
    improvements: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestion = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await rewriteClassContent(currentTitle, currentSummary);
      if (result.success) {
        setSuggestion(result.suggestion);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI suggestion");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion.title, suggestion.summary);
      setSuggestion(null);
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setError(null);
  };

  return (
    <div className="space-y-3 rounded-lg border border-sage/30 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sage" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-charcoal">AI Content Improvement</h4>
        </div>
        {!suggestion && (
          <button
            type="button"
            onClick={handleGetSuggestion}
            disabled={loading}
            aria-busy={loading ? "true" : "false"}
            className="inline-flex items-center gap-2 rounded-md border border-sage/40 bg-white px-3 py-1.5 text-sm font-medium text-forest transition hover:bg-sage/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Get AI suggestions for improving class content"
          >
            {loading ? (
              <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>Analyzing...</span>
                <span className="sr-only">Analyzing class content with AI...</span>
              </span>
            ) : (
              <>
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Improve with AI
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="space-y-3 rounded-md border border-sage/40 bg-cream/30 p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-charcoal/70 opacity-80 mb-1">Improved Title:</p>
                <p className="text-sm font-medium text-charcoal">{suggestion.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal/70 opacity-80 mb-1">Improved Description:</p>
                <p className="text-sm text-charcoal/80">{suggestion.summary}</p>
              </div>
              {suggestion.improvements.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-charcoal/70 opacity-80 mb-1">Improvements:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-sm text-charcoal/70 opacity-80">
                    {suggestion.improvements.map((improvement, idx) => (
                      <li key={idx}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="ml-2 text-slateSoft hover:text-charcoal transition"
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 rounded-md bg-sage px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sage/90"
              aria-label="Apply AI suggestions"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              Apply AI suggestion
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md border border-sage/40 bg-white px-3 py-1.5 text-sm font-medium text-charcoal transition hover:bg-cream"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

