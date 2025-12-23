"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { saveStep1Account } from "../actions";
import { step1AccountSchema } from "../schema";
import { WizardShell } from "../../components/WizardShell";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingAnalytics } from "../../hooks/useOnboardingAnalytics";

// Helper function for tracking errors (can be called from callbacks)
async function trackOnboardingError(
  event: "step_error",
  stepId: string,
  providerId: number,
  error: string
) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [{
          eventType: `onboarding_${event}`,
          payload: {
            step_id: stepId,
            provider_id: providerId,
            error: error,
          },
        }],
      }),
    });
  } catch (err) {
    // Silently fail - analytics should not break the app
    console.error("Analytics error:", err);
  }
}
import { Loader2 } from "lucide-react";

interface Step1AccountClientProps {
  providerId: number;
  initialData: {
    name: string;
    email: string;
    phone: string;
  };
  currentStep?: string | null;
  isComplete?: boolean;
}

const formSchema = step1AccountSchema;

type FormData = z.infer<typeof formSchema>;

export function Step1AccountClient({ 
  providerId, 
  initialData,
  currentStep,
  isComplete 
}: Step1AccountClientProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track step view
  useOnboardingAnalytics("step_view", "step-1-account", providerId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      
      const result = await saveStep1Account(null, formData);
      
      if (result.success) {
        toast({
          title: "Saved!",
          description: "Your account details have been saved.",
        });
      } else {
        setError("root", { message: result.error || "Failed to save" });
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save",
        });
        await trackOnboardingError("step_error", "step-1-account", providerId, result.error || "Unknown error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save";
      setError("root", { message: errorMessage });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <WizardShell
      title="Step 1 — Account & Contact"
      description="Let's start with your basic contact information"
      currentStep={1}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          label="Your Name"
          required
          error={errors.name?.message}
          helpText="This is how parents will see your name on the platform"
        >
          <Input
            type="text"
            placeholder="Jane Smith"
            className={cn(
              errors.name && "ring-2 ring-red-400 border-red-400"
            )}
            {...register("name", {
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
          />
        </FormField>

        <FormField
          label="Email Address"
          required
          error={errors.email?.message}
          helpText="We'll use this to send you booking notifications and updates"
        >
          <Input
            type="email"
            placeholder="jane@example.com"
            className={cn(
              errors.email && "ring-2 ring-red-400 border-red-400"
            )}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Phone Number"
          required
          error={errors.phone?.message}
          helpText="Parents can call this number directly from your listing"
        >
          <Input
            type="tel"
            placeholder="07123 456789"
            className={cn(
              errors.phone && "ring-2 ring-red-400 border-red-400"
            )}
            {...register("phone", {
              minLength: { value: 6, message: "Phone number must be at least 6 characters" },
            })}
          />
        </FormField>

        {errors.root && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-sage/20">
          <Button type="submit" disabled={isSubmitting} className="min-w-[180px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Business Details →"
            )}
          </Button>
        </div>
      </form>
    </WizardShell>
  );
}
