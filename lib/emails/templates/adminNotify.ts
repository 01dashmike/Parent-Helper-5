export type ProviderSubmission = {
  name?: string;
  email?: string;
  phone?: string;
  organisation?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  category?: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postcode?: string;
  regions?: string[];
  times?: string[];
  ageRanges?: string[];
  consentNewsletter?: boolean;
  uploads?: { fileName: string; url: string }[];
  submittedAt?: string;
  submissionId?: string;
};

const escapeHtml = (s?: string) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const placeholderHtml = "&mdash;";
const placeholderText = "—";

const trimOrNull = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const formatHtmlValue = (value?: string) => {
  const trimmed = trimOrNull(value);
  return trimmed ? escapeHtml(trimmed) : placeholderHtml;
};

const formatTextValue = (value?: string) => {
  const trimmed = trimOrNull(value);
  return trimmed ?? placeholderText;
};

const formatHtmlList = (list?: string[]) => {
  const cleaned = list?.map((item) => trimOrNull(item)).filter(Boolean) as string[] | undefined;
  return cleaned && cleaned.length > 0
    ? cleaned.map((item) => escapeHtml(item)).join(", ")
    : placeholderHtml;
};

const formatTextList = (list?: string[]) => {
  const cleaned = list?.map((item) => trimOrNull(item)).filter(Boolean) as string[] | undefined;
  return cleaned && cleaned.length > 0 ? cleaned.join(", ") : placeholderText;
};

