"use client";

import { useState, useEffect } from "react";
import { motion } from "@/components/motion/motion-proxy";
import LinkComponent from "@/components/ui/link";
import { formatDateLongTimeShort } from "@/lib/utils/date";
import { Check } from "@/components/icons";

interface ThankYouClientProps {
  bookingDetails: {
    booking: {
      confirmation_code: string;
      total_paid: string;
    };
    bookingRequest: {
      parent_name: string;
      child_name: string;
      child_age: number;
      class_id: number;
    };
    classData: {
      name: string;
      providers: { name: string } | null;
    } | null;
    occurrence: {
      starts_at: string;
      ends_at: string | null;
    } | null;
  } | null;
}

export default function ThankYouClient({ bookingDetails }: ThankYouClientProps) {
  const [startsAt, setStartsAt] = useState<string>("TBC");

  useEffect(() => {
    if (bookingDetails?.occurrence?.starts_at) {
      setStartsAt(formatDateLongTimeShort(bookingDetails.occurrence.starts_at));
    }
  }, [bookingDetails?.occurrence?.starts_at]);

  if (!bookingDetails) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-sage/20 bg-white p-8 text-center shadow-xl"
      >
        <h2 className="text-title font-semibold text-charcoal">Booking Not Found</h2>
        <p className="mt-4 text-slateSoft">
          We couldn&apos;t find your booking. Please contact support if you&apos;ve completed payment.
             </p>
        <LinkComponent href="/" className="ph-btn mt-6 inline-block" prefetch={false}>
          Return Home
        </LinkComponent>
      </motion.div>
    );
  }

  const { booking, bookingRequest, classData } = bookingDetails;

  const amount = Number(booking.total_paid);
  const formattedAmount = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-sage/20 bg-white p-section shadow-xl sm:p-8"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
        >
          <Check size={32} className="h-8 w-8 text-green-600" aria-label="Booking confirmed" />
        </motion.div>

        <h1 className="text-display-2 font-semibold text-charcoal">Booking Confirmed!</h1>
        <p className="mt-2 text-slateSoft">Thank you for your booking, {bookingRequest.parent_name}!</p>
      </div>

      <div className="mt-8 space-y-4 rounded-lg border border-sage/20 bg-cream/30 p-6">
        <div>
          <p className="text-small text-slateSoft">Class</p>
          <p className="text-title font-semibold text-charcoal">{classData?.name || "Class"}</p>
        </div>

        <div>
          <p className="text-small text-slateSoft">Date & Time</p>
          <p className="text-title font-semibold text-charcoal">{startsAt}</p>
        </div>

        <div>
          <p className="text-small text-slateSoft">Child</p>
          <p className="text-title font-semibold text-charcoal">
            {bookingRequest.child_name} (age {bookingRequest.child_age})
          </p>
        </div>

        <div>
          <p className="text-small text-slateSoft">Amount Paid</p>
          <p className="text-title font-semibold text-sage">{formattedAmount}</p>
        </div>

        <div>
          <p className="text-small text-slateSoft">Confirmation Code</p>
          <p className="text-title font-mono font-semibold text-charcoal">{booking.confirmation_code}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-section">
        <p className="text-small text-blue-800">
          <strong>What&apos;s next?</strong> You&apos;ll receive a confirmation email shortly with all the details.
          If you have any questions, please contact the provider directly.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <LinkComponent href="/" className="ph-btn-secondary flex-1 text-center" prefetch={false}>
          Return Home
        </LinkComponent>
        {classData && (
          <LinkComponent
            href={`/class/${bookingDetails.bookingRequest.class_id || ""}`}
            className="ph-btn flex-1 text-center"
            prefetch={false}
          >
            View Class
          </LinkComponent>
        )}
      </div>
    </motion.div>
  );
}

