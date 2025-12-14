"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestWellnessOtpAction, verifyWellnessOtpAction } from "../../actions";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export default function WellnessLoginForm() {
  const [phase, setPhase] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
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
      const result = await verifyWellnessOtpAction(null, formData);

      if (result.status === "success") {
        setVerifyMessage(result.message || "Signed in successfully!");
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
        <p className="font-medium text-charcoal">How it works</p>
        <ol className="mt-3 space-y-2 list-decimal pl-6">
          <li>Enter your email address.</li>
          <li>We&apos;ll send a secure 6-digit code to your inbox.</li>
          <li>Enter the code to access your wellness dashboard.</li>
        </ol>
      </div>

      <div className="space-y-4">
        <form onSubmit={onEmailSubmit} className="space-y-3">
          <FormField
            label="Email address"
            required
            error={emailForm.formState.errors.email?.message}
            id="wellness-email"
          >
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...emailForm.register("email")}
            />
          </FormField>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Sending…" : phase === "otp" ? "Resend code" : "Send login code"}
          </Button>
          {requestMessage && (
            <StatusMessage 
              message={requestMessage} 
              isError={requestError} 
              id="status-wellness-email" 
            />
          )}
        </form>

        {phase === "otp" && (
          <form onSubmit={onOtpSubmit} className="space-y-3">
            <FormField
              label="6-digit code"
              required
              error={otpForm.formState.errors.token?.message}
              id="wellness-otp"
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
              {isSubmitting ? "Verifying…" : "Verify & sign in"}
            </Button>
            {verifyMessage && (
              <StatusMessage 
                message={verifyMessage} 
                isError={verifyError} 
                id="status-wellness-otp" 
              />
            )}
            <p className="text-sm text-charcoal/60">
              Didn&apos;t get the email? Check your spam folder or click &ldquo;Resend code&rdquo;
              above.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
