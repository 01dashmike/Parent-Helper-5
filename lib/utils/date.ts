/**
 * Unified date formatting utility
 * Accepts ISO string or Date object and formats consistently using en-GB locale
 */

type DateInput = string | Date | number;

type DateFormatPreset =
  | "date" // e.g., "15 Jan 2024"
  | "datetime" // e.g., "15 Jan 2024, 14:30"
  | "short" // e.g., "15/01/2024"
  | "long" // e.g., "15 January 2024"
  | "month-day" // e.g., "15 Jan"
  | "time" // e.g., "14:30"
  | "relative" // e.g., "2 days ago"
  | "default"; // e.g., default toLocaleDateString("en-GB") format

/**
 * Normalize input to Date object
 */
function normalizeDate(input: DateInput): Date {
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === "number") {
    // Handle Unix timestamp (seconds) or milliseconds
    return new Date(input > 1e10 ? input : input * 1000);
  }
  if (typeof input === "string") {
    return new Date(input);
  }
  throw new Error(`Invalid date input: ${input}`);
}

/**
 * Format date using preset or custom options
 * @param input - Date input (string, Date, or number)
 * @param preset - Format preset or custom Intl options
 * @returns Formatted date string
 */
export function formatDate(
  input: DateInput,
  preset?: DateFormatPreset | Intl.DateTimeFormatOptions
): string {
  const date = normalizeDate(input);

  // Handle preset options
  if (preset === "date") {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (preset === "datetime") {
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (preset === "short") {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (preset === "long") {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (preset === "month-day") {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }

  if (preset === "time") {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (preset === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "just now";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }
    // Fall back to formatted date for older dates
    return formatDate(date, "date");
  }

  // Handle custom Intl.DateTimeFormatOptions
  if (preset && typeof preset === "object") {
    return new Intl.DateTimeFormat("en-GB", preset).format(date);
  }

  // Default: medium date format
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date range (e.g., "15 Jan → 20 Jan 2024")
 * @param start - Start date
 * @param end - End date
 * @returns Formatted date range string
 */
export function formatDateRange(start: DateInput, end: DateInput): string {
  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const startLabel = formatter.format(startDate);
  const endLabel = formatter.format(endDate);

  // If same year, omit year from start
  if (startDate.getFullYear() === endDate.getFullYear()) {
    const startFormatter = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    });
    return `${startFormatter.format(startDate)} → ${endLabel}`;
  }

  return `${startLabel} → ${endLabel}`;
}

/**
 * Get current year (for copyright notices, etc.)
 * @returns Current year as number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Format date as "15 Jan" (month-day format for charts/analytics)
 * @param input - Date input
 * @returns Formatted date string like "15 Jan"
 */
export function formatMonthDay(input: DateInput): string {
  const date = normalizeDate(input);
  return date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date with weekday and full date (e.g., "Monday, 15 January 2024")
 * @param input - Date input
 * @returns Formatted date string
 */
export function formatDateWithWeekday(input: DateInput): string {
  const date = normalizeDate(input);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format date with default locale format (no options)
 * @param input - Date input
 * @returns Formatted date string using default locale format
 */
export function formatDateDefault(input: DateInput): string {
  const date = normalizeDate(input);
  return date.toLocaleDateString();
}

/**
 * Format date and time with long date style and short time style
 * @param input - Date input
 * @returns Formatted date string like "15 January 2024, 14:30"
 */
export function formatDateLongTimeShort(input: DateInput): string {
  const date = normalizeDate(input);
  return date.toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/**
 * Format date with weekday, day, month, hour, and minute
 * @param input - Date input
 * @returns Formatted date string like "Mon, 15 Jan, 14:30"
 */
export function formatDateWithTime(input: DateInput): string {
  const date = normalizeDate(input);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format time with relative and absolute formats
 * Returns both a short relative format (e.g., "5m ago") and absolute format
 * @param input - Date input
 * @returns Object with relative and absolute time strings
 */
export function formatTimeRelative(input: DateInput): { relative: string; absolute: string } {
  const date = normalizeDate(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative: string;
  if (diffMins < 1) {
    relative = "Just now";
  } else if (diffMins < 60) {
    relative = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    relative = `${diffDays}d ago`;
  } else {
    relative = `${Math.floor(diffDays / 7)}w ago`;
  }

  const absolute = date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return { relative, absolute };
}

/**
 * Format relative time with suffix (e.g., "3 days ago")
 * Similar to date-fns formatDistanceToNow with addSuffix: true
 * @param input - Date input
 * @returns Formatted relative time string
 */
export function formatDistanceToNow(input: DateInput): string {
  const date = normalizeDate(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isPast = diffMs > 0;
  const suffix = isPast ? "ago" : "in";

  if (diffSeconds < 60) {
    return isPast ? "just now" : "in a moment";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ${suffix}`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ${suffix}`;
  }
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ${suffix}`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ${suffix}`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ${suffix}`;
  }
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ${suffix}`;
}

