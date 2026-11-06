import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const port = parseInt(env.SMTP_PORT || '587', 10);
  const secure = env.SMTP_SECURE || port === 465;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    // Useful for cloud providers that don't allow strictly strict certs
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
};

/**
 * Send Contact Form Inquiry Email to Craviti Headquarters
 */
export const sendContactEmail = async ({
  name,
  email,
  phone = '',
  restaurant = '',
  tables = '',
  subject = '',
  message = '',
  ip = '',
}) => {
  const mailTransporter = getTransporter();
  const targetRecipient = 'contactcraviti@gmail.com';
  const submissionTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const mailSubject = subject || `[Craviti Inquiry] New Contact Form Submission from ${name}`;

  const textBody = `
New Contact Form Submission on Craviti Public Website
======================================================
Name:            ${name}
Email:           ${email}
Phone:           ${phone || 'N/A'}
Restaurant:      ${restaurant || 'N/A'}
Dining Tables:   ${tables || 'N/A'}
Subject:         ${subject || 'General Inquiry'}
Submission Time: ${submissionTime} (IST)
IP Address:      ${ip || 'N/A'}

Message:
--------
${message}
======================================================
Sent via Craviti Production Backend Mail Service
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #111827; padding: 24px; color: #ffffff; }
    .header h2 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; }
    .content { padding: 28px 24px; }
    .field-row { display: flex; border-bottom: 1px solid #f1f5f9; padding: 10px 0; font-size: 13px; }
    .field-label { width: 140px; font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
    .field-val { flex: 1; color: #0f172a; font-weight: 600; word-break: break-word; }
    .message-box { margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>CRAVITI - New Website Inquiry</h2>
      <p>Received from Craviti Public Portal Contact Form</p>
    </div>
    <div class="content">
      <div class="field-row">
        <div class="field-label">Sender Name</div>
        <div class="field-val"><strong>${name}</strong></div>
      </div>
      <div class="field-row">
        <div class="field-label">Email Address</div>
        <div class="field-val"><a href="mailto:${email}" style="color: #ff6b35; text-decoration: none;">${email}</a></div>
      </div>
      <div class="field-row">
        <div class="field-label">Phone / WhatsApp</div>
        <div class="field-val"><a href="tel:${phone}" style="color: #0f172a; text-decoration: none;">${phone || 'N/A'}</a></div>
      </div>
      ${restaurant ? `
      <div class="field-row">
        <div class="field-label">Restaurant</div>
        <div class="field-val">${restaurant}</div>
      </div>` : ''}
      ${tables ? `
      <div class="field-row">
        <div class="field-label">Dining Tables</div>
        <div class="field-val">${tables}</div>
      </div>` : ''}
      <div class="field-row">
        <div class="field-label">Subject</div>
        <div class="field-val">${subject || 'General Inquiry'}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Timestamp</div>
        <div class="field-val">${submissionTime} (IST)</div>
      </div>
      <div class="field-row">
        <div class="field-label">Origin IP</div>
        <div class="field-val"><code>${ip || 'N/A'}</code></div>
      </div>

      <div style="margin-top: 20px;">
        <span class="field-label" style="display: block; margin-bottom: 6px;">Message Body:</span>
        <div class="message-box">${message}</div>
      </div>
    </div>
    <div class="footer">
      This email was generated automatically by Craviti Production Engine on Render.
    </div>
  </div>
</body>
</html>
  `.trim();

  // If credentials are completely empty (local dev without SMTP), log gracefully
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('[EmailService] SMTP credentials not fully configured in environment. Logged inquiry:');
    console.log({ targetRecipient, mailSubject, name, email, phone, message });
    return {
      success: true,
      delivered: false,
      message: 'Logged inquiry (SMTP credentials pending in local dev environment)',
    };
  }

  const senderEmail = env.EMAIL_FROM || env.SMTP_USER;
  const info = await mailTransporter.sendMail({
    from: senderEmail,
    to: targetRecipient,
    replyTo: email,
    subject: mailSubject,
    text: textBody,
    html: htmlBody,
  });

  return {
    success: true,
    delivered: true,
    messageId: info.messageId,
  };
};
