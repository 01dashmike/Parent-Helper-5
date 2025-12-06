"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CalendarSelector from "@/components/bookings/CalendarSelector";
import SessionCard from "@/components/bookings/SessionCard";
import UpsellSelector from "@/components/bookings/UpsellSelector";
import BookingForm from "@/components/bookings/BookingForm";
import BookingSummary from "@/components/bookings/BookingSummary";
import CheckoutProgressBar from "@/components/bookings/CheckoutProgressBar";
import CreditRedemptionBanner from "@/components/bookings/CreditRedemptionBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import {
  createBookingAction,
  createBlockBookingAction,
  checkAvailability,
  getUpsellsForCheckout,
} from "./actions";
import { useToast } from "@/lib/hooks/useToast";
import Link from "next/link";

type BookingStep = "select_session" | "upsells" | "details" | "review" | "payment" | "complete";

type ClassData = {
  id: number;
  name: string;
  description: string;
  category: string;
  town: string;
  venue: string;
  address: string;
  ageGroupMin: number;
  ageGroupMax: number;
  price: string;
  providerId: number;
  providerName: string;
};

type UpsellItem = {
  id: number;
  title: string;
  description: string;
  price: number;
  type: "block_upgrade" | "add_on" | "subscription_offer";
  metadata: Record<string, any>;
};

type Session = {
  sessionId: number;
  startTime: string;
  endTime: string;
  capacity: number;
  seatsTaken: number;
  seatsAvailable: number;
  isAvailable: boolean;
};

type BookingSettings = {
  allowFreeBookings: boolean;
  allowDropIns: boolean;
  allowBlockBookings: boolean;
  requireChildDetails: boolean;
  requireParentPhone: boolean;
  bookingDeadlineHours: number;
};

type BookPageClientProps = {
  classData: ClassData;
  settings?: BookingSettings;
  initialSessions: Session[];
  initialUpsells: UpsellItem[];
  initialStep?: BookingStep;
  initialSessionId?: number;
  userId?: string;
};

