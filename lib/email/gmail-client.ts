import { google } from "googleapis";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export function getGmailRedirectUri(origin: string): string {
  return `${origin}/api/admin/gmail-callback`;
}

export function createOAuth2Client(redirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailAuthUrl(origin: string): string | null {
  const oauth2Client = createOAuth2Client(getGmailRedirectUri(origin));
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_SEND_SCOPE],
  });
}

export async function exchangeCodeForTokens(code: string, origin: string) {
  const oauth2Client = createOAuth2Client(getGmailRedirectUri(origin));
  if (!oauth2Client) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured");
  }

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getAuthenticatedGmailClient() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client || !refreshToken) {
    return null;
  }

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export function encodeMessage(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
