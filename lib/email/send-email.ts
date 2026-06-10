import {
  encodeMessage,
  getAuthenticatedGmailClient,
} from "@/lib/email/gmail-client";

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

export function isEmailConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.EMAIL_FROM
  );
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    return { success: false, error: "EMAIL_FROM is not configured" };
  }

  const gmail = await getAuthenticatedGmailClient();
  if (!gmail) {
    return {
      success: false,
      error:
        "Gmail is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
    };
  }

  const sender = parseSender(from);

  const rawMessage = [
    `From: ${sender.name} <${sender.email}>`,
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    options.html,
  ].join("\r\n");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodeMessage(rawMessage),
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
