"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { isChildProfilesEnabled } from "@/lib/env";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ErrorMessage } from "@/components/ui/errormessage";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AddChildModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkip?: () => void;
};

const COMMON_INTERESTS = [
  "music",
  "dance",
  "swimming",
  "sports",
  "arts",
  "crafts",
  "sensory",
  "outdoor",
  "yoga",
  "gymnastics",
];

const COMMON_ALLERGIES = [
  "nuts",
  "dairy",
  "eggs",
  "gluten",
  "soy",
];

const addChildFormSchema = z.object({
  first_name: z.string().min(1, "Child's name is required"),
  birthdate: z.string().min(1, "Birthdate is required"),
  interests: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

type AddChildFormData = z.infer<typeof addChildFormSchema>;

export function AddChildModal({ open, onOpenChange, onSkip }: AddChildModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxDate, setMaxDate] = useState<string>("");
  const [announcement, setAnnouncement] = useState('');

  const form = useForm<AddChildFormData>({
    resolver: zodResolver(addChildFormSchema),
    defaultValues: {
      first_name: "",
      birthdate: "",
      interests: [],
      allergies: [],
    },
  });

  // Set max date on client side to avoid hydration mismatches
  useEffect(() => {
    setMaxDate(new Date().toISOString().split("T")[0]);
  }, []);

  if (!isChildProfilesEnabled()) {
    return null;
  }

  const toggleInterest = (interest: string) => {
    const currentInterests = form.watch("interests");
    if (currentInterests.includes(interest)) {
      form.setValue("interests", currentInterests.filter((i) => i !== interest));
    } else {
      form.setValue("interests", [...currentInterests, interest]);
    }
  };

  const toggleAllergy = (allergy: string) => {
    const currentAllergies = form.watch("allergies");
    if (currentAllergies.includes(allergy)) {
      form.setValue("allergies", currentAllergies.filter((a) => a !== allergy));
    } else {
      form.setValue("allergies", [...currentAllergies, allergy]);
    }
  };

  const onSubmit = async (data: AddChildFormData) => {
    setError(null);
    setIsSubmitting(true);
    setAnnouncement('Submitting…');

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add child");
      }

      setAnnouncement('Saved');
      onOpenChange(false);
      router.push("/account");
      router.refresh();
    } catch (err: unknown) {
      console.error("[AddChildModal] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      setAnnouncement('Error saving changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onOpenChange(false);
    router.push("/account");
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add your child to personalise results"
      description="This helps us show you classes that match your child's age and interests. You can skip this step."
      size="lg"
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting ? "true" : "false"}>
          <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
            {announcement}
          </VisuallyHidden>

          <FormField
            label="Child's name"
            required
            error={form.formState.errors.first_name?.message}
            id="first_name"
          >
            <Input
              {...form.register("first_name")}
              placeholder="e.g. Emma"
              autoComplete="name"
            />
          </FormField>

          <FormField
            label="Birthdate"
            required
            error={form.formState.errors.birthdate?.message}
            id="birthdate"
          >
            <Input
              {...form.register("birthdate")}
              type="date"
              max={maxDate}
            />
          </FormField>

          <div>
            <label className="block text-small font-medium text-charcoal mb-2">
              Interests (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_INTERESTS.map((interest) => {
                const isSelected = form.watch("interests").includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-label={`${isSelected ? "Remove" : "Add"} ${interest} interest`}
                    aria-pressed={isSelected}
                    className={`rounded-full px-3 py-1 text-small font-medium motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
                      isSelected
                        ? "bg-sage text-white"
                        : "border border-sage/30 bg-white text-charcoal hover:bg-cream"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-small font-medium text-charcoal mb-2">
              Allergies (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = form.watch("allergies").includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    aria-label={`${isSelected ? "Remove" : "Add"} ${allergy} allergy`}
                    aria-pressed={isSelected}
                    className={`rounded-full px-3 py-1 text-small font-medium motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
                      isSelected
                        ? "bg-terracotta text-white"
                        : "border border-terracotta/30 bg-white text-charcoal hover:bg-cream"
                    }`}
                  >
                    {allergy}
                  </button>
                );
              })}
            </div>
          </div>

            {error && (
              <ErrorMessage
                error={error}
                onRetry={() => {
                  setError(null);
                }}
              />
            )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !form.watch("first_name") || !form.watch("birthdate")}
              className="flex-1"
              aria-busy={isSubmitting ? "true" : "false"}
            >
              {isSubmitting ? (
                <span role="status" aria-live="polite" className="inline-flex items-center">
                  <Loader2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
                  <span>Saving...</span>
                  <VisuallyHidden>Saving child information...</VisuallyHidden>
                </span>
              ) : (
                "Save & Continue"
              )}
            </Button>
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
            >
              Skip
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}

