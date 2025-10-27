"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/trackEvent";

const STORAGE_KEY = "ph_newsletter_seen";

const initialForm = {
  email: "",
  name: "",
  postcode: "",
  child1: "",
  child2: "",
};

export function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { toast } = useToast();

  const storage = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }, []);

  const markSeen = () => {
    if (storage) {
      storage.setItem(STORAGE_KEY, "true");
    } else if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen =
      (storage && storage.getItem(STORAGE_KEY)) ||
      (!storage && window.localStorage.getItem(STORAGE_KEY));
    if (seen) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      markSeen();
      trackEvent("newsletter_impression");
    }, 3000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      markSeen();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email) return;

    setSubmitting(true);
    try {
      const utmData =
        typeof window !== "undefined" ? window.localStorage.getItem("ph_utm_data") : null;
      const geoData =
        typeof window !== "undefined" ? window.localStorage.getItem("ph_geo_data") : null;
      let parsedUTM: Record<string, unknown> = {};
      if (utmData) {
        try {
          parsedUTM = JSON.parse(utmData);
        } catch (error) {
          console.warn("[newsletter] failed to parse stored UTM", error);
        }
      }
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-utm-data": utmData || "{}",
          "x-geo-data": geoData || "{}",
        },
        body: JSON.stringify({ email: form.email, postcode: form.postcode || undefined }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        const location = result?.location;
        if (location && typeof window !== "undefined") {
          window.localStorage.setItem("ph_geo_data", JSON.stringify(location));
        }
        toast({
          title: "You're subscribed!",
          description: "Welcome to Parent Helper Weekly.",
        });
        markSeen();
        setOpen(false);
        setForm(initialForm);
        trackEvent("newsletter_signup", {
          email: form.email,
          postcode: form.postcode,
          source: (parsedUTM.utm_source as string | undefined) || "popup",
        });
      } else if (response.status === 409) {
        toast({
          title: "Already subscribed?",
          description: result?.error ?? "That email is already on our list.",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: result?.error ?? "Could not subscribe. Please try again later.",
        });
      }
    } catch (error) {
      console.error("[newsletter] subscribe error", error);
      toast({
        title: "Network error",
        description: "Could not subscribe. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="m-4 w-[min(95vw,720px)] overflow-hidden rounded-3xl border-none bg-brand-cream p-0 shadow-2xl md:m-0">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2"
            >
              <div className="flex flex-col justify-center gap-6 px-6 py-8 sm:px-10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-brand-teal">
                    Looking for baby & toddler classes?
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-brand-lavender">
                    Sign up for your personalised weekly newsletter — local activities sent every
                    Sunday night 💌
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    placeholder="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                  <Input
                    placeholder="First name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                  <Input
                    placeholder="Your postcode"
                    value={form.postcode}
                    onChange={(event) => setForm({ ...form, postcode: event.target.value })}
                  />
                  <Input
                    placeholder="Youngest child – date of birth"
                    type="date"
                    value={form.child1}
                    onChange={(event) => setForm({ ...form, child1: event.target.value })}
                  />
                  <Input
                    placeholder="Child 2 – date of birth (if applicable)"
                    type="date"
                    value={form.child2}
                    onChange={(event) => setForm({ ...form, child2: event.target.value })}
                  />
                  <p className="text-xs leading-relaxed text-brand-lavender">
                    By submitting this form, you agree to our{" "}
                    <a
                      href="/privacy"
                      className="underline decoration-brand-teal decoration-2 underline-offset-2 transition hover:text-brand-coral"
                    >
                      Privacy Policy
                    </a>
                    . You can unsubscribe anytime.
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="default"
                    className="w-full bg-brand-coral hover:bg-brand-teal"
                  >
                    {submitting ? "Signing Up..." : "Sign Up"}
                  </Button>
                </form>
              </div>

              <div className="relative hidden md:block">
                <Image
                  src="/newsletter-baby.jpg"
                  alt="Parent cuddling a smiling baby"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      ) : null}
    </AnimatePresence>
  );
}
