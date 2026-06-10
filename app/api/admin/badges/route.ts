import { NextResponse } from "next/server";
import { checkIsAdmin, createBadge, getAllBadgesWithHolders } from "@/lib/queries";
import { BADGE_CONDITION_TYPES } from "@/lib/badge-categories";

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const badges = await getAllBadgesWithHolders();
  return NextResponse.json({ badges });
}

export async function POST(request: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, emoji, condition_type, condition_value } = body;

  if (!name?.trim() || !description?.trim() || !emoji?.trim()) {
    return NextResponse.json({ error: "Name, description and emoji are required" }, { status: 400 });
  }

  if (!BADGE_CONDITION_TYPES.includes(condition_type)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const value =
    condition_type === "manual"
      ? null
      : typeof condition_value === "number"
        ? condition_value
        : parseInt(String(condition_value), 10);

  if (condition_type !== "manual" && (!value || value <= 0)) {
    return NextResponse.json({ error: "Condition value is required" }, { status: 400 });
  }

  const badge = await createBadge({
    name: name.trim(),
    description: description.trim(),
    emoji: emoji.trim(),
    condition_type,
    condition_value: condition_type === "manual" ? null : value,
  });

  if (!badge) {
    return NextResponse.json({ error: "Failed to create badge" }, { status: 500 });
  }

  return NextResponse.json({ badge });
}
