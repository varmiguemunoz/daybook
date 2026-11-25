import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function configured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function emailConfigured(): boolean {
  return configured();
}

function getTransporter(): Transporter | null {
  if (!configured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject, html });
    return true;
  } catch (error) {
    console.error('[email] send failed', error);
    return false;
  }
}
