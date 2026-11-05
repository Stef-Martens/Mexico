"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { PlayerInfoModal } from "@/components/player-info-modal";
import type { Cosmetic } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  allTimeCount: number;
  tonightCount: number;
  isLeader?: boolean;
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
  allTimeCount,
  tonightCount,
  isLeader = false,
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

  // A cosmetic border is painted behind the padding box, so the card colour
  // has to be layered in between.
  const cardColor = "linear-gradient(hsl(var(--card)), hsl(var(--card)))";
  const cardStyle: React.CSSProperties = cardBorder
    ? {
        border: "2px solid transparent",
        backgroundImage: cardBg
          ? `${cardBg}, ${cardColor}, ${cardBorder}`
          : `${cardColor}, ${cardBorder}`,
        backgroundOrigin: "border-box",
        backgroundClip: cardBg
          ? "padding-box, padding-box, border-box"
          : "padding-box, border-box",
        boxShadow: cardGlow,
      }
    : {
        backgroundImage: cardBg ? `${cardBg}, ${cardColor}` : undefined,
        boxShadow: cardGlow,
      };

  const avatar = (
    <div
      className={cn(
        "relative shrink-0 rounded-full",
        isLeader
          ? "h-[clamp(56px,17vw,70px)] w-[clamp(56px,17vw,70px)]"
          : "h-[clamp(44px,14vw,58px)] w-[clamp(44px,14vw,58px)]",
        isLeader ? "p-0.5" : "p-[1.5px]",
      )}
      style={{ background: avatarRing ?? "hsl(var(--foreground))" }}
    >
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-full bg-card",
          hasPendingAdFundum && "brightness-75 grayscale",
        )}
      >
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted-foreground text-2xl font-bold text-card">
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      {avatarBadge && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 leading-none",
            isLeader ? "text-xl" : "text-base",
          )}
        >
          {avatarBadge}
        </span>
      )}
    </div>
  );

  const subtitle = isLoading
    ? "Logging..."
    : hasPendingAdFundum
      ? "Owes Adje"
      : cardTitle;
  const nameBlock = (
    <>
      <span
        className={cn(
          "block truncate font-bold",
          isLeader ? "text-lg" : "pr-5 text-[15px]",
        )}
      >
        {player.name}
      </span>
      <span
        className={cn(
          "block min-h-4 truncate text-xs leading-4",
          !isLeader && "pr-5",
          hasPendingAdFundum && !isLoading
            ? "font-bold text-red-600 dark:text-red-400"
            : "text-muted-foreground",
        )}
      >
        {subtitle}
      </span>
    </>
  );

  const score = (
    <div className={cn("min-w-0", isLeader && "pr-7 text-right")}>
      <div
        className={cn(
          "font-extrabold leading-none tabular-nums",
          isLeader
            ? "text-[clamp(34px,11vw,46px)] tracking-[-0.05em]"
            : "text-[clamp(26px,8.2vw,34px)] tracking-[-0.04em]",
        )}
      >
        {allTimeCount}
      </div>
      <div
        className={cn(
          "mt-0.5 whitespace-nowrap text-xs font-bold",
          tonightCount > 0
            ? "text-green-700 dark:text-green-400"
            : "font-semibold text-muted-foreground",
        )}
      >
        {tonightCount > 0 ? `+${tonightCount}` : "0"} tonight
      </div>
    </div>
  );

  return (
    <>
      <div className={cn("relative", isLeader && "col-span-2")}>
        <button
          onClick={handleClick}
          disabled={isLoading}
          aria-label={`Log a Mexico for ${player.name}`}
          className={cn(
            "h-full w-full rounded-[9px] bg-card p-2.5 text-left transition-transform active:scale-[0.98] disabled:opacity-60",
            !cardBorder && "border",
          )}
          style={cardStyle}
        >
          {isLeader ? (
            <div className="flex items-center gap-2.5">
              {avatar}
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-muted-foreground">
                  All-time #1
                </span>
                {nameBlock}
              </div>
              {score}
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-1">
                {score}
                {avatar}
              </div>
              <div className="mt-2">{nameBlock}</div>
            </>
          )}
        </button>

        {/* Generous touch area, so a tap near the icon doesn't log a Mexico */}
        <button
          onClick={() => setShowInfo(true)}
          className={cn(
            "absolute right-0 flex h-11 w-11 p-1.5 text-muted-foreground",
            isLeader
              ? "top-0 items-start justify-end"
              : "bottom-0 items-end justify-end",
          )}
          aria-label={`View ${player.name}'s profile`}
        >
          <Info className="h-4 w-4" />
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
