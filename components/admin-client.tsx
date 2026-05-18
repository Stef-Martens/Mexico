"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Player } from "@/lib/queries";

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

      // Refresh the page to show updated list
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
      {/* Add Member Form */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
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
              className="w-full px-3 py-2 border rounded-md"
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

      {/* Non-Members List */}
      {nonMembers.length > 0 && (
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">
            Registered Users (Not Members) - {nonMembers.length}
          </h2>
          <div className="space-y-2">
            {nonMembers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <div className="font-medium">{user.email}</div>
                  <div className="text-sm text-muted-foreground">
                    Registered: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">
          Current Members - {members.length}
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
                  Member since: {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
