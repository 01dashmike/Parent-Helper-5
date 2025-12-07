"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Check } from "lucide-react";
import {
  aiGenerateClassCopy,
  aiImproveClassCopy,
} from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";

type ClassCopyAssistantProps = {
  onApply?: (data: {
    title?: string;
    subtitle?: string;
    description?: string;
    bullets?: string[];
  }) => void;
};

export default function ClassCopyAssistant({ onApply }: ClassCopyAssistantProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  type ClassCopyResult = {
    title?: string;
    subtitle?: string;
    description?: string;
    bullets?: string[];
    improved?: string;
    changes?: string[];
  };
  const [result, setResult] = useState<ClassCopyResult | null>(null);

  // Create from scratch state
  const [ageRange, setAgeRange] = useState("");
  const [category, setCategory] = useState("");
  const [style, setStyle] = useState("");
  const [city, setCity] = useState("");
  const [tone, setTone] = useState<"calm" | "exciting" | "professional" | "friendly">("friendly");

  // Improve existing state
  const [existingText, setExistingText] = useState("");
  const [improveTone, setImproveTone] = useState<"calm" | "exciting" | "professional" | "friendly">("friendly");

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("ageRange", ageRange);
      formData.append("category", category);
      formData.append("style", style);
      formData.append("city", city);
      formData.append("tone", tone);

      const response = await aiGenerateClassCopy(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setResult(response.data);
      showSuccess("Class copy generated!");
    } catch {
      showError("Failed to generate class copy");
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!existingText.trim()) {
      showError("Please enter text to improve");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("existingText", existingText);
      formData.append("tone", improveTone);

      const response = await aiImproveClassCopy(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setResult(response.data);
      showSuccess("Class copy improved!");
    } catch {
      showError("Failed to improve class copy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sage" />
          <CardTitle>AI Class Copy Assistant</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create from Scratch</TabsTrigger>
            <TabsTrigger value="improve">Improve My Text</TabsTrigger>
            <TabsTrigger value="tone">Change Tone</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="ageRange">Age Range</Label>
                <Input
                  id="ageRange"
                  placeholder="e.g., 0-12 months"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Music, Sensory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  placeholder="e.g., Play-based, Structured"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., London, Manchester"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(v: "calm" | "exciting" | "professional" | "friendly") => setTone(v)}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="exciting">Exciting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Class Copy
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="improve" className="space-y-4">
            <div>
              <Label htmlFor="existingText">Your Current Text</Label>
              <Textarea
                id="existingText"
                placeholder="Paste your class description here..."
                rows={6}
                value={existingText}
                onChange={(e) => setExistingText(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="improveTone">Desired Tone</Label>
              <Select value={improveTone} onValueChange={(v: "calm" | "exciting" | "professional" | "friendly") => setImproveTone(v)}>
                <SelectTrigger id="improveTone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="exciting">Exciting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleImprove} disabled={loading || !existingText.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Improving...
                </>
              ) : (
                "Improve My Text"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="tone" className="space-y-4">
            <p className="text-sm text-slateSoft">
              Use the &quot;Improve My Text&quot; tab and select a different tone to change the tone of your existing copy.
            </p>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-6 space-y-4 rounded-lg border border-sage/20 bg-cream/30 p-4">
            {result.title && (
              <div>
                <Label className="text-sm font-semibold">Title</Label>
                <p className="mt-1 text-sm">{result.title}</p>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApply({ title: result.title })}
                  >
                    <Check className="mr-2 h-3 w-3" />
                    Apply Title
                  </Button>
                )}
              </div>
            )}

            {result.subtitle && (
              <div>
                <Label className="text-sm font-semibold">Subtitle</Label>
                <p className="mt-1 text-sm">{result.subtitle}</p>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApply({ subtitle: result.subtitle })}
                  >
                    <Check className="mr-2 h-3 w-3" />
                    Apply Subtitle
                  </Button>
                )}
              </div>
            )}

            {result.description && (
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="mt-1 whitespace-pre-wrap text-sm">{result.description}</p>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApply({ description: result.description })}
                  >
                    <Check className="mr-2 h-3 w-3" />
                    Apply Description
                  </Button>
                )}
              </div>
            )}

            {result.bullets && result.bullets.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Key Benefits</Label>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {result.bullets.map((bullet: string, i: number) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApply({ bullets: result.bullets })}
                  >
                    <Check className="mr-2 h-3 w-3" />
                    Apply Bullets
                  </Button>
                )}
              </div>
            )}

            {result.improved && (
              <div>
                <Label className="text-sm font-semibold">Improved Version</Label>
                <p className="mt-1 whitespace-pre-wrap text-sm">{result.improved}</p>
                {result.changes && result.changes.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-xs font-semibold">Changes Made:</Label>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slateSoft">
                      {result.changes.map((change: string, i: number) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {onApply && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => onApply({ description: result.improved })}
                  >
                    <Check className="mr-2 h-3 w-3" />
                    Apply Improved Text
                  </Button>
                )}
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

