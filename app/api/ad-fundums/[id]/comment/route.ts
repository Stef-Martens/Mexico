import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserPlayer, addAdFundumComment } from "@/lib/queries";

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

    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Comment too long (max 500 characters)" },
        { status: 400 },
      );
    }

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const comment = await addAdFundumComment(id, player.id, content.trim());
    if (!comment) {
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Error in /api/ad-fundums/[id]/comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 },
    );
  }
}
