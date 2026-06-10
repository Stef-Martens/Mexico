export const COSMETIC_TYPES = [
  "border_color",
  "bg_gradient",
  "avatar_ring",
  "full_card",
  "card_glow",
  "avatar_badge",
  "card_title",
] as const;

export type CosmeticType = (typeof COSMETIC_TYPES)[number];

export const COSMETIC_RARITIES = [
  "common",
  "rare",
  "epic",
  "legendary",
] as const;

export type CosmeticRarity = (typeof COSMETIC_RARITIES)[number];

export const COSMETIC_TYPE_LABELS: Record<CosmeticType, string> = {
  border_color: "Border color",
  bg_gradient: "Card background",
  avatar_ring: "Avatar ring",
  full_card: "Full card theme",
  card_glow: "Card glow",
  avatar_badge: "Avatar badge",
  card_title: "Card title",
};

export const BOX_TIERS = ["bronze", "silver", "gold"] as const;
export type BoxTier = (typeof BOX_TIERS)[number];

export const BOX_TIER_LABELS: Record<BoxTier, { label: string; emoji: string }> =
  {
    bronze: { label: "Bronze box", emoji: "📦" },
    silver: { label: "Silver box", emoji: "🎁" },
    gold: { label: "Gold box", emoji: "✨" },
  };

/** Which mystery boxes can drop this rarity */
export function getBoxTiersForRarity(rarity: string): BoxTier[] {
  const tiers: BoxTier[] = [];
  if (rarity === "common" || rarity === "rare") tiers.push("bronze");
  if (rarity === "rare" || rarity === "epic") tiers.push("silver");
  if (rarity === "epic" || rarity === "legendary") tiers.push("gold");
  return tiers;
}

export function formatBoxTiers(rarity: string): string {
  return getBoxTiersForRarity(rarity)
    .map((t) => `${BOX_TIER_LABELS[t].emoji} ${BOX_TIER_LABELS[t].label}`)
    .join(" · ");
}

export const RARITY_LABELS: Record<
  CosmeticRarity,
  { label: string; boxes: string }
> = {
  common: { label: "Common", boxes: "📦 Bronze" },
  rare: { label: "Rare", boxes: "📦 Bronze · 🎁 Silver" },
  epic: { label: "Epic", boxes: "🎁 Silver · ✨ Gold" },
  legendary: { label: "Legendary", boxes: "✨ Gold" },
};

export function cosmeticMatchesBoxFilter(
  rarity: string,
  boxFilter: BoxTier | "all",
): boolean {
  if (boxFilter === "all") return true;
  return getBoxTiersForRarity(rarity).includes(boxFilter);
}
