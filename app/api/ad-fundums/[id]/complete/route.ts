import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserPlayer,
  completeAdFundum,
  checkAndAwardBadges,
  getPlayerMexicoCount,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";

export async function POST(
  request: Request,
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

    const { id } = await params;
    const { mediaUrl, mediaType } = (await request.json()) as {
      mediaUrl: string;
      mediaType: "image" | "video";
    };

    if (!mediaUrl || !mediaType) {
      return NextResponse.json(
        { error: "Missing mediaUrl or mediaType" },
        { status: 400 },
      );
    }

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: adf, error: fetchErr } = await supabase
      .from("ad_fundums")
      .select("id, target_player_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !adf) {
      return NextResponse.json({ error: "Adje not found" }, { status: 404 });
    }
    if (adf.target_player_id !== player.id) {
      return NextResponse.json(
        { error: "This is not your adje" },
        { status: 403 },
      );
    }
    if (adf.status === "completed") {
      return NextResponse.json(
        { error: "Adje already completed" },
        { status: 400 },
      );
    }

    const ok = await completeAdFundum(id, mediaUrl, mediaType);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to update adje status" },
        { status: 500 },
      );
    }

    // Award badges (non-fatal)
    let newBadges: Awaited<ReturnType<typeof checkAndAwardBadges>> = [];
    try {
      const yearStart = getStartDateForRange("year");
      const [allTimeCount, yearCount] = await Promise.all([
        getPlayerMexicoCount(player.id, null),
        getPlayerMexicoCount(player.id, yearStart),
      ]);
      newBadges = await checkAndAwardBadges(player.id, allTimeCount, yearCount);
    } catch (e) {
      console.error("checkAndAwardBadges failed (non-fatal):", e);
    }

    return NextResponse.json({ success: true, newBadges });
  } catch (error) {
    console.error("Error in /api/ad-fundums/[id]/complete:", error);
    return NextResponse.json(
      { error: "Failed to complete adje" },
      { status: 500 },
    );
  }
}
