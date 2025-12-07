"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import LinkComponent from "@/components/ui/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ErrorMessage } from "@/components/ui/errormessage";
import { saveFamilyDraft } from "@/app/family/actions";
import { useAutosave } from "@/app/family/hooks/useAutosave";
import { useFieldAnalytics } from "@/app/family/hooks/useFieldAnalytics";
import { trackAnalyticsEvent } from "@/app/family/analytics";
import { cn } from "@/lib/utils";

const familyProfileSchema = z.object({
  home_town: z.string().optional(),
  home_postcode: z.string().optional(),
  interests: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

type FamilyProfileFormData = z.infer<typeof familyProfileSchema>;

const COMMON_INTERESTS = [
  "music",
  "dance",
  "swimming",
  "sports",
  "arts",
  "crafts",
  "sensory",
  "outdoor",
  "indoor",
  "reading",
  "cooking",
  "yoga",
  "gymnastics",
  "nature",
  "animals",
];

const COMMON_ALLERGIES = [
  "nuts",
  "dairy",
  "eggs",
  "gluten",
  "soy",
  "fish",
  "shellfish",
];

const TOTAL_STEPS = 3;

interface FamilyProfileFormWizardProps {
  familyProfile?: {
    id: string;
    home_town?: string | null;
    home_postcode?: string | null;
    interests?: string[] | null;
    allergies?: string[] | null;
  };
}

export default function FamilyProfileFormWizard({
  familyProfile,
}: FamilyProfileFormWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const isEditingExisting = Boolean(familyProfile && familyProfile.id !== "draft");

  const defaultValues = useMemo<FamilyProfileFormData>(() => {
    if (familyProfile) {
      return {
        home_town: familyProfile.home_town || "",
        home_postcode: familyProfile.home_postcode || "",
        interests: familyProfile.interests || [],
        allergies: familyProfile.allergies || [],
      };
    }
    return {
      home_town: "",
      home_postcode: "",
      interests: [],
      allergies: [],
    };
  }, [familyProfile]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<FamilyProfileFormData>({
    resolver: zodResolver(familyProfileSchema),
    defaultValues,
  });

  const watchedValues = watch();
  const selectedInterests = watch("interests") || [];
  const selectedAllergies = watch("allergies") || [];

  const fieldAnalytics = useFieldAnalytics({
    scope: "family",
    stepIndex: currentStep - 1,
    totalSteps: TOTAL_STEPS,
  });

  const { enqueueSave, isSaving: isAutosaving, isOffline, hasPendingOfflineSave, error: autosaveError } = useAutosave<FamilyProfileFormData>({
    initialValues: defaultValues,
    saveAction: async (values) => {
      if (isEditingExisting) {
        return { success: true };
      }
      return saveFamilyDraft(values);
    },
    scope: "family",
  });

  // Autosave on form changes
  useEffect(() => {
    if (!isEditingExisting) {
      enqueueSave(watchedValues);
    }
  }, [watchedValues, enqueueSave, isEditingExisting]);

  // Track step view
  useEffect(() => {
    trackAnalyticsEvent("step_view", {
      scope: "family",
      stepIndex: currentStep - 1,
      totalSteps: TOTAL_STEPS,
      experiment: "family_onboarding_v1",
      variant: "multi_step",
    });
  }, [currentStep]);

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue("interests", current.filter((i) => i !== interest));
    } else {
      setValue("interests", [...current, interest]);
    }
    fieldAnalytics.onChange("interests");
  };

  const toggleAllergy = (allergy: string) => {
    const current = selectedAllergies;
    if (current.includes(allergy)) {
      setValue("allergies", current.filter((a) => a !== allergy));
    } else {
      setValue("allergies", [...current, allergy]);
    }
    fieldAnalytics.onChange("allergies");
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      trackAnalyticsEvent("step_next", {
        scope: "family",
        stepIndex: currentStep - 1,
        totalSteps: TOTAL_STEPS,
        experiment: "family_onboarding_v1",
        variant: "multi_step",
      });
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      trackAnalyticsEvent("step_back", {
        scope: "family",
        stepIndex: currentStep - 1,
        totalSteps: TOTAL_STEPS,
        experiment: "family_onboarding_v1",
        variant: "multi_step",
      });
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FamilyProfileFormData) => {
    setIsSubmitting(true);
    setError(null);
    setAnnouncement("Submitting…");

    trackAnalyticsEvent("step_complete", {
      scope: "family",
      stepIndex: TOTAL_STEPS - 1,
      totalSteps: TOTAL_STEPS,
      experiment: "family_onboarding_v1",
      variant: "multi_step",
    });

    try {
      const url = isEditingExisting
        ? `/api/family/${familyProfile?.id}`
        : "/api/family";
      const method = isEditingExisting ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save family profile");
      }

      setAnnouncement("Saved");
      router.push("/family");
      router.refresh();
    } catch (err: unknown) {
      console.error("[FamilyProfileFormWizard] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setAnnouncement("Error saving changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60"
      aria-busy={isSubmitting ? "true" : "false"}
    >
      <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
        {announcement}
      </VisuallyHidden>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-charcoal">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-text-tertiary">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
          <div
            className="h-full bg-sage transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Step 1: Household Basics */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Household Basics</h2>
          <div>
            <label htmlFor="home_town" className="mb-2 block text-small font-medium">
              Home Town (Optional)
            </label>
            <input
              id="home_town"
              {...register("home_town")}
              type="text"
              className="w-full rounded border border-sage/20 px-3 py-2"
              placeholder="e.g., London"
              onFocus={() => fieldAnalytics.onFocus("home_town")}
              onBlur={() => fieldAnalytics.onBlur("home_town")}
              onChange={(e) => {
                register("home_town").onChange(e);
                fieldAnalytics.onChange("home_town");
              }}
            />
          </div>
          <div>
            <label htmlFor="home_postcode" className="mb-2 block text-small font-medium">
              Postcode (Optional)
            </label>
            <input
              id="home_postcode"
              {...register("home_postcode")}
              type="text"
              inputMode="text"
              className="w-full rounded border border-sage/20 px-3 py-2"
              placeholder="e.g., SW11 1AA"
              onFocus={() => fieldAnalytics.onFocus("home_postcode")}
              onBlur={() => fieldAnalytics.onBlur("home_postcode")}
              onChange={(e) => {
                register("home_postcode").onChange(e);
                fieldAnalytics.onChange("home_postcode");
              }}
            />
            <p className="text-small text-text-tertiary mt-1">
              Used to find classes near you
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Family Interests */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Family Interests</h2>
          <p className="text-small text-text-tertiary mb-4">
            Select interests that apply to your family
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_INTERESTS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-full px-3 py-1 text-small font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
                  selectedInterests.includes(interest)
                    ? "bg-blue-600 text-white"
                    : "border border-sage/20 bg-surface-alt text-charcoal hover:bg-cream/50"
                )}
                aria-pressed={selectedInterests.includes(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Allergies */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Family Allergies</h2>
          <p className="text-small text-text-tertiary mb-4">
            Select any allergies to avoid classes that may involve them
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleAllergy(allergy)}
                className={cn(
                  "rounded-full px-3 py-1 text-small font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
                  selectedAllergies.includes(allergy)
                    ? "bg-red-600 text-white"
                    : "border border-sage/20 bg-surface-alt text-charcoal hover:bg-cream/50"
                )}
                aria-pressed={selectedAllergies.includes(allergy)}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="bg-white text-charcoal border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Back
            </button>
          )}
          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-sage text-white font-medium rounded-xl px-4 py-3 shadow-soft hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-sage text-white font-medium rounded-xl px-4 py-3 shadow-soft hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isSubmitting ? "true" : "false"}
            >
              {isSubmitting ? "Saving..." : familyProfile ? "Update Profile" : "Create Profile"}
            </button>
          )}
        </div>
        <LinkComponent
          href="/family"
          className="bg-white text-charcoal border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          prefetch={false}
        >
          Cancel
        </LinkComponent>
      </div>

      {/* Autosave status */}
      {!isEditingExisting && (
        <p className="mt-4 text-xs text-text-tertiary text-center">
          {isOffline
            ? "Working offline, saving when you're back online"
            : isAutosaving
              ? "Autosaving draft…"
              : hasPendingOfflineSave
                ? "Waiting to sync offline changes…"
                : autosaveError
                  ? `Autosave failed – ${autosaveError}`
                  : "Drafts save automatically"}
        </p>
      )}
    </form>
  );
}

