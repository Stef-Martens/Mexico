import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/queries";
import { getGmailAuthUrl } from "@/lib/email/gmail-client";

export async function GET(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const authUrl = getGmailAuthUrl(origin);

  if (!authUrl) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables",
      },
      { status: 500 },
    );
  }

  return NextResponse.redirect(authUrl);
}
