/**
 * Default HTML templates for contact-form emails.
 * Placeholders {{name}}, {{email}} and {{message}} are replaced with the
 * visitor's (HTML-escaped) values before sending via Resend.
 * Editable from Admin → Home ("Contact Email Template" / "Customer Auto-Reply
 * Template"; stored on homepage/settings.emailTemplateHtml / autoReplyTemplateHtml).
 */
export const DEFAULT_EMAIL_TEMPLATE_HTML = `<body style="background-color: #0d1a2e; color: #e5e7eb; margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1a2b42; border-radius: 8px; border: 1px solid #2a3f5f;">
    <tr>
      <td style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/dsq1lxrqi/image/upload/f_png,q_auto/v1787285448/MelliVision_Logo_V3W_w2ii5n.png" alt="Logo" style="max-width: 150px; height: auto;">
        </div>
        <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 24px; text-align: center;">Message From MelliVision</h1>
        <p style="margin: 0 0 16px; text-align: center;">To Be Replied ASAP.</p>

        <div style="background-color: #0d1a2e; padding: 20px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> {{name}}</p>
          <p style="margin: 0 0 16px;"><strong>Email:</strong> <a href="mailto:{{email}}" style="color: #60a5fa; text-decoration: none;">{{email}}</a></p>
          <hr style="border: none; border-top: 1px solid #2a3f5f; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #d1d5db;">Message:</p>
          <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">{{message}}</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">All Rights Are Reserved To MelliVision 2026.</p>
      </td>
    </tr>
  </table>
</body>`;

/**
 * Default HTML template for the automatic acknowledgment sent to the VISITOR
 * right after they submit the contact form.
 */
export const DEFAULT_AUTOREPLY_TEMPLATE_HTML = `<body style="background-color: #0d1a2e; color: #e5e7eb; margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1a2b42; border-radius: 8px; border: 1px solid #2a3f5f;">
    <tr>
      <td style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://res.cloudinary.com/dsq1lxrqi/image/upload/f_png,q_auto/v1787285448/MelliVision_Logo_V3W_w2ii5n.png" alt="Logo" style="max-width: 150px; height: auto;">
        </div>
        <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 24px; text-align: center;">Thank You, {{name}}!</h1>
        <p style="margin: 0 0 16px; text-align: center;">
          We have received your message and appreciate you reaching out.
          Our team will get back to you shortly at <strong>{{email}}</strong>.
        </p>

        <div style="background-color: #0d1a2e; padding: 20px; border-radius: 8px;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #d1d5db;">Your message:</p>
          <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">{{message}}</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">This is an automatic confirmation — please do not reply directly to this email.</p>
      </td>
    </tr>
  </table>
</body>`;
