"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Check, ArrowRight } from "lucide-react";
import { aiGenerateSeoSuggestions } from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";
import { Badge } from "@/components/ui/badge";

type SeoAssistantProps = {
  currentTitle?: string;
  currentDescription?: string;
  category?: string;
  city?: string;
  ageRange?: string;
  onApply?: (data: {
    seoTitle?: string;
    seoH1?: string;
    metaDescription?: string;
    improvedDescription?: string;
    suggestedTags?: string[];
  }) => void;
};

export default function SeoAssistant({
  currentTitle,
  currentDescription,
  category,
  city,
  ageRange,
  onApply,
}: SeoAssistantProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  type SeoResult = {
    seoTitle?: string;
    seoH1?: string;
    metaDescription?: string;
    improvedDescription?: string;
    suggestedTags?: string[];
    cityHooks?: string[];
  };
  const [result, setResult] = useState<SeoResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (currentTitle) formData.append("currentTitle", currentTitle);
      if (currentDescription) formData.append("currentDescription", currentDescription);
      if (category) formData.append("category", category);
      if (city) formData.append("city", city);
      if (ageRange) formData.append("ageRange", ageRange);

      const response = await aiGenerateSeoSuggestions(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setResult(response.data);
      showSuccess("SEO suggestions generated!");
    } catch {
      showError("Failed to generate SEO suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-sage" />
          <CardTitle>AI SEO Optimiser</CardTitle>
        </div>
        <p className="text-sm text-slateSoft mt-2">
          Optimize your listing for search engines with AI-powered suggestions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(currentTitle || currentDescription) && (
          <div className="rounded-lg border border-sage/20 bg-cream/30 p-4">
            <Label className="text-sm font-semibold mb-2 block">Current Content</Label>
            {currentTitle && (
              <div className="mb-2">
                <Label className="text-xs">Title:</Label>
                <p className="text-sm">{currentTitle}</p>
              </div>
            )}
            {currentDescription && (
              <div>
                <Label className="text-xs">Description:</Label>
                <p className="text-sm line-clamp-3">{currentDescription}</p>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating SEO Suggestions...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Generate SEO Suggestions
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            {/* SEO Title */}
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-start justify-between mb-2">
                <Label className="text-sm font-semibold">SEO Title</Label>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApply({ seoTitle: result?.seoTitle })}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Apply
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm flex-1">{result?.seoTitle}</p>
                <Badge variant={(result?.seoTitle?.length ?? 0) <= 60 ? "success" : "warning"}>
                  {result?.seoTitle?.length ?? 0} chars
                </Badge>
              </div>
            </div>

            {/* SEO H1 */}
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-start justify-between mb-2">
                <Label className="text-sm font-semibold">SEO H1</Label>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApply({ seoH1: result.seoH1 })}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Apply
                  </Button>
                )}
              </div>
              <p className="text-sm">{result.seoH1}</p>
            </div>

            {/* Meta Description */}
            <div className="rounded-lg border border-sage/20 bg-white p-4">
              <div className="flex items-start justify-between mb-2">
                <Label className="text-sm font-semibold">Meta Description</Label>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApply({ metaDescription: result?.metaDescription })}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Apply
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm flex-1">{result?.metaDescription}</p>
                <Badge variant={(result?.metaDescription?.length ?? 0) <= 160 ? "success" : "warning"}>
                  {result?.metaDescription?.length ?? 0} chars
                </Badge>
              </div>
            </div>

            {/* City Hooks */}
            {result.cityHooks && result.cityHooks.length > 0 && (
              <div className="rounded-lg border border-sage/20 bg-white p-4">
                <Label className="text-sm font-semibold mb-2 block">City-Specific Hooks</Label>
                <div className="flex flex-wrap gap-2">
                  {result.cityHooks.map((hook: string, i: number) => (
                    <Badge key={i} variant="secondary">
                      {hook}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Tags */}
            {result.suggestedTags && result.suggestedTags.length > 0 && (
              <div className="rounded-lg border border-sage/20 bg-white p-4">
                <Label className="text-sm font-semibold mb-2 block">Suggested Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {result.suggestedTags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApply({ suggestedTags: result.suggestedTags })}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Apply All Tags
                  </Button>
                )}
              </div>
            )}

            {/* Improved Description */}
            {result.improvedDescription && (
              <div className="rounded-lg border border-sage/30 bg-blue-50 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Label className="text-sm font-semibold">Improved Description</Label>
                    <p className="text-xs text-slateSoft mt-1">
                      Quick Fix: More SEO-friendly version
                    </p>
                  </div>
                  {onApply && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApply({ improvedDescription: result.improvedDescription })}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Apply
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-xs text-slateSoft">Before</Label>
                    <p className="text-xs mt-1 line-clamp-4">{currentDescription}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slateSoft">After</Label>
                    <p className="text-xs mt-1 line-clamp-4">{result.improvedDescription}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    {ToastComponent}
    </>
  );
}

