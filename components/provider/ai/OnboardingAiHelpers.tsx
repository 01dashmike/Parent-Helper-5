"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { aiGenerateOnboardingText } from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";

type OnboardingAiHelpersProps = {
  step: "tagline" | "description" | "captions";
  existingData?: Record<string, unknown>;
  onGenerated?: (text: string) => void;
};

export default function OnboardingAiHelpers({
  step,
  existingData = {},
  onGenerated,
}: OnboardingAiHelpersProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("step", step);
      if (Object.keys(existingData).length > 0) {
        formData.append("existingData", JSON.stringify(existingData));
      }

      const response = await aiGenerateOnboardingText(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      if (onGenerated) {
        onGenerated(response.data?.text ?? "");
      }
      showSuccess("Text generated!");
    } catch {
      showError("Failed to generate text");
    } finally {
      setLoading(false);
    }
  };

  const buttonLabels: Record<string, string> = {
    tagline: "Generate a tagline with AI",
    description: "Use AI to write this description",
    captions: "Suggest captions for my photos",
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-3 w-3" />
          {buttonLabels[step]}
        </>
      )}
    </Button>
  );
}

