"use client";

import { useState, useEffect } from "react";
import type {
  Player,
  PlayerBadge,
  PlayerCosmetic,
  Cosmetic,
} from "@/lib/queries";
import { X } from "lucide-react";

interface PlayerInfo {
  player: Player;
  allTimeCount: number;
  yearCount: number;
  badges: PlayerBadge[];
  cosmetics: PlayerCosmetic[];
  equippedCosmetic: Cosmetic | null;
}

interface PlayerInfoModalProps {
  playerId: string;
  playerName: string;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-400 border-slate-400/40 bg-slate-400/10",
  rare: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  epic: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  legendary: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
};

export function PlayerInfoModal({
  playerId,
  playerName,
  onClose,
}: PlayerInfoModalProps) {
  const [info, setInfo] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/player/${playerId}/info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-lg font-bold">{playerName}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !info ? (
            <p className="text-center text-muted-foreground py-6">
              Could not load player info
            </p>
          ) : (
            <>
              {/* Avatar + Stats */}
              <div className="flex items-center gap-4">
                {info.player.avatar_url ? (
                  <img
                    src={info.player.avatar_url}
                    alt={info.player.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {info.player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-xl font-bold">{info.allTimeCount}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-xl font-bold">{info.yearCount}</p>
                    <p className="text-xs text-muted-foreground">This year</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 text-center">
                    <p className="text-xl font-bold">
                      🪙 {info.player.coins ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Coins</p>
                  </div>
                </div>
              </div>

              {/* Equipped cosmetic */}
              {info.equippedCosmetic && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Equipped
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0"
                      style={{
                        background: info.equippedCosmetic.preview,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {info.equippedCosmetic.name}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${RARITY_COLORS[info.equippedCosmetic.rarity]}`}
                      >
                        {info.equippedCosmetic.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Badges{" "}
                  <span className="text-foreground">{info.badges.length}</span>
                </p>
                {info.badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No badges yet — keep playing!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {info.badges.map((pb) => (
                      <div
                        key={pb.id}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border"
                      >
                        <span className="text-2xl">{pb.badge?.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {pb.badge?.name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {pb.badge?.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cosmetics collection count */}
              {info.cosmetics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Collection{" "}
                    <span className="text-foreground">
                      {info.cosmetics.length} item
                      {info.cosmetics.length !== 1 ? "s" : ""}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.cosmetics.map((pc) => (
                      <div
                        key={pc.id}
                        title={pc.cosmetic?.name}
                        className={`w-7 h-7 rounded-lg border-2 ${pc.equipped ? "ring-2 ring-primary" : ""}`}
                        style={{ background: pc.cosmetic?.preview }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
