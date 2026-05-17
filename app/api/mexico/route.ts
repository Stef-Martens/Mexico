import { NextResponse } from "next/server";
import {
  logMexico,
  getPlayerMexicoCount,
  getPlayers,
  awardCoins,
  checkAndAwardBadges,
  getPlayersWithPendingAdFundums,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 },
      );
    }

    // Block logging if the player has a pending ad fundum
    const pendingPlayers = await getPlayersWithPendingAdFundums();
    if (pendingPlayers.has(playerId)) {
      return NextResponse.json(
        {
          error: "Player has a pending Adje! They must drink first. 🍺",
          blocked: true,
        },
        { status: 403 },
      );
    }

    await logMexico(playerId);

    // Award +1 coin — non-fatal if admin client fails (e.g. missing env var in production)
    try {
      await awardCoins(playerId, 1);
    } catch (e) {
      console.error("awardCoins failed (non-fatal):", e);
    }

    // Check for milestones
    const yearStart = getStartDateForRange("year");
    const allTimeCount = await getPlayerMexicoCount(playerId, null);
    const yearCount = await getPlayerMexicoCount(playerId, yearStart);

    // Get player name
    const players = await getPlayers();
    const player = players.find((p) => p.id === playerId);
    const playerName = player?.name || "Player";

    const milestones: { type: string; count: number; period: string }[] = [];

    // Check year milestones (10, 25, 50, 100, 250, 500, 1000)
    const yearMilestones = [10, 25, 50, 100, 250, 500, 1000];
    if (yearMilestones.includes(yearCount)) {
      milestones.push({ type: "milestone", count: yearCount, period: "year" });
    }

    // Check all-time milestones (50, 100, 250, 500, 1000, 2500, 5000)
    const allTimeMilestones = [50, 100, 250, 500, 1000, 2500, 5000];
    if (allTimeMilestones.includes(allTimeCount)) {
      milestones.push({
        type: "milestone",
        count: allTimeCount,
        period: "all-time",
      });
    }

    // Check and award any newly unlocked badges — non-fatal
    let newBadges: { emoji: string; name: string }[] = [];
    try {
      newBadges = await checkAndAwardBadges(playerId, allTimeCount, yearCount);
    } catch (e) {
      console.error("checkAndAwardBadges failed (non-fatal):", e);
    }

    return NextResponse.json({
      success: true,
      milestones,
      newBadges,
      playerName,
      yearCount,
      allTimeCount,
    });
  } catch (error) {
    console.error("Error in /api/mexico:", error);
    return NextResponse.json(
      { error: "Failed to log Mexico" },
      { status: 500 },
    );
  }
}
