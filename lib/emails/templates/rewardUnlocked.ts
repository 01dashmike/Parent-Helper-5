/**
 * Reward unlocked email template
 */

export type RewardUnlockedData = {
    rewardAmount: string; // e.g., "5.00"
    points: number;
    referralType?: "member" | "provider";
};

export function generateRewardUnlockedEmail(data: RewardUnlockedData) {
    const isProvider = data.referralType === "provider";
    const subject = isProvider
        ? "Your friend's class is live – here's your 10% boost credit!"
        : "🎉 You've earned a £5 Parent Helper credit!";

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #9CAF88;">Reward Unlocked! 🎉</h1>
            <p>Great news! ${isProvider ? "A provider you referred has joined Parent Helper" : "Your friend has joined Parent Helper using your referral link"}.</p>
            <div style="background: #f5f5f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: #9CAF88; margin: 0;">
                    £${data.rewardAmount} Credit
                </p>
                <p style="margin: 10px 0 0;">+ ${data.points} points</p>
            </div>
            <p>Your credit is now available in your rewards account. ${isProvider ? "Use it towards boosting your listings!" : "Use it towards your next class booking!"}</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/account/rewards" style="display: inline-block; background-color: #9CAF88; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                    View My Rewards
                </a>
            </div>
            <p>Thank you for spreading the word about Parent Helper!</p>
            <p>Best regards,<br>The Parent Helper Team</p>
        </div>
    `;

    const text = `Reward Unlocked! 🎉\n\nGreat news! ${isProvider ? "A provider you referred has joined Parent Helper" : "Your friend has joined Parent Helper using your referral link"}.\n\nYou've earned:\n- £${data.rewardAmount} Credit\n- ${data.points} points\n\nYour credit is now available in your rewards account. ${isProvider ? "Use it towards boosting your listings!" : "Use it towards your next class booking!"}\n\nView your rewards: ${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/account/rewards`;

    return { subject, html, text };
}

