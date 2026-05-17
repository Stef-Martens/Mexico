import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  getCurrentUserPlayer,
  completeAdFundum,
  checkAndAwardBadges,
  getPlayerMexicoCount,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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

    const player = await getCurrentUserPlayer();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Verify this ad fundum belongs to the current player
    const { data: adf, error: fetchErr } = await supabase
      .from("ad_fundums")
      .select("id, target_player_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !adf) {
      return NextResponse.json(
        { error: "Ad fundum not found" },
        { status: 404 },
      );
    }

    if (adf.target_player_id !== player.id) {
      return NextResponse.json(
        { error: "This is not your ad fundum" },
        { status: 403 },
      );
    }

    if (adf.status === "completed") {
      return NextResponse.json(
        { error: "Ad fundum already completed" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: images and MP4/MOV/WebM videos.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum 50 MB." },
        { status: 400 },
      );
    }

    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const storagePath = `${id}/proof.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from("ad-fundums")
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    const { data: urlData } = adminClient.storage
      .from("ad-fundums")
      .getPublicUrl(storagePath);

    const mediaType = isVideo ? "video" : "image";
    const ok = await completeAdFundum(id, urlData.publicUrl, mediaType);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to update ad fundum status" },
        { status: 500 },
      );
    }

    // Check for newly unlocked badges (non-fatal)
    let newBadges: Awaited<ReturnType<typeof checkAndAwardBadges>> = [];
    try {
      const yearStart = getStartDateForRange("year");
      const [allTimeCount, yearCount] = await Promise.all([
        getPlayerMexicoCount(player.id, null),
        getPlayerMexicoCount(player.id, yearStart),
      ]);
      newBadges = await checkAndAwardBadges(player.id, allTimeCount, yearCount);
    } catch (e) {
      console.error("checkAndAwardBadges failed (non-fatal):", e);
    }

    return NextResponse.json({
      success: true,
      mediaUrl: urlData.publicUrl,
      newBadges,
    });
  } catch (error) {
    console.error("Error in /api/ad-fundums/[id]/upload:", error);
    return NextResponse.json(
      { error: "Failed to upload proof" },
      { status: 500 },
    );
  }
}
