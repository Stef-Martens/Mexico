import { NextResponse } from "next/server";
import { logMexico } from "@/lib/queries";

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

    await logMexico(playerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/mexico:", error);
    return NextResponse.json(
      { error: "Failed to log Mexico" },
      { status: 500 },
    );
  }
}
