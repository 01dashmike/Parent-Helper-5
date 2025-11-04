"use client";

import { useEffect, useCallback, useState, type FormEventHandler } from "react";

const STORAGE_KEY = "newsletterDismissed";

function shouldShowModal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "true";
  } catch (error) {
    return true;
  }
}

export default function NewsletterModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch (error) {
        // ignore storage errors
      }
    }
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleManualOpen = () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        // ignore storage errors
      }
      setOpen(true);
    };

    window.addEventListener("newsletter:open", handleManualOpen);
    return () => {
      window.removeEventListener("newsletter:open", handleManualOpen);
    };
  }, []);

  if (!open) return null;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    close();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-charcoal/40 px-4 py-10 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl bg-cream p-8 shadow-xl">
        <button
          type="button"
          onClick={close}
          className="absolute right-5 top-5 text-sm text-charcoal/50 transition hover:text-charcoal"
          aria-label="Close newsletter sign-up"
        >
          ✕
        </button>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-charcoal">
            Join the Parent Helper Family
          </h2>
          <p className="text-charcoal/70">
            Weekly inspiration, gentle reminders, and curated activities for your family inbox.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-charcoal">
              Email address
              <input
                type="email"
                name="email"
                required
                className="mt-2 w-full rounded-full border border-sage/30 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-sage focus:outline-none focus:ring-0"
                placeholder="you@example.com"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage/90 hover:text-[#C97C5C]"
            >
              Sign me up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
