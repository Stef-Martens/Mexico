import { NextResponse } from "next/server";
import {
  checkIsAdmin,
  grantCosmeticToPlayer,
  revokeCosmeticFromPlayer,
} from "@/lib/queries";

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

  if (action === "revoke") {
    const ok = await revokeCosmeticFromPlayer(id, playerId);
    if (!ok) {
      return NextResponse.json({ error: "Failed to remove cosmetic" }, { status: 500 });
    }
  } else {
    await grantCosmeticToPlayer(playerId, id);
  }

  return NextResponse.json({ success: true });
}
