"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Check, X } from "lucide-react";
import { aiGenerateScheduleSuggestions } from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";

type ScheduleSuggestionPanelProps = {
  onApply?: (suggestion: {
    day: string;
    time: string;
    duration: number;
  }) => void;
};

export default function ScheduleSuggestionPanel({ onApply }: ScheduleSuggestionPanelProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  type Suggestion = {
    day: string;
    time: string;
    duration: number;
    reasoning?: string;
  };
  type PriceRange = {
    min: number;
    max: number;
    currency?: string;
    reasoning?: string;
  };
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [ageRange, setAgeRange] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setSuggestions(null);
    setPriceRange(null);

    try {
      const formData = new FormData();
      formData.append("ageRange", ageRange);
      formData.append("category", category);
      formData.append("city", city);

      const response = await aiGenerateScheduleSuggestions(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setSuggestions(response.data?.suggestions ?? []);
      setPriceRange(response.data?.priceRange ?? null);
      showSuccess("Schedule suggestions generated!");
    } catch {
      showError("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-sage" />
          <CardTitle>AI Schedule & Pricing Suggestions</CardTitle>
        </div>
        <p className="text-sm text-slateSoft mt-2">
          Get suggestions for optimal class times and pricing based on parent behavior patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="scheduleAgeRange">Age Range</Label>
            <Input
              id="scheduleAgeRange"
              placeholder="e.g., 0-12 months"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="scheduleCategory">Category</Label>
            <Input
              id="scheduleCategory"
              placeholder="e.g., Music, Sensory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="scheduleCity">City</Label>
            <Input
              id="scheduleCity"
              placeholder="e.g., London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Suggestions...
            </>
          ) : (
            "Generate Suggestions"
          )}
        </Button>

        {suggestions && suggestions.length > 0 && (
          <div className="space-y-3 mt-6">
            <Label className="text-sm font-semibold">Suggested Schedules</Label>
            {suggestions.map((suggestion: Suggestion, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-sage/20 bg-cream/30 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-sage" />
                      <p className="font-medium">
                        {suggestion.day} {suggestion.time} ({suggestion.duration} min)
                      </p>
                    </div>
                    <p className="text-xs text-slateSoft">{suggestion.reasoning}</p>
                  </div>
                  {onApply && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onApply({
                            day: suggestion.day,
                            time: suggestion.time,
                            duration: suggestion.duration,
                          })
                        }
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {priceRange && (
          <div className="mt-4 rounded-lg border border-sage/20 bg-blue-50 p-4">
            <Label className="text-sm font-semibold mb-2 block">
              Suggested Price Range (Benchmark)
            </Label>
            <p className="text-sm">
              £{priceRange.min} - £{priceRange.max} {priceRange.currency}
            </p>
            <p className="text-xs text-slateSoft mt-1">{priceRange.reasoning}</p>
            <p className="text-xs text-slateSoft mt-2 italic">
              Note: This is a suggested benchmark based on similar classes. Always set your own pricing based on your costs and market.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    {ToastComponent}
    </>
  );
}

