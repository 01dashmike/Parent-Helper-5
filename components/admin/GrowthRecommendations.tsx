"use client";

import { useState, useCallback, useEffect } from "react";

interface GrowthRecommendation {
  title: string;
  description: string;
  actionType: "add_classes" | "feature_location" | "optimize_schedule" | "improve_listing" | "expand_coverage";
  actionData?: {
    dayOfWeek?: string;
    location?: string;
    postcode?: string;
    category?: string;
  };
  priority: number;
  expectedImpact: string;
}

interface Props {
  initialRecommendations?: GrowthRecommendation[];
}

export default function GrowthRecommendations({ initialRecommendations = [] }: Props) {
  const [recommendations, setRecommendations] = useState<GrowthRecommendation[]>(initialRecommendations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/growth-recommendations");
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load recommendations";
      setError(errorMessage);
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialRecommendations.length === 0) {
      fetchRecommendations();
    }
  }, [initialRecommendations.length, fetchRecommendations]);

  const handleAction = async (recommendation: GrowthRecommendation) => {
    // Handle different action types
    switch (recommendation.actionType) {
      case "add_classes":
        // Navigate to class creation with pre-filled day
        window.location.href = `/provider/classes/new?day=${recommendation.actionData?.dayOfWeek || ""}`;
        break;
      case "feature_location":
        // Navigate to featured listings with location filter
        window.location.href = `/admin/featured?location=${encodeURIComponent(recommendation.actionData?.location || "")}`;
        break;
      case "optimize_schedule":
        // Navigate to class management
        window.location.href = `/provider/classes`;
        break;
      case "improve_listing":
        // Navigate to class management
        window.location.href = `/provider/classes`;
        break;
      case "expand_coverage":
        // Navigate to provider onboarding
        window.location.href = `/providers/register`;
        break;
      default:
        console.log("Action:", recommendation.actionType, recommendation.actionData);
    }
  };

  const getActionButtonText = (actionType: string): string => {
    switch (actionType) {
      case "add_classes":
        return "Add Classes";
      case "feature_location":
        return "View Featured Listings";
      case "optimize_schedule":
        return "Manage Classes";
      case "improve_listing":
        return "Edit Listings";
      case "expand_coverage":
        return "Expand Coverage";
      default:
        return "Take Action";
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact.toLowerCase()) {
      case "high":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        <p>No recommendations available. Click refresh to generate new insights.</p>
        <button
          onClick={fetchRecommendations}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Generate Recommendations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title font-semibold text-charcoal">AI Growth Recommendations</h2>
          <p className="text-small text-slateSoft mt-1">
            Actionable insights powered by AI analysis of your platform data
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-small text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {recommendations.map((rec: GrowthRecommendation, idx: number) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-small font-semibold text-gray-500">#{rec.priority}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-small font-medium border ${getImpactColor(rec.expectedImpact)}`}
                  >
                    {rec.expectedImpact} Impact
                  </span>
                </div>
                <h3 className="text-title font-semibold text-charcoal mb-2">{rec.title}</h3>
                <p className="text-small text-gray-600 mb-4">{rec.description}</p>
              </div>
            </div>

            <button
              onClick={() => handleAction(rec)}
              className="w-full rounded bg-blue-600 px-4 py-2 text-small font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {getActionButtonText(rec.actionType)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

