/**
 * Booking confirmation email template for customers
 * Includes class details and optional ICS calendar attachment
 */

export type BookingConfirmationData = {
    bookingId: string;
    parentName: string;
    parentEmail: string;
    className: string;
    classDescription?: string;
    venue: string;
    address: string;
    postcode?: string;
    town: string;
    sessionDate: Date | string;
    sessionTime?: string;
    dayOfWeek?: string;
    amountPaid: number; // in cents
    currency?: string;
    confirmationCode?: string;
    providerName?: string;
    providerContact?: string;
    bookingNotes?: string;
    cancellationPolicy?: string;
    referralCode?: string | null; // User's referral code
    referralUrl?: string | null; // Full referral URL
};

/**
 * Generate ICS calendar file content for booking
 */
function generateICS(data: BookingConfirmationData): string {
    const startDate = new Date(data.sessionDate);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

    // Format date as YYYYMMDDTHHmmssZ (UTC)
    const formatDate = (date: Date) => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const summary = `${data.className} - ${data.venue}`;
    const description = `Booking confirmation for ${data.className}\n\nVenue: ${data.venue}\nAddress: ${data.address}${data.postcode ? `, ${data.postcode}` : ""}\n${data.providerContact ? `Contact: ${data.providerContact}\n` : ""}${data.confirmationCode ? `Confirmation Code: ${data.confirmationCode}` : ""}`;
    const location = `${data.venue}, ${data.address}${data.postcode ? `, ${data.postcode}` : ""}, ${data.town}`;

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Parent Helper//Booking Confirmation//EN
BEGIN:VEVENT
UID:${data.bookingId}@parenthelper.co.uk
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${summary}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

export function bookingConfirmation(data: BookingConfirmationData): {
    html: string;
    text: string;
    subject: string;
    icsAttachment?: {
        filename: string;
        content: string;
        type: string;
    };
} {
    const safeName = data.parentName?.trim() || "there";
    const sessionDate = new Date(data.sessionDate);
    const formattedDate = sessionDate.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const formattedTime = data.sessionTime || sessionDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const amount = (data.amountPaid / 100).toFixed(2);
    const currency = data.currency?.toUpperCase() || "GBP";

    const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2f2f2f;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fafafa;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;padding:32px 32px 40px;box-shadow:0 8px 24px rgba(47,47,47,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <img src="https://parenthelper.co.uk/logo.png" alt="Parent Helper" width="120" height="32" style="display:block;margin:0 auto 12px;" />
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;font-size:16px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${safeName},</p>
                <p style="margin:0 0 16px;font-weight:600;color:#4f6f52;font-size:18px;">
                  Your booking is confirmed! 🎉
                </p>
                <p style="margin:0 0 16px;">
                  We're excited to have you join us for <strong>${data.className}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;background-color:#f5f5f5;border-radius:8px;margin-bottom:16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding-bottom:12px;font-weight:600;color:#2f2f2f;">Class Details</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Class:</strong> ${data.className}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Date:</strong> ${formattedDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Time:</strong> ${formattedTime}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Venue:</strong> ${data.venue}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Address:</strong> ${data.address}${data.postcode ? `, ${data.postcode}` : ""}, ${data.town}
                    </td>
                  </tr>
                  ${data.confirmationCode ? `
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Confirmation Code:</strong> <span style="font-family:monospace;background-color:#fff;padding:2px 6px;border-radius:4px;">${data.confirmationCode}</span>
                    </td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="padding-top:8px;border-top:1px solid #ddd;color:#666;">
                      <strong style="color:#2f2f2f;">Amount Paid:</strong> ${currency} ${amount}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${data.bookingNotes ? `
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0 0 8px;font-weight:600;color:#2f2f2f;">Important Notes:</p>
                <p style="margin:0;color:#666;line-height:1.6;">${data.bookingNotes}</p>
              </td>
            </tr>
            ` : ""}
            ${data.cancellationPolicy ? `
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0 0 8px;font-weight:600;color:#2f2f2f;">Cancellation Policy:</p>
                <p style="margin:0;color:#666;line-height:1.6;">${data.cancellationPolicy}</p>
              </td>
            </tr>
            ` : ""}
            ${data.providerContact ? `
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0 0 8px;font-weight:600;color:#2f2f2f;">Need to get in touch?</p>
                <p style="margin:0;color:#666;">Contact: ${data.providerContact}</p>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding-top:16px;border-top:1px solid #e0e0e0;text-align:center;">
                <p style="margin:0 0 16px;color:#666;font-size:14px;">
                  View your booking details in your account
                </p>
                <a href="https://parenthelper.co.uk/account/bookings" style="display:inline-block;background-color:#4f6f52;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View My Bookings</a>
              </td>
            </tr>
            ${data.referralCode && data.referralUrl ? `
            <tr>
              <td style="padding-top:24px;padding-bottom:16px;background-color:#f0f7f0;border-radius:8px;text-align:center;">
                <p style="margin:0 0 12px;font-weight:600;color:#2f2f2f;font-size:16px;">
                  Invite another family and both of you get rewards! 🎁
                </p>
                <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.6;">
                  Share your referral code with friends and family. When they sign up and book, you both earn rewards!
                </p>
                <div style="margin:16px 0;padding:12px;background-color:#ffffff;border-radius:6px;border:2px dashed #4f6f52;">
                  <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Your Referral Code</p>
                  <p style="margin:0 0 12px;font-family:monospace;font-size:20px;font-weight:700;color:#4f6f52;letter-spacing:2px;">${data.referralCode}</p>
                  <a href="${data.referralUrl}" style="display:inline-block;background-color:#4f6f52;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;font-size:14px;">Share Your Link</a>
                </div>
                <p style="margin:16px 0 0;font-size:12px;color:#999;">
                  Your referral link: <a href="${data.referralUrl}" style="color:#4f6f52;text-decoration:underline;">${data.referralUrl}</a>
                </p>
                <p style="margin:12px 0 0;font-size:12px;color:#999;">
                  <a href="https://parenthelper.co.uk/referrals/info" style="color:#4f6f52;text-decoration:underline;">Learn more about our referral program</a>
                </p>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding-top:24px;text-align:center;font-size:14px;color:#999;">
                <p style="margin:0 0 8px;">Thank you for booking with Parent Helper!</p>
                <p style="margin:0;">- The Parent Helper Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = `Hi ${safeName},

Your booking is confirmed! 🎉

We're excited to have you join us for ${data.className}.

Class Details:
- Class: ${data.className}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Venue: ${data.venue}
- Address: ${data.address}${data.postcode ? `, ${data.postcode}` : ""}, ${data.town}
${data.confirmationCode ? `- Confirmation Code: ${data.confirmationCode}\n` : ""}
- Amount Paid: ${currency} ${amount}

${data.bookingNotes ? `Important Notes:\n${data.bookingNotes}\n\n` : ""}${data.cancellationPolicy ? `Cancellation Policy:\n${data.cancellationPolicy}\n\n` : ""}${data.providerContact ? `Need to get in touch?\nContact: ${data.providerContact}\n\n` : ""}View your booking details: https://parenthelper.co.uk/account/bookings

${data.referralCode && data.referralUrl ? `\n🎁 Invite another family and both of you get rewards!\n\nShare your referral code with friends and family. When they sign up and book, you both earn rewards!\n\nYour Referral Code: ${data.referralCode}\nYour Referral Link: ${data.referralUrl}\n\nShare your link: ${data.referralUrl}\n\nLearn more: https://parenthelper.co.uk/referrals/info\n\n` : ""}Thank you for booking with Parent Helper!
- The Parent Helper Team`;

    const icsContent = generateICS(data);

    return {
        html,
        text,
        subject: `Booking Confirmed: ${data.className} on ${formattedDate}`,
        icsAttachment: {
            filename: `booking-${data.bookingId}.ics`,
            content: icsContent,
            type: "text/calendar",
        },
    };
}

