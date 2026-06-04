const nodemailer = require('nodemailer');

const isEmailEnabled = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendStatusUpdateEmail = async ({
  to,
  title,
  referenceId,
  status,
  summary
}) => {
  if (!isEmailEnabled()) {
    return { skipped: true };
  }

  if (!to) {
    return { skipped: true };
  }

  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `Update: ${title} (${referenceId})`;
  const text = `Hello,\n\nYour ${title} (${referenceId}) is now "${status}".\n${summary ? `\n${summary}` : ''}\n\nThanks,\nNewsInsight Support`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
      <h2 style="margin:0 0 12px;">Status update</h2>
      <p>Your <strong>${title}</strong> (<strong>${referenceId}</strong>) is now <strong>${status}</strong>.</p>
      ${summary ? `<p>${summary}</p>` : ''}
      <p style="margin-top:16px;">Thanks,<br/>NewsInsight Support</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  return { messageId: info.messageId };
};

module.exports = {
  sendStatusUpdateEmail
};
