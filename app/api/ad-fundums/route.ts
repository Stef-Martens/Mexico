import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdFundums } from "@/lib/queries";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fundums = await getAdFundums();
    return NextResponse.json(fundums);
  } catch (error) {
    console.error("Error in GET /api/ad-fundums:", error);
    return NextResponse.json(
      { error: "Failed to fetch ad fundums" },
      { status: 500 },
    );
  }
}
