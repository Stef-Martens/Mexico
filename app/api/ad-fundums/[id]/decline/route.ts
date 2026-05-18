import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkIsAdmin,
  getCurrentUserPlayer,
  declineAdFundum,
} from "@/lib/queries";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { id } = await params;

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    let reason: string | undefined;
    try {
      const body = await _request.json();
      reason =
        typeof body?.reason === "string" && body.reason.trim()
          ? body.reason.trim()
          : undefined;
    } catch {
      // body is optional
    }

    const newAdje = await declineAdFundum(id, player.id, reason);
    if (!newAdje) {
      return NextResponse.json(
        { error: "Failed to decline adje" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, newAdje });
  } catch (error) {
    console.error("Error in /api/ad-fundums/[id]/decline:", error);
    return NextResponse.json(
      { error: "Failed to decline adje" },
      { status: 500 },
    );
  }
}
