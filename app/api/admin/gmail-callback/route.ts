import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/queries";
import { exchangeCodeForTokens } from "@/lib/email/gmail-client";

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

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gmail Connected</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.5; }
    code, pre { background: #f4f4f5; padding: 12px; border-radius: 8px; display: block; overflow-x: auto; word-break: break-all; }
    h1 { color: #166534; }
  </style>
</head>
<body>
  <h1>✅ Gmail connected</h1>
  <p>Add this to your <code>.env.local</code> and Vercel environment variables:</p>
  <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
  <p>Also set <code>EMAIL_FROM</code> to your Gmail address, e.g.:</p>
  <pre>EMAIL_FROM=Mexico &lt;your@gmail.com&gt;</pre>
  <p>Restart your dev server, then try sending a test recap from the admin panel.</p>
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
