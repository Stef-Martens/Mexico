import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/queries";
import { runMonthlyRecap } from "@/lib/monthly-recap";

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { yearMonth, dryRun, force } = body as {
    yearMonth?: string;
    dryRun?: boolean;
    force?: boolean;
  };

  try {
    const result = await runMonthlyRecap({ yearMonth, dryRun, force });

    return NextResponse.json({
      message: dryRun
        ? `Dry run complete for ${result.monthLabel}`
        : result.skipped
          ? `Recap for ${result.monthLabel} was already sent`
          : `Monthly recap sent for ${result.monthLabel}`,
      ...result,
    });
  } catch (error) {
    console.error("Admin monthly recap failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Monthly recap failed",
      },
      { status: 500 },
    );
  }
}
