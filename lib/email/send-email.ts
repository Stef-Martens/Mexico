import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "Mexico", email: from.trim() };
}

export async function isEmailConfigured(): Promise<boolean> {
  return !!(process.env.EMAIL_FROM && process.env.GMAIL_APP_PASSWORD);
}

export function getEmailConfigError(): string | null {
  if (!process.env.EMAIL_FROM) {
    return "EMAIL_FROM must be set in environment variables.";
  }
  if (!process.env.GMAIL_APP_PASSWORD) {
    return "GMAIL_APP_PASSWORD must be set in environment variables.";
  }
  return null;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    return { success: false, error: "EMAIL_FROM is not configured" };
  }

  const configError = getEmailConfigError();
  if (configError) {
    return { success: false, error: configError };
  }

  const sender = parseSender(from);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: sender.email,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `${sender.name} <${sender.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
