"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";

interface ProfileFormProps {
  initialName: string;
  initialAvatarUrl: string | null;
}

export function ProfileForm({
  initialName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          avatarUrl: avatarUrl || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="avatarUrl"
              className="block text-sm font-medium mb-2"
            >
              Avatar URL (optional)
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste a URL to an image (e.g., from Gravatar, Imgur, etc.)
            </p>
          </div>

          {avatarUrl && (
            <div>
              <p className="text-sm font-medium mb-2">Preview</p>
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full object-cover border-2"
                onError={(e) => {
                  e.currentTarget.src = "";
                  e.currentTarget.alt = "Invalid image URL";
                }}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
