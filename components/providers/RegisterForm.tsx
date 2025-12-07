"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { submitProviderLead } from "@/app/providers/actions";
import { logProviderSignupStarted, logProviderSignupSubmitted } from "@/lib/analytics";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/errormessage";

const categoriesList = [
    "Arts & Crafts",
    "Baby Massage",
    "Music & Movement",
    "Storytime & Literacy",
    "STEM & Curiosity",
    "Outdoor Adventures",
    "Wellbeing & Calm",
    "Parent Meetups",
];

const providerRegisterFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  town: z.string().min(1, "Location is required"),
  categories: z.array(z.string()).min(1, "Please select at least one category"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  gdpr: z.boolean().refine((val) => val === true, {
    message: "You must agree to the GDPR terms",
  }),
  newsletter: z.boolean().optional(),
});

type ProviderRegisterFormData = z.infer<typeof providerRegisterFormSchema>;

export default function RegisterForm() {
    const searchParams = useSearchParams();
    const referralCode = searchParams?.get('ref');
    const [submitState, setSubmitState] = useState<{ status: "idle" | "success" | "error"; message?: string; fieldErrors?: Record<string, string> }>({ status: "idle" });

    const form = useForm<ProviderRegisterFormData>({
        resolver: zodResolver(providerRegisterFormSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            website: "",
            town: "",
            categories: [],
            description: "",
            gdpr: false,
            newsletter: false,
        },
    });

    useEffect(() => {
        logProviderSignupStarted({ source: "providers/register" });
    }, []);

    useEffect(() => {
        if (submitState.status === "success") {
            logProviderSignupSubmitted({
                source: "providers/register",
                categoriesCount: form.watch("categories").length,
                newsletterOptIn: form.watch("newsletter") ?? false,
                attachmentsUploaded: 0,
            });
            form.reset();
        }
    }, [submitState.status, form]);

    const toggleCategory = (category: string) => {
        const currentCategories = form.watch("categories");
        if (currentCategories.includes(category)) {
            form.setValue("categories", currentCategories.filter((c) => c !== category));
        } else {
            form.setValue("categories", [...currentCategories, category]);
        }
    };

    const onSubmit = async (data: ProviderRegisterFormData) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        if (data.phone) formData.append("phone", data.phone);
        if (data.website) formData.append("website", data.website);
        formData.append("town", data.town);
        data.categories.forEach((cat) => formData.append("categories", cat));
        formData.append("description", data.description);
        formData.append("gdpr", "true");
        if (data.newsletter) formData.append("newsletter", "true");
        if (referralCode) formData.append('ref', referralCode);

        // Handle file uploads separately
        const logoInput = document.querySelector<HTMLInputElement>('input[name="logo"]');
        const galleryInput = document.querySelector<HTMLInputElement>('input[name="gallery"]');
        if (logoInput?.files?.[0]) formData.append("logo", logoInput.files[0]);
        if (galleryInput?.files) {
            Array.from(galleryInput.files).forEach((file) => {
                formData.append("gallery", file);
            });
        }

        const result = await submitProviderLead(null, formData);
        setSubmitState(result);
    };

    return (
        <FormProvider {...form}>
            <form
                id="provider-register-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 rounded-3xl border border-sage/25 bg-white p-6 shadow-soft md:p-8"
            >
                <div className="space-y-2 text-center">
                    <h1 className="text-title font-semibold md:text-display-2">Become a Parent Helper provider</h1>
                    <p className="text-small text-text-tertiary md:text-body">
                        Tell us about your classes and we&apos;ll be in touch within two working days.
                    </p>
                </div>

                {submitState.status === "success" && submitState.message && (
                    <div className="rounded-2xl border border-sage/30 bg-sage/10 p-4 text-small text-sage">
                        {submitState.message}
                    </div>
                )}

                {submitState.status === "error" && submitState.message && (
                    <ErrorMessage error={submitState.message} />
                )}

                <div className="grid gap-section md:grid-cols-2">
                    <FormField
                        label="Your name"
                        required
                        error={form.formState.errors.name?.message || submitState.fieldErrors?.name}
                        id="name"
                    >
                        <Input {...form.register("name")} placeholder="Jane Doe" autoComplete="name" />
                    </FormField>

                    <FormField
                        label="Email address"
                        required
                        error={form.formState.errors.email?.message || submitState.fieldErrors?.email}
                        id="email"
                    >
                        <Input {...form.register("email")} type="email" placeholder="hello@yourclasses.co.uk" autoComplete="email" />
                    </FormField>

                    <FormField
                        label="Phone number"
                        error={form.formState.errors.phone?.message || submitState.fieldErrors?.phone}
                        id="phone"
                        helpText="Optional — helps us follow up if we have a quick question."
                    >
                        <Input {...form.register("phone")} type="tel" placeholder="+44 7123 456789" autoComplete="tel" />
                    </FormField>

                    <FormField
                        label="Website or social link"
                        error={form.formState.errors.website?.message || submitState.fieldErrors?.website}
                        id="website"
                        helpText="Share your main booking link or Instagram."
                    >
                        <Input {...form.register("website")} type="url" placeholder="https://yourclasses.co.uk" />
                    </FormField>

                    <FormField
                        label="Where do you run classes?"
                        required
                        error={form.formState.errors.town?.message || submitState.fieldErrors?.town}
                        id="town"
                        className="md:col-span-2"
                    >
                        <Input {...form.register("town")} placeholder="e.g. Manchester, Trafford, Stockport" />
                    </FormField>
                </div>

                <fieldset className="space-y-4">
                    <legend className="text-small font-medium text-charcoal">
                        What type of classes do you run? *
                    </legend>
                    <div className="grid gap-3 md:grid-cols-2">
                        {categoriesList.map((category) => (
                            <label
                                key={category}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-small transition hover:border-sage/60 ${
                                    form.watch("categories").includes(category) ? "border-sage bg-sage/10" : "border-sage/20 bg-white"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={form.watch("categories").includes(category)}
                                    onChange={() => toggleCategory(category)}
                                    className="h-4 w-4 rounded border-sage text-sage focus:ring-sage"
                                />
                                {category}
                            </label>
                        ))}
                    </div>
                    {(form.formState.errors.categories || submitState.fieldErrors?.categories) && (
                        <p className="text-small text-red-600" role="alert">
                            {form.formState.errors.categories?.message || submitState.fieldErrors?.categories}
                        </p>
                    )}
                    {!form.formState.errors.categories && !submitState.fieldErrors?.categories && (
                        <p className="text-small text-charcoal/50">
                            Select all that apply — families love to browse by activity type.
                        </p>
                    )}
                </fieldset>

                <FormField
                    label="Tell us about your sessions"
                    required
                    error={form.formState.errors.description?.message || submitState.fieldErrors?.description}
                    id="description"
                    helpText="Minimum 30 characters. We'll use this to draft your live listing."
                >
                    <Textarea {...form.register("description")} rows={5} placeholder="Share who your classes are for, the experience you provide, and what parents love most about joining." />
                </FormField>

            <fieldset className="space-y-4">
                <legend className="text-small font-medium text-charcoal">
                    Upload your logo and class images
                </legend>
                <div className="grid gap-card md:grid-cols-2">
                    <label className="input-label block rounded-2xl border border-sage/25 bg-white/70 p-4">
                        Logo (PNG or JPG, max 5MB)
                        <input
                            type="file"
                            name="logo"
                            accept="image/png,image/jpeg,image/webp"
                            className="input mt-2 block w-full text-small text-text-tertiary file:mr-3 file:rounded-full file:border-0 file:bg-sage file:px-4 file:py-2 file:text-small file:font-semibold file:text-white file:hover:bg-sage/90"
                        />
                    </label>
                    <label className="input-label block rounded-2xl border border-sage/25 bg-white/70 p-4">
                        Gallery images (up to 3, PNG or JPG, max 5MB each)
                        <input
                            type="file"
                            name="gallery"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            className="input mt-2 block w-full text-small text-text-tertiary file:mr-3 file:rounded-full file:border-0 file:bg-sage file:px-4 file:py-2 file:text-small file:font-semibold file:text-white file:hover:bg-sage/90"
                        />
                    </label>
                </div>
                <p className="text-small text-charcoal/50">
                    We’ll resize and optimise images for you. Add families enjoying your sessions if you have
                    consent.
                </p>
            </fieldset>

                <fieldset className="space-y-4">
                    <label className="flex items-start gap-3 rounded-2xl border border-sage/25 bg-white/80 px-4 py-3 text-small text-charcoal">
                        <input
                            type="checkbox"
                            {...form.register("gdpr")}
                            className="mt-1 h-5 w-5 rounded border-sage text-sage focus:ring-sage"
                        />
                        <span>
                            I agree to Parent Helper storing my details to process this application and contact me
                            about onboarding. *
                        </span>
                    </label>
                    {form.formState.errors.gdpr && (
                        <p className="text-small text-red-600" role="alert">
                            {form.formState.errors.gdpr.message}
                        </p>
                    )}

                    <label className="flex items-start gap-3 rounded-2xl border border-sage/15 bg-white/70 px-4 py-3 text-small text-charcoal/80">
                        <input
                            type="checkbox"
                            {...form.register("newsletter")}
                            className="mt-1 h-5 w-5 rounded border-sage text-sage focus:ring-sage"
                        />
                        <span>Send me provider updates, marketing support, and new feature releases.</span>
                    </label>
                </fieldset>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Submitting…" : "Submit my details"}
                    </Button>
                <p className="text-small text-charcoal/50 md:text-right">
                    We usually reply within two working days. Questions? Email{" "}
                    <a
                        href="mailto:hello@parenthelper.co.uk"
                        className="text-sage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Email hello@parenthelper.co.uk (opens email client)"
                    >
                        hello@parenthelper.co.uk
                    </a>
                    .
                </p>
            </div>
        </form>
        </FormProvider>
    );
}

