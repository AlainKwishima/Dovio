import nodemailer from 'nodemailer';

let cachedTransporter = null;

function createTransporter() {
  if (process.env.NODE_ENV === 'test') {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = port === 465; // true for port 465, false for others
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

export function getMailer() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = createTransporter();
  return cachedTransporter;
}

export async function sendMail({ to, subject, html, text }) {
  const mailer = getMailer();
  const info = await mailer.sendMail({ from: process.env.SMTP_FROM || 'no-reply@mobile.app', to, subject, html, text });
  if (process.env.NODE_ENV !== 'test') {
    try { console.log('Email preview:', info?.message?.toString?.()); } catch {}
  }
  return info;
}


