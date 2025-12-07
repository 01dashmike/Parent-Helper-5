/**
 * Welcome Email Template
 * Sent after user completes profile setup
 */

export const welcomeEmailTemplate = {
  subject: "You're now part of Parent Helper! 🎉",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9CAF88; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 14px 28px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 20px 0; font-weight: 600; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Parent Helper! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi {{first_name}},</p>
          <p>We're so excited to have you join Parent Helper! You're now part of a community of thousands of families discovering amazing baby and toddler classes.</p>
          
          <h2>What's next?</h2>
          <ul>
            <li><strong>Explore classes:</strong> Search for activities near you</li>
            <li><strong>Save searches:</strong> Get alerts when new classes match your criteria</li>
            <li><strong>Personalized recommendations:</strong> We'll show you classes perfect for your child's age and interests</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/search" class="button">Start Exploring Classes</a>
          </div>

          <p>If you saved a search, you'll receive weekly alerts when new classes appear. You can manage your alerts anytime from your account.</p>

          <p>Questions? Just reply to this email – we're here to help!</p>

          <p>Best,<br>The Parent Helper Team</p>
        </div>
        <div class="footer">
          <p>You're receiving this because you signed up for Parent Helper.</p>
          <p><a href="{{app_url}}/account/preferences">Manage preferences</a> | <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Welcome to Parent Helper! 🎉

Hi {{first_name}},

We're so excited to have you join Parent Helper! You're now part of a community of thousands of families discovering amazing baby and toddler classes.

What's next?
- Explore classes: Search for activities near you
- Save searches: Get alerts when new classes match your criteria
- Personalized recommendations: We'll show you classes perfect for your child's age and interests

Start exploring: {{app_url}}/search

If you saved a search, you'll receive weekly alerts when new classes appear. You can manage your alerts anytime from your account.

Questions? Just reply to this email – we're here to help!

Best,
The Parent Helper Team

Manage preferences: {{app_url}}/account/preferences
Unsubscribe: {{unsubscribe_url}}
  `,
};

