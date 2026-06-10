import { NextResponse } from "next/server";
import { checkIsAdmin, deleteBadge, updateBadge } from "@/lib/queries";
import { BADGE_CONDITION_TYPES } from "@/lib/badge-categories";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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

  const ok = await updateBadge(id, {
    name: name.trim(),
    description: description.trim(),
    emoji: emoji.trim(),
    condition_type,
    condition_value: condition_type === "manual" ? null : value,
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to update badge" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await deleteBadge(id);

  if (!ok) {
    return NextResponse.json({ error: "Failed to delete badge" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
