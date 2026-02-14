"use client";

import { Button } from "@/components/ui";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteButtonProps {
  eventId: string;
  playerName: string;
}

export function DeleteMexicoButton({ eventId, playerName }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete this Mexico for ${playerName}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/mexico/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Delete failed:", data);
        throw new Error(data.error || "Failed to delete Mexico");
      }

      console.log("Delete successful:", data);
      toast.success(`Mexico deleted for ${playerName}`);

      // Force a hard refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error deleting Mexico:", error);
      toast.error("Failed to delete Mexico. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
