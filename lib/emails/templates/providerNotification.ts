/**
 * Provider notification email template for new bookings
 * Sent to providers when a booking is confirmed
 */

export type ProviderNotificationData = {
    bookingId: string;
    providerName: string;
    providerEmail: string;
    className: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    childName?: string;
    childAge?: number;
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
    bookingNotes?: string;
    dashboardUrl?: string;
};

export function providerNotification(data: ProviderNotificationData): {
    html: string;
    text: string;
    subject: string;
} {
    const safeProviderName = data.providerName?.trim() || "there";
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
    const dashboardUrl = data.dashboardUrl || "https://parenthelper.co.uk/provider/console/bookings";

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
                <p style="margin:0 0 16px;">Hi ${safeProviderName},</p>
                <p style="margin:0 0 16px;font-weight:600;color:#4f6f52;font-size:18px;">
                  New Booking Received! 🎉
                </p>
                <p style="margin:0 0 16px;">
                  You have a new booking for <strong>${data.className}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;background-color:#f5f5f5;border-radius:8px;margin-bottom:16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding-bottom:12px;font-weight:600;color:#2f2f2f;">Booking Details</td>
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
                      <strong style="color:#2f2f2f;">Location:</strong> ${data.address}${data.postcode ? `, ${data.postcode}` : ""}, ${data.town}
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
                      <strong style="color:#2f2f2f;">Amount:</strong> ${currency} ${amount}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;background-color:#e8f5e9;border-radius:8px;margin-bottom:16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding-bottom:12px;font-weight:600;color:#2f2f2f;">Parent Contact</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Name:</strong> ${data.parentName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Email:</strong> <a href="mailto:${data.parentEmail}" style="color:#4f6f52;text-decoration:none;">${data.parentEmail}</a>
                    </td>
                  </tr>
                  ${data.parentPhone ? `
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Phone:</strong> <a href="tel:${data.parentPhone}" style="color:#4f6f52;text-decoration:none;">${data.parentPhone}</a>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.childName ? `
                  <tr>
                    <td style="padding-bottom:8px;color:#666;">
                      <strong style="color:#2f2f2f;">Child:</strong> ${data.childName}${data.childAge ? ` (${data.childAge} ${data.childAge === 1 ? "year" : "years"} old)` : ""}
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </td>
            </tr>
            ${data.bookingNotes ? `
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0 0 8px;font-weight:600;color:#2f2f2f;">Booking Notes:</p>
                <p style="margin:0;color:#666;line-height:1.6;">${data.bookingNotes}</p>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding-top:16px;border-top:1px solid #e0e0e0;text-align:center;">
                <p style="margin:0 0 16px;color:#666;font-size:14px;">
                  Manage this booking in your provider dashboard
                </p>
                <a href="${dashboardUrl}" style="display:inline-block;background-color:#4f6f52;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Dashboard</a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;text-align:center;font-size:14px;color:#999;">
                <p style="margin:0 0 8px;">Thank you for being part of Parent Helper!</p>
                <p style="margin:0;">- The Parent Helper Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = `Hi ${safeProviderName},

New Booking Received! 🎉

You have a new booking for ${data.className}.

Booking Details:
- Class: ${data.className}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Venue: ${data.venue}
- Location: ${data.address}${data.postcode ? `, ${data.postcode}` : ""}, ${data.town}
${data.confirmationCode ? `- Confirmation Code: ${data.confirmationCode}\n` : ""}
- Amount: ${currency} ${amount}

Parent Contact:
- Name: ${data.parentName}
- Email: ${data.parentEmail}
${data.parentPhone ? `- Phone: ${data.parentPhone}\n` : ""}${data.childName ? `- Child: ${data.childName}${data.childAge ? ` (${data.childAge} ${data.childAge === 1 ? "year" : "years"} old)` : ""}\n` : ""}
${data.bookingNotes ? `Booking Notes:\n${data.bookingNotes}\n\n` : ""}Manage this booking: ${dashboardUrl}

Thank you for being part of Parent Helper!
- The Parent Helper Team`;

    return {
        html,
        text,
        subject: `New Booking: ${data.className} - ${formattedDate}`,
    };
}

