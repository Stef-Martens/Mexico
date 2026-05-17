"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Heart, MessageCircle, Upload, Send } from "lucide-react";
import type { AdFundum, AdFundumComment, Player } from "@/lib/queries";

interface AdFundumFeedProps {
  initialFundums: AdFundum[];
  currentPlayer: Player;
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface FundumCardProps {
  fundum: AdFundum;
  currentPlayer: Player;
  onLike: (id: string) => Promise<void>;
  onComment: (id: string, content: string) => Promise<void>;
  onUpload: (id: string, file: File, onProgress: (pct: number) => void) => Promise<void>;
}

function FundumCard({
  fundum,
  currentPlayer,
  onLike,
  onComment,
  onUpload,
}: FundumCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [liking, setLiking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMyFundum = fundum.target_player_id === currentPlayer.id;
  const hasLiked = (fundum.likes || []).some(
    (l) => l.player_id === currentPlayer.id,
  );
  const likeCount = fundum.likes?.length ?? 0;
  const commentCount = fundum.comments?.length ?? 0;

  const isCompleted = fundum.status === "completed";

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    await onLike(fundum.id);
    setLiking(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    await onComment(fundum.id, commentText.trim());
    setCommentText("");
    setSubmittingComment(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    onUpload(fundum.id, file, setUploadProgress).finally(() => {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        {fundum.target_player?.avatar_url ? (
          <img
            src={fundum.target_player.avatar_url}
            alt={fundum.target_player.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-border flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xl font-bold text-primary-foreground flex-shrink-0">
            {fundum.target_player?.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">
            {fundum.target_player?.name}
            {isMyFundum && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (you)
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            assigned by{" "}
            <span className="font-medium text-foreground">
              {fundum.assigned_by_player?.name}
            </span>{" "}
            · {timeAgo(fundum.created_at)}
          </p>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
            isCompleted
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {isCompleted ? "✅ Done" : "🔴 Pending"}
        </span>
      </div>

      {/* Reason */}
      {fundum.reason && (
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground italic">
            &ldquo;{fundum.reason}&rdquo;
          </p>
        </div>
      )}

      {/* Media */}
      {isCompleted && fundum.media_url && (
        <div className="w-full bg-black">
          {fundum.media_type === "video" ? (
            <video
              src={fundum.media_url}
              controls
              playsInline
              className="w-full max-h-96 object-contain"
            />
          ) : (
            <img
              src={fundum.media_url}
              alt="Adje proof"
              className="w-full max-h-96 object-contain"
            />
          )}
        </div>
      )}

      {/* Upload proof button (own pending fundum) */}
      {isMyFundum && !isCompleted && (
        <div className="px-4 py-3 border-t border-border">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? `Uploading… ${uploadProgress}%` : "Upload your proof 🍺"}
          </button>
          {uploading && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Actions bar */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-border">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
            hasLiked
              ? "text-red-400"
              : "text-muted-foreground hover:text-red-400"
          }`}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "fill-red-400" : ""}`} />
        </button>
        {likeCount > 0 && (
          <button
            onClick={() => setShowLikers((v) => !v)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            {showLikers
              ? "Hide likes"
              : `${likeCount} like${likeCount !== 1 ? "s" : ""}`}
          </button>
        )}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {/* Likers list */}
      {showLikers && likeCount > 0 && (
        <div className="px-4 pb-3 border-t border-border pt-2">
          <p className="text-xs text-muted-foreground">
            {(fundum.likes || [])
              .map((l) => l.player?.name ?? "Someone")
              .join(", ")}
          </p>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Existing comments */}
          {(fundum.comments || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-2">
              {fundum.comments!.map((c) => (
                <div key={c.id} className="flex gap-2">
                  {(c.player as any)?.avatar_url ? (
                    <img
                      src={(c.player as any).avatar_url}
                      alt={(c.player as any).name}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/60 flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0 mt-0.5">
                      {(c.player as any)?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-xs font-bold mr-1.5">
                      {(c.player as any)?.name}
                    </span>
                    <span className="text-sm">{c.content}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {timeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New comment form */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              className="flex-1 text-sm px-3 py-1.5 rounded-xl bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submittingComment}
              className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function AdFundumFeed({
  initialFundums,
  currentPlayer,
}: AdFundumFeedProps) {
  const [fundums, setFundums] = useState<AdFundum[]>(initialFundums);

  const pendingCount = fundums.filter((f) => f.status === "pending").length;
  const completedCount = fundums.filter((f) => f.status === "completed").length;
  const myPendingCount = fundums.filter(
    (f) => f.target_player_id === currentPlayer.id && f.status === "pending",
  ).length;

  async function handleLike(id: string) {
    const res = await fetch(`/api/ad-fundums/${id}/like`, { method: "POST" });
    if (!res.ok) return;
    const { liked } = await res.json();
    setFundums((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const likes = f.likes ? [...f.likes] : [];
        if (liked) {
          likes.push({
            id: crypto.randomUUID(),
            ad_fundum_id: id,
            player_id: currentPlayer.id,
            created_at: new Date().toISOString(),
            player: { name: currentPlayer.name },
          });
        } else {
          const idx = likes.findIndex((l) => l.player_id === currentPlayer.id);
          if (idx !== -1) likes.splice(idx, 1);
        }
        return { ...f, likes };
      }),
    );
  }

  async function handleComment(id: string, content: string) {
    const res = await fetch(`/api/ad-fundums/${id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      toast.error("Failed to post comment");
      return;
    }
    const { comment } = await res.json();
    setFundums((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return { ...f, comments: [...(f.comments ?? []), comment] };
      }),
    );
  }

  async function handleUpload(id: string, file: File, onProgress: (pct: number) => void) {
    const formData = new FormData();
    formData.append("file", file);
    type UploadResponse = { error?: string; mediaUrl?: string; newBadges?: { emoji: string; name: string }[] };
    const data = await new Promise<UploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        try { resolve(JSON.parse(xhr.responseText) as UploadResponse); } catch { reject(new Error("Invalid response")); }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("POST", `/api/ad-fundums/${id}/upload`);
      xhr.send(formData);
    }).catch((err: unknown) => { toast.error(String(err)); return null; });
    if (!data) return;
    if (data.error) {
      toast.error(data.error || "Upload failed");
      return;
    }
    setFundums((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          status: "completed" as const,
          media_url: data.mediaUrl ?? null,
          media_type: file.type.startsWith("video/") ? "video" : "image",
          completed_at: new Date().toISOString(),
        };
      }),
    );
    toast.success("🍻 Adje completed! Proof uploaded.");
    if (data.newBadges && data.newBadges.length > 0) {
      data.newBadges.forEach((b) =>
        toast.success(`${b.emoji} Badge unlocked: ${b.name}!`, {
          duration: 5000,
        }),
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p className="text-xl font-bold text-red-400">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{myPendingCount}</p>
          <p className="text-xs text-muted-foreground">Your debt</p>
        </div>
      </div>

      {/* Feed */}
      {fundums.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🍺</p>
          <p className="font-semibold">No adjes yet</p>
          <p className="text-sm mt-1">Buy one for someone from the shop!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fundums.map((f) => (
            <FundumCard
              key={f.id}
              fundum={f}
              currentPlayer={currentPlayer}
              onLike={handleLike}
              onComment={handleComment}
              onUpload={handleUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
