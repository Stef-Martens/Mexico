"use client";

import { useRef, useState } from "react";
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
  const [avatarMode, setAvatarMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setAvatarUrl(data.url);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

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
            <p className="block text-sm font-medium mb-2">Avatar (optional)</p>

            {/* Mode toggle */}
            <div className="flex rounded-md border overflow-hidden mb-3 w-fit">
              <button
                type="button"
                onClick={() => setAvatarMode("url")}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  avatarMode === "url"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setAvatarMode("upload")}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  avatarMode === "upload"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Upload Image
              </button>
            </div>

            {avatarMode === "url" ? (
              <div>
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
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  id="avatarFile"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isUploading
                    ? "Uploading…"
                    : "JPEG, PNG, GIF or WebP — max 5 MB"}
                </p>
              </div>
            )}
          </div>

          {avatarUrl && (
            <div>
              <p className="text-sm font-medium mb-2">Preview</p>
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full object-cover border-2"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isLoading || isUploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
