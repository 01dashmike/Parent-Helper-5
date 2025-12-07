"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Copy, CheckCircle, XCircle, Calendar, MapPin, Users, CreditCard } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";
import type { ProviderBooking } from "@/lib/bookings/provider";

type ProviderBookingDetailClientProps = {
  booking: ProviderBooking;
  providerId: number;
};

export default function ProviderBookingDetailClient({
  booking,
  providerId,
}: ProviderBookingDetailClientProps) {
  const router = useRouter();
  const { showError, showSuccess, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      showError("Please provide a reason for cancellation");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/provider/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      const data = await response.json();

      if (data.error) {
        showError(data.error);
        return;
      }

      showSuccess("Booking cancelled");
      router.refresh();
    } catch (error) {
      showError("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttended = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/provider/bookings/${booking.id}/attend`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        showError(data.error);
        return;
      }

      showSuccess("Marked as attended");
      router.refresh();
    } catch (error) {
      showError("Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/provider/bookings/${booking.id}/resend-email`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        showError(data.error);
        return;
      }

      showSuccess("Confirmation email sent");
    } catch (error) {
      showError("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    const sessionDate = booking.session ? new Date(booking.session.startTime) : null;
    const summary = `
Booking Summary

Date: ${sessionDate ? format(sessionDate, "EEEE, MMMM d, yyyy") : "N/A"}
Time: ${sessionDate ? format(sessionDate, "h:mm a") : "N/A"}
Class: ${booking.class?.name || "N/A"}
Venue: ${booking.class?.venue || "N/A"}
Address: ${booking.class?.address || "N/A"}

Parent: ${booking.parentFirstName} ${booking.parentLastName}
Email: ${booking.parentEmail}
${booking.parentPhone ? `Phone: ${booking.parentPhone}` : ""}

Children:
${booking.children.map((c) => `- ${c.name} (age ${c.age})`).join("\n")}

Booking Type: ${booking.bookingType}
Status: ${booking.status}
Amount: £${booking.priceTotal.toFixed(2)}
    `.trim();

    navigator.clipboard.writeText(summary);
    showSuccess("Booking summary copied to clipboard");
  };

  const sessionDate = booking.session ? new Date(booking.session.startTime) : null;
  const sessionEnd = booking.session ? new Date(booking.session.endTime) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/provider/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Booking #{booking.id}</h1>
            <Badge variant={booking.status === "confirmed" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionDate && (
              <>
                <div>
                  <p className="text-sm text-slateSoft">Date</p>
                  <p className="font-semibold">{format(sessionDate, "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-slateSoft">Time</p>
                  <p className="font-semibold">
                    {format(sessionDate, "h:mm a")} - {sessionEnd ? format(sessionEnd, "h:mm a") : ""}
                  </p>
                </div>
              </>
            )}
            {booking.class && (
              <>
                <div>
                  <p className="text-sm text-slateSoft flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Venue
                  </p>
                  <p className="font-semibold">{booking.class.venue}</p>
                  <p className="text-sm text-slateSoft">{booking.class.address}, {booking.class.town}</p>
                </div>
                <div>
                  <p className="text-sm text-slateSoft">Class</p>
                  <p className="font-semibold">{booking.class.name}</p>
                </div>
              </>
            )}
            {booking.session && (
              <div>
                <p className="text-sm text-slateSoft">Capacity</p>
                <p className="font-semibold">
                  {booking.session.seatsTaken} / {booking.session.capacity} booked
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent & Children */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parent & Children
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slateSoft">Parent Name</p>
              <p className="font-semibold">
                {booking.parentFirstName} {booking.parentLastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-slateSoft">Email</p>
              <p className="font-semibold">{booking.parentEmail}</p>
            </div>
            {booking.parentPhone && (
              <div>
                <p className="text-sm text-slateSoft">Phone</p>
                <p className="font-semibold">{booking.parentPhone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slateSoft mb-2">Children</p>
              <div className="space-y-2">
                {booking.children.map((child, i) => (
                  <div key={i} className="bg-cream p-3 rounded-lg">
                    <p className="font-semibold">{child.name}</p>
                    <p className="text-sm text-slateSoft">Age: {child.age} years</p>
                    {child.allergies && (
                      <p className="text-sm text-slateSoft">Allergies: {child.allergies}</p>
                    )}
                    {child.notes && (
                      <p className="text-sm text-slateSoft">Notes: {child.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slateSoft">Booking Type</p>
              <Badge variant="outline">
                {booking.bookingType === "block" ? "Block" : booking.bookingType === "free_rsvp" ? "Free RSVP" : "Drop-in"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slateSoft">Total Amount</p>
              <p className="text-2xl font-bold text-sage">£{booking.priceTotal.toFixed(2)}</p>
            </div>
            {booking.upsellItems.length > 0 && (
              <div>
                <p className="text-sm text-slateSoft mb-2">Add-ons</p>
                <div className="space-y-1">
                  {booking.upsellItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{item.title}</span>
                      <span>£{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-slateSoft">Created</p>
              <p className="font-semibold">{format(booking.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.status === "confirmed" && (
              <>
                <Button
                  onClick={handleMarkAttended}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Attended
                </Button>
                <Button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Confirmation Email
                </Button>
                <Button
                  onClick={handleCopySummary}
                  className="w-full"
                  variant="outline"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Booking Summary
                </Button>
                <div className="pt-4 border-t border-sage/20">
                  <p className="text-sm font-semibold mb-2">Cancel Booking</p>
                  <Textarea
                    placeholder="Reason for cancellation..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <Button
                    onClick={handleCancel}
                    disabled={loading || !cancellationReason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </Button>
                </div>
              </>
            )}
            {booking.status === "attended" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>This booking has been marked as attended.</AlertDescription>
              </Alert>
            )}
            {booking.status === "cancelled" && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>This booking has been cancelled.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {booking.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
          </CardContent>
        </Card>
      )}
      {ToastComponent}
    </div>
  );
}