const toHref = (value?: string) => {
  const trimmed = trimOrNull(value);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const formatLinkHtml = (value?: string, type: "url" | "email" = "url") => {
  const trimmed = trimOrNull(value);
  if (!trimmed) return placeholderHtml;

  const href = type === "email" ? `mailto:${trimmed}` : toHref(trimmed);
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(trimmed);

  return `<a href="${safeHref}" style="color:#4f6f52;text-decoration:none;">${safeLabel}</a>`;
};

const formatMultilineHtml = (value?: string) => {
  const trimmed = trimOrNull(value);
  if (!trimmed) return placeholderHtml;
  return escapeHtml(trimmed).replace(/\r?\n/g, "<br />");
};

const formatUploadedFilesHtml = (uploads?: { fileName: string; url: string }[]) => {
  const items = uploads
    ?.map((file) => {
      const url = trimOrNull(file?.url);
      if (!url) return null;
      const label = trimOrNull(file?.fileName) ?? url;
      const safeLabel = escapeHtml(label);
      const safeUrl = escapeHtml(url);
      return `<li style="margin-bottom:8px;"><a href="${safeUrl}" style="color:#4f6f52;text-decoration:none;">${safeLabel}</a></li>`;
    })
    .filter(Boolean) as string[] | undefined;

  if (!items || items.length === 0) {
    return `<p style="margin:0;">${placeholderHtml}</p>`;
  }

  return `<ul style="margin:0;padding-left:20px;">${items.join("")}</ul>`;
};

const formatUploadedFilesText = (uploads?: { fileName: string; url: string }[]) => {
  const items = uploads
    ?.map((file) => {
      const url = trimOrNull(file?.url);
      if (!url) return null;
      const label = trimOrNull(file?.fileName) ?? url;
      return `- ${label} (${url})`;
    })
    .filter(Boolean) as string[] | undefined;

  return items && items.length > 0 ? items.join("\n") : placeholderText;
};

export function adminNotify(submission: ProviderSubmission): {
  subject: string;
  html: string;
  text: string;
} {
  const organisation = trimOrNull(submission.organisation) ?? trimOrNull(submission.name);
  const location = trimOrNull(submission.town) ?? trimOrNull(submission.postcode) ?? placeholderText;
  const subject = `New Provider Registration: ${organisation ?? "Unnamed provider"} (${location})`;

  const submittedAtDisplay = (() => {
    const raw = trimOrNull(submission.submittedAt);
    if (!raw) return placeholderHtml;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? escapeHtml(raw) : escapeHtml(date.toISOString());
  })();

  const submittedAtText = (() => {
    const raw = trimOrNull(submission.submittedAt);
    if (!raw) return placeholderText;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? raw : date.toISOString();
  })();

  const twoColumnRow = (left: string, right: string) => `
    <tr>
      <td style="vertical-align:top;width:50%;padding-right:16px;">${left}</td>
      <td style="vertical-align:top;width:50%;padding-left:16px;">${right}</td>
    </tr>
  `;

  const detailBlock = (label: string, value: string) => `
    <p style="margin:0 0 12px;">
      <span style="display:block;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">${label}</span>
      <span style="font-size:15px;color:#2f2f2f;line-height:1.6;">${value}</span>
    </p>
  `;

  const contactHtml = [
    detailBlock("Name", formatHtmlValue(submission.name)),
    detailBlock("Email", formatLinkHtml(submission.email, "email")),
    detailBlock("Phone", formatHtmlValue(submission.phone)),
  ].join("");

  const organisationHtml = [
    detailBlock("Organisation", formatHtmlValue(submission.organisation)),
    detailBlock("Website", formatLinkHtml(submission.website)),
    detailBlock(
      "Socials",
      [
        `Instagram: ${formatLinkHtml(submission.instagram)}`,
        `Facebook: ${formatLinkHtml(submission.facebook)}`,
      ].join("<br />")
    ),
  ].join("");

  const offeringHtml = [
    detailBlock("Category", formatHtmlValue(submission.category)),
    detailBlock("Age ranges", formatHtmlList(submission.ageRanges)),
    detailBlock("Times", formatHtmlList(submission.times)),
    detailBlock("Service areas", formatHtmlList(submission.regions)),
  ].join("");

  const locationHtml = [
    detailBlock("Address line 1", formatHtmlValue(submission.addressLine1)),
    detailBlock("Address line 2", formatHtmlValue(submission.addressLine2)),
    detailBlock("Town", formatHtmlValue(submission.town)),
    detailBlock("Postcode", formatHtmlValue(submission.postcode)),
  ].join("");

  const descriptionHtml = detailBlock("Description", formatMultilineHtml(submission.description));
  const consentHtml = detailBlock("Newsletter consent", submission.consentNewsletter ? "Yes" : "No");
  const uploadsHtml = formatUploadedFilesHtml(submission.uploads);

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2f2f2f;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fafafa;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background-color:#ffffff;border-radius:12px;padding:32px 32px 40px;box-shadow:0 16px 32px rgba(47,47,47,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:16px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">
                Parent Helper – Admin
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;color:#2f2f2f;">New provider registration received</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:8px;">Submission details</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#2f2f2f;">
                      <span style="display:inline-block;margin-right:16px;"><strong>ID:</strong> ${formatHtmlValue(submission.submissionId)}</span>
                      <span style="display:inline-block;"><strong>Submitted:</strong> ${submittedAtDisplay}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  ${twoColumnRow(contactHtml, organisationHtml)}
                  ${twoColumnRow(offeringHtml, locationHtml)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5e7eb;padding-top:24px;">
                  <tr>
                    <td>
                      ${descriptionHtml}
                      ${consentHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Uploads</p>
                ${uploadsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #e5e7eb;padding-top:24px;">
                  <tr>
                    <td>
                      <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Admin actions</p>
                      <p style="margin:0 0 8px;font-size:15px;">
                        <a href="https://parenthelper.co.uk/admin/providers?filter=pending" style="color:#4f6f52;text-decoration:none;font-weight:600;">Open Admin – Pending Providers</a>
                      </p>
                      ${trimOrNull(submission.email)
                        ? `<p style="margin:0;font-size:15px;"><a href="mailto:${escapeHtml(trimOrNull(submission.email)!)}" style="color:#4f6f52;text-decoration:none;font-weight:600;">Reply to provider</a></p>`
                        : `<p style="margin:0;font-size:15px;color:#6b7280;">Reply to provider: ${placeholderHtml}</p>`
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:32px;font-size:12px;color:#6b7280;line-height:1.6;">
                This email contains registration details supplied via the Parent Helper onboarding form.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const uploadsText = formatUploadedFilesText(submission.uploads);
  const emailLinkText = trimOrNull(submission.email)
    ? `mailto:${trimOrNull(submission.email)}`
    : placeholderText;

  const text = [
    "Parent Helper – Admin",
    "New provider registration received",
    "",
    `Submission ID: ${formatTextValue(submission.submissionId)}`,
    `Submitted: ${submittedAtText}`,
    "",
    "Contact",
    `Name: ${formatTextValue(submission.name)}`,
    `Email: ${formatTextValue(submission.email)}`,
    `Phone: ${formatTextValue(submission.phone)}`,
    "",
    "Organisation",
    `Organisation: ${formatTextValue(submission.organisation)}`,
    `Website: ${formatTextValue(submission.website)}`,
    `Instagram: ${formatTextValue(submission.instagram)}`,
    `Facebook: ${formatTextValue(submission.facebook)}`,
    "",
    "Offering",
    `Category: ${formatTextValue(submission.category)}`,
    `Age ranges: ${formatTextList(submission.ageRanges)}`,
    `Times: ${formatTextList(submission.times)}`,
    `Service areas: ${formatTextList(submission.regions)}`,
    "",
    "Location",
    `Address line 1: ${formatTextValue(submission.addressLine1)}`,
    `Address line 2: ${formatTextValue(submission.addressLine2)}`,
    `Town: ${formatTextValue(submission.town)}`,
    `Postcode: ${formatTextValue(submission.postcode)}`,
    "",
    "Description",
    `${formatTextValue(submission.description)}`,
    "",
    `Newsletter consent: ${submission.consentNewsletter ? "Yes" : "No"}`,
    "",
    "Uploads",
    `${uploadsText}`,
    "",
    "Admin actions",
    "Open Admin – Pending Providers: https://parenthelper.co.uk/admin/providers?filter=pending",
    `Reply to provider: ${emailLinkText}`,
    "",
    "This email contains registration details supplied via the Parent Helper onboarding form.",
  ].join("\n");

  return {
    subject,
    html,
    text,
  };
}


