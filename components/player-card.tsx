"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { PlayerInfoModal } from "@/components/player-info-modal";
import type { Cosmetic } from "@/lib/queries";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  equippedCosmetics?: Cosmetic[];
  hasPendingAdFundum?: boolean;
}

function parseCosmeticStyles(cosmetics: Cosmetic[]): {
  cardBorder?: string;
  cardBg?: string;
  avatarRing?: string;
  cardGlow?: string;
  avatarBadge?: string;
  cardTitle?: string;
} {
  const result: ReturnType<typeof parseCosmeticStyles> = {};
  for (const cosmetic of cosmetics) {
    switch (cosmetic.type) {
      case "border_color":
        result.cardBorder = cosmetic.preview;
        break;
      case "bg_gradient":
        result.cardBg = cosmetic.value;
        break;
      case "avatar_ring":
        result.avatarRing = cosmetic.value;
        break;
      case "card_glow":
        result.cardGlow = cosmetic.value;
        break;
      case "avatar_badge":
        result.avatarBadge = cosmetic.value;
        break;
      case "card_title":
        result.cardTitle = cosmetic.value;
        break;
      case "full_card": {
        try {
          const parsed = JSON.parse(cosmetic.value) as {
            border?: string;
            bg?: string;
          };
          if (parsed.border) result.cardBorder = parsed.border;
          if (parsed.bg) result.cardBg = parsed.bg;
        } catch {
          // ignore
        }
        break;
      }
    }
  }
  return result;
}

export function PlayerCard({
  player,
  equippedCosmetics,
  hasPendingAdFundum,
}: PlayerCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const { cardBorder, cardBg, avatarRing, cardGlow, avatarBadge, cardTitle } =
    parseCosmeticStyles(equippedCosmetics ?? []);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/mexico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId: player.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to log Mexico");
      }

      const data = await response.json();

      if (data.blocked) {
        toast.error(
          `🍺 ${player.name} has a pending Adje! They must drink first.`,
          { duration: 6000 },
        );
        return;
      }

      // Show milestone toasts if any
      if (data.milestones && data.milestones.length > 0) {
        data.milestones.forEach(
          (milestone: { count: number; period: string }) => {
            const periodText =
              milestone.period === "year" ? "this year" : "all time";
            toast.success(
              `🎉 ${data.playerName} hit ${milestone.count} Mexicos ${periodText}!`,
              { duration: 5000 },
            );
          },
        );
      } else {
        toast.success(`Mexico logged for ${player.name}! 🎲`);
      }

      // Show badge toasts
      if (data.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badge: { emoji: string; name: string }) => {
          toast.success(`${badge.emoji} Badge unlocked: ${badge.name}!`, {
            duration: 5000,
          });
        });
      }

      router.refresh();
    } catch (error) {
      console.error("Error logging Mexico:", error);
      toast.error("Failed to log Mexico. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Build card border style: cosmetic gradient or default class
  const cardBorderStyle = cardBorder
    ? {
        border: "2px solid transparent",
        backgroundColor: "hsl(var(--card))",
        backgroundImage: cardBg
          ? `${cardBg}, linear-gradient(hsl(var(--card)), hsl(var(--card))), ${cardBorder}`
          : `linear-gradient(hsl(var(--card)), hsl(var(--card))), ${cardBorder}`,
        backgroundOrigin: "border-box",
        backgroundClip: cardBg
          ? "padding-box, padding-box, border-box"
          : "padding-box, border-box",
        boxShadow: cardGlow,
      }
    : undefined;

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="group w-full relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed p-6"
          style={
            cardBorderStyle ?? {
              background: cardBg ?? undefined,
              boxShadow: cardGlow,
            }
          }
        >
          {/* Default bg when no cosmetic */}
          {!cardBorder && !cardBg && (
            <div className="absolute inset-0 bg-gradient-to-br from-card to-card/50 rounded-2xl border-2 border-border group-hover:border-primary/50 transition-colors" />
          )}
          {/* Custom bg with default border when only bg applied */}
          {!cardBorder && cardBg && (
            <div className="absolute inset-0 rounded-2xl border-2 border-border group-hover:border-primary/50 transition-colors" />
          )}

          {/* Pending ad fundum overlay */}
          {hasPendingAdFundum && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-red-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 pointer-events-none">
              <span className="text-3xl">🍺</span>
              <span className="text-xs font-bold text-red-300 text-center px-2">
                Owes Adje
              </span>
            </div>
          )}

          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(180deg,white,transparent)]" />

          <div className="relative flex flex-col items-center gap-4">
            {/* Avatar */}
            {player.avatar_url ? (
              <div className="relative">
                <div
                  className="p-1 rounded-full"
                  style={avatarRing ? { background: avatarRing } : undefined}
                >
                  <img
                    src={player.avatar_url}
                    alt={player.name}
                    className="w-24 h-24 rounded-full object-cover shadow-lg"
                    style={
                      !avatarRing
                        ? { boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2)" }
                        : undefined
                    }
                  />
                </div>
                {avatarBadge && (
                  <span className="absolute -bottom-1 -right-1 text-xl leading-none drop-shadow-lg">
                    {avatarBadge}
                  </span>
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="relative">
                <div
                  className="p-1 rounded-full"
                  style={avatarRing ? { background: avatarRing } : undefined}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-5xl font-bold text-primary-foreground shadow-lg">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                {avatarBadge && (
                  <span className="absolute -bottom-1 -right-1 text-xl leading-none drop-shadow-lg">
                    {avatarBadge}
                  </span>
                )}
              </div>
            )}

            {/* Player Name */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {player.name}
              </h3>
              <p className="text-xs font-semibold text-muted-foreground min-h-[1rem]">
                {cardTitle ?? (isLoading ? "Logging..." : "")}
              </p>
            </div>
          </div>

          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none rounded-2xl" />
        </button>

        {/* Info button — overlaid top-right corner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(true);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background transition-all shadow"
          aria-label={`View ${player.name}'s profile`}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {showInfo && (
        <PlayerInfoModal
          playerId={player.id}
          playerName={player.name}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