export default function BookPageClient({
  classData,
  settings,
  initialSessions,
  initialUpsells,
  initialStep = "select_session",
  initialSessionId,
  userId,
}: BookPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<BookingStep>(initialStep);
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>(initialSessionId);
  const [selectedUpsellIds, setSelectedUpsellIds] = useState<number[]>([]);
  const [bookingType, setBookingType] = useState<"drop_in" | "block" | "free_rsvp">("drop_in");
  const [blockWeekCount, setBlockWeekCount] = useState<number>(4);
  const [bookingData, setBookingData] = useState<{
    parentFirstName: string;
    parentLastName: string;
    parentEmail: string;
    parentPhone?: string;
    children: Array<{ name: string; age: number; notes?: string; allergies?: string }>;
    notes?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const { showError, showSuccess, ToastComponent } = useToast();
  const [creditEligibility, setCreditEligibility] = useState<{
    canUseCredits: boolean;
    canUsePass: boolean;
    creditCost?: number;
    pass?: any;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"credits" | "pass" | "payment" | null>(null);

  // Update URL when step changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("step", step);
    if (selectedSessionId) {
      params.set("sessionId", selectedSessionId.toString());
    }
    router.replace(`/class/${classData.id}/book?${params.toString()}`, { scroll: false });
  }, [step, selectedSessionId, router, searchParams, classData.id]);

  // Check credit eligibility when session is selected
  useEffect(() => {
    if (selectedSessionId && userId && step !== "complete") {
      fetch(`/api/wallet/check-eligibility?classId=${classData.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCreditEligibility(data);
            // Auto-select pass if available and no credits needed
            if (data.canUsePass && !data.canUseCredits) {
              setSelectedPaymentMethod("pass");
            }
          }
        })
        .catch(console.error);
    }
  }, [selectedSessionId, classData.id, userId, step]);

  // Determine if class is free
  const isFree = classData.price.toLowerCase().includes("free") || parseFloat(classData.price.replace(/[^0-9.]/g, "")) === 0;
  const sessionPrice = isFree ? 0 : parseFloat(classData.price.replace(/[^0-9.]/g, "")) || 0;

  // Get selected session
  const selectedSession = initialSessions.find((s) => s.sessionId === selectedSessionId);

  // Get selected upsells
  const selectedUpsells = initialUpsells.filter((u) => selectedUpsellIds.includes(u.id));

  // Calculate total price
  const upsellTotal = selectedUpsells.reduce((sum, u) => sum + u.price, 0);
  const childrenCount = bookingData?.children.length || 1;
  const basePrice = isFree ? 0 : sessionPrice * childrenCount;
  const blockMultiplier = bookingType === "block" ? blockWeekCount : 1;
  const totalPrice = basePrice * blockMultiplier + upsellTotal;

  const handleSessionSelect = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    // Auto-advance to upsells if available, otherwise to details
    if (initialUpsells.length > 0 || settings?.allowBlockBookings) {
      setStep("upsells");
    } else {
      setStep("details");
    }
  };

  const handleNext = () => {
    if (step === "select_session") {
      if (!selectedSessionId) {
        showError("Please select a session");
        return;
      }
      if (initialUpsells.length > 0 || settings?.allowBlockBookings) {
        setStep("upsells");
      } else {
        setStep("details");
      }
    } else if (step === "upsells") {
      setStep("details");
    } else if (step === "details") {
      setStep("review");
    } else if (step === "review") {
      if (isFree || totalPrice === 0) {
        handleConfirmBooking();
      } else {
        setStep("payment");
      }
    }
  };

  const handleBack = () => {
    if (step === "upsells") {
      setStep("select_session");
    } else if (step === "details") {
      if (initialUpsells.length > 0 || settings?.allowBlockBookings) {
        setStep("upsells");
      } else {
        setStep("select_session");
      }
    } else if (step === "review") {
      setStep("details");
    } else if (step === "payment") {
      setStep("review");
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSessionId || !bookingData) {
      showError("Please complete all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("sessionId", selectedSessionId.toString());
      formData.append("providerId", classData.providerId.toString());
      formData.append("parentFirstName", bookingData.parentFirstName);
      formData.append("parentLastName", bookingData.parentLastName);
      formData.append("parentEmail", bookingData.parentEmail);
      if (bookingData.parentPhone) {
        formData.append("parentPhone", bookingData.parentPhone);
      }
      formData.append("children", JSON.stringify(bookingData.children));
      formData.append("bookingType", bookingType);
      formData.append("notes", bookingData.notes || "");

      if (selectedUpsellIds.length > 0) {
        formData.append(
          "upsellItems",
          JSON.stringify(
            selectedUpsells.map((u) => ({
              upsellId: u.id,
              title: u.title,
              price: u.price,
            }))
          )
        );
      }

      let result;
      if (bookingType === "block") {
        formData.append("classId", classData.id.toString());
        formData.append("startSessionId", selectedSessionId.toString());
        formData.append("weekCount", blockWeekCount.toString());
        result = await createBlockBookingAction(formData);
      } else {
        result = await createBookingAction(formData);
      }

      if (result.error) {
        showError(result.error);
        return;
      }

      // Handle both single booking and block booking responses
      const bookingId = "bookingId" in result ? result.bookingId : ("bookingIds" in result && result.bookingIds?.[0]) || null;

      if (bookingId) {
        // Redeem credits/pass if selected
        if (selectedPaymentMethod === "credits" || selectedPaymentMethod === "pass") {
          const redeemResponse = await fetch("/api/wallet/redeem-booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: bookingId,
              classId: classData.id,
              useCredits: selectedPaymentMethod === "credits",
              usePass: selectedPaymentMethod === "pass",
            }),
          });

          const redeemData = await redeemResponse.json();
          if (!redeemData.success) {
            showError(redeemData.error || "Failed to redeem credits/pass");
            // Booking is still created, but payment method failed
          }
        }

        setBookingId(bookingId);
        setStep("complete");
      } else {
        showError("Booking created but no ID returned");
      }
    } catch (error) {
      console.error("[BookPageClient] Error:", error);
      showError("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // For now, stub payment - in production this would redirect to Stripe
    showSuccess("Payment integration coming soon. For now, booking will be marked as pending.");
    await handleConfirmBooking();
  };

  // No available sessions
  if (initialSessions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-slateSoft mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Sessions Available</h2>
            <p className="text-slateSoft mb-6">
              There are currently no available sessions for {classData.name}. Please contact the provider for more information.
            </p>
            <div className="space-y-2">
              {classData.providerName && (
                <p className="text-sm">
                  <strong>Provider:</strong> {classData.providerName}
                </p>
              )}
            </div>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href={`/class/${classData.id}`}>Back to Class</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/class/${classData.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Book {classData.name}</h1>
        <p className="text-slateSoft">{classData.venue}, {classData.town}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <CheckoutProgressBar currentStep={step} />
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {step === "select_session" && (
          <div className="space-y-6">
            <CalendarSelector
              sessions={initialSessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={handleSessionSelect}
            />
            <div className="grid gap-4 md:grid-cols-2">
              {initialSessions.map((session) => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  selected={selectedSessionId === session.sessionId}
                  onSelect={() => handleSessionSelect(session.sessionId)}
                />
              ))}
            </div>
          </div>
        )}

        {step === "upsells" && selectedSession && (
          <div className="space-y-6">
            {/* Credit/Pass Redemption Banner */}
            {creditEligibility && (creditEligibility.canUseCredits || creditEligibility.canUsePass) && (
              <CreditRedemptionBanner
                classId={classData.id}
                sessionPrice={sessionPrice}
                canUseCredits={creditEligibility.canUseCredits}
                canUsePass={creditEligibility.canUsePass}
                creditCost={creditEligibility.creditCost}
                pass={creditEligibility.pass}
                onUseCredits={() => setSelectedPaymentMethod("credits")}
                onUsePass={() => setSelectedPaymentMethod("pass")}
                selectedMethod={selectedPaymentMethod === "credits" ? "credits" : selectedPaymentMethod === "pass" ? "pass" : null}
              />
            )}

            {settings?.allowBlockBookings && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Block Booking</h3>
                  <p className="text-sm text-slateSoft mb-4">
                    Book multiple weeks at once and save! Select how many weeks you'd like to book.
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Weeks:</label>
                    <select
                      value={blockWeekCount}
                      onChange={(e) => {
                        setBlockWeekCount(parseInt(e.target.value, 10));
                        setBookingType(parseInt(e.target.value, 10) > 1 ? "block" : "drop_in");
                      }}
                      className="rounded-md border border-sage/30 px-3 py-2"
                    >
                      <option value={1}>Single session</option>
                      <option value={4}>4 weeks</option>
                      <option value={8}>8 weeks</option>
                      <option value={12}>12 weeks (full term)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {initialUpsells.length > 0 && (
              <UpsellSelector
                upsells={initialUpsells}
                selectedUpsellIds={selectedUpsellIds}
                onSelectionChange={setSelectedUpsellIds}
              />
            )}
          </div>
        )}

        {step === "details" && (
          <BookingForm
            onNext={(data) => {
              setBookingData(data);
              setStep("review");
            }}
            requirePhone={settings?.requireParentPhone}
          />
        )}

        {step === "review" && selectedSession && bookingData && (
          <div className="space-y-6">
            <BookingSummary
              session={selectedSession}
              upsells={selectedUpsells}
              sessionPrice={sessionPrice}
              bookingType={bookingType}
              blockWeekCount={blockWeekCount}
            >
              {bookingData.children}
            </BookingSummary>
            <Alert>
              <AlertDescription>
                By confirming, you agree to the provider's cancellation and refund policies.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "payment" && (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Payment</h2>
              <p className="text-slateSoft mb-6">
                Total: <strong className="text-charcoal">£{totalPrice.toFixed(2)}</strong>
              </p>
              <p className="text-sm text-slateSoft mb-6">
                Payment integration coming soon. For now, bookings will be marked as pending.
              </p>
              <Button onClick={handlePayment} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Booking (Stub)"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "complete" && bookingId && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Booking Confirmed!</h2>
              <p className="text-slateSoft mb-6">
                Your booking for {classData.name} has been confirmed. A confirmation email has been sent to {bookingData?.parentEmail}.
              </p>
              <div className="space-y-4">
                <div className="bg-cream p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Booking Reference</p>
                  <p className="text-lg font-mono">#{bookingId}</p>
                </div>
                {selectedSession && (
                  <div className="text-sm text-slateSoft">
                    <p>
                      <strong>Date:</strong> {new Date(selectedSession.startTime).toLocaleDateString("en-GB", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date(selectedSession.startTime).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 space-x-4">
                <Button asChild>
                  <Link href={`/class/${classData.id}`}>View Class</Link>
                </Button>
                {userId && (
                  <Button asChild variant="outline">
                    <Link href="/account/bookings">My Bookings</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      {step !== "complete" && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === "select_session" || loading}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading || (step === "select_session" && !selectedSessionId)}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : step === "review" ? (
              isFree || totalPrice === 0 ? "Confirm Booking" : "Continue to Payment"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      )}
      {ToastComponent}
    </div>
  );
}

