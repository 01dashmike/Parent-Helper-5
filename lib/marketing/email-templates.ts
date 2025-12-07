/**
 * Email templates for marketing automation
 * These templates use Handlebars-style variables: {{first_name}}, {{wallet_balance}}, {{local_city}}
 */

export const emailTemplates = {
  welcome: {
    subject: "Welcome to Parent Helper, {{first_name}}! 👋",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Parent Helper!</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>We're so excited to have you join our community of parents discovering amazing classes for their little ones.</p>
            <p><strong>Here's what you can do next:</strong></p>
            <ul>
              <li>Set up your profile to get personalized recommendations</li>
              <li>Browse classes near {{local_city}}</li>
              <li>Save your favorite searches to get alerts about new classes</li>
            </ul>
            <a href="{{app_url}}/account/profile" class="button">Set Up Your Profile</a>
            <p>Happy exploring!</p>
            <p>The Parent Helper Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

Welcome to Parent Helper! We're so excited to have you join our community.

Here's what you can do next:
- Set up your profile to get personalized recommendations
- Browse classes near {{local_city}}
- Save your favorite searches to get alerts about new classes

Visit {{app_url}}/account/profile to get started.

Happy exploring!
The Parent Helper Team
    `,
  },

  welcomeBenefits: {
    subject: "Discover the benefits of Parent Helper, {{first_name}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .benefit { margin: 15px 0; padding: 15px; background-color: white; border-left: 4px solid #9CAF88; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Why Parents Love Parent Helper</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>Here are some ways Parent Helper can help you find the perfect classes:</p>
            <div class="benefit">
              <strong>📍 Location-Based Search</strong>
              <p>Find classes near {{local_city}} that match your child's age and interests.</p>
            </div>
            <div class="benefit">
              <strong>🔔 Smart Alerts</strong>
              <p>Get notified when new classes appear that match your saved searches.</p>
            </div>
            <div class="benefit">
              <strong>💳 Easy Booking</strong>
              <p>Book classes directly through our platform with secure payment.</p>
            </div>
            <a href="{{app_url}}/search" class="button">Start Exploring Classes</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

Here are some ways Parent Helper can help you:

📍 Location-Based Search
Find classes near {{local_city}} that match your child's age and interests.

🔔 Smart Alerts
Get notified when new classes appear that match your saved searches.

💳 Easy Booking
Book classes directly through our platform with secure payment.

Visit {{app_url}}/search to start exploring.

The Parent Helper Team
    `,
  },

  welcomeSavedSearch: {
    subject: "Create your first saved search, {{first_name}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Never Miss a New Class</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>Did you know you can save your searches and get alerts when new classes appear?</p>
            <p>When you save a search, we'll send you a weekly digest of new classes matching your criteria near {{local_city}}.</p>
            <a href="{{app_url}}/search" class="button">Create Your First Saved Search</a>
            <p>It only takes a minute, and you'll never miss a great class opportunity!</p>
            <p>The Parent Helper Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

Did you know you can save your searches and get alerts when new classes appear?

When you save a search, we'll send you a weekly digest of new classes matching your criteria near {{local_city}}.

Visit {{app_url}}/search to create your first saved search.

It only takes a minute, and you'll never miss a great class opportunity!

The Parent Helper Team
    `,
  },

  firstBooking: {
    subject: "Congratulations on your first booking, {{first_name}}! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>We're thrilled that you've made your first booking with Parent Helper!</p>
            <p>We hope your little one has an amazing time at the class.</p>
            <p><strong>Share the love!</strong> Invite 2 friends to join Parent Helper and you'll both unlock bonus credit.</p>
            <a href="{{app_url}}/account/referrals" class="button">Invite Friends & Earn Credit</a>
            <p>Thanks for being part of our community!</p>
            <p>The Parent Helper Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

Congratulations on your first booking with Parent Helper! We hope your little one has an amazing time.

Share the love! Invite 2 friends to join Parent Helper and you'll both unlock bonus credit.

Visit {{app_url}}/account/referrals to get your referral link.

Thanks for being part of our community!
The Parent Helper Team
    `,
  },

  inactivity: {
    subject: "Classes you might love near {{local_city}}, {{first_name}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .class-card { margin: 15px 0; padding: 15px; background-color: white; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>We Miss You!</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>It's been a while since you last booked a class. We've found some great new classes near {{local_city}} that might interest you!</p>
            {{#if wallet_balance}}
            <p>You have {{wallet_balance}} in your wallet - perfect for booking a new class!</p>
            {{/if}}
            <a href="{{app_url}}/search?town={{local_city}}" class="button">Explore Classes Near You</a>
            <p>Happy exploring!</p>
            <p>The Parent Helper Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

It's been a while since you last booked a class. We've found some great new classes near {{local_city}} that might interest you!

{{#if wallet_balance}}
You have {{wallet_balance}} in your wallet - perfect for booking a new class!
{{/if}}

Visit {{app_url}}/search?town={{local_city}} to explore classes near you.

Happy exploring!
The Parent Helper Team
    `,
  },

  walletNudge: {
    subject: "Use your {{wallet_balance}} credit on new bookings, {{first_name}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Use Your Credit</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>You have {{wallet_balance}} in your Parent Helper wallet!</p>
            <p>Why not use it to book a new class near {{local_city}}? We've added lots of great options recently.</p>
            <a href="{{app_url}}/search?town={{local_city}}" class="button">Browse Classes</a>
            <p>The Parent Helper Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

You have {{wallet_balance}} in your Parent Helper wallet!

Why not use it to book a new class near {{local_city}}? We've added lots of great options recently.

Visit {{app_url}}/search?town={{local_city}} to browse classes.

The Parent Helper Team
    `,
  },

  referralReminder: {
    subject: "Your friend hasn't joined yet, {{first_name}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reminder: Invite Your Friends</h1>
          </div>
          <div class="content">
            <p>Hi {{first_name}},</p>
            <p>You invited a friend to join Parent Helper, but they haven't signed up yet.</p>
            <p>Invite 2 friends to join and you'll both unlock bonus credit when they sign up!</p>
            <a href="{{app_url}}/account/referrals" class="button">Send Another Invite</a>
            <p>The Parent Helper Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi {{first_name}},

You invited a friend to join Parent Helper, but they haven't signed up yet.

Invite 2 friends to join and you'll both unlock bonus credit when they sign up!

Visit {{app_url}}/account/referrals to send another invite.

The Parent Helper Team
    `,
  },
};

