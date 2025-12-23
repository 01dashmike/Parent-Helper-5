"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveStep2Business } from "../actions";
import { step2BusinessSchema } from "../schema";
import type { OnboardingFormState } from "../../_lib/types";
import { WizardShell } from "../../components/WizardShell";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { CLASS_CATEGORIES } from "@/lib/constants/categories";

interface Step2BusinessClientProps {
  providerId: number;
  initialData: Partial<{
    providerName: string;
    addressLine1: string;
    addressLine2: string;
    town: string;
    county: string;
    postcode: string;
    category: string;
  }>;
}

const formSchema = step2BusinessSchema;

type FormData = z.infer<typeof formSchema>;

export function Step2BusinessClient({ providerId, initialData }: Step2BusinessClientProps) {
  const initialState: OnboardingFormState = {
    success: false,
    error: null,
    nextStep: null,
  };
  const [state, formAction] = useFormState(saveStep2Business, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const category = watch("category");

  useEffect(() => {
    if (state?.error) {
      setError("root", { message: state.error });
    }
  }, [state, setError]);

  // Form submission is handled by action={formAction}
  // react-hook-form is used only for validation display

  return (
    <WizardShell
      title="Step 2 — Business Basics"
      description="Tell us about your business and where you're located"
      currentStep={2}
      backHref="/provider/onboarding/wizard/step-1-account"
    >
      <form ref={formRef} action={formAction} className="space-y-6">
        <FormField
          label="Business Name"
          required
          error={errors.providerName?.message}
          helpText="This is how your business will appear to parents"
        >
          <Input
            type="text"
            placeholder="Little Stars Music"
            {...register("providerName")}
          />
        </FormField>

        <FormField
          label="Address Line 1"
          required
          error={errors.addressLine1?.message}
        >
          <Input
            type="text"
            placeholder="123 High Street"
            {...register("addressLine1")}
          />
        </FormField>

        <FormField
          label="Address Line 2"
          error={errors.addressLine2?.message}
          helpText="Optional (e.g., Suite 4, Floor 2)"
        >
          <Input
            type="text"
            placeholder="Suite 4 (optional)"
            {...register("addressLine2")}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Town"
            required
            error={errors.town?.message}
          >
            <Input
              type="text"
              placeholder="London"
              {...register("town")}
            />
          </FormField>

          <FormField
            label="County"
            error={errors.county?.message}
            helpText="Optional"
          >
            <Input
              type="text"
              placeholder="Greater London (optional)"
              {...register("county")}
            />
          </FormField>
        </div>

        <FormField
          label="Postcode"
          required
          error={errors.postcode?.message}
          helpText="We'll use this to help parents find classes near them"
        >
          <Input
            type="text"
            placeholder="SW1A 1AA"
            {...register("postcode", {
              onChange: (e) => {
                setValue("postcode", e.target.value.toUpperCase());
              },
            })}
          />
        </FormField>

        <FormField
          label="Main Category"
          error={errors.category?.message}
          helpText="You can add more categories later when creating classes"
        >
          <Select
            value={category || ""}
            onValueChange={(value) => setValue("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              {CLASS_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {errors.root && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-sage/20">
          <SubmitButton isSubmitting={isSubmitting} />
        </div>
      </form>
    </WizardShell>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const isLoading = pending || isSubmitting;

  return (
    <Button type="submit" disabled={isLoading} className="min-w-[180px]">
      {isLoading ? "Saving..." : "Continue to Class Details →"}
    </Button>
  );
}
