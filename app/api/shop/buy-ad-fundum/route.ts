import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserPlayer,
  deductCoins,
  createAdFundum,
  checkAndAwardBadges,
  getPlayerMexicoCount,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";

const AD_FUNDUM_COST = 30;

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
    const { targetPlayerId, reason } = body as {
      targetPlayerId: string;
      reason?: string;
    };

    if (!targetPlayerId) {
      return NextResponse.json(
        { error: "targetPlayerId is required" },
        { status: 400 },
      );
    }

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (player.id === targetPlayerId) {
      return NextResponse.json(
        { error: "You cannot assign an ad fundum to yourself" },
        { status: 400 },
      );
    }

    const ok = await deductCoins(player.id, AD_FUNDUM_COST);
    if (!ok) {
      return NextResponse.json(
        { error: `Not enough coins. Ad Fundum costs ${AD_FUNDUM_COST} coins.` },
        { status: 400 },
      );
    }

    const adFundum = await createAdFundum(targetPlayerId, player.id, reason);
    if (!adFundum) {
      return NextResponse.json(
        { error: "Failed to create ad fundum" },
        { status: 500 },
      );
    }

    // Check if assigning player earned any badges
    const yearStart = getStartDateForRange("year");
    const [allTimeCount, yearCount] = await Promise.all([
      getPlayerMexicoCount(player.id, null),
      getPlayerMexicoCount(player.id, yearStart),
    ]);
    const newBadges = await checkAndAwardBadges(
      player.id,
      allTimeCount,
      yearCount,
    );

    return NextResponse.json({ success: true, adFundum, newBadges });
  } catch (error) {
    console.error("Error in /api/shop/buy-ad-fundum:", error);
    return NextResponse.json(
      { error: "Failed to buy ad fundum" },
      { status: 500 },
    );
  }
}
