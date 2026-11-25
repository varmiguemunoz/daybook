import nodemailer, { type Transporter } from 'nodemailer';
import type { Config } from '../../config';

let transporter: Transporter | null = null;
let sender = '';

export function configureEmail(config: Config): void {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) return;
  sender = config.SMTP_FROM ?? config.SMTP_USER;
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.sendMail({ from: sender, to, subject, text });
    return true;
  } catch (error) {
    console.error('[email] send failed', error);
    return false;
  }
}
