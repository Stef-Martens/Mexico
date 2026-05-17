import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerInfo } from "@/lib/queries";

export async function GET(
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

    const { id } = await params;
    const info = await getPlayerInfo(id);

    if (!info) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error("Error in /api/player/[id]/info:", error);
    return NextResponse.json(
      { error: "Failed to fetch player info" },
      { status: 500 },
    );
  }
}
