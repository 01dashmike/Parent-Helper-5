"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address").min(5, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password");
        form.setError("password", { message: authError.message || "Invalid credentials" });
        return;
      }

      if (authData?.user) {
        // Redirect to admin dashboard
        router.push("/admin");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <FormField
        label="Email address"
        required
        error={form.formState.errors.email?.message}
        id="admin-email"
      >
        <Input
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          {...form.register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        required
        error={form.formState.errors.password?.message}
        id="admin-password"
      >
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          {...form.register("password")}
        />
      </FormField>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-xs text-charcoal/60 text-center">
        Use the credentials from the seed script or your admin account.
      </p>
    </form>
  );
}
