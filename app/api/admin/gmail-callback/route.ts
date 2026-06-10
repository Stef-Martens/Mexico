import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/queries";
import {
  exchangeCodeForTokens,
  saveGmailRefreshToken,
} from "@/lib/email/gmail-client";

export async function GET(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return new NextResponse("Admin access required", { status: 403 });
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(`Google authorization failed: ${error}`, {
      status: 400,
    });
  }

  if (!code) {
    return new NextResponse("Missing authorization code", { status: 400 });
  }

  try {
    const tokens = await exchangeCodeForTokens(code, origin);

    if (!tokens.refresh_token) {
      return new NextResponse(
        `Gmail connected, but no refresh token was returned.

Revoke access at https://myaccount.google.com/permissions and try again.
Make sure you see the consent screen (we request offline access).`,
        { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }

    await saveGmailRefreshToken(tokens.refresh_token);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gmail Connected</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.5; }
    h1 { color: #166534; }
  </style>
</head>
<body>
  <h1>✅ Gmail connected</h1>
  <p>Your Gmail refresh token has been saved. You can send test emails from the admin panel now.</p>
  <p>Make sure these are set in Vercel: <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and <code>EMAIL_FROM</code>.</p>
  <p><a href="/admin">← Back to admin panel</a></p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("Gmail callback error:", err);
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to connect Gmail",
      { status: 500 },
    );
  }
}
