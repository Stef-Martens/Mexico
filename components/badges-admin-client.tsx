"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { BadgeWithHolders, Player } from "@/lib/queries";
import {
  BADGE_CATEGORY_LABELS,
  BADGE_CONDITION_TYPES,
  formatBadgeCondition,
  type BadgeConditionType,
} from "@/lib/badge-categories";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";

interface BadgesAdminClientProps {
  initialBadges: BadgeWithHolders[];
  players: Player[];
}

interface BadgeForm {
  name: string;
  description: string;
  emoji: string;
  condition_type: BadgeConditionType;
  condition_value: string;
}

const emptyForm = (): BadgeForm => ({
  name: "",
  description: "",
  emoji: "🏅",
  condition_type: "mexico_alltime",
  condition_value: "10",
});

export function BadgesAdminClient({
  initialBadges,
  players,
}: BadgesAdminClientProps) {
  const [badges, setBadges] = useState(initialBadges);
  const [filter, setFilter] = useState<BadgeConditionType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BadgeForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [assignPlayerId, setAssignPlayerId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return badges;
    return badges.filter((b) => b.condition_type === filter);
  }, [badges, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, BadgeWithHolders[]>();
    for (const badge of filtered) {
      const list = groups.get(badge.condition_type) ?? [];
      list.push(badge);
      groups.set(badge.condition_type, list);
    }
    return groups;
  }, [filtered]);

  const refreshBadges = async () => {
    const res = await fetch("/api/admin/badges");
    const data = await res.json();
    if (res.ok) setBadges(data.badges);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (badge: BadgeWithHolders) => {
    setEditingId(badge.id);
    setForm({
      name: badge.name,
      description: badge.description,
      emoji: badge.emoji,
      condition_type: badge.condition_type as BadgeConditionType,
      condition_value: badge.condition_value?.toString() ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      ...form,
      condition_value:
        form.condition_type === "manual"
          ? null
          : parseInt(form.condition_value, 10),
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/badges/${editingId}` : "/api/admin/badges",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      await refreshBadges();
      setFormOpen(false);
      setMessage({
        text: editingId ? "Label updated" : "Label created",
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to save",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (badge: BadgeWithHolders) => {
    if (
      !confirm(
        `Delete "${badge.name}"? This removes it from all ${badge.holders.length} player(s).`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setBadges((prev) => prev.filter((b) => b.id !== badge.id));
      setMessage({ text: `"${badge.name}" deleted`, type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to delete",
        type: "error",
      });
    }
  };

  const handleHolderAction = async (
    badgeId: string,
    playerId: string,
    action: "award" | "revoke",
  ) => {
    try {
      const res = await fetch(`/api/admin/badges/${badgeId}/holders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      await refreshBadges();
      setMessage({
        text: action === "award" ? "Label assigned" : "Label removed",
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {badges.length} label{badges.length !== 1 ? "s" : ""} total
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          Add label
        </Button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Category filter — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          All
        </button>
        {BADGE_CONDITION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {BADGE_CATEGORY_LABELS[type].label}
          </button>
        ))}
      </div>

      {/* Badge list grouped by category */}
      <div className="space-y-5">
        {Array.from(grouped.entries()).map(([category, categoryBadges]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {BADGE_CATEGORY_LABELS[category as BadgeConditionType]?.label ??
                category}
            </h3>
            <div className="space-y-2">
              {categoryBadges.map((badge) => {
                const isExpanded = expandedId === badge.id;
                const holderIds = new Set(
                  badge.holders.map((h) => h.player_id),
                );
                const unassignedPlayers = players.filter(
                  (p) => !holderIds.has(p.id),
                );

                return (
                  <div
                    key={badge.id}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : badge.id)
                      }
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <span className="text-2xl shrink-0">{badge.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{badge.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatBadgeCondition(
                            badge.condition_type,
                            badge.condition_value,
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {badge.holders.length} 👤
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-border/50 space-y-3">
                        <p className="text-sm text-muted-foreground pt-2">
                          {badge.description}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1.5"
                            onClick={() => openEdit(badge)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:text-destructive border-destructive/30"
                            onClick={() => handleDelete(badge)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                            Who has it ({badge.holders.length})
                          </p>
                          {badge.holders.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                              Nobody yet
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {badge.holders.map((holder) => (
                                <div
                                  key={holder.player_id}
                                  className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/50"
                                >
                                  <span className="text-sm font-medium truncate">
                                    {holder.player_name}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleHolderAction(
                                        badge.id,
                                        holder.player_id,
                                        "revoke",
                                      )
                                    }
                                    className="text-xs text-destructive hover:underline shrink-0"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {unassignedPlayers.length > 0 && (
                          <div className="flex gap-2">
                            <select
                              value={assignPlayerId[badge.id] ?? ""}
                              onChange={(e) =>
                                setAssignPlayerId((prev) => ({
                                  ...prev,
                                  [badge.id]: e.target.value,
                                }))
                              }
                              className="flex-1 min-w-0 px-2 py-2 text-sm border rounded-lg bg-background"
                            >
                              <option value="">Assign to…</option>
                              {unassignedPlayers.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              disabled={!assignPlayerId[badge.id]}
                              onClick={() => {
                                const pid = assignPlayerId[badge.id];
                                if (!pid) return;
                                handleHolderAction(badge.id, pid, "award");
                                setAssignPlayerId((prev) => ({
                                  ...prev,
                                  [badge.id]: "",
                                }));
                              }}
                            >
                              Assign
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No labels in this category
          </p>
        )}
      </div>

      {/* Add/Edit sheet */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setFormOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md bg-card border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b sticky top-0 bg-card">
              <h2 className="font-bold">
                {editingId ? "Edit label" : "New label"}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-16">
                  <label className="block text-xs font-medium mb-1">Emoji</label>
                  <input
                    value={form.emoji}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, emoji: e.target.value }))
                    }
                    required
                    maxLength={4}
                    className="w-full px-2 py-2 text-center text-xl border rounded-lg bg-background"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                    placeholder="Mexico God"
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  required
                  placeholder="Reach 1000 Mexicos all time"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Category</label>
                <select
                  value={form.condition_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      condition_type: e.target.value as BadgeConditionType,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                >
                  {BADGE_CONDITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {BADGE_CATEGORY_LABELS[type].label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {BADGE_CATEGORY_LABELS[form.condition_type].hint}
                </p>
              </div>

              {form.condition_type !== "manual" && (
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Required amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.condition_value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        condition_value: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving…" : editingId ? "Save changes" : "Create label"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
