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

      if (!response.ok) {
        throw new Error("Failed to delete Mexico");
      }

      toast.success(`Mexico deleted for ${playerName}`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting Mexico:", error);
      toast.error("Failed to delete Mexico. Please try again.");
    } finally {
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
