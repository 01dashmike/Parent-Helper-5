"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { isNewsletterEnabled } from "@/lib/env";

const STORAGE_KEY = "newsletterDismissed";

const newsletterFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type NewsletterFormData = z.infer<typeof newsletterFormSchema>;

// Helper to check if we're in browser environment
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function shouldShowModal(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

export default function NewsletterModal() {
  const [open, setOpen] = useState(false);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const close = useCallback(() => {
    setOpen(false);
    form.reset();
    if (isBrowser()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore storage errors
      }
    }
  }, [form]);

  useEffect(() => {
    // Only show modal if newsletter feature is enabled
    if (!isBrowser() || !isNewsletterEnabled()) return;
    if (!shouldShowModal()) return;

    const timer = window.setTimeout(() => setOpen(true), 5000);

    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const halfPage = document.body.scrollHeight * 0.5;
      if (scrolled >= halfPage) {
        setOpen(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: effect should only run once on mount to set up scroll listener
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;

    const handleManualOpen = () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      setOpen(true);
    };

    window.addEventListener("newsletter:open", handleManualOpen);
    return () => {
      window.removeEventListener("newsletter:open", handleManualOpen);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: effect should only run once on mount to set up custom event listener
  }, []);

  const onSubmit = async (_data: NewsletterFormData) => {
    // Handle newsletter subscription
    // This would typically call an API endpoint
    close();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) close();
      }}
      title="Join the Parent Helper Family"
      description="Weekly inspiration, gentle reminders, and curated activities for your family inbox."
      size="lg"
      overlayClassName="z-[120]"
    >
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Email address"
                required
                error={form.formState.errors.email?.message}
                id="newsletter-email"
              >
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </FormField>
              <Button
                type="submit"
                size="lg"
                variant="default"
                className="w-full"
              >
                Sign me up
              </Button>
            </form>
          </FormProvider>
    </Modal>
  );
}
