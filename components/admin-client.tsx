"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { Player } from "@/lib/queries";
import { Check, X, UserPlus, Clock, Pencil, Mail } from "lucide-react";

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

const RECAP_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function getBrusselsYearMonth(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return { year: get("year"), month: get("month") };
}

function getPreviousMonthBrussels() {
  const { year, month } = getBrusselsYearMonth();
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function AdminClient({ users: initialUsers, players }: AdminClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [playerList, setPlayerList] = useState(players);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const playerByUserId = useMemo(() => {
    const map = new Map<string, Player>();
    for (const player of playerList) {
      if (player.user_id) map.set(player.user_id, player);
    }
    return map;
  }, [playerList]);
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

  const [recapSending, setRecapSending] = useState(false);
  const [recapMessage, setRecapMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [recapYear, setRecapYear] = useState(getPreviousMonthBrussels().year);
  const [recapMonth, setRecapMonth] = useState(getPreviousMonthBrussels().month);

  const recapYearOptions = useMemo(() => {
    const currentYear = getBrusselsYearMonth().year;
    return Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);
  }, []);

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

  const handleSendTestRecap = async () => {
    setRecapSending(true);
    setRecapMessage(null);

    const yearMonth = `${recapYear}-${String(recapMonth).padStart(2, "0")}`;

    try {
      const response = await fetch("/api/admin/monthly-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: true, yearMonth }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to send test email");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setRecapMessage({
        text: `Test email sent for ${data.monthLabel}`,
        type: "success",
      });
    } catch (error) {
      setRecapMessage({
        text: error instanceof Error ? error.message : "Failed to send test email",
        type: "error",
      });
    } finally {
      setRecapSending(false);
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
      const name =
        playerList.find((p) => p.id === coinPlayerId)?.name ?? "Player";
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

  const startEditingName = (userId: string, currentName: string) => {
    setEditingUserId(userId);
    setEditName(currentName);
  };

  const cancelEditingName = () => {
    setEditingUserId(null);
    setEditName("");
  };

  const handleSaveName = async (playerId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    setNameSaving(true);
    try {
      const response = await fetch("/api/admin/update-player-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, name: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update name");
      }

      setPlayerList((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p)),
      );
      cancelEditingName();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to update name",
      );
    } finally {
      setNameSaving(false);
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
            {playerList.map((p) => (
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

      {/* Monthly Recap */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Monthly Recap Emails</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          On the 1st of each month, all members automatically receive a recap
          for the previous month. Top 3 get coins: 🥇 20, 🥈 10, 🥉 5. Use the
          test button below to preview what it looks like.
        </p>
        {recapMessage && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              recapMessage.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {recapMessage.text}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div>
            <label htmlFor="recap-month" className="block text-xs font-medium mb-1">
              Month
            </label>
            <select
              id="recap-month"
              value={recapMonth}
              onChange={(e) => setRecapMonth(parseInt(e.target.value, 10))}
              className="px-3 py-2 border rounded-md bg-background text-sm min-w-[140px]"
            >
              {RECAP_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recap-year" className="block text-xs font-medium mb-1">
              Year
            </label>
            <select
              id="recap-year"
              value={recapYear}
              onChange={(e) => setRecapYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 border rounded-md bg-background text-sm min-w-[100px]"
            >
              {recapYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleSendTestRecap}
            variant="outline"
            disabled={recapSending}
          >
            {recapSending ? "Sending…" : "Send test email"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Sends a preview to stef.m@hotmail.be only. No coins awarded. Current
          month shows stats so far.
        </p>
      </div>

      {/* Members List */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">
          Current Members — {members.length}
        </h2>
        <div className="space-y-2">
          {members.map((user) => {
            const player = playerByUserId.get(user.user_id);
            const isEditing = editingUserId === user.user_id;

            return (
              <div
                key={user.user_id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  {isEditing && player ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 text-sm border rounded-md bg-background"
                        autoFocus
                        disabled={nameSaving}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName(player.id);
                          if (e.key === "Escape") cancelEditingName();
                        }}
                      />
                      <button
                        onClick={() => handleSaveName(player.id)}
                        disabled={nameSaving || !editName.trim()}
                        className="p-1.5 rounded-md text-primary hover:bg-primary/10 disabled:opacity-50"
                        aria-label="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditingName}
                        disabled={nameSaving}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
                        aria-label="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {player?.name ?? user.email}
                      </span>
                      {user.is_admin && (
                        <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground truncate">
                    {player ? user.email : "No player profile yet"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Member since:{" "}
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                {player && !isEditing && (
                  <button
                    onClick={() => startEditingName(user.user_id, player.name)}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors shrink-0"
                    aria-label={`Edit ${player.name}'s name`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
