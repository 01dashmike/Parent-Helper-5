"use client";

import { useState } from "react";
import { completeOnboardingAndPublish } from "../actions";
import { WizardShell } from "../../components/WizardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

interface Step6PublishClientProps {
  providerId: number;
  summary: {
    providerName: string;
    address: string;
    className: string;
    schedule: string;
    hasLogo: boolean;
    photoCount: number;
  };
}

export function Step6PublishClient({ providerId, summary }: Step6PublishClientProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      const result = await completeOnboardingAndPublish(null, formData);

      if (result.success) {
        toast({
          title: "Published!",
          description: "Your listing is now live and visible to parents.",
        });
        // Redirect handled by server action
      } else {
        setError(result.error || "Failed to publish");
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to publish",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to publish";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WizardShell
      title="Step 6 — Publish Your Listing"
      description="You're almost there! Publish your listing to make it visible to parents."
      currentStep={6}
      backHref="/provider/onboarding/wizard/step-5-preview"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-sage/30 bg-sage/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-sage flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  🎉 You're ready to go live!
                </h3>
                <p className="text-sm text-charcoal/70 mb-4">
                  Once you publish, your listing will be visible to parents searching for classes in your area.
                  You can edit any details later from your provider dashboard.
                </p>
                <ul className="space-y-2 text-sm text-charcoal/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                    <span>Your class will appear in search results</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                    <span>Parents can view your full listing and contact you</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                    <span>You can add more classes anytime</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                    <span>You can update your profile and class details anytime</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-charcoal mb-4">Summary of Your Listing</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-charcoal">Business</p>
                  <p className="text-charcoal/70">{summary.providerName}</p>
                  <p className="text-charcoal/70">{summary.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-charcoal">Class</p>
                  <p className="text-charcoal/70">{summary.className}</p>
                  {summary.schedule && (
                    <p className="text-charcoal/70">Schedule: {summary.schedule}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-charcoal">Media</p>
                  <p className="text-charcoal/70">
                    {summary.hasLogo ? "✓ Logo uploaded" : "No logo"}
                    {summary.photoCount > 0 && ` • ${summary.photoCount} photo${summary.photoCount !== 1 ? "s" : ""} uploaded`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-sage/20">
          <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting ? (
              "Publishing..."
            ) : (
              <>
                Publish and Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </WizardShell>
  );
}
