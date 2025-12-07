/**
 * ICS (iCalendar) generation utilities
 * Extracted from calendar feed route for testability
 */

/**
 * Escape text for iCalendar format
 */
export function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Format date in iCalendar format (YYYYMMDDTHHMMSSZ)
 */
export function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generate iCalendar format content from bookings
 */
export function generateICalendar(
  bookings: any[],
  _userEmail: string,
): string {
  const now = new Date();
  const lines: string[] = [];

  // iCalendar header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Parent Helper//Calendar Sync//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:Parent Helper Bookings`);
  lines.push(`X-WR-CALDESC:Your upcoming class bookings from Parent Helper`);

  // Add each booking as an event
  bookings.forEach((booking) => {
    const classData = booking.classes || {};
    const className = classData.name || "Class";
    const venue = classData.venue || "";
    const address = classData.address || "";
    const postcode = classData.postcode || "";
    const town = classData.town || "";
    const location = [venue, address, town, postcode].filter(Boolean).join(", ");

    const sessionDate = new Date(booking.session_date);
    const endDate = new Date(sessionDate);
    // Assume 1 hour duration if not specified
    endDate.setHours(endDate.getHours() + 1);

    const summary = `${className} - ${booking.child_name}`;
    const description = [
      `Child: ${booking.child_name}`,
      `Confirmation Code: ${booking.confirmation_code}`,
      booking.total_paid ? `Total Paid: £${Number(booking.total_paid).toFixed(2)}` : "",
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:booking-${booking.id}@parenthelper.co.uk`);
    lines.push(`DTSTAMP:${formatICalDate(now)}`);
    lines.push(`DTSTART:${formatICalDate(sessionDate)}`);
    lines.push(`DTEND:${formatICalDate(endDate)}`);
    lines.push(`SUMMARY:${escapeICalText(summary)}`);
    if (location) {
      lines.push(`LOCATION:${escapeICalText(location)}`);
    }
    if (description) {
      lines.push(`DESCRIPTION:${escapeICalText(description)}`);
    }
    lines.push(`STATUS:CONFIRMED`);
    lines.push(`SEQUENCE:0`);
    lines.push("END:VEVENT");
  });

  // iCalendar footer
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

