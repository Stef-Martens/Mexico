import { NextResponse } from "next/server";
import { checkIsAdmin, deleteMexicoEvent } from "@/lib/queries";
import { revalidatePath } from "next/cache";

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

    console.log("Attempting to delete event:", eventId);
    await deleteMexicoEvent(eventId);
    console.log("Event deleted successfully:", eventId);

    // Revalidate the log page and home page
    revalidatePath("/log");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/mexico:", error);
    return NextResponse.json(
      { error: "Failed to delete Mexico event" },
      { status: 500 },
    );
  }
}
