interface FailureDetails {
  to: string;
  subject: string;
  type: string;
  error: string;
  timestamp: string;
}

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
};

export function getEmailFailureAlertTemplate(details: FailureDetails) {
  const { to, subject, type, error, timestamp } = details;
  const formattedTimestamp = formatTimestamp(timestamp);

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f8f7f2;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;color:#2f2f2f;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7f2;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background-color:#ffffff;border-radius:12px;padding:28px 24px;box-shadow:0 16px 32px rgba(34,53,45,0.08);">
            <tr>
              <td style="padding-bottom:20px;">
                <h1 style="margin:0;font-size:18px;font-weight:600;color:#588157;">Transactional Email Delivery Failed</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#2f2f2f;">
                  Parent Helper attempted to send a transactional email and encountered an error. Review the delivery summary below.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e4e2dc;border-radius:10px;">
                  <tbody>
                    <tr>
                      <td style="width:140px;padding:12px 16px;background-color:#f8f7f2;font-size:12px;font-weight:600;color:#588157;text-transform:uppercase;letter-spacing:0.08em;">Type</td>
                      <td style="padding:12px 16px;font-size:14px;color:#2f2f2f;">${type}</td>
                    </tr>
                    <tr>
                      <td style="width:140px;padding:12px 16px;background-color:#f8f7f2;font-size:12px;font-weight:600;color:#588157;text-transform:uppercase;letter-spacing:0.08em;">Recipient</td>
                      <td style="padding:12px 16px;font-size:14px;color:#2f2f2f;">${to}</td>
                    </tr>
                    <tr>
                      <td style="width:140px;padding:12px 16px;background-color:#f8f7f2;font-size:12px;font-weight:600;color:#588157;text-transform:uppercase;letter-spacing:0.08em;">Subject</td>
                      <td style="padding:12px 16px;font-size:14px;color:#2f2f2f;">${subject}</td>
                    </tr>
                    <tr>
                      <td style="width:140px;padding:12px 16px;background-color:#f8f7f2;font-size:12px;font-weight:600;color:#588157;text-transform:uppercase;letter-spacing:0.08em;">Error</td>
                      <td style="padding:12px 16px;font-size:14px;color:#b7423c;">${error}</td>
                    </tr>
                    <tr>
                      <td style="width:140px;padding:12px 16px;background-color:#f8f7f2;font-size:12px;font-weight:600;color:#588157;text-transform:uppercase;letter-spacing:0.08em;">Timestamp</td>
                      <td style="padding:12px 16px;font-size:14px;color:#2f2f2f;">${formattedTimestamp}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;font-size:12px;color:#6b7280;line-height:1.6;">
                This alert is for internal visibility only. No personal content or message bodies are included.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Transactional Email Delivery Failed",
    "",
    "Parent Helper attempted to send a transactional email and encountered an error. Summary:",
    `Type: ${type}`,
    `Recipient: ${to}`,
    `Subject: ${subject}`,
    `Error: ${error}`,
    `Timestamp: ${formattedTimestamp}`,
    "",
    "This alert contains no message content or personal data.",
  ].join("\n");

  return {
    subject: "⚠️ Transactional Email Delivery Failed — Parent Helper",
    html,
    text,
  };
}


