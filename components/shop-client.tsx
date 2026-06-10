"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Player, PlayerCosmetic, Cosmetic } from "@/lib/queries";

interface ShopClientProps {
  player: Player & { coins: number };
  ownedCosmetics: PlayerCosmetic[];
  players: Player[];
}

const BOX_TIERS = [
  {
    id: "bronze" as const,
    name: "Bronze Box",
    emoji: "📦",
    cost: 5,
    desc: "Common & Rare cosmetics",
    gradient: "from-amber-900/40 to-amber-700/20",
    border: "border-amber-700/50",
    badgeBg: "bg-amber-700/30 text-amber-300",
    rarities: ["common", "rare"],
  },
  {
    id: "silver" as const,
    name: "Silver Box",
    emoji: "🎁",
    cost: 15,
    desc: "Rare & Epic cosmetics",
    gradient: "from-slate-600/40 to-slate-400/20",
    border: "border-slate-400/50",
    badgeBg: "bg-slate-500/30 text-slate-200",
    rarities: ["rare", "epic"],
  },
  {
    id: "gold" as const,
    name: "Gold Box",
    emoji: "✨",
    cost: 30,
    desc: "Epic & Legendary cosmetics",
    gradient: "from-yellow-800/40 to-yellow-500/20",
    border: "border-yellow-500/50",
    badgeBg: "bg-yellow-600/30 text-yellow-200",
    rarities: ["epic", "legendary"],
  },
];

const RARITY_COLORS: Record<string, string> = {
  common: "bg-slate-400/10 border-slate-400/40 text-slate-400",
  rare: "bg-blue-400/10 border-blue-400/40 text-blue-400",
  epic: "bg-purple-400/10 border-purple-400/40 text-purple-400",
  legendary: "bg-yellow-400/10 border-yellow-400/40 text-yellow-400",
};

const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

