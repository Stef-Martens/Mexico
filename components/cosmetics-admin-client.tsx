"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { CosmeticWithOwners, Player } from "@/lib/queries";
import {
  BOX_TIER_LABELS,
  BOX_TIERS,
  COSMETIC_RARITIES,
  COSMETIC_TYPE_LABELS,
  COSMETIC_TYPES,
  RARITY_LABELS,
  cosmeticMatchesBoxFilter,
  formatBoxTiers,
  type BoxTier,
  type CosmeticRarity,
  type CosmeticType,
} from "@/lib/cosmetic-meta";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";

interface CosmeticsAdminClientProps {
  initialCosmetics: CosmeticWithOwners[];
  players: Player[];
}

interface CosmeticForm {
  name: string;
  description: string;
  type: CosmeticType;
  value: string;
  preview: string;
  rarity: CosmeticRarity;
}

const VALUE_HINTS: Partial<Record<CosmeticType, string>> = {
  avatar_badge: "Emoji only, e.g. 👑",
  card_title: "Emoji + text, e.g. ⚡ Mexico God",
  border_color: "CSS color, e.g. #38bdf8",
  bg_gradient: "CSS gradient for card bg",
  avatar_ring: "CSS gradient for ring",
  card_glow: "CSS box-shadow glow",
  full_card: 'JSON, e.g. {"border":"...","bg":"..."}',
};

const emptyForm = (): CosmeticForm => ({
  name: "",
  description: "",
  type: "card_title",
  value: "",
  preview: "linear-gradient(135deg,#8b5cf6,#6366f1)",
  rarity: "epic",
});

const RARITY_COLORS: Record<string, string> = {
  common: "border-slate-400/40",
  rare: "border-blue-400/40",
  epic: "border-purple-400/40",
  legendary: "border-yellow-400/40",
};

