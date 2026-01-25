"use client";

import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
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

      // Refresh the page to show updated counts
      router.refresh();
    } catch (error) {
      console.error("Error logging Mexico:", error);
      alert("Failed to log Mexico. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">{player.name}</h3>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full h-14 text-lg"
        size="lg"
      >
        {isLoading ? "Logging..." : "+1 Mexico 🎲"}
      </Button>
    </div>
  );
}
