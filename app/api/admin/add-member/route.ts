import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if current user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { email, userId } = await request.json();

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Email or user ID is required" },
        { status: 400 },
      );
    }

    let targetUserId = userId as string | undefined;

    if (!targetUserId) {
      const { data: userData, error: userError } = await supabase.rpc(
        "get_user_id_by_email",
        { user_email: email },
      );

      if (userError) {
        console.error("Error finding user:", userError);
        return NextResponse.json(
          { error: userError.message || "User not found with this email" },
          { status: 404 },
        );
      }

      targetUserId = userData;
    }

    const { error: addError } = await supabase.rpc("admin_add_member", {
      target_user_id: targetUserId,
    });

    if (addError) {
      console.error("Error adding member:", addError);
      if (addError.message?.includes("already a member")) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: addError.message || "Failed to add member" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add member",
      },
      { status: 500 },
    );
  }
}
