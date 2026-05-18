import { NextResponse } from "next/server";
import { checkIsAdmin, awardCoins } from "@/lib/queries";

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { playerId, amount } = await request.json();

  if (!playerId || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await awardCoins(playerId, amount);

  return NextResponse.json({ success: true });
}
