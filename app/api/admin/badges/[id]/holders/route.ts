import { NextResponse } from "next/server";
import { awardBadgeToPlayer, checkIsAdmin, revokeBadgeFromPlayer } from "@/lib/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { playerId, action } = await request.json();

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const ok =
    action === "revoke"
      ? await revokeBadgeFromPlayer(id, playerId)
      : await awardBadgeToPlayer(id, playerId);

  if (!ok) {
    return NextResponse.json({ error: "Failed to update player badge" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
