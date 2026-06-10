import { NextResponse } from "next/server";
import { runMonthlyRecap } from "@/lib/monthly-recap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMonthlyRecap();

    if (result.skipped) {
      return NextResponse.json({
        message: `Recap for ${result.monthLabel} already sent`,
        ...result,
      });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error, ...result }, { status: 500 });
    }

    return NextResponse.json({
      message: `Monthly recap sent for ${result.monthLabel}`,
      ...result,
    });
  } catch (error) {
    console.error("Monthly recap cron failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Monthly recap failed",
      },
      { status: 500 },
    );
  }
}