export function ShopClient({
  player,
  ownedCosmetics,
  players,
}: ShopClientProps) {
  const [coins, setCoins] = useState(player.coins);
  const [inventory, setInventory] = useState<PlayerCosmetic[]>(ownedCosmetics);
  const [opening, setOpening] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Cosmetic | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [buyingFundum, setBuyingFundum] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [fundumReason, setFundumReason] = useState("");
  const [equipping, setEquipping] = useState<string | null>(null);
  const [showBuyCoins, setShowBuyCoins] = useState(false);

  const equippedByType = inventory.reduce<Record<string, string>>((acc, pc) => {
    if (pc.equipped && pc.cosmetic) {
      acc[pc.cosmetic.type] = pc.cosmetic_id;
    }
    return acc;
  }, {});

  async function handleBuyBox(tier: "bronze" | "silver" | "gold") {
    const tierDef = BOX_TIERS.find((b) => b.id === tier)!;
    if (coins < tierDef.cost) {
      toast.error(`Not enough coins! You need ${tierDef.cost} coins.`);
      return;
    }
    setOpening(tier);
    try {
      const res = await fetch("/api/shop/buy-box", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open box");
        return;
      }
      setCoins((c) => c - tierDef.cost);
      setReveal(data.cosmetic as Cosmetic);
      setIsNew(data.isNew);
      // Add to inventory if new
      if (data.isNew) {
        setInventory((inv) => [
          ...inv,
          {
            id: crypto.randomUUID(),
            player_id: player.id,
            cosmetic_id: data.cosmetic.id,
            equipped: false,
            obtained_at: new Date().toISOString(),
            cosmetic: data.cosmetic,
          },
        ]);
      }
    } finally {
      setOpening(null);
    }
  }

  async function handleBuyFundum() {
    if (!selectedTarget) {
      toast.error("Select a player first");
      return;
    }
    if (coins < 30) {
      toast.error("Not enough coins! An Adje costs 30 coins.");
      return;
    }
    setBuyingFundum(true);
    try {
      const res = await fetch("/api/shop/buy-ad-fundum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlayerId: selectedTarget,
          reason: fundumReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      setCoins((c) => c - 30);
      setSelectedTarget("");
      setFundumReason("");
      const targetName = players.find((p) => p.id === selectedTarget)?.name;
      toast.success(`🍺 Adje assigned to ${targetName}!`);
    } finally {
      setBuyingFundum(false);
    }
  }

  async function handleEquip(cosmeticId: string, cosmeticType: string) {
    const isAlreadyEquipped = equippedByType[cosmeticType] === cosmeticId;
    setEquipping(cosmeticId);
    try {
      const res = await fetch("/api/shop/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cosmeticId: isAlreadyEquipped ? null : cosmeticId,
          type: cosmeticType,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to equip");
        return;
      }
      setInventory((inv) =>
        inv.map((c) => {
          if (c.cosmetic?.type !== cosmeticType) return c;
          return {
            ...c,
            equipped: c.cosmetic_id === cosmeticId && !isAlreadyEquipped,
          };
        }),
      );
      toast.success(
        isAlreadyEquipped ? "Cosmetic unequipped" : "Cosmetic equipped! ✨",
      );
    } finally {
      setEquipping(null);
    }
  }

  // Sort inventory by rarity
  const sortedInventory = [...inventory].sort(
    (a, b) =>
      RARITY_ORDER.indexOf(b.cosmetic?.rarity ?? "common") -
      RARITY_ORDER.indexOf(a.cosmetic?.rarity ?? "common"),
  );

  // Group inventory by cosmetic type
  const TYPE_META: Record<
    string,
    { label: string; icon: string; order: number }
  > = {
    card_glow: { label: "Card Glow", icon: "✨", order: 0 },
    full_card: { label: "Full Card", icon: "🃏", order: 1 },
    border_color: { label: "Card Border", icon: "🖼️", order: 2 },
    bg_gradient: { label: "Background", icon: "🎨", order: 3 },
    avatar_ring: { label: "Avatar Ring", icon: "💫", order: 4 },
    avatar_badge: { label: "Avatar Badge", icon: "📌", order: 5 },
    card_title: { label: "Card Title", icon: "🏷️", order: 6 },
  };

  const groupedInventory = sortedInventory.reduce<
    Record<string, typeof sortedInventory>
  >((acc, pc) => {
    const type = pc.cosmetic?.type ?? "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(pc);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedInventory).sort(
    ([a], [b]) => (TYPE_META[a]?.order ?? 99) - (TYPE_META[b]?.order ?? 99),
  );

  const otherPlayers = players.filter((p) => p.id !== player.id);

  return (
    <div className="space-y-8">
      {/* Coin balance */}
      <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
        <span className="text-3xl">🪙</span>
        <div>
          <p className="text-2xl font-bold">{coins}</p>
          <p className="text-xs text-muted-foreground">
            Mexico Coins — earn 1 per Mexico logged
          </p>
        </div>
      </div>

      {/* Buy Coins */}
      <section>
        <button
          onClick={() => setShowBuyCoins((v) => !v)}
          className="w-full flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 transition-all hover:bg-muted/40 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div className="text-left">
              <p className="font-bold text-base">Buy Coins</p>
              <p className="text-xs text-muted-foreground">
                30 for €3 &middot; 60 for €5 &middot; 150 for €10
              </p>
            </div>
          </div>
          <span className="text-muted-foreground text-lg">{showBuyCoins ? "▲" : "▼"}</span>
        </button>

        {showBuyCoins && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Pay via Revolut — admin adds your coins after receiving payment. Include your in-game name in the note.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { coins: 30, price: 3, popular: false },
                { coins: 60, price: 5, popular: true },
                { coins: 150, price: 10, popular: false },
              ].map(({ coins: amount, price, popular }) => {
                const link = process.env.NEXT_PUBLIC_REVOLUT_LINK ?? "#";
                return (
                  <a
                    key={amount}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-all active:scale-[0.98] ${
                      popular
                        ? "border-primary/60 bg-gradient-to-r from-primary/10 to-primary/5 shadow-[0_0_0_1px] shadow-primary/20"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    {popular && (
                      <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        BEST VALUE
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🪙</span>
                      <div>
                        <p className="font-bold text-base">{amount} coins</p>
                        <p className="text-xs text-muted-foreground">
                          {(price / amount).toFixed(2).replace("0.", "")}¢ per coin
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">€{price}</span>
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-primary/15 text-primary font-semibold">
                        Pay →
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Mystery Boxes */}
      <section>
        <h2 className="text-base font-bold mb-3">🎲 Mystery Boxes</h2>
        <div className="grid grid-cols-1 gap-3">
          {BOX_TIERS.map((box) => (
            <div
              key={box.id}
              className={`rounded-2xl border bg-gradient-to-br ${box.gradient} ${box.border} p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{box.emoji}</span>
                  <div>
                    <p className="font-bold">{box.name}</p>
                    <p className="text-xs text-muted-foreground">{box.desc}</p>
                    <div className="flex gap-1 mt-1">
                      {box.rarities.map((r) => (
                        <span
                          key={r}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${RARITY_COLORS[r]}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyBox(box.id)}
                  disabled={opening === box.id || coins < box.cost}
                  className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {opening === box.id ? (
                    <span className="text-xs">Opening…</span>
                  ) : (
                    <>
                      <span>🪙 {box.cost}</span>
                      <span className="text-[10px] font-normal opacity-80">
                        Open
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buy Ad Fundum */}
      <section>
        <h2 className="text-base font-bold mb-3">🍺 Send Adje</h2>
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-700/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">😈</span>
            <div>
              <p className="font-bold">Adje for Someone</p>
              <p className="text-xs text-muted-foreground">
                Force another player to do an adje and upload proof. Costs{" "}
                <span className="font-bold text-yellow-400">🪙 30 coins</span>
              </p>
            </div>
          </div>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">— Choose a victim —</option>
            {otherPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Reason (optional)"
            value={fundumReason}
            onChange={(e) => setFundumReason(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleBuyFundum}
            disabled={buyingFundum || !selectedTarget || coins < 30}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {buyingFundum ? "Sending…" : "🍺 Send Adje — 🪙 30"}
          </button>
        </div>
      </section>

      {/* Inventory */}
      <section>
        <h2 className="text-base font-bold mb-3">
          🎨 Your Collection{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({inventory.length} item{inventory.length !== 1 ? "s" : ""})
          </span>
        </h2>
        {inventory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p className="text-3xl mb-2">📦</p>
            <p>No cosmetics yet. Open a mystery box!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedGroups.map(([type, items]) => {
              const meta = TYPE_META[type] ?? {
                label: type,
                icon: "🎁",
                order: 99,
              };
              return (
                <div key={type}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <span>{meta.icon}</span>
                    {meta.label}
                    <span className="font-normal normal-case tracking-normal">
                      ({items.length})
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((pc) => {
                      const cosmetic = pc.cosmetic!;
                      const isEquipped =
                        equippedByType[cosmetic.type] === pc.cosmetic_id;
                      return (
                        <div
                          key={pc.id}
                          className={`rounded-2xl border p-3 flex flex-col gap-2 transition-all ${
                            isEquipped
                              ? "border-primary shadow-[0_0_0_2px] shadow-primary/30"
                              : "border-border"
                          }`}
                        >
                          {/* Preview swatch */}
                          {cosmetic.type === "avatar_badge" ? (
                            <div className="w-full h-12 rounded-xl bg-muted flex items-center justify-center text-3xl">
                              {cosmetic.value}
                            </div>
                          ) : cosmetic.type === "card_title" ? (
                            <div
                              className="w-full h-12 rounded-xl flex items-center justify-center text-xs font-bold px-2 text-center"
                              style={{
                                background: cosmetic.preview,
                                color: "#fff",
                                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                              }}
                            >
                              {cosmetic.value}
                            </div>
                          ) : (
                            <div
                              className="w-full h-12 rounded-xl"
                              style={{ background: cosmetic.preview }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-semibold truncate">
                              {cosmetic.name}
                            </p>
                            <span
                              className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${RARITY_COLORS[cosmetic.rarity]}`}
                            >
                              {cosmetic.rarity}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleEquip(pc.cosmetic_id, cosmetic.type)
                            }
                            disabled={equipping === pc.cosmetic_id}
                            className={`text-xs font-semibold py-1.5 rounded-lg transition-all active:scale-95 ${
                              isEquipped
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-foreground hover:bg-muted/80"
                            }`}
                          >
                            {equipping === pc.cosmetic_id
                              ? "…"
                              : isEquipped
                                ? "✓ Equipped"
                                : "Equip"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reveal overlay */}
      {reveal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setReveal(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xs bg-card border border-border rounded-3xl p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full h-32 rounded-2xl mb-4"
              style={{ background: reveal.preview }}
            />
            <p className="text-xs text-muted-foreground mb-1">
              {isNew
                ? "✨ New cosmetic unlocked!"
                : "Duplicate — already in your collection"}
            </p>
            <h3 className="text-xl font-bold mb-1">{reveal.name}</h3>
            <span
              className={`inline-block text-xs font-bold px-2 py-0.5 rounded border capitalize mb-3 ${RARITY_COLORS[reveal.rarity]}`}
            >
              {reveal.rarity}
            </span>
            <p className="text-sm text-muted-foreground mb-5">
              {reveal.description}
            </p>
            <button
              onClick={() => setReveal(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
