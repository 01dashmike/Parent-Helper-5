"use client";

import { useState, useEffect, useId, useMemo } from "react";
import { useRouter } from "next/navigation";
import LinkComponent from "@/components/ui/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ErrorMessage } from "@/components/ui/errormessage";
import { saveChildDraft } from "@/app/family/actions";
import { useAutosave } from "@/app/family/hooks/useAutosave";
import { useFieldAnalytics } from "@/app/family/hooks/useFieldAnalytics";

const childProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  age_years: z.coerce.number().int().min(0).max(18).optional().nullable(),
  age_months: z.coerce.number().int().min(0).max(216).min(1, "Age in months is required"),
  interests: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

type ChildProfileFormData = z.infer<typeof childProfileSchema>;

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

interface ChildProfileFormProps {
  child?: {
    id: string;
    first_name: string;
    age_years?: number | null;
    age_months: number;
    interests?: string[] | null;
    allergies?: string[] | null;
  };
  familyId: string;
}

export default function ChildProfileForm({ child, familyId }: ChildProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const ageMonthsHelperId = useId();
  const interestsHelperId = useId();
  const allergiesHelperId = useId();
  const isEditingExisting = Boolean(child && child.id !== "draft");

  const defaultValues = useMemo<ChildProfileFormData>(() => {
    if (child) {
      return {
        first_name: child.first_name,
        age_years: child.age_years ?? null,
        age_months: child.age_months ?? 1,
        interests: child.interests ?? [],
        allergies: child.allergies ?? [],
      };
    }

    return {
      first_name: "",
      age_years: null,
      age_months: 1,
      interests: [],
      allergies: [],
    };
  }, [child]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChildProfileFormData>({
    resolver: zodResolver(childProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const selectedInterests = watch("interests") || [];
  const selectedAllergies = watch("allergies") || [];
  const ageYears = watch("age_years");
  const ageMonths = watch("age_months");
  const watchedValues = watch();

  const fieldAnalytics = useFieldAnalytics({ scope: "child" });

  // Track field errors
  useEffect(() => {
    if (errors.first_name) {
      fieldAnalytics.onError("first_name", errors.first_name.message);
    }
    if (errors.age_months) {
      fieldAnalytics.onError("age_months", errors.age_months.message);
    }
  }, [errors, fieldAnalytics]);

  const {
    enqueueSave,
    isSaving: isAutosaving,
    lastSavedAt,
    error: autosaveError,
    isOffline,
    hasPendingOfflineSave,
  } = useAutosave<ChildProfileFormData>({
    initialValues: defaultValues,
    saveAction: async (values) => {
      if (isEditingExisting) {
        return { success: true };
      }
      return saveChildDraft({ ...values, familyId });
    },
    scope: "child",
  });

  useEffect(() => {
    if (isEditingExisting) return;
    enqueueSave(watchedValues);
  }, [enqueueSave, isEditingExisting, watchedValues]);

  // Auto-calculate total months when years/months change
  useEffect(() => {
    const years = ageYears || 0;
    const months = ageMonths || 0;
    const totalMonths = years * 12 + months;
    if (totalMonths > 0 && totalMonths !== ageMonths) {
      setValue("age_months", totalMonths, { shouldValidate: true });
    }
  }, [ageYears, ageMonths, setValue]);

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

  const onSubmit = async (data: ChildProfileFormData) => {
    setIsSubmitting(true);
    setError(null);
    setAnnouncement('Submitting…');

    try {
      const url = isEditingExisting ? `/api/family/children/${child?.id}` : "/api/family/children";
      const method = isEditingExisting ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          family_id: familyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save child profile");
      }

      setAnnouncement('Saved');
      router.push("/family");
      router.refresh();
    } catch (err: unknown) {
      console.error("[ChildProfileForm] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setAnnouncement('Error saving changes');
      fieldAnalytics.onError("form_submit", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60"
    >
      <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => setError(null)}
          className="mb-4"
        />
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="first_name" className="input-label">
            First Name <span className="text-red-500" aria-label="required">*</span>
          </label>
          <input
            id="first_name"
            {...register("first_name")}
            type="text"
            required
            className="input"
            placeholder="e.g., Emma"
            aria-invalid={errors.first_name ? "true" : "false"}
            aria-describedby={errors.first_name ? "first_name-error" : undefined}
            onFocus={() => fieldAnalytics.onFocus("first_name")}
            onBlur={() => fieldAnalytics.onBlur("first_name")}
            onChange={(e) => {
              register("first_name").onChange(e);
              fieldAnalytics.onChange("first_name");
            }}
          />
            {errors.first_name && (
              <p id="first_name-error" className="input-error" role="alert">
                {errors.first_name.message}
              </p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-card">
          <div>
            <label htmlFor="age_years" className="input-label">
              Age (Years)
            </label>
            <input
              id="age_years"
              {...register("age_years")}
              type="number"
              inputMode="numeric"
              min="0"
              max="18"
              className="input"
              placeholder="0"
              onFocus={() => fieldAnalytics.onFocus("age_years")}
              onBlur={() => fieldAnalytics.onBlur("age_years")}
              onChange={(e) => {
                register("age_years").onChange(e);
                fieldAnalytics.onChange("age_years");
              }}
            />
          </div>
          <div>
            <label htmlFor="age_months" className="input-label">
              Age (Months) <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="age_months"
              {...register("age_months")}
              type="number"
              inputMode="numeric"
              required
              min="0"
              max="216"
              className="input"
              placeholder="e.g., 6"
              aria-invalid={errors.age_months ? "true" : "false"}
              aria-describedby={[ageMonthsHelperId, errors.age_months ? "age_months-error" : undefined].filter(Boolean).join(" ") || undefined}
              onFocus={() => fieldAnalytics.onFocus("age_months")}
              onBlur={() => fieldAnalytics.onBlur("age_months")}
              onChange={(e) => {
                register("age_months").onChange(e);
                fieldAnalytics.onChange("age_months");
              }}
            />
            {errors.age_months && (
              <p id="age_months-error" className="input-error" role="alert">
                {errors.age_months.message}
              </p>
            )}
            <p id={ageMonthsHelperId} className="input-helper">
              Total months (will auto-calculate if years provided)
            </p>
          </div>
        </div>

        <div>
          <label className="input-label">Interests</label>
          <p id={interestsHelperId} className="input-helper">
            Select interests to find matching classes
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_INTERESTS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-3 py-1 text-small font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                  selectedInterests.includes(interest)
                    ? "bg-blue-600 text-white"
                    : "border border-sage/20 bg-surface-alt text-charcoal hover:bg-cream/50"
                }`}
                aria-pressed={selectedInterests.includes(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-small font-medium">Allergies</label>
          <p id={allergiesHelperId} className="text-small text-text-tertiary mt-1 mb-2">
            Select allergies to exclude classes that may involve them
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleAllergy(allergy)}
                className={`rounded-full px-3 py-1 text-small font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                  selectedAllergies.includes(allergy)
                    ? "bg-red-600 text-white"
                    : "border border-sage/20 bg-surface-alt text-charcoal hover:bg-cream/50"
                }`}
                aria-pressed={selectedAllergies.includes(allergy)}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-sage text-white font-medium rounded-xl px-4 py-3 shadow-soft hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : child ? "Update Profile" : "Create Profile"}
        </button>
        <LinkComponent
          href="/family"
          className="bg-white text-charcoal border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          prefetch={false}
        >
          Cancel
        </LinkComponent>
        {!isEditingExisting && (
          <p className="text-xs text-text-tertiary">
            {isOffline
              ? "Working offline, saving when you’re back online"
              : isAutosaving
                ? "Autosaving draft…"
                : hasPendingOfflineSave
                  ? "Waiting to sync offline changes…"
                  : autosaveError
                    ? `Autosave failed – ${autosaveError}`
                    : lastSavedAt
                      ? "Draft saved"
                      : "Drafts save automatically"}
          </p>
        )}
      </div>
    </form>
  );
}

