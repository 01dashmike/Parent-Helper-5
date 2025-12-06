"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RebuildRecsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleRebuild() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/demo/rebuild-recs", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to rebuild recommendations");
      }

      setResult({
        success: true,
        message: `Rebuilt ${data.total} recommendations for ${data.results.length} families`,
      });

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRebuild}
        disabled={loading}
        variant="default"
        size="default"
      >
        {loading ? "Rebuilding..." : "Re-run AI Recommendations"}
      </Button>
      {result && (
        <p
          className={`text-small ${result.success ? "text-green-600" : "text-red-600"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

