"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
// Experiment actions - create if needed
// import { toggleExperimentAction } from "@/app/admin/insights/actions";

async function toggleExperimentAction(_prevState: { status: "idle" | "success" | "error"; enabled?: boolean; message?: string }, _formData: FormData): Promise<{ status: "idle" | "success" | "error"; enabled?: boolean; message?: string }> {
  return { status: "idle" };
}

type ExperimentStats = {
  variantA: {
    assignments: number;
    clicks: number;
    ctr: number;
  };
  variantB: {
    assignments: number;
    clicks: number;
    ctr: number;
  };
  delta: number;
};

export default function ExperimentControls() {
  const EXPERIMENTS_ENABLED = process.env.NEXT_PUBLIC_EXPERIMENTS_ENABLED === "true";
  const [enabled, setEnabled] = useState(EXPERIMENTS_ENABLED);
  const [stats, setStats] = useState<ExperimentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggleState, toggleAction] = useFormState<{ status: "idle" | "success" | "error"; enabled?: boolean; message?: string }, FormData | undefined>(toggleExperimentAction, {
    status: "idle" as const,
  });

  useEffect(() => {
    if (toggleState.status === "success") {
      setEnabled(toggleState.enabled ?? enabled);
    }
  }, [toggleState, enabled]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/experiment-stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch experiment stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (enabled) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [enabled]);

  if (!EXPERIMENTS_ENABLED && !enabled) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-sage/20 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-title font-semibold text-charcoal">Hero Copy A/B Test</h2>
          <p className="text-small text-slateSoft mt-1">
            Test shorter copy and CTA placement variations
          </p>
        </div>
        <form action={toggleAction}>
          <button
            type="submit"
            className={`rounded-lg px-4 py-2 text-small font-semibold transition ${
              enabled
                ? "bg-sage text-white hover:bg-sage/90"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>
        </form>
      </div>

      {toggleState.status === "error" && (
        <p className="text-small text-terracotta mb-4">{toggleState.message}</p>
      )}

      {enabled && (
        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-small text-slateSoft">Loading stats...</p>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-sage/20 bg-cream/40 p-section">
                  <h3 className="text-small font-semibold text-charcoal mb-small">Variant A (Control)</h3>
                  <div className="space-y-1 text-small">
                    <p className="text-slateSoft">
                      Assignments: <span className="font-semibold text-charcoal">{stats.variantA.assignments}</span>
                    </p>
                    <p className="text-slateSoft">
                      Clicks: <span className="font-semibold text-charcoal">{stats.variantA.clicks}</span>
                    </p>
                    <p className="text-slateSoft">
                      CTR: <span className="font-semibold text-charcoal">{stats.variantA.ctr.toFixed(2)}%</span>
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-sage/20 bg-cream/40 p-section">
                  <h3 className="text-small font-semibold text-charcoal mb-small">Variant B (Test)</h3>
                  <div className="space-y-1 text-small">
                    <p className="text-slateSoft">
                      Assignments: <span className="font-semibold text-charcoal">{stats.variantB.assignments}</span>
                    </p>
                    <p className="text-slateSoft">
                      Clicks: <span className="font-semibold text-charcoal">{stats.variantB.clicks}</span>
                    </p>
                    <p className="text-slateSoft">
                      CTR: <span className="font-semibold text-charcoal">{stats.variantB.ctr.toFixed(2)}%</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-sage/30 bg-sage/5 p-section">
                <h3 className="text-small font-semibold text-charcoal mb-small">CTR Delta</h3>
                <p className={`text-title font-bold ${stats.delta > 0 ? "text-sage" : stats.delta < 0 ? "text-terracotta" : "text-charcoal"}`}>
                  {stats.delta > 0 ? "+" : ""}{stats.delta.toFixed(2)}%
                </p>
                <p className="text-small text-slateSoft mt-1">
                  {stats.delta > 0
                    ? "Variant B is performing better"
                    : stats.delta < 0
                      ? "Variant A is performing better"
                      : "No significant difference"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-small text-slateSoft">No data available yet</p>
          )}
        </div>
      )}
    </section>
  );
}

