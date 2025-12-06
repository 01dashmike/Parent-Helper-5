"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BookingSummaryProps = {
  session: {
    sessionId: number;
    startTime: string;
    endTime: string;
    seatsAvailable: number;
  };
  children: Array<{ name: string; age: number }>;
  upsells: Array<{ title: string; price: number }>;
  sessionPrice: number;
  bookingType: "drop_in" | "block" | "free_rsvp";
  blockWeekCount?: number;
};

export default function BookingSummary({
  session,
  children,
  upsells,
  sessionPrice,
  bookingType,
  blockWeekCount,
}: BookingSummaryProps) {
  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  const childrenCount = children.length;
  const basePrice = bookingType === "free_rsvp" ? 0 : sessionPrice * childrenCount;
  const upsellTotal = upsells.reduce((sum, u) => sum + u.price, 0);
  const blockMultiplier = bookingType === "block" && blockWeekCount ? blockWeekCount : 1;
  const totalPrice = (basePrice * blockMultiplier) + upsellTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Details */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Session</h4>
          <div className="text-sm space-y-1">
            <p>{format(startDate, "EEEE, MMMM d, yyyy")}</p>
            <p className="text-slateSoft">
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")} ({duration} minutes)
            </p>
            {bookingType === "block" && blockWeekCount && (
              <Badge variant="info" className="mt-2">
                Block booking: {blockWeekCount} weeks
              </Badge>
            )}
            {bookingType === "free_rsvp" && (
              <Badge variant="success" className="mt-2">
                Free RSVP
              </Badge>
            )}
          </div>
        </div>

        {/* Children */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Children ({childrenCount})</h4>
          <ul className="text-sm space-y-1">
            {children.map((child, i) => (
              <li key={i} className="text-slateSoft">
                {child.name} (age {child.age})
              </li>
            ))}
          </ul>
        </div>

        {/* Upsells */}
        {upsells.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Add-ons</h4>
            <ul className="text-sm space-y-1">
              {upsells.map((upsell, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-slateSoft">{upsell.title}</span>
                  <span>£{upsell.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price Breakdown */}
        {bookingType !== "free_rsvp" && (
          <div className="pt-4 border-t border-sage/20">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slateSoft">
                  {childrenCount} {childrenCount === 1 ? "child" : "children"} × £{sessionPrice.toFixed(2)}
                  {blockMultiplier > 1 && ` × ${blockMultiplier} weeks`}
                </span>
                <span>£{(basePrice * blockMultiplier).toFixed(2)}</span>
              </div>
              {upsellTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slateSoft">Add-ons</span>
                  <span>£{upsellTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-sage/20 font-semibold text-lg">
                <span>Total</span>
                <span className="text-sage">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {bookingType === "free_rsvp" && (
          <div className="pt-4 border-t border-sage/20">
            <p className="text-sm text-slateSoft text-center">
              This is a free RSVP. No payment required.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



