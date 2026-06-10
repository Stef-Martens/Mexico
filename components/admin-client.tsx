"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Player } from "@/lib/queries";
import { Check, X, UserPlus, Clock } from "lucide-react";

interface UserWithMembership {
  user_id: string;
  email: string;
  is_member: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AdminClientProps {
  users: UserWithMembership[];
  players: Player[];
}

export function AdminClient({ users: initialUsers, players }: AdminClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Send coins state
  const [coinPlayerId, setCoinPlayerId] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [sendingCoins, setSendingCoins] = useState(false);
  const [coinMessage, setCoinMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/add-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      setMessage({
        text: `Successfully added ${email} as a member!`,
        type: "success",
      });
      setEmail("");

      window.location.reload();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to add member",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (user: UserWithMembership) => {
    setActionLoading(`accept-${user.user_id}`);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to accept user");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, is_member: true } : u,
        ),
      );
      setActionMessage({
        text: `✅ ${user.email} is now a member`,
        type: "success",
      });
    } catch (error) {
      setActionMessage({
        text: error instanceof Error ? error.message : "Failed to accept user",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (user: UserWithMembership) => {
    if (
      !confirm(
        `Decline access for ${user.email}? They will be hidden from this list.`,
      )
    ) {
      return;
    }

    setActionLoading(`decline-${user.user_id}`);
    setActionMessage(null);

    try {
      const response = await fetch("/api/admin/decline-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to decline user");
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
      setActionMessage({
        text: `Declined ${user.email}`,
        type: "success",
      });
    } catch (error) {
      setActionMessage({
        text: error instanceof Error ? error.message : "Failed to decline user",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(coinAmount, 10);
    if (!coinPlayerId || isNaN(amount) || amount <= 0) return;
    setSendingCoins(true);
    setCoinMessage(null);
    try {
      const res = await fetch("/api/admin/award-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: coinPlayerId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const name = players.find((p) => p.id === coinPlayerId)?.name ?? "Player";
      setCoinMessage({ text: `✅ Sent ${amount} coins to ${name}!`, type: "success" });
      setCoinAmount("");
      setCoinPlayerId("");
    } catch (error) {
      setCoinMessage({
        text: error instanceof Error ? error.message : "Failed to send coins",
        type: "error",
      });
    } finally {
      setSendingCoins(false);
    }
  };

  const nonMembers = users.filter((u) => !u.is_member);
  const members = users.filter((u) => u.is_member);

  return (
    <div className="space-y-8">
      {/* Pending Access Requests */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Pending Access Requests</h2>
          {nonMembers.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {nonMembers.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Users who signed in but don&apos;t have access yet.
        </p>

        {actionMessage && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              actionMessage.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {nonMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">
            No pending requests — all clear!
          </p>
        ) : (
          <div className="space-y-3">
            {nonMembers.map((user) => {
              const isAccepting = actionLoading === `accept-${user.user_id}`;
              const isDeclining = actionLoading === `decline-${user.user_id}`;
              const isBusy = isAccepting || isDeclining;

              return (
                <div
                  key={user.user_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Registered{" "}
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(user)}
                      disabled={isBusy}
                      className="gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {isAccepting ? "Accepting…" : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(user)}
                      disabled={isBusy}
                      className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                      {isDeclining ? "Declining…" : "Decline"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Form */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Add Member by Email</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manually grant access if you know their email address.
        </p>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 border rounded-md bg-background"
              disabled={loading}
            />
          </div>
          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </form>
      </div>

      {/* Send Coins */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-1">🪙 Send Coins</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Award coins after receiving a Revolut payment.
        </p>
        <form onSubmit={handleSendCoins} className="space-y-3">
          <select
            value={coinPlayerId}
            onChange={(e) => setCoinPlayerId(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="">— Select player —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {[30, 60, 150].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCoinAmount(String(preset))}
                className={`flex-1 py-1.5 text-sm rounded-md border transition-colors ${
                  coinAmount === String(preset)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-muted/80"
                }`}
              >
                {preset}
              </button>
            ))}
            <input
              type="number"
              min="1"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              placeholder="Custom"
              className="flex-1 px-3 py-1.5 border rounded-md bg-background text-sm"
            />
          </div>
          {coinMessage && (
            <div
              className={`p-3 rounded-md text-sm ${
                coinMessage.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {coinMessage.text}
            </div>
          )}
          <Button
            type="submit"
            disabled={sendingCoins || !coinPlayerId || !coinAmount}
          >
            {sendingCoins ? "Sending…" : "🪙 Send Coins"}
          </Button>
        </form>
      </div>

      {/* Members List */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">
          Current Members — {members.length}
        </h2>
        <div className="space-y-2">
          {members.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.email}</span>
                  {user.is_admin && (
                    <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Member since:{" "}
                  {new Date(user.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
