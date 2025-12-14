"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestWellnessOtpAction, verifyWellnessOtpAction } from "../../actions";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address").min(5, "Email is required"),
});

const otpSchema = z.object({
  email: z.string().email("Email is required"),
  token: z.string().length(6, "Enter the 6-digit code").regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

function StatusMessage({ message, isError, id }: { message?: string; isError: boolean; id: string }) {
  if (!message) return null;

  const tone = isError
    ? "border-terracotta/40 bg-terracotta/10 text-terracotta/80"
    : "border-sage/40 bg-sage/10 text-sage/80";

  return (
    <p 
      id={id}
      className={`rounded-lg border px-3 py-2 text-sm ${tone}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {message}
    </p>
  );
}

export default function WellnessRegisterForm() {
  const [phase, setPhase] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [accountabilityOptIn, setAccountabilityOptIn] = useState(false);
  const [accountabilityFrequency, setAccountabilityFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", token: "" },
  });

  useEffect(() => {
    if (phase === "otp") {
      otpForm.setValue("email", email);
    }
  }, [phase, email, otpForm]);

  const onEmailSubmit = emailForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setRequestMessage(null);
    setRequestError(false);

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      const result = await requestWellnessOtpAction(null, formData);

      if (result.status === "success") {
        setEmail(result.email || data.email);
        setPhase("otp");
        setRequestMessage(result.message || "Check your inbox for the 6-digit code.");
      } else {
        setRequestError(true);
        setRequestMessage(result.message || "Something went wrong. Please try again.");
        emailForm.setError("email", { message: result.message || "Failed to send code" });
      }
    } catch (error) {
      setRequestError(true);
      setRequestMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const onOtpSubmit = otpForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setVerifyMessage(null);
    setVerifyError(false);

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("token", data.token);
      formData.append("newsletter", newsletterOptIn ? "true" : "false");
      formData.append("accountability", accountabilityOptIn ? "true" : "false");
      formData.append("frequency", accountabilityFrequency);
      
      const result = await verifyWellnessOtpAction(null, formData);

      if (result.status === "success") {
        setVerifyMessage(result.message || "Account created successfully!");
        // Redirect handled by server action
      } else {
        setVerifyError(true);
        setVerifyMessage(result.message || "Invalid or expired code.");
        otpForm.setError("token", { message: result.message || "Invalid code" });
      }
    } catch (error) {
      setVerifyError(true);
      setVerifyMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-sage/30 bg-cream/40 p-4 text-sm text-charcoal/80">
        <p className="font-medium text-charcoal">Why create an account?</p>
        <ul className="mt-3 space-y-2 list-disc pl-6">
          <li>Save your wellness preferences</li>
          <li>Access your plans from any device</li>
          <li>Get optional accountability emails</li>
          <li>Receive personalized recommendations</li>
        </ul>
      </div>

      <div className="space-y-4">
        {phase === "email" && (
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <FormField
              label="Email address"
              required
              error={emailForm.formState.errors.email?.message}
              id="wellness-register-email"
            >
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...emailForm.register("email")}
              />
            </FormField>

            {/* Newsletter opt-in */}
            <div className="flex items-start gap-3 rounded-lg border border-sage/20 bg-sage/5 p-4">
              <Checkbox
                id="newsletter"
                checked={newsletterOptIn}
                onCheckedChange={(checked) => setNewsletterOptIn(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="newsletter" className="text-sm font-medium text-charcoal cursor-pointer">
                  Subscribe to our wellness newsletter
                </Label>
                <p className="mt-1 text-xs text-charcoal/70">
                  Get tips, recipes, and wellness inspiration delivered to your inbox
                </p>
              </div>
            </div>

            {/* Accountability emails opt-in */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-sage/20 bg-sage/5 p-4">
                <Checkbox
                  id="accountability"
                  checked={accountabilityOptIn}
                  onCheckedChange={(checked) => setAccountabilityOptIn(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="accountability" className="text-sm font-medium text-charcoal cursor-pointer">
                    Enable accountability emails
                  </Label>
                  <p className="mt-1 text-xs text-charcoal/70">
                    Get regular check-ins to help you stay on track with your wellness goals
                  </p>
                </div>
              </div>

              {accountabilityOptIn && (
                <div className="ml-7 space-y-2">
                  <Label className="text-xs font-medium text-charcoal">
                    How often would you like to hear from us?
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { value: "weekly", label: "Weekly" },
                      { value: "biweekly", label: "Bi-weekly" },
                      { value: "monthly", label: "Monthly" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAccountabilityFrequency(option.value as any)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          accountabilityFrequency === option.value
                            ? "border-sage bg-sage text-white"
                            : "border-sage/30 bg-white text-charcoal hover:border-sage/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Sending…" : "Create account"}
            </Button>
            {requestMessage && (
              <StatusMessage 
                message={requestMessage} 
                isError={requestError} 
                id="status-wellness-register-email" 
              />
            )}
          </form>
        )}

        {phase === "otp" && (
          <form onSubmit={onOtpSubmit} className="space-y-3">
            <FormField
              label="6-digit code"
              required
              error={otpForm.formState.errors.token?.message}
              id="wellness-register-otp"
            >
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                className="tracking-[0.4em] text-center"
                placeholder="123456"
                {...otpForm.register("token")}
              />
            </FormField>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Verifying…" : "Verify & create account"}
            </Button>
            {verifyMessage && (
              <StatusMessage 
                message={verifyMessage} 
                isError={verifyError} 
                id="status-wellness-register-otp" 
              />
            )}
            <p className="text-sm text-charcoal/60">
              Didn&apos;t get the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => setPhase("email")}
                className="font-medium text-sage hover:underline"
              >
                try again
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
