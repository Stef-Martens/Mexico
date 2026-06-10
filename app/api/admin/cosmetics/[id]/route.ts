import { NextResponse } from "next/server";
import { checkIsAdmin, deleteCosmetic, updateCosmetic } from "@/lib/queries";
import { COSMETIC_RARITIES, COSMETIC_TYPES } from "@/lib/cosmetic-meta";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, description, type, value, preview, rarity } = body;

  if (!name?.trim() || !value?.trim() || !preview?.trim()) {
    return NextResponse.json(
      { error: "Name, value and preview are required" },
      { status: 400 },
    );
  }

  if (!COSMETIC_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!COSMETIC_RARITIES.includes(rarity)) {
    return NextResponse.json({ error: "Invalid rarity" }, { status: 400 });
  }

  const ok = await updateCosmetic(id, {
    name: name.trim(),
    description: (description ?? "").trim(),
    type,
    value: value.trim(),
    preview: preview.trim(),
    rarity,
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to update cosmetic" }, { status: 500 });
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
  const ok = await deleteCosmetic(id);

  if (!ok) {
    return NextResponse.json({ error: "Failed to delete cosmetic" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
