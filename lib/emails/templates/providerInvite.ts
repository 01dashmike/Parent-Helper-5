type TemplateParams = {
  orgName: string;
  contactName?: string | null;
  inviteLink: string;
};

const baseStyles = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #2F3336;
`;

export function getProviderInviteTemplate({
  orgName,
  contactName,
  inviteLink,
}: TemplateParams) {
  const headline = contactName ? `Hi ${contactName},` : "Hi there,";

  const html = `
    <div style="${baseStyles} background: #F7F4EE; padding: 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid rgba(108, 141, 131, 0.2);">
        <tr>
          <td>
            <p style="margin: 0 0 16px; font-size: 15px;">${headline}</p>
            <p style="margin: 0 0 16px; font-size: 15px;">
              Welcome to Parent Helper! We’ve reviewed your submission and created a provider console for <strong>${orgName}</strong>.
            </p>
            <p style="margin: 0 0 16px; font-size: 15px;">
              Use the secure magic link below to set your password-free login and access the console. The link expires shortly for security, but you can request a new one anytime from the login screen.
            </p>
            <p style="margin: 24px 0;">
              <a href="${inviteLink}" style="display: inline-block; background: #6C8D83; color: #FFFFFF; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600;">
                Access your provider console
              </a>
            </p>
            <p style="margin: 0 0 16px; font-size: 15px;">
              Once inside, you can:
            </p>
            <ul style="margin: 0 0 16px 20px; padding: 0; font-size: 15px;">
              <li>Add or edit classes and descriptions</li>
              <li>Schedule upcoming sessions</li>
              <li>Manage your venues and contact details</li>
            </ul>
            <p style="margin: 0 0 16px; font-size: 15px;">
              If you have any questions, simply reply to this email and we’ll be happy to help.
            </p>
            <p style="margin: 24px 0 0; font-size: 15px;">
              Warmly,<br/>
              The Parent Helper team
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = `
${headline}

Welcome to Parent Helper! We’ve reviewed your submission and created a provider console for ${orgName}.

Use the secure link below to access your portal:
${inviteLink}

Inside the console you can:
- Add or edit classes and descriptions
- Schedule upcoming sessions
- Manage venues and contact details

If the link has expired, request a new one anytime from the login screen.

Warmly,
The Parent Helper team
  `.trim();

  return {
    subject: `You're invited to Parent Helper (${orgName})`,
    html,
    text,
  };
}

