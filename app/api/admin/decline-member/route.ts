import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { error } = await supabase.rpc("admin_decline_user", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Error declining user:", error);
      return NextResponse.json(
        { error: error.message || "Failed to decline user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error declining user:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to decline user",
      },
      { status: 500 },
    );
  }
}
