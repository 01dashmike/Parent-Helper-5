"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

const PROVIDER_REFERRALS_ENABLED = process.env.NEXT_PUBLIC_PROVIDER_REFERRALS_ENABLED === "true";

export function ProviderReferralBanner() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!PROVIDER_REFERRALS_ENABLED) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/referral/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    referred_email: email,
                    referral_type: "provider",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send referral");
            }

            setSuccess("Invitation sent successfully!");
            setEmail("");
            setMessage("");
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(null);
            }, 2000);
        } catch (err: unknown) {
            console.error("[ProviderReferralBanner] Unexpected error:", err);
            const errorMessage = err instanceof Error ? err.message : "An error occurred";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Banner */}
            <div className="rounded-lg border border-sage/30 bg-sage/10 p-4 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-charcoal">
                            Refer another class provider and save 10% on boosting your listing
                        </h3>
                        <p className="mt-1 text-small text-slateSoft">
                            Share Parent Helper with other providers and earn a 10% discount on featured listings.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="ml-4 rounded-lg bg-sage px-4 py-2 text-small font-semibold text-white transition hover:bg-sage/90"
                    >
                        Refer Provider
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-2xl border border-sage/20 bg-white p-6 shadow-soft">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="min-h-11 min-w-11 flex items-center justify-center absolute right-4 top-4 text-slateSoft hover:text-charcoal md:min-h-0 md:min-w-0"
                            aria-label="Close referral modal"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>

                        <h2 className="text-title font-semibold text-charcoal mb-4">
                            Refer a Provider
                        </h2>

                        {error && (
                            <div className="mb-4 rounded-lg border border-terracotta/30 bg-terracotta/10 p-3 text-small text-terracotta">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 rounded-lg border border-sage/30 bg-sage/10 p-3 text-small text-forest">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-small font-medium text-charcoal mb-1">
                                    Provider Email *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="provider@example.com"
                                    required
                                    className="w-full rounded-lg border border-sage/30 bg-white px-4 py-2 text-small text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                                />
                            </div>

                            <div>
                                <label className="block text-small font-medium text-charcoal mb-1">
                                    Message (Optional)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Add a personal message..."
                                    rows={4}
                                    className="w-full rounded-lg border border-sage/30 bg-white px-4 py-2 text-small text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sage px-4 py-2 text-small font-semibold text-white transition hover:bg-sage/90 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                    {isSubmitting ? "Sending..." : "Send Invitation"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-lg border border-sage/30 bg-white px-4 py-2 text-small font-semibold text-charcoal transition hover:bg-cream"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

