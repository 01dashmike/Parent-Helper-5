/**
 * Saved Search Digest Email Template
 * Sent when new classes match a saved search
 */

export const savedSearchDigestTemplate = {
  subject: "New classes matching your saved search: {{search_name}}",
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
        .class-card { margin: 15px 0; padding: 15px; background-color: white; border-left: 4px solid #9CAF88; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #9CAF88; color: white; text-decoration: none; border-radius: 24px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Classes Found!</h1>
        </div>
        <div class="content">
          <p>Hi {{first_name}},</p>
          <p>We found <strong>{{class_count}}</strong> new {{class_count === 1 ? 'class' : 'classes'}} matching your saved search: <strong>{{search_name}}</strong></p>

          {{classes_list}}

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{view_all_url}}" class="button">View All Matching Classes</a>
          </div>

          <p style="font-size: 14px; color: #666;">
            <a href="{{manage_searches_url}}">Manage your saved searches</a>
          </p>
        </div>
        <div class="footer">
          <p>You're receiving this because you have a saved search with {{cadence}} alerts enabled.</p>
          <p><a href="{{unsubscribe_url}}">Unsubscribe from this search</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hi {{first_name}},

We found {{class_count}} new {{class_count === 1 ? 'class' : 'classes'}} matching your saved search: {{search_name}}

{{classes_list_text}}

View all matching classes: {{view_all_url}}

Manage your saved searches: {{manage_searches_url}}

You're receiving this because you have a saved search with {{cadence}} alerts enabled.
Unsubscribe: {{unsubscribe_url}}
  `,
};

