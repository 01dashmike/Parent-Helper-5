"use client";

import { useState, useEffect } from "react";

interface WalletThankYouClientProps {
  startsAt: string | null;
}

export function WalletThankYouClient({ startsAt }: WalletThankYouClientProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    if (startsAt) {
      setFormattedDate(
        new Date(startsAt).toLocaleString("en-GB", {
          dateStyle: "long",
          timeStyle: "short",
        })
      );
    }
  }, [startsAt]);

  if (!startsAt) return null;

  return (
    <div>
      <p className="text-small text-slateSoft">Date & Time</p>
      <p className="font-medium text-charcoal">{formattedDate || "Loading..."}</p>
    </div>
  );
}

