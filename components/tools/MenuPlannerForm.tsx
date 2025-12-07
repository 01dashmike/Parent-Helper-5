"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { useFormState } from "react-dom";
import { generatePlan, savePlan, emailPlan } from "@/app/tools/menu-planner/actions";
import { MENU_CUISINE_OPTIONS, type GeneratePlanState, type MenuPlan } from "@/app/tools/menu-planner/schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/errormessage";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: GeneratePlanState = { status: "idle" };

const otpEmailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type OtpEmailFormData = z.infer<typeof otpEmailFormSchema>;

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

type AsyncStatus = "idle" | "loading" | "success" | "error";

export default function MenuPlannerForm() {
  const [state, formAction] = useFormState(generatePlan, initialState);
  const plan = state.status === "success" ? state.plan : null;

  const [saveStatus, setSaveStatus] = useState<AsyncStatus>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<AsyncStatus>("idle");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [showOtpPrompt, setShowOtpPrompt] = useState(false);
  const [otpStatus, setOtpStatus] = useState<AsyncStatus>("idle");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const otpForm = useForm<OtpEmailFormData>({
    resolver: zodResolver(otpEmailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setIsAuthenticated(Boolean(session));
      if (session?.user?.email) {
        emailForm.setValue("email", session.user.email);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      if (session?.user?.email) {
        emailForm.setValue("email", session.user.email);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (state.status === "error") {
      setSaveStatus("idle");
      setSaveMessage(null);
    }
  }, [state.status]);

  const handleSave = () => {
    if (!plan) return;
    if (!isAuthenticated) {
      setShowOtpPrompt(true);
      setOtpStatus("idle");
      setOtpMessage(null);
      return;
    }
    setSaveStatus("loading");
    setSaveMessage(null);
    startTransition(() => {
      savePlan(JSON.stringify(plan)).then((result) => {
        if (result.ok) {
          setSaveStatus("success");
          setSaveMessage(result.message ?? "Plan saved.");
        } else {
          setSaveStatus("error");
          setSaveMessage(result.message ?? "Unable to save the plan.");
        }
      });
    });
  };

  const onEmailSubmit = async (data: EmailFormData) => {
    if (!plan) return;
    setEmailStatus("loading");
    setEmailMessage(null);
    startTransition(() => {
      emailPlan(JSON.stringify(plan), data.email).then((result) => {
        if (result.ok) {
          setEmailStatus("success");
          setEmailMessage(result.message ?? "Plan emailed successfully.");
        } else {
          setEmailStatus("error");
          setEmailMessage(result.message ?? "Unable to email the plan.");
        }
      });
    });
  };

  const onOtpSubmit = async (data: OtpEmailFormData) => {
    if (!supabase) return;
    setOtpStatus("loading");
    setOtpMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/tools/menu-planner`,
          shouldCreateUser: true,
        },
      });
      if (error) {
        setOtpStatus("error");
        setOtpMessage(error.message ?? "Unable to send login link.");
        return;
      }
      setOtpStatus("success");
      setOtpMessage("Check your email for the login link. Once signed in, press Save again.");
    } catch (error: unknown) {
      console.error("[MenuPlannerForm] Unexpected error:", error);
      setOtpStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Unexpected error. Try again shortly.";
      setOtpMessage(errorMessage);
    }
  };

  const resetEmailForm = () => {
    setShowEmailForm((prev) => !prev);
    setEmailStatus("idle");
    setEmailMessage(null);
  };

  return (
    <div className="space-y-10">
      <form
        action={formAction}
        className="space-y-8 rounded-hero border border-sage/20 bg-surface-alt p-6 shadow-soft md:p-8"
        aria-busy={isPending}
      >
        <h2 className="text-title font-semibold text-text-primary">Tell us about your household</h2>
        <p className="text-small text-text-tertiary">
          We&apos;ll assemble a 7-day menu with breakfasts, lunches, dinners, and a consolidated shopping list.
        </p>

        {state.status === "error" && (
          <ErrorMessage
            error={state.message}
            onRetry={() => {
              // Reset error state and retry - formAction will handle reset
              formAction(new FormData());
            }}
          />
        )}

        <div className="grid gap-section md:grid-cols-2">
          <label className="input-label flex flex-col gap-2">
            Household size
            <input
              name="householdSize"
              type="number"
              min={1}
              max={10}
              defaultValue={4}
              required
              className="input input-lg"
            />
          </label>

          <label className="input-label flex flex-col gap-2">
            Ages (optional)
            <input
              name="ages"
              type="text"
              placeholder="e.g. 2, 5, 34, 36"
              className="input input-lg"
            />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-small font-medium text-text-primary">
            Favourite cuisines (pick a few that your household enjoys)
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {MENU_CUISINE_OPTIONS.map((cuisine) => (
              <label
                key={cuisine}
                className="flex items-center gap-3 rounded-hero border border-sage/25 bg-surface/50 px-4 py-2 text-small text-text-primary transition hover:border-sage/60"
              >
                <input
                  type="checkbox"
                  name="cuisines"
                  value={cuisine}
                  className="h-4 w-4 rounded border-sage/50 text-brand focus:ring-sage/60"
                />
                {cuisine}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="input-label flex flex-col gap-2">
          Allergies or ingredients to avoid
          <textarea
            name="dislikes"
            rows={3}
            placeholder="List allergens, strong dislikes, or anything to avoid (comma separated)"
            className="input"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-small font-medium text-text-primary">
            Grocery budget focus
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Value-friendly", value: "value", description: "Emphasises budget staples and batch cooking." },
              { label: "Balanced", value: "balanced", description: "Mix of cost-conscious and occasional treats." },
              { label: "Premium", value: "premium", description: "More specialty ingredients and elevated dishes." },
            ].map((option) => (
              <label
                key={option.value}
                className="flex flex-col gap-1 rounded-hero border border-sage/25 bg-surface/40 p-4 text-small text-text-primary transition hover:border-sage/60"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="budget"
                    value={option.value}
                    defaultChecked={option.value === "balanced"}
                    required
                    className="h-4 w-4 text-brand focus:ring-sage/60"
                  />
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="text-small text-text-tertiary">{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-small font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
          disabled={isPending && !plan}
          aria-disabled={isPending && !plan}
          aria-label={isPending && !plan ? "Generating menu plan" : "Generate menu plan"}
        >
          {isPending && !plan ? (
            <>
              <LoadingSpinner size="sm" label="Generating menu plan" />
              <span>Planning...</span>
            </>
          ) : (
            "Generate menu plan"
          )}
        </button>
      </form>

      {plan && (
        <PlanPreview
          plan={plan}
          saveStatus={saveStatus}
          saveMessage={saveMessage}
          emailStatus={emailStatus}
          emailMessage={emailMessage}
          emailForm={emailForm}
          showEmailForm={showEmailForm}
          onToggleEmailForm={resetEmailForm}
          onSave={handleSave}
          onEmailSubmit={onEmailSubmit}
        />
      )}

      {showOtpPrompt && (
        <div className="rounded-hero border border-sage/20 bg-surface-alt p-6 shadow-soft md:p-8">
          <h3 className="text-title font-semibold text-text-primary">Sign in to save your plan</h3>
          <p className="mt-1 text-small text-text-tertiary">
            Enter your email and we&apos;ll send a one-time login link. After confirming, return to this page and press Save.
          </p>
          <FormProvider {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <FormField
                label="Email"
                required
                error={otpForm.formState.errors.email?.message}
                id="otp-email"
                className="sm:flex-1"
              >
                <Input {...otpForm.register("email")} type="email" placeholder="you@example.com" />
              </FormField>
              <Button
                type="submit"
                disabled={otpStatus === "loading"}
                aria-label={otpStatus === "loading" ? "Sending login link" : "Send login link"}
              >
                {otpStatus === "loading" ? (
                  <>
                    <LoadingSpinner size="sm" label="Sending login link" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send login link"
                )}
              </Button>
            </form>
          </FormProvider>
          {otpMessage && (
            <p
              className={`mt-3 text-small ${
                otpStatus === "error" ? "text-terracotta" : "text-brand"
              }`}
            >
              {otpMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type PlanPreviewProps = {
  plan: MenuPlan;
  saveStatus: AsyncStatus;
  saveMessage: string | null;
  emailStatus: AsyncStatus;
  emailMessage: string | null;
  emailForm: ReturnType<typeof useForm<EmailFormData>>;
  showEmailForm: boolean;
  onToggleEmailForm: () => void;
  onSave: () => void;
  onEmailSubmit: (data: EmailFormData) => void;
};

function PlanPreview({
  plan,
  saveStatus,
  saveMessage,
  emailStatus,
  emailMessage,
  emailForm,
  showEmailForm,
  onToggleEmailForm,
  onSave,
  onEmailSubmit,
}: PlanPreviewProps) {
  return (
    <section className="space-y-6 rounded-hero border border-sage/25 bg-surface-alt p-6 shadow-soft md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-display-2 font-semibold text-text-primary">Your 7-day family menu</h2>
          <p className="text-small text-text-tertiary">
            Generated at {new Date(plan.generatedAt).toLocaleString()}. Adjust quantities to suit your household.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sage/30 px-4 py-2 text-small font-semibold text-brand transition hover:border-sage hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
            disabled={saveStatus === "loading"}
            aria-disabled={saveStatus === "loading"}
            aria-label={saveStatus === "loading" ? "Saving plan" : "Save plan"}
          >
            {saveStatus === "loading" ? (
              <>
                <LoadingSpinner size="sm" label="Saving plan" />
                <span>Saving…</span>
              </>
            ) : (
              "Save plan"
            )}
          </button>
          <button
            type="button"
            onClick={onToggleEmailForm}
            className="inline-flex items-center justify-center rounded-full border border-sage/30 px-4 py-2 text-small font-semibold text-sage transition hover:border-sage hover:bg-sage/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
          >
            Email plan
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-small font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
          >
            Print
          </button>
        </div>
      </div>

      {(saveMessage || saveStatus === "error") && (
        <p
          className={`text-small ${
            saveStatus === "error" ? "text-terracotta" : "text-brand"
          }`}
        >
          {saveMessage}
        </p>
      )}

      {showEmailForm && (
        <FormProvider {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-3 rounded-hero border border-sage/20 bg-surface/30 p-4 md:flex-row md:items-center">
            <FormField
              label="Send to"
              required
              error={emailForm.formState.errors.email?.message}
              id="email-address"
              className="flex-1"
            >
              <Input {...emailForm.register("email")} type="email" />
            </FormField>
            <Button
              type="submit"
              disabled={emailStatus === "loading"}
              aria-label={emailStatus === "loading" ? "Sending email" : "Send email"}
            >
              {emailStatus === "loading" ? (
                <>
                  <LoadingSpinner size="sm" label="Sending email" />
                  <span>Sending…</span>
                </>
              ) : (
                "Send email"
              )}
            </Button>
            {emailMessage && (
              <p
                className={`text-small ${
                  emailStatus === "error" ? "text-terracotta" : "text-brand"
                } md:ml-4`}
              >
                {emailMessage}
              </p>
            )}
          </form>
        </FormProvider>
      )}

      <div className="grid gap-section lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {plan.days.map((day) => (
            <article
              key={day.day}
              className="rounded-hero border border-sage/20 bg-cream/50 p-4 text-small text-charcoal"
            >
              <h3 className="text-title font-semibold text-charcoal">{day.day}</h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <strong>Breakfast:</strong> {day.meals.breakfast.name} – {day.meals.breakfast.description}
                </li>
                <li>
                  <strong>Lunch:</strong> {day.meals.lunch.name} – {day.meals.lunch.description}
                </li>
                <li>
                  <strong>Dinner:</strong> {day.meals.dinner.name} – {day.meals.dinner.description}
                </li>
              </ul>
            </article>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-hero border border-sage/20 bg-surface/40 p-4 text-small text-text-primary">
            <h3 className="text-title font-semibold text-text-primary">Shopping list</h3>
            <ul className="mt-3 space-y-2">
              {plan.shoppingList.map((group) => (
                <li key={group.category}>
                  <strong>{group.category}:</strong> {group.items.join(", ")}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-hero border border-sage/20 bg-surface/40 p-4 text-small text-text-primary">
            <h3 className="text-title font-semibold text-text-primary">Planner notes</h3>
            <ul className="mt-3 space-y-2">
              {plan.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-hero border border-sage/20 bg-surface/40 p-4 text-small text-text-primary">
            <h3 className="text-title font-semibold text-text-primary">Tips for the week</h3>
            <ul className="mt-3 space-y-2">
              {plan.tips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <p className="text-small text-text-tertiary">
        Dietary disclaimer: This meal planner provides general suggestions and is not medical advice. Always consult a qualified health professional for personalised guidance, especially for allergies or medical conditions.
      </p>
    </section>
  );
}

