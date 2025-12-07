/**
 * Weekly Family Newsletter Email Template
 * Uses Handlebars-style variables: {{household_name}}, {{child_name}}, {{local_city}}, etc.
 */

export const familyNewsletterTemplate = {
  subject: "Your weekly Parent Helper newsletter, {{household_name}}",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9CAF88; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .section { margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; }
        .class-card { margin: 10px 0; padding: 15px; border-left: 4px solid #9CAF88; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Weekly Parent Helper Newsletter</h1>
        </div>
        <div class="content">
          <p>Hi {{household_name}},</p>
          <p>Here's what's new for your family this week!</p>

          {{#if child_section}}
          <div class="section">
            <h2>For {{child_name}}, this week</h2>
            {{child_section}}
          </div>
          {{/if}}

          {{#if local_section}}
          <div class="section">
            <h2>Near {{local_city}}</h2>
            {{local_section}}
          </div>
          {{/if}}

          {{#if editors_picks_section}}
          <div class="section">
            <h2>Editor's Picks</h2>
            {{editors_picks_section}}
          </div>
          {{/if}}

          {{#if category_section}}
          <div class="section">
            <h2>Because you looked at {{category}}</h2>
            {{category_section}}
          </div>
          {{/if}}

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/search" class="button">Explore More Classes</a>
          </div>
        </div>
        <div class="footer">
          <p>You're receiving this because you opted in to personalized newsletters.</p>
          <p><a href="{{app_url}}/account/preferences">Manage preferences</a> | <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hi {{household_name}},

Here's what's new for your family this week!

{{#if child_section}}
For {{child_name}}, this week:
{{child_section}}
{{/if}}

{{#if local_section}}
Near {{local_city}}:
{{local_section}}
{{/if}}

{{#if editors_picks_section}}
Editor's Picks:
{{editors_picks_section}}
{{/if}}

{{#if category_section}}
Because you looked at {{category}}:
{{category_section}}
{{/if}}

Explore more classes: {{app_url}}/search

Manage preferences: {{app_url}}/account/preferences
Unsubscribe: {{unsubscribe_url}}
  `,
};

