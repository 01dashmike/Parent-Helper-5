/**
 * Referral invitation email template
 */

export type ReferralInviteData = {
    referrerName: string;
    referralUrl: string;
    referralType?: "member" | "provider";
};

export function generateReferralInviteEmail(data: ReferralInviteData) {
    const isProvider = data.referralType === "provider";
    const subject = isProvider
        ? "Join Parent Helper as a Class Provider – Invitation from a Friend"
        : `Join Parent Helper and find amazing classes near you – gift from ${data.referrerName}`;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #9CAF88;">You're Invited to Parent Helper!</h1>
            <p>Hi there,</p>
            <p><strong>${data.referrerName}</strong> thinks you'd love Parent Helper${isProvider ? " as a class provider" : ""}.</p>
            ${isProvider
                ? `<p>Parent Helper connects thousands of parents with amazing baby and toddler classes across the UK. Join as a provider to reach more families and grow your business.</p>`
                : `<p>Parent Helper is the best way to discover amazing baby and toddler classes near you.</p>`}
            <div style="background: #f5f5f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <a href="${data.referralUrl}" style="display: inline-block; background-color: #9CAF88; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                    ${isProvider ? "Join as Provider" : "Join Parent Helper"}
                </a>
            </div>
            <p>When you sign up using this link, you'll both get rewards!</p>
            <p>Best regards,<br>The Parent Helper Team</p>
        </div>
    `;

    const text = `You're invited to Parent Helper!\n\n${data.referrerName} thinks you'd love Parent Helper${isProvider ? " as a class provider" : ""}.\n\n${isProvider
        ? "Parent Helper connects thousands of parents with amazing baby and toddler classes across the UK. Join as a provider to reach more families and grow your business.\n\n"
        : "Parent Helper is the best way to discover amazing baby and toddler classes near you.\n\n"}Join here: ${data.referralUrl}\n\nWhen you sign up using this link, you'll both get rewards!`;

    return { subject, html, text };
}