export function CosmeticsAdminClient({
  initialCosmetics,
  players,
}: CosmeticsAdminClientProps) {
  const [cosmetics, setCosmetics] = useState(initialCosmetics);
  const [boxFilter, setBoxFilter] = useState<BoxTier | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CosmeticForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [assignPlayerId, setAssignPlayerId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filtered = useMemo(
    () =>
      cosmetics.filter((c) => cosmeticMatchesBoxFilter(c.rarity, boxFilter)),
    [cosmetics, boxFilter],
  );

  const grouped = useMemo(() => {
    const groups = new Map<CosmeticRarity, CosmeticWithOwners[]>();
    for (const c of filtered) {
      const list = groups.get(c.rarity as CosmeticRarity) ?? [];
      list.push(c);
      groups.set(c.rarity as CosmeticRarity, list);
    }
    return groups;
  }, [filtered]);

  const refresh = async () => {
    const res = await fetch("/api/admin/cosmetics");
    const data = await res.json();
    if (res.ok) setCosmetics(data.cosmetics);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (c: CosmeticWithOwners) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description,
      type: c.type as CosmeticType,
      value: c.value,
      preview: c.preview,
      rarity: c.rarity as CosmeticRarity,
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(
        editingId ? `/api/admin/cosmetics/${editingId}` : "/api/admin/cosmetics",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      await refresh();
      setFormOpen(false);
      setMessage({
        text: editingId ? "Cosmetic updated" : "Cosmetic created",
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

  const handleDelete = async (c: CosmeticWithOwners) => {
    if (
      !confirm(
        `Delete "${c.name}"? Removes it from ${c.owners.length} player(s).`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/cosmetics/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setCosmetics((prev) => prev.filter((x) => x.id !== c.id));
      setMessage({ text: `"${c.name}" deleted`, type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed to delete",
        type: "error",
      });
    }
  };

  const handleOwnerAction = async (
    cosmeticId: string,
    playerId: string,
    action: "grant" | "revoke",
  ) => {
    try {
      const res = await fetch(`/api/admin/cosmetics/${cosmeticId}/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      await refresh();
      setMessage({
        text: action === "grant" ? "Cosmetic granted" : "Cosmetic removed",
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Failed",
        type: "error",
      });
    }
  };

  const renderPreview = (c: CosmeticWithOwners) => {
    if (c.type === "avatar_badge") {
      return <span className="text-2xl">{c.value}</span>;
    }
    if (c.type === "card_title") {
      return <span className="text-sm font-bold truncate">{c.value}</span>;
    }
    return (
      <div
        className="w-10 h-10 rounded-lg border shrink-0"
        style={{ background: c.preview }}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {cosmetics.length} cosmetic{cosmetics.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          Add
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

      {/* Box filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setBoxFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
            boxFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          All boxes
        </button>
        {BOX_TIERS.map((tier) => (
          <button
            key={tier}
            onClick={() => setBoxFilter(tier)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
              boxFilter === tier
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {BOX_TIER_LABELS[tier].emoji} {BOX_TIER_LABELS[tier].label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {COSMETIC_RARITIES.map((rarity) => {
          const items = grouped.get(rarity);
          if (!items?.length) return null;

          return (
            <div key={rarity}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {RARITY_LABELS[rarity].label} · {RARITY_LABELS[rarity].boxes}
              </h3>
              <div className="space-y-2">
                {items.map((c) => {
                  const isExpanded = expandedId === c.id;
                  const ownerIds = new Set(c.owners.map((o) => o.player_id));
                  const unassigned = players.filter((p) => !ownerIds.has(p.id));

                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl border bg-card overflow-hidden ${RARITY_COLORS[c.rarity]}`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        {renderPreview(c)}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {COSMETIC_TYPE_LABELS[c.type as CosmeticType]} ·{" "}
                            {formatBoxTiers(c.rarity)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {c.owners.length} 👤
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border/50 space-y-3">
                          <p className="text-sm text-muted-foreground pt-2">
                            {c.description || "No description"}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground break-all bg-muted/50 p-2 rounded-lg">
                            {c.value}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1.5"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30"
                              onClick={() => handleDelete(c)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                              Owners ({c.owners.length})
                            </p>
                            {c.owners.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">
                                Nobody owns this yet
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {c.owners.map((owner) => (
                                  <div
                                    key={owner.player_id}
                                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/50"
                                  >
                                    <span className="text-sm truncate">
                                      {owner.player_name}
                                      {owner.equipped && (
                                        <span className="text-xs text-primary ml-1">
                                          equipped
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleOwnerAction(
                                          c.id,
                                          owner.player_id,
                                          "revoke",
                                        )
                                      }
                                      className="text-xs text-destructive shrink-0"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {unassigned.length > 0 && (
                            <div className="flex gap-2">
                              <select
                                value={assignPlayerId[c.id] ?? ""}
                                onChange={(e) =>
                                  setAssignPlayerId((prev) => ({
                                    ...prev,
                                    [c.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 min-w-0 px-2 py-2 text-sm border rounded-lg bg-background"
                              >
                                <option value="">Grant to…</option>
                                {unassigned.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                disabled={!assignPlayerId[c.id]}
                                onClick={() => {
                                  const pid = assignPlayerId[c.id];
                                  if (!pid) return;
                                  handleOwnerAction(c.id, pid, "grant");
                                  setAssignPlayerId((prev) => ({
                                    ...prev,
                                    [c.id]: "",
                                  }));
                                }}
                              >
                                Grant
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
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No cosmetics for this box
          </p>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setFormOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md bg-card border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b sticky top-0 bg-card z-10">
              <h2 className="font-bold">
                {editingId ? "Edit cosmetic" : "New cosmetic"}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div
                className="w-full h-14 rounded-xl border"
                style={{ background: form.preview }}
              />

              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Mexico God"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                />
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
                  placeholder="Absolute deity title"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as CosmeticType,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                >
                  {COSMETIC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {COSMETIC_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Rarity / box pool
                </label>
                <select
                  value={form.rarity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      rarity: e.target.value as CosmeticRarity,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                >
                  {COSMETIC_RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {RARITY_LABELS[r].label} — {RARITY_LABELS[r].boxes}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Value</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  required
                  placeholder={VALUE_HINTS[form.type] ?? "CSS value"}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono text-xs"
                />
                {VALUE_HINTS[form.type] && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {VALUE_HINTS[form.type]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Preview (shop swatch)
                </label>
                <input
                  value={form.preview}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, preview: e.target.value }))
                  }
                  required
                  placeholder="linear-gradient(135deg,#8b5cf6,#6366f1)"
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background font-mono text-xs"
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
