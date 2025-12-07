"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "@/components/motion/motion-proxy";
import { RewardSelector } from "@/components/booking/RewardSelector";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/icons/tokens";
import { ErrorState } from "@/components/ui/errorstate";

const bookingFormSchema = z.object({
    parentName: z.string().min(1, "Parent name is required"),
    parentEmail: z.string().email("Valid email is required"),
    parentPhone: z.string().min(10, "Phone number is required"),
    childName: z.string().min(1, "Child name is required"),
    childAge: z.coerce.number().min(0).max(18),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const classId = searchParams?.get("classId");
    const occurrenceId = searchParams?.get("occurrenceId");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classData, setClassData] = useState<any>(null);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
    const [bookingAmountCents, setBookingAmountCents] = useState<number>(0);
    const [appliedCoupon, setAppliedCoupon] = useState<{ value_cents: number } | null>(null);
    const [walletBalanceCents, setWalletBalanceCents] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
    const [walletLoading, setWalletLoading] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingFormSchema),
    });

    useEffect(() => {
        // Validate required params
        if (!classId || !occurrenceId) {
            setError("Missing booking information. Please select a class session to book.");
            return;
        }

        // Validate IDs are numeric
        const classIdNum = parseInt(classId, 10);
        const occurrenceIdNum = parseInt(occurrenceId, 10);
        if (isNaN(classIdNum) || isNaN(occurrenceIdNum)) {
            setError("Invalid booking information. Please try again.");
            return;
        }

        // Reset form state when class/occurrence changes
        reset();
        setError(null);
        setSelectedRewardId(null);
        setSelectedCouponId(null);
        setAppliedCoupon(null);
        setPaymentMethod("card");

        // Fetch class details
        let cancelled = false;
        
        fetch(`/api/classes/${classId}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch class: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (cancelled) return;
                
                if (!data || !data.id) {
                    throw new Error("Invalid class data received");
                }
                
                setClassData(data);
                // Calculate booking amount in cents
                if (data.booking_price) {
                    setBookingAmountCents(Math.round(Number(data.booking_price) * 100));
                } else if (data.price) {
                    const priceMatch = data.price.match(/[\d.]+/);
                    if (priceMatch) {
                        setBookingAmountCents(Math.round(parseFloat(priceMatch[0]) * 100));
                    }
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Error fetching class:", err);
                setError("Failed to load class details. Please try again.");
            });

        // Fetch wallet balance (API will return error if feature disabled)
        setWalletLoading(true);
        fetch("/api/wallet/balance")
            .then((res) => {
                if (cancelled) return null;
                if (res.ok) {
                    return res.json();
                }
                // Feature disabled or not authenticated
                return null;
            })
            .then((data) => {
                if (cancelled) return;
                if (data && data.balance_cents !== undefined) {
                    setWalletBalanceCents(data.balance_cents);
                } else {
                    setWalletBalanceCents(null); // Feature disabled or not available
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Error fetching wallet balance:", err);
                setWalletBalanceCents(null);
            })
            .finally(() => {
                if (!cancelled) {
                    setWalletLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [classId, occurrenceId, router, reset]);

    const onSubmit = async (data: BookingFormData) => {
        // Validate required params
        if (!classId || !occurrenceId) {
            setError("Missing booking information. Please try again.");
            return;
        }

        // Validate IDs are numeric
        const classIdNum = parseInt(classId, 10);
        const occurrenceIdNum = parseInt(occurrenceId, 10);
        if (isNaN(classIdNum) || isNaN(occurrenceIdNum)) {
            setError("Invalid booking information. Please try again.");
            return;
        }

        if (loading) return; // Prevent double submission

        setLoading(true);
        setError(null);
        setAnnouncement('Submitting…');

        try {
            // Validate payment method
            const useWallet = paymentMethod === "wallet" && 
                             walletBalanceCents !== null && 
                             walletBalanceCents >= bookingAmountCents;

            if (paymentMethod === "wallet" && (!walletBalanceCents || walletBalanceCents < bookingAmountCents)) {
                throw new Error("Insufficient wallet balance. Please select card payment.");
            }

            const endpoint = useWallet ? "/api/book/start-with-wallet" : "/api/book/start";
            
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: classIdNum,
                    occurrenceId: occurrenceIdNum,
                    ...data,
                    reward_id: selectedRewardId || undefined,
                    coupon_id: selectedCouponId || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(errorData.error || `Failed to start booking (${response.status})`);
            }

            const result = await response.json();

            if (!result) {
                throw new Error("Invalid response from server");
            }

            setAnnouncement('Saved');
            if (useWallet) {
                // Wallet payment - redirect to confirmation page
                if (result.bookingId) {
                    router.push(`/book/thank-you?booking_id=${result.bookingId}&payment_method=wallet`);
                } else {
                    throw new Error("Booking ID not received");
                }
            } else {
                // Stripe Checkout
                if (result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    throw new Error("No checkout URL received");
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
            setError(errorMessage);
            setAnnouncement('Error saving changes');
            setLoading(false);
        }
    };

    if (!classId || !occurrenceId) {
        return (
            <div className="min-h-screen bg-surface px-4 py-10">
                <div className="mx-auto max-w-2xl">
                    <ErrorState
                        message="Missing booking information. Please select a class session to book."
                        homeHref="/"
                    />
                </div>
            </div>
        );
    }

    return (
        <div aria-labelledby="page-title" className="min-h-screen bg-surface px-4 py-6 sm:py-10">
            <noscript>
                <div className="mx-auto max-w-2xl mb-4 rounded-lg border border-sage/30 bg-brand/10 px-4 py-3 text-small text-text-primary">
                    <p className="font-medium mb-1">JavaScript is disabled</p>
                    <p>Online booking requires JavaScript to process payments securely. Please enable JavaScript or contact the provider directly to book.</p>
                </div>
            </noscript>
            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-sage/20 bg-surface-alt p-4 shadow-xl sm:p-8"
                >
                    <h1 id="page-title" className="text-title font-semibold text-text-primary">Complete Your Booking</h1>

                    {classData ? (
                        <div className="mt-4 rounded-lg border border-sage/20 bg-surface/30 p-4">
                            <h2 className="font-semibold text-text-primary">{classData.name || classData.title || "Class"}</h2>
                            <div className="mt-2 flex items-baseline gap-2">
                                {classData.price && (
                                    <p className={cn("text-title font-semibold", selectedCouponId ? "text-slateSoft line-through" : "text-brand")}>
                                        {classData.price}
                                    </p>
                                )}
                                {selectedCouponId && appliedCoupon && (
                                    <p className="text-title font-semibold text-green-600">
                                        {classData.booking_price 
                                            ? `£${(Number(classData.booking_price) - (appliedCoupon.value_cents / 100)).toFixed(2)}`
                                            : "Discount applied"}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-lg border border-sage/20 bg-surface/30 p-4">
                            <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-2">
                                <div className="h-4 w-3/4 rounded bg-sage/20"></div>
                                <div className="h-4 w-1/2 rounded bg-sage/20"></div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="form-error" role="alert">
                            <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                            <p id="error-form" className="form-error-text">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        <div className="sr-only" aria-live="assertive" aria-atomic="true">
                            {announcement}
                        </div>
                        <div>
                            <label htmlFor="parentName" className="block text-small font-medium text-text-primary">Parent Name *</label>
                            <input
                                id="parentName"
                                {...register("parentName")}
                                type="text"
                                className="ph-input mt-1 w-full"
                                placeholder="Your full name"
                                autoComplete="name"
                                tabIndex={0}
                                aria-describedby={errors.parentName ? "error-parentName" : undefined}
                                aria-invalid={errors.parentName ? "true" : "false"}
                            />
                            {errors.parentName && (
                                <div className="form-error" role="alert">
                                    <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                                    <p id="error-parentName" className="form-error-text">{errors.parentName.message}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="parentEmail" className="block text-small font-medium text-text-primary">Email *</label>
                            <input
                                id="parentEmail"
                                {...register("parentEmail")}
                                type="email"
                                className="ph-input mt-1 w-full"
                                placeholder="your.email@example.com"
                                autoComplete="email"
                                tabIndex={0}
                                aria-describedby={errors.parentEmail ? "error-parentEmail" : undefined}
                                aria-invalid={errors.parentEmail ? "true" : "false"}
                            />
                            {errors.parentEmail && (
                                <div className="form-error" role="alert">
                                    <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                                    <p id="error-parentEmail" className="form-error-text">{errors.parentEmail.message}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="parentPhone" className="block text-small font-medium text-text-primary">Phone *</label>
                            <input
                                id="parentPhone"
                                {...register("parentPhone")}
                                type="tel"
                                className="ph-input mt-1 w-full"
                                placeholder="07123 456789"
                                autoComplete="tel"
                                tabIndex={0}
                                aria-describedby={errors.parentPhone ? "error-parentPhone" : undefined}
                                aria-invalid={errors.parentPhone ? "true" : "false"}
                            />
                            {errors.parentPhone && (
                                <div className="form-error" role="alert">
                                    <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                                    <p id="error-parentPhone" className="form-error-text">{errors.parentPhone.message}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="childName" className="block text-small font-medium text-charcoal">Child Name *</label>
                            <input
                                id="childName"
                                {...register("childName")}
                                type="text"
                                className="ph-input mt-1 w-full"
                                placeholder="Child's name"
                                tabIndex={0}
                                aria-describedby={errors.childName ? "error-childName" : undefined}
                                aria-invalid={errors.childName ? "true" : "false"}
                            />
                            {errors.childName && (
                                <div className="form-error" role="alert">
                                    <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                                    <p id="error-childName" className="form-error-text">{errors.childName.message}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="childAge" className="block text-small font-medium text-charcoal">Child Age *</label>
                            <input
                                id="childAge"
                                {...register("childAge", { valueAsNumber: true })}
                                type="number"
                                min="0"
                                max="18"
                                className="ph-input mt-1 w-full"
                                placeholder="Age"
                                tabIndex={0}
                                aria-describedby={errors.childAge ? "error-childAge" : undefined}
                                aria-invalid={errors.childAge ? "true" : "false"}
                            />
                            {errors.childAge && (
                                <div className="form-error" role="alert">
                                    <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                                    <p id="error-childAge" className="form-error-text">{errors.childAge.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Reward Selector */}
                        {bookingAmountCents > 0 && (
                            <div className="mt-4">
                                <RewardSelector
                                    onRewardSelected={(rewardId, couponId, couponValue) => {
                                        setSelectedRewardId(rewardId);
                                        setSelectedCouponId(couponId);
                                        setAppliedCoupon(couponValue ? { value_cents: couponValue } : null);
                                    }}
                                    bookingAmountCents={bookingAmountCents}
                                />
                            </div>
                        )}

                        {/* Payment Method Selection */}
                        {walletBalanceCents !== null && bookingAmountCents > 0 && (
                            <div className="mt-6 space-y-3">
                                <label className="block text-small font-medium text-charcoal">Payment Method</label>
                                
                                {/* Wallet Option */}
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-lg border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-sage/50",
                                        paymentMethod === "wallet"
                                            ? "border-sage bg-sage/10"
                                            : "border-gray-200 hover:border-gray-300",
                                        walletBalanceCents < bookingAmountCents && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={() => {
                                        if (walletBalanceCents >= bookingAmountCents) {
                                            setPaymentMethod("wallet");
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if ((e.key === "Enter" || e.key === " ") && walletBalanceCents >= bookingAmountCents) {
                                            e.preventDefault();
                                            setPaymentMethod("wallet");
                                        }
                                    }}
                                    tabIndex={walletBalanceCents >= bookingAmountCents ? 0 : -1}
                                    role="radio"
                                    aria-checked={paymentMethod === "wallet"}
                                    aria-label="Pay with Family Wallet"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                checked={paymentMethod === "wallet"}
                                                onChange={() => setPaymentMethod("wallet")}
                                                disabled={walletBalanceCents < bookingAmountCents}
                                                className="h-4 w-4 text-sage"
                                                tabIndex={0}
                                            />
                                            <div>
                                                <div className="font-medium text-charcoal">Pay with Family Wallet</div>
                                                <div className="text-small text-slateSoft">
                                                    Balance: £{(walletBalanceCents / 100).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        {walletBalanceCents >= bookingAmountCents && (
                                            <span className="text-small font-medium text-green-600">Available</span>
                                        )}
                                    </div>
                                    {walletBalanceCents < bookingAmountCents && (
                                        <p className="mt-2 text-smallall text-red-600">
                                            Insufficient balance. You need £{((bookingAmountCents - walletBalanceCents) / 100).toFixed(2)} more.
                                        </p>
                                    )}
                                </div>

                                {/* Card Option */}
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-lg border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-sage/50",
                                        paymentMethod === "card"
                                            ? "border-sage bg-sage/10"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                    onClick={() => setPaymentMethod("card")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setPaymentMethod("card");
                                        }
                                    }}
                                    tabIndex={0}
                                    role="radio"
                                    aria-checked={paymentMethod === "card"}
                                    aria-label="Pay with Card"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === "card"}
                                            onChange={() => setPaymentMethod("card")}
                                            className="h-4 w-4 text-sage"
                                            tabIndex={0}
                                        />
                                        <div>
                                            <div className="font-medium text-charcoal">Pay with Card</div>
                                            <div className="text-small text-slateSoft">Secure payment via Stripe</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                loading || 
                                !classData ||
                                (paymentMethod === "wallet" && walletBalanceCents !== null && walletBalanceCents < bookingAmountCents) ||
                                walletLoading
                            }
                            className="btn btn-primary btn-md mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            tabIndex={0}
                        >
                            {loading 
                                ? "Processing..." 
                                : walletLoading
                                    ? "Loading payment options..."
                                    : paymentMethod === "wallet" 
                                        ? "Complete Booking with Wallet"
                                        : "Continue to Payment"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

