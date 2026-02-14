"use client";

import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

export function PlayerCard({ player }: PlayerCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

      // Show milestone toasts if any
      if (data.milestones && data.milestones.length > 0) {
        data.milestones.forEach(
          (milestone: { count: number; period: string }) => {
            const periodText =
              milestone.period === "year" ? "this year" : "all time";
            toast.success(
              `🎉 ${data.playerName} hit ${milestone.count} Mexicos ${periodText}!`,
              {
                duration: 5000,
              },
            );
          },
        );
      } else {
        // Regular success toast
        toast.success(`Mexico logged for ${player.name}! 🎲`);
      }

      // Refresh the page to show updated counts
      router.refresh();
    } catch (error) {
      console.error("Error logging Mexico:", error);
      toast.error("Failed to log Mexico. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="group relative bg-gradient-to-br from-card to-card/50 rounded-2xl border-2 border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed p-6"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(180deg,white,transparent)]" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Large Avatar */}
        {player.avatar_url ? (
          <div className="relative">
            <img
              src={player.avatar_url}
              alt={player.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-lg"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-5xl font-bold text-primary-foreground ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-lg">
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Player Name */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
            {player.name}
          </h3>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-2xl">🎲</span>
            <span>{isLoading ? "Logging..." : "Click to Log Mexico"}</span>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
    </button>
  );
}
