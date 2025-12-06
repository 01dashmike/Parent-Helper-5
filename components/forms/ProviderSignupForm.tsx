"use client";

import { useState, useEffect, useMemo, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import LinkComponent from "@/components/ui/link";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ErrorMessage } from "@/components/ui/errormessage";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/buttons";
import {
  CATEGORY_OPTIONS,
  HEAR_ABOUT_OPTIONS,
} from "@/app/onboarding/constants";
import { submitProviderLead } from "@/app/onboarding/actions";

const providerSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  company: z.string().min(1, "Business name is required"),
  website: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Please enter a valid URL",
  }).optional(),
  postcode: z.string().optional(),
  town: z.string().optional(),
  hear_about: z.string().optional(),
  categories: z.array(z.string()).min(1, "Please select at least one category"),
  message: z.string().optional(),
  photos: z.instanceof(FileList).optional(),
  newsletter_optin: z.boolean().default(false),
  privacy_accepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy policy",
  }),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  _botcheck: z.string().optional(),
});

type ProviderSignupFormData = z.infer<typeof providerSignupSchema>;

export default function ProviderSignupForm() {
  const photosId = useId();
  const privacyAcceptedId = useId();
  const [userAgent, setUserAgent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserAgent(window.navigator.userAgent);
    }
  }, []);

  const form = useForm<ProviderSignupFormData>({
    resolver: zodResolver(providerSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      website: "",
      postcode: "",
      town: "",
      hear_about: "",
      categories: [],
      message: "",
      newsletter_optin: false,
      privacy_accepted: false,
      userAgent: "",
      ip: "",
      _botcheck: "",
    },
  });

  const selectedCategories = form.watch("categories");
  const photos = form.watch("photos");

  const fileSummary = useMemo(() => {
    if (!photos || photos.length === 0) return null;
    return Array.from(photos)
      .map((file) => `${file.name} ${(file.size / (1024 * 1024)).toFixed(2)} MB`)
      .join(", ");
  }, [photos]);

  const onSubmit = async (data: ProviderSignupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      formData.append("company", data.company);
      if (data.website) formData.append("website", data.website);
      if (data.postcode) formData.append("postcode", data.postcode);
      if (data.town) formData.append("town", data.town);
      if (data.hear_about) formData.append("hear_about", data.hear_about);
      data.categories.forEach((cat) => formData.append("categories", cat));
      if (data.message) formData.append("message", data.message);
      if (data.photos) {
        Array.from(data.photos).forEach((file) => formData.append("photos", file));
      }
      formData.append("newsletter_optin", data.newsletter_optin.toString());
      formData.append("privacy_accepted", data.privacy_accepted.toString());
      formData.append("userAgent", userAgent);
      formData.append("ip", "");
      formData.append("_botcheck", "");

      const result = await submitProviderLead(null, formData);

      if (result.status === "success") {
        setSuccess(true);
        form.reset();
      } else {
        const errorMessage = result.error || "Failed to submit form";
        setError(errorMessage);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="rounded-3xl border border-sage/20 bg-surface-alt p-8 shadow-soft">
        <div className="max-w-2xl">
          <h2 className="text-title font-semibold text-text-primary">Thanks for registering</h2>
          <p className="mt-3 text-slateSoft">
            Our onboarding team will review your details and help you get listed. While you wait,
            explore our upcoming premium features to boost your visibility and manage bookings.
          </p>
        </div>

        <div className="mt-8 grid gap-card md:grid-cols-3">
          <UpsellCard
            title="Featured placements"
            description="Secure top spots in category searches and newsletters to stay front of mind."
          />
          <UpsellCard
            title="Smart enquiries"
            description="Centralise parent enquiries and respond quickly with custom templates."
          />
          <UpsellCard
            title="Online bookings"
            description="Soon you'll be able to take payments and manage attendance in one place."
          />
        </div>

        <div className="mt-10 inline-flex flex-col gap-2">
          <LinkComponent
            href="/onboarding/premium"
            className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-body font-semibold text-white transition-standard hover:bg-brand/90"
            prefetch={false}
          >
            Preview premium features
          </LinkComponent>
          <LinkComponent
            href="/"
            className="text-body font-medium text-forest underline-offset-4 hover:underline"
            prefetch={false}
          >
            Return to homepage
          </LinkComponent>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-sage/20 bg-surface-alt p-8 shadow-soft">
      <div className="mb-6">
        <h2 className="text-title text-text-primary">Tell us about your business</h2>
        <p className="mt-2 text-small text-slateSoft">
          Share a few details to start your Parent Helper profile. Our team will follow up within 1–2 business days.
        </p>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => {
            form.reset();
            setError(null);
          }}
        />
      )}

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          aria-busy={isSubmitting}
          encType="multipart/form-data"
          aria-describedby="provider-form-description"
        >
        <VisuallyHidden id="provider-form-description" as="p">
          Complete this form to register your classes on Parent Helper.
        </VisuallyHidden>

        <div className="grid gap-card md:grid-cols-2">
          <FormField
            label="Your name"
            required
            error={form.formState.errors.name?.message}
            id="name"
          >
            <Input
              {...form.register("name")}
              autoComplete="name"
            />
          </FormField>

          <FormField
            label="Email"
            required
            error={form.formState.errors.email?.message}
            id="email"
          >
            <Input
              {...form.register("email")}
              type="email"
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Phone (optional)"
            id="phone"
          >
            <Input
              {...form.register("phone")}
              type="tel"
              inputMode="tel"
              placeholder="07123 456789"
              autoComplete="tel"
            />
          </FormField>

          <FormField
            label="Business or brand name"
            required
            error={form.formState.errors.company?.message}
            id="company"
          >
            <Input
              {...form.register("company")}
              autoComplete="organization"
            />
          </FormField>

          <FormField
            label="Website or social link"
            id="website"
            error={form.formState.errors.website?.message}
          >
            <Input
              {...form.register("website")}
              type="url"
              placeholder="https://"
              autoComplete="url"
            />
          </FormField>

          <FormField
            label="Postcode"
            id="postcode"
          >
            <Input
              {...form.register("postcode")}
              inputMode="text"
              placeholder="E1 6AN"
              autoComplete="postal-code"
            />
          </FormField>

          <FormField
            label="Town or city"
            id="town"
          >
            <Input
              {...form.register("town")}
              autoComplete="address-level2"
            />
          </FormField>

          <FormField
            label="How did you hear about us?"
            id="hear_about"
          >
            <select
              {...form.register("hear_about")}
              className="w-full rounded-md border border-sage/30 bg-white px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              {HEAR_ABOUT_OPTIONS.map((option) => (
                <option key={option || "placeholder"} value={option}>
                  {option || "Select an option"}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="space-y-2">
          <label className="block text-small font-medium text-text-primary">
            Categories
          </label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_OPTIONS.map((option) => {
              const id = `category-${option.toLowerCase()}`;
              return (
                <label
                  key={option}
                  htmlFor={id}
                  className="flex items-center gap-2 rounded-xl border border-sage/30 bg-surface/40 px-3 py-2 text-small text-text-primary motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:border-sage focus-within:ring-2 focus-within:ring-sage/50 focus-within:ring-offset-2"
                >
                  <input
                    id={id}
                    type="checkbox"
                    value={option}
                    checked={selectedCategories.includes(option)}
                    onChange={(e) => {
                      const current = selectedCategories;
                      if (e.target.checked) {
                        form.setValue("categories", [...current, option]);
                      } else {
                        form.setValue("categories", current.filter((c) => c !== option));
                      }
                    }}
                    className="h-4 w-4 rounded border-sage text-brand focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    aria-hidden="false"
                  />
                  {option}
                </label>
              );
            })}
          </div>
          {form.formState.errors.categories && (
            <p className="text-small text-red-600">{form.formState.errors.categories.message}</p>
          )}
        </div>

        <FormField
          label="Additional message"
          id="message"
        >
          <Textarea
            {...form.register("message")}
            rows={4}
            placeholder="Share anything else we should know about your classes or goals."
          />
        </FormField>

        <FormField
          label="Photo uploads (up to 3)"
          id={photosId}
          helpText="Attach up to three JPG, PNG, or WEBP files (maximum 2 MB each)."
        >
          <input
            {...form.register("photos")}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
          />
        </FormField>
        {fileSummary ? (
          <p className="text-small text-text-tertiary">Selected: {fileSummary}</p>
        ) : null}

        <div className="space-y-3">
          <label htmlFor="newsletter_optin" className="flex items-start gap-3 text-small text-text-primary">
            <input
              id="newsletter_optin"
              type="checkbox"
              {...form.register("newsletter_optin")}
              className="mt-1 h-4 w-4 rounded border-sage text-brand focus:ring-sage"
            />
            <span>
              Keep me updated with Parent Helper news and tips for growing our classes.
            </span>
          </label>

          <label className="flex items-start gap-3 text-small text-text-primary" htmlFor={privacyAcceptedId}>
            <input
              id={privacyAcceptedId}
              type="checkbox"
              {...form.register("privacy_accepted")}
              className="mt-1 h-4 w-4 rounded border-sage text-brand focus:ring-sage"
            />
            {form.formState.errors.privacy_accepted && (
              <span className="text-red-600">{form.formState.errors.privacy_accepted.message}</span>
            )}
            <span>
              I agree to the Parent Helper privacy policy and consent to being contacted about my listing.
            </span>
          </label>
        </div>

        <input type="hidden" {...form.register("userAgent")} value={userAgent} readOnly />
        <input type="hidden" {...form.register("ip")} value="" readOnly />
        <input type="text" {...form.register("_botcheck")} className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-slateSoft">
            By submitting this form, you consent to our team contacting you about onboarding to Parent Helper.
          </p>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingLabel="Submitting form"
            disabled={isSubmitting}
            aria-label={isSubmitting ? "Submitting form" : "Submit details"}
          >
            {isSubmitting ? "Submitting…" : "Submit details"}
          </Button>
        </div>
      </form>
      </FormProvider>
    </section>
  );
}

function UpsellCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-sage/20 bg-surface/60 p-6 shadow-card">
      <h3 className="text-title text-text-primary">{title}</h3>
      <p className="mt-2 text-small text-slateSoft">{description}</p>
    </div>
  );
}


