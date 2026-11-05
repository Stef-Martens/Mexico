import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/cron (cron jobs use Bearer token auth, not cookies)
     * - manifest.json (browsers fetch it without cookies, so it must stay public)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/cron|manifest\\.json$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

