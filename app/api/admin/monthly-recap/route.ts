import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/queries";
import { runMonthlyRecap } from "@/lib/monthly-recap";

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { testEmail, yearMonth } = body as {
    testEmail?: boolean;
    yearMonth?: string;
  };

  const testEmailOnly =
    process.env.MONTHLY_RECAP_TEST_EMAIL || "stef.m@hotmail.be";

  if (!testEmail) {
    return NextResponse.json(
      { error: "Only test emails can be triggered from the admin panel" },
      { status: 400 },
    );
  }

  if (yearMonth && !/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    return NextResponse.json({ error: "Invalid yearMonth format" }, { status: 400 });
  }

  try {
    const result = await runMonthlyRecap({
      testEmailOnly,
      yearMonth,
    });

    return NextResponse.json({
      message: result.error
        ? result.error
        : `Test recap sent to ${testEmailOnly} for ${result.monthLabel}`,
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
