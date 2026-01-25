import { NextResponse } from "next/server";
import { updatePlayerProfile } from "@/lib/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, avatarUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const success = await updatePlayerProfile(name, avatarUrl);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
