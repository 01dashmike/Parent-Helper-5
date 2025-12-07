"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { Modal } from "@/components/ui/modal";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

type SaveSearchPromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  town?: string;
  onSuccess?: () => void;
};

export function SaveSearchPrompt({
  open,
  onOpenChange,
  town,
  onSuccess,
}: SaveSearchPromptProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setAnnouncement('Submitting…');

    try {
      // Build search params from current URL
      const searchParams = new URLSearchParams();
      
      if (typeof window !== "undefined") {
        try {
          const currentUrl = window.location.href;
          const url = new URL(currentUrl);
          if (url.searchParams.get("q")) searchParams.set("q", url.searchParams.get("q")!);
          if (url.searchParams.get("town")) searchParams.set("town", url.searchParams.get("town")!);
          if (url.searchParams.get("age")) searchParams.set("age", url.searchParams.get("age")!);
          if (url.searchParams.get("category")) searchParams.set("category", url.searchParams.get("category")!);
        } catch (urlError) {
          // Fallback if URL parsing fails
          console.warn("[SaveSearchPrompt] Failed to parse URL:", urlError);
        }
      }
      
      // Add town from prop if not already in params
      if (town && !searchParams.has("town")) {
        searchParams.set("town", town);
      }

      const searchString = searchParams.toString();
      const nextUrl = `/onboarding/child${searchString ? `?search=${encodeURIComponent(searchString)}` : ""}${town && !searchParams.has("town") ? `${searchString ? "&" : "?"}town=${encodeURIComponent(town)}` : ""}`;

      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          next: nextUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      setSuccess(true);
      setAnnouncement('Saved');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 2000);
      }
    } catch (err: unknown) {
      console.error("[SaveSearchPrompt] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      setAnnouncement('Error saving changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const townDisplay = town || "your area";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Want to save this alert?"
      description={`Sign in to get alerts when new classes appear near ${townDisplay}.`}
      size="md"
    >
      {success ? (
            <div className="rounded-card border border-sage/40 bg-sage/10 p-4 text-center">
              <p className="text-sage font-medium">
                ✨ Magic link sent! Check your email to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting ? "true" : "false"}>
              <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
                {announcement}
              </VisuallyHidden>
              <div>
                <label
                  htmlFor="save-search-email"
                  className="block text-small font-medium text-charcoal mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail size={iconSize.md} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" aria-hidden="true" />
                  <input
                    id="save-search-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-card border border-sage/30 bg-white pl-10 pr-4 py-2 text-small text-charcoal placeholder:text-charcoal/40 focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div role="alert">
                  <div className="rounded-card border border-terracotta/40 bg-terracotta/10 p-3 text-small text-terracotta">
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full rounded-card bg-sage px-4 py-2 font-semibold text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                aria-busy={isSubmitting ? "true" : "false"}
              >
                {isSubmitting ? (
                  <span role="status" aria-live="polite" className="inline-flex items-center">
                    <Loader2 size={iconSize.sm} className="mr-2 inline" aria-hidden="true" />
                    <span>Sending...</span>
                    <VisuallyHidden>Sending magic link...</VisuallyHidden>
                  </span>
                ) : (
                  "✨ Send me a magic link to save & get alerts"
                )}
              </button>

              <p className="text-small text-charcoal/60 text-center">
                We&apos;ll send you a secure link to sign in. No password needed!
              </p>
            </form>
          )}
    </Modal>
  );
}

