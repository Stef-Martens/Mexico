import { NextResponse } from "next/server";
import {
  checkIsAdmin,
  createCosmetic,
  getAllCosmeticsWithOwners,
} from "@/lib/queries";
import { COSMETIC_RARITIES, COSMETIC_TYPES } from "@/lib/cosmetic-meta";

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cosmetics = await getAllCosmeticsWithOwners();
  return NextResponse.json({ cosmetics });
}

export async function POST(request: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const cosmetic = await createCosmetic({
    name: name.trim(),
    description: (description ?? "").trim(),
    type,
    value: value.trim(),
    preview: preview.trim(),
    rarity,
  });

  if (!cosmetic) {
    return NextResponse.json({ error: "Failed to create cosmetic" }, { status: 500 });
  }

  return NextResponse.json({ cosmetic });
}
