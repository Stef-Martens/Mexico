"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function RefreshButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    // Give a small delay for visual feedback
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (iconOnly) {
    return (
      <Button
        onClick={handleRefresh}
        variant="ghost"
        size="icon"
        disabled={isRefreshing}
        aria-label="Refresh"
      >
        <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      Refresh
    </Button>
  );
}
