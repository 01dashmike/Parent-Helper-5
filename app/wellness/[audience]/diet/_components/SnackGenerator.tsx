"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { generateSnackAlternatives } from "@/lib/wellness/actions";
import type { Audience, SnackGeneratorResult } from "@/lib/wellness/types";

interface SnackGeneratorProps {
  audience: Audience;
  onComplete: (result: SnackGeneratorResult) => void;
  result: SnackGeneratorResult | null;
}

export default function SnackGenerator({
  audience,
  onComplete,
  result,
}: SnackGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snacksInput, setSnacksInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const currentSnacks = snacksInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await generateSnackAlternatives({
        audience,
        currentSnacks,
      });

      if (response.success && response.data) {
        onComplete(response.data);
      } else {
        setError(response.error || "Failed to generate snack alternatives");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-soft">
          <h3 className="text-2xl font-semibold text-charcoal">
            Your Healthier Snack Alternatives
          </h3>
          <button
            onClick={() => onComplete(null as unknown as SnackGeneratorResult)}
            className="rounded-full bg-charcoal/10 px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/20"
            >
            ↻ Try Different Snacks
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {result.alternatives.map((alt, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-soft">
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2 text-lg">
                  <span className="text-2xl">❌</span>
                  <span className="font-medium text-charcoal/60 line-through">
                    {alt.unhealthySnack}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold text-sage">
                    {alt.healthyAlternative}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-charcoal/80">
                <div>
                  <span className="font-medium text-charcoal">Why better:</span>{" "}
                  {alt.reason}
                </div>
                <div>
                  <span className="font-medium text-charcoal">Taste:</span>{" "}
                  {alt.tasteProfile}
                </div>
                <div>
                  <span className="font-medium text-charcoal">Where to buy:</span>{" "}
                  {alt.where}
                </div>
              </div>
            </div>
          ))}
        </div>

        {result.generalTips && result.generalTips.length > 0 && (
          <div className="rounded-2xl bg-sage/10 p-6">
            <h4 className="mb-4 text-lg font-semibold text-charcoal">
              💡 General Snacking Tips
            </h4>
            <ul className="space-y-2 text-sm text-charcoal/80">
              {result.generalTips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-soft">
        <h3 className="mb-6 text-2xl font-semibold text-charcoal">
          Find Healthier Snack Alternatives
        </h3>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-charcoal">
            What snacks do you or your family love? (comma-separated)
          </label>
          <input
            type="text"
            value={snacksInput}
            onChange={(e) => setSnacksInput(e.target.value)}
            placeholder="e.g., crisps, chocolate bars, biscuits, cakes, sweets"
            className="w-full rounded-lg border border-sage/30 px-4 py-3 focus:border-sage focus:outline-none"
            required
          />
          <p className="mt-2 text-xs text-charcoal/60">
            Enter the snacks you currently eat that you'd like healthier alternatives for
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !snacksInput.trim()}
          className="w-full rounded-full bg-sage py-3 px-6 font-semibold text-white transition-all hover:bg-sage/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Finding alternatives...
            </>
          ) : (
            "🍪 Get Healthier Options"
          )}
        </button>

        <p className="mt-4 text-center text-xs text-charcoal/60">
          We'll suggest healthier alternatives that match the taste profiles you love
        </p>
      </form>
    </div>
  );
}
