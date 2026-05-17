import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getCurrentUserPlayer } from "@/lib/queries";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("type") ?? "";
    const fileName = searchParams.get("name") ?? "file";

    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: images and MP4/MOV/WebM videos.",
        },
        { status: 400 },
      );
    }

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Verify ownership and status
    const { data: adf, error: fetchErr } = await supabase
      .from("ad_fundums")
      .select("id, target_player_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !adf) {
      return NextResponse.json({ error: "Adje not found" }, { status: 404 });
    }
    if (adf.target_player_id !== player.id) {
      return NextResponse.json(
        { error: "This is not your adje" },
        { status: 403 },
      );
    }
    if (adf.status === "completed") {
      return NextResponse.json(
        { error: "Adje already completed" },
        { status: 400 },
      );
    }

    const isVideo = fileType.startsWith("video/");
    const ext = fileName.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const storagePath = `${id}/proof.${ext}`;

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("ad-fundums")
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (error || !data) {
      console.error("Failed to create signed upload URL:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 },
      );
    }

    const { data: urlData } = admin.storage
      .from("ad-fundums")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (error) {
    console.error("Error in /api/ad-fundums/[id]/upload-url:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
