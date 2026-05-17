import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openMysteryBox, getCurrentUserPlayer } from "@/lib/queries";
import type { BoxTier } from "@/lib/queries";

const VALID_TIERS: BoxTier[] = ["bronze", "silver", "gold"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body as { tier: BoxTier };

    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "Invalid box tier" }, { status: 400 });
    }

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const result = await openMysteryBox(player.id, tier);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error in /api/shop/buy-box:", error);
    return NextResponse.json(
      { error: "Failed to open mystery box" },
      { status: 500 },
    );
  }
}
