"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils/date";

export function LastUpdated() {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Format date on mount - no need for loading state since it's immediate
    setFormattedDate(formatDate(new Date(), "long"));
  }, []);

  return <span aria-live="polite">{formattedDate || formatDate(new Date(), "long")}</span>;
}

