import { NextResponse } from "next/server";
import { checkIsAdmin, deleteMexicoEvent } from "@/lib/queries";

export async function DELETE(request: Request) {
  try {
    // Check if user is admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    await deleteMexicoEvent(eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/mexico:", error);
    return NextResponse.json(
      { error: "Failed to delete Mexico event" },
      { status: 500 },
    );
  }
}
