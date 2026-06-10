import { NextResponse } from "next/server";
import { checkIsAdmin, updatePlayerNameByAdmin } from "@/lib/queries";

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { playerId, name } = await request.json();

  if (!playerId || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const success = await updatePlayerNameByAdmin(playerId, name);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to update player name" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, name: name.trim() });
}
