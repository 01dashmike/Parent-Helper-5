"use client";

import { useMemo } from "react";
import { calculateSEOScore, type SEOScoreResult } from "@/lib/seo-score";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SEOScorePanelProps {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  heroImage?: string;
  bodyMarkdown?: string;
}

function getGradeColor(grade: SEOScoreResult["grade"]) {
  switch (grade) {
    case "A":
      return "text-green-600 bg-green-50 border-green-200";
    case "B":
      return "text-sage bg-sage/10 border-sage/30";
    case "C":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "D":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "F":
      return "text-red-600 bg-red-50 border-red-200";
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-sage";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export default function SEOScorePanel({
  title,
  excerpt,
  seoTitle,
  seoDescription,
  heroImage,
  bodyMarkdown,
}: SEOScorePanelProps) {
  const seoResult = useMemo(
    () =>
      calculateSEOScore({
        title,
        excerpt,
        seoTitle,
        seoDescription,
        heroImage,
        bodyMarkdown,
      }),
    [title, excerpt, seoTitle, seoDescription, heroImage, bodyMarkdown]
  );

  return (
    <div className="space-y-3">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-small font-semibold text-charcoal">SEO Score</h3>
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${getGradeColor(seoResult.grade)}`}
        >
          <span>{seoResult.score}</span>
          <span className="text-xs font-medium">/ 100</span>
          <span className="ml-1 text-xs">{seoResult.grade}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getScoreColor(seoResult.score)}`}
          style={{ width: `${seoResult.score}%` }}
        />
      </div>

      {/* Checks List */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {seoResult.checks.map((check) => (
          <div
            key={check.name}
            className="flex items-start gap-2 text-xs py-1"
          >
            {check.passed ? (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            ) : check.score > 0 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-charcoal">{check.name}:</span>{" "}
              <span className="text-slateSoft">{check.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



