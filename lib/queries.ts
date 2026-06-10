import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";

export interface Player {
  id: string;
  name: string;
  created_at: string;
  avatar_url?: string | null;
  user_id?: string | null;
  coins?: number;
}

export interface MexicoEvent {
  id: string;
  player_id: string;
  created_at: string;
}

/**
 * Check if current user is an app member
 */
export async function checkAppMembership(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("app_members")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  return !error && !!data;
}

/**
 * Check if current user is an admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("app_members")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  return !error && data?.is_admin === true;
}

export interface UserWithMembership {
  user_id: string;
  email: string;
  is_member: boolean;
  is_admin: boolean;
  created_at: string;
}

/**
 * Get all users with their membership status (admin only)
 */
export async function getAllUsersWithMembership(): Promise<
  UserWithMembership[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_all_users_with_membership");

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all players
 */
export async function getPlayers(): Promise<Player[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching players:", error);
    return [];
  }

  return data || [];
}

/**
 * Ensure current user exists as a player
 * Returns the player ID
 */
export async function ensureCurrentUserAsPlayer(): Promise<string | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Check if player already exists with this user_id
  const { data: existingPlayer } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingPlayer) {
    return existingPlayer.id;
  }

  // Create player for this user
  const { data: newPlayer, error } = await supabase
    .from("players")
    .insert({ name: user.email || "Anonymous", user_id: user.id })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating player:", error);
    return null;
  }

  return newPlayer?.id || null;
}

/**
 * Insert a Mexico event for a player
 */
export async function logMexico(playerId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("mexico_events").insert({
    player_id: playerId,
    logged_by: user.id,
    logged_by_email: user.email,
  });

  if (error) {
    console.error("Error logging Mexico:", error);
    throw new Error("Failed to log Mexico");
  }
}

/**
 * Delete a Mexico event (admin only)
 */
export async function deleteMexicoEvent(eventId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("mexico_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    console.error("Error deleting Mexico event:", error);
    throw new Error("Failed to delete Mexico event");
  }
}

/**
 * Get total mexico count for a player in a given time range
 */
export async function getPlayerMexicoCount(
  playerId: string,
  startDate: string | null = null,
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("mexico_events")
    .select("id", { count: "exact" })
    .eq("player_id", playerId);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error getting player mexico count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get leaderboard for a given time range
 */
export async function getLeaderboard(
  startDate: string | null,
): Promise<{ player_id: string; player_name: string; mexico_count: number }[]> {
  const supabase = await createClient();

  let query = supabase.from("mexico_events").select(
    `
      player_id,
      players!inner(name)
    `,
  );

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  // Aggregate by player
  const aggregated = (data || []).reduce(
    (acc, row) => {
      const playerId = row.player_id;
      const playerName = (row.players as any).name;

      if (!acc[playerId]) {
        acc[playerId] = {
          player_id: playerId,
          player_name: playerName,
          mexico_count: 0,
        };
      }
      acc[playerId].mexico_count++;
      return acc;
    },
    {} as Record<
      string,
      { player_id: string; player_name: string; mexico_count: number }
    >,
  );

  return Object.values(aggregated).sort(
    (a, b) => b.mexico_count - a.mexico_count,
  );
}

/**
 * Get leaderboard for a bounded date range (e.g. a calendar month)
 */
export async function getLeaderboardForRange(
  startDate: string,
  endDate: string,
): Promise<{ player_id: string; player_name: string; mexico_count: number }[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("mexico_events")
    .select(
      `
      player_id,
      players!inner(name)
    `,
    )
    .gte("created_at", startDate)
    .lt("created_at", endDate);

  if (error) {
    console.error("Error fetching leaderboard for range:", error);
    return [];
  }

  const aggregated = (data || []).reduce(
    (acc, row) => {
      const playerId = row.player_id;
      const playerName = (row.players as any).name;

      if (!acc[playerId]) {
        acc[playerId] = {
          player_id: playerId,
          player_name: playerName,
          mexico_count: 0,
        };
      }
      acc[playerId].mexico_count++;
      return acc;
    },
    {} as Record<
      string,
      { player_id: string; player_name: string; mexico_count: number }
    >,
  );

  return Object.values(aggregated).sort(
    (a, b) => b.mexico_count - a.mexico_count,
  );
}

export interface MemberPlayerWithEmail {
  id: string;
  name: string;
  user_id: string;
  email: string;
  coins: number;
}

/** Get all app members with linked player profiles and emails */
export async function getMemberPlayersWithEmails(): Promise<
  MemberPlayerWithEmail[]
> {
  const admin = createAdminClient();

  const [{ data: players, error: playersError }, { data: members, error: membersError }] =
    await Promise.all([
      admin.from("players").select("id, name, user_id, coins").not("user_id", "is", null),
      admin.from("app_members").select("user_id"),
    ]);

  if (playersError || membersError || !players) {
    console.error("Error fetching member players:", playersError || membersError);
    return [];
  }

  const memberIds = new Set((members || []).map((m) => m.user_id));
  const results: MemberPlayerWithEmail[] = [];

  for (const player of players) {
    if (!player.user_id || !memberIds.has(player.user_id)) continue;

    const { data: authData, error: authError } =
      await admin.auth.admin.getUserById(player.user_id);

    if (authError || !authData.user.email) continue;

    results.push({
      id: player.id,
      name: player.name,
      user_id: player.user_id,
      email: authData.user.email,
      coins: player.coins ?? 0,
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current user's player profile
 */
export async function getCurrentUserPlayer(): Promise<Player | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Update current user's player profile
 */
export async function updatePlayerProfile(
  name: string,
  avatarUrl?: string | null,
): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const updates: { name: string; avatar_url?: string | null } = { name };
  if (avatarUrl !== undefined) {
    updates.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from("players")
    .update(updates)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating player profile:", error);
    return false;
  }

  return true;
}

/** Update any player's display name (admin only) */
export async function updatePlayerNameByAdmin(
  playerId: string,
  name: string,
): Promise<boolean> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) return false;

  const trimmed = name.trim();
  if (!trimmed) return false;

  const admin = createAdminClient();
  const { error } = await admin
    .from("players")
    .update({ name: trimmed })
    .eq("id", playerId);

  if (error) {
    console.error("Error updating player name:", error);
    return false;
  }

  return true;
}

export interface EventLogEntry {
  id: string;
  created_at: string;
  player_name: string;
  logged_by_email: string | null;
}

// ─────────────────────────────────────────────────────────────
// Cosmetics & Shop types
// ─────────────────────────────────────────────────────────────

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  type:
    | "border_color"
    | "bg_gradient"
    | "avatar_ring"
    | "full_card"
    | "card_glow"
    | "avatar_badge"
    | "card_title";
  value: string;
  preview: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  created_at: string;
}

export interface PlayerCosmetic {
  id: string;
  player_id: string;
  cosmetic_id: string;
  equipped: boolean;
  obtained_at: string;
  cosmetic?: Cosmetic;
}

// ─────────────────────────────────────────────────────────────
// Badge types
// ─────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition_type: string;
  condition_value: number | null;
  created_at: string;
}

export interface PlayerBadge {
  id: string;
  player_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}

// ─────────────────────────────────────────────────────────────
// Ad Fundum types
// ─────────────────────────────────────────────────────────────

export interface AdFundum {
  id: string;
  target_player_id: string;
  assigned_by_player_id: string;
  reason: string | null;
  status: "pending" | "completed" | "declined";
  media_url: string | null;
  media_type: "image" | "video" | null;
  completed_at: string | null;
  created_at: string;
  decline_reason?: string | null;
  target_player?: Player;
  assigned_by_player?: Player;
  likes?: AdFundumLike[];
  comments?: AdFundumComment[];
}

export interface AdFundumLike {
  id: string;
  ad_fundum_id: string;
  player_id: string;
  created_at: string;
  player?: { name: string };
}

export interface AdFundumComment {
  id: string;
  ad_fundum_id: string;
  player_id: string;
  content: string;
  created_at: string;
  player?: Player;
}

/**
 * Get event log with player and user information
 */
export async function getEventLog(
  limit: number = 50,
): Promise<EventLogEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mexico_events")
    .select(
      `
      id,
      created_at,
      players!inner(name),
      logged_by_email
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching event log:", error);
    return [];
  }

  return (data || []).map((event) => ({
    id: event.id,
    created_at: event.created_at,
    player_name: (event.players as any).name,
    logged_by_email: event.logged_by_email,
  }));
}

// ─────────────────────────────────────────────────────────────
// Coins
// ─────────────────────────────────────────────────────────────

export async function getPlayerCoins(playerId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("coins")
    .eq("id", playerId)
    .single();
  if (error) return 0;
  return data?.coins ?? 0;
}

/** Award coins to a player (uses service role to bypass RLS) */
export async function awardCoins(
  playerId: string,
  amount: number,
): Promise<void> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("players")
    .select("coins")
    .eq("id", playerId)
    .single();
  const newCoins = (current?.coins ?? 0) + amount;
  await admin.from("players").update({ coins: newCoins }).eq("id", playerId);
}

/** Deduct coins from the current user's player. Returns false if insufficient. */
export async function deductCoins(
  playerId: string,
  amount: number,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("players")
    .select("coins")
    .eq("id", playerId)
    .single();
  const currentCoins = current?.coins ?? 0;
  if (currentCoins < amount) return false;
  const { error } = await admin
    .from("players")
    .update({ coins: currentCoins - amount })
    .eq("id", playerId);
  return !error;
}

// ─────────────────────────────────────────────────────────────
// Cosmetics
// ─────────────────────────────────────────────────────────────

export async function getAllCosmetics(): Promise<Cosmetic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cosmetics")
    .select("*")
    .order("rarity");
  if (error) return [];
  return data || [];
}

export interface CosmeticOwner {
  player_id: string;
  player_name: string;
  equipped: boolean;
  obtained_at: string;
}

export interface CosmeticWithOwners extends Cosmetic {
  owners: CosmeticOwner[];
}

export async function getAllCosmeticsWithOwners(): Promise<CosmeticWithOwners[]> {
  const admin = createAdminClient();

  const [{ data: cosmetics, error: cError }, { data: playerCosmetics, error: pcError }] =
    await Promise.all([
      admin.from("cosmetics").select("*").order("rarity").order("name"),
      admin
        .from("player_cosmetics")
        .select("cosmetic_id, player_id, equipped, obtained_at, player:players(name)"),
    ]);

  if (cError || pcError || !cosmetics) {
    console.error("Error fetching cosmetics:", cError || pcError);
    return [];
  }

  const ownersByCosmetic = new Map<string, CosmeticOwner[]>();
  for (const row of playerCosmetics || []) {
    const list = ownersByCosmetic.get(row.cosmetic_id) ?? [];
    list.push({
      player_id: row.player_id,
      player_name: (row.player as any).name as string,
      equipped: row.equipped,
      obtained_at: row.obtained_at,
    });
    ownersByCosmetic.set(row.cosmetic_id, list);
  }

  return cosmetics.map((c) => ({
    ...(c as Cosmetic),
    owners: ownersByCosmetic.get(c.id) ?? [],
  }));
}

export async function createCosmetic(input: {
  name: string;
  description: string;
  type: string;
  value: string;
  preview: string;
  rarity: string;
}): Promise<Cosmetic | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("cosmetics").insert(input).select("*").single();
  if (error) {
    console.error("Error creating cosmetic:", error);
    return null;
  }
  return data as Cosmetic;
}

export async function updateCosmetic(
  cosmeticId: string,
  input: {
    name: string;
    description: string;
    type: string;
    value: string;
    preview: string;
    rarity: string;
  },
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("cosmetics").update(input).eq("id", cosmeticId);
  if (error) {
    console.error("Error updating cosmetic:", error);
    return false;
  }
  return true;
}

export async function deleteCosmetic(cosmeticId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("cosmetics").delete().eq("id", cosmeticId);
  if (error) {
    console.error("Error deleting cosmetic:", error);
    return false;
  }
  return true;
}

export async function revokeCosmeticFromPlayer(
  cosmeticId: string,
  playerId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("player_cosmetics")
    .delete()
    .eq("cosmetic_id", cosmeticId)
    .eq("player_id", playerId);
  if (error) {
    console.error("Error revoking cosmetic:", error);
    return false;
  }
  return true;
}

export async function getPlayerCosmetics(
  playerId: string,
): Promise<PlayerCosmetic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_cosmetics")
    .select("*, cosmetic:cosmetics(*)")
    .eq("player_id", playerId)
    .order("obtained_at", { ascending: false });
  if (error) return [];
  return (data || []).map((row) => ({
    ...row,
    cosmetic: row.cosmetic as Cosmetic,
  }));
}

export async function getEquippedCosmeticForPlayer(
  playerId: string,
): Promise<Cosmetic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_cosmetics")
    .select("cosmetic:cosmetics(*)")
    .eq("player_id", playerId)
    .eq("equipped", true)
    .maybeSingle();
  if (error || !data) return null;
  return (data.cosmetic as unknown as Cosmetic) || null;
}

/** Returns a map of playerId → all equipped Cosmetics (one per type) */
export async function getEquippedCosmeticsForAllPlayers(): Promise<
  Record<string, Cosmetic[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_cosmetics")
    .select("player_id, cosmetic:cosmetics(*)")
    .eq("equipped", true);
  if (error || !data) return {};
  const result: Record<string, Cosmetic[]> = {};
  for (const row of data) {
    if (row.player_id && row.cosmetic) {
      if (!result[row.player_id]) result[row.player_id] = [];
      result[row.player_id].push(row.cosmetic as unknown as Cosmetic);
    }
  }
  return result;
}

/** Grant a cosmetic to a player. Ignores if they already have it. */
export async function grantCosmeticToPlayer(
  playerId: string,
  cosmeticId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("player_cosmetics")
    .upsert(
      { player_id: playerId, cosmetic_id: cosmeticId },
      { onConflict: "player_id,cosmetic_id", ignoreDuplicates: true },
    );
}

/** Equip a cosmetic — unequips any other cosmetic of the same type first */
export async function equipCosmetic(
  playerId: string,
  cosmeticId: string,
): Promise<void> {
  const admin = createAdminClient();
  // Find the type of the cosmetic being equipped
  const { data: cosmeticData } = await admin
    .from("cosmetics")
    .select("type")
    .eq("id", cosmeticId)
    .single();
  if (cosmeticData?.type) {
    // Unequip existing equipped cosmetic of the same type
    const { data: sameType } = await admin
      .from("player_cosmetics")
      .select("cosmetic_id, cosmetic:cosmetics(type)")
      .eq("player_id", playerId)
      .eq("equipped", true);
    const toUnequip = (sameType ?? []).filter(
      (r) =>
        (r.cosmetic as unknown as { type: string } | null)?.type ===
        cosmeticData.type,
    );
    for (const r of toUnequip) {
      await admin
        .from("player_cosmetics")
        .update({ equipped: false })
        .eq("player_id", playerId)
        .eq("cosmetic_id", r.cosmetic_id);
    }
  }
  await admin
    .from("player_cosmetics")
    .update({ equipped: true })
    .eq("player_id", playerId)
    .eq("cosmetic_id", cosmeticId);
}

/** Unequip all cosmetics for a player (or only those of a specific type) */
export async function unequipCosmetics(
  playerId: string,
  type?: string,
): Promise<void> {
  const admin = createAdminClient();
  if (type) {
    // Find cosmetic_ids of the given type the player has equipped
    const { data } = await admin
      .from("player_cosmetics")
      .select("cosmetic_id, cosmetic:cosmetics(type)")
      .eq("player_id", playerId)
      .eq("equipped", true);
    const toUnequip = (data ?? []).filter(
      (r) => (r.cosmetic as unknown as { type: string } | null)?.type === type,
    );
    for (const r of toUnequip) {
      await admin
        .from("player_cosmetics")
        .update({ equipped: false })
        .eq("player_id", playerId)
        .eq("cosmetic_id", r.cosmetic_id);
    }
  } else {
    await admin
      .from("player_cosmetics")
      .update({ equipped: false })
      .eq("player_id", playerId);
  }
}

// ─────────────────────────────────────────────────────────────
// Mystery Box
// ─────────────────────────────────────────────────────────────

const BOX_COSTS = { bronze: 5, silver: 15, gold: 30 } as const;
const BOX_RARITY_POOLS: Record<string, string[]> = {
  bronze: ["common", "rare"],
  silver: ["rare", "epic"],
  gold: ["epic", "legendary"],
};
// Weights: first in list is more likely
const BOX_WEIGHTS: Record<string, number[]> = {
  bronze: [70, 30],
  silver: [65, 35],
  gold: [60, 40],
};

export type BoxTier = keyof typeof BOX_COSTS;

export async function openMysteryBox(
  playerId: string,
  tier: BoxTier,
): Promise<{ cosmetic: Cosmetic; isNew: boolean } | { error: string }> {
  const cost = BOX_COSTS[tier];

  // Deduct coins
  const ok = await deductCoins(playerId, cost);
  if (!ok) return { error: "Not enough coins" };

  // Pick a rarity based on weights
  const rarityPool = BOX_RARITY_POOLS[tier];
  const weights = BOX_WEIGHTS[tier];
  const roll = Math.random() * 100;
  const rarity = roll < weights[0] ? rarityPool[0] : rarityPool[1];

  // Fetch all cosmetics of that rarity
  const admin = createAdminClient();
  const { data: cosmeticsOfRarity } = await admin
    .from("cosmetics")
    .select("*")
    .eq("rarity", rarity);

  if (!cosmeticsOfRarity || cosmeticsOfRarity.length === 0) {
    // Refund if no cosmetics found
    await awardCoins(playerId, cost);
    return { error: "No cosmetics available" };
  }

  // Check which ones the player already owns
  const { data: owned } = await admin
    .from("player_cosmetics")
    .select("cosmetic_id")
    .eq("player_id", playerId);
  const ownedIds = new Set((owned || []).map((o) => o.cosmetic_id));

  // Prefer cosmetics they don't own yet; fall back to any
  const unowned = cosmeticsOfRarity.filter((c) => !ownedIds.has(c.id));
  const pool = unowned.length > 0 ? unowned : cosmeticsOfRarity;

  const cosmetic = pool[Math.floor(Math.random() * pool.length)] as Cosmetic;
  const isNew = !ownedIds.has(cosmetic.id);

  await grantCosmeticToPlayer(playerId, cosmetic.id);

  return { cosmetic, isNew };
}

// ─────────────────────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────────────────────

export async function getPlayerBadges(
  playerId: string,
): Promise<PlayerBadge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_badges")
    .select("*, badge:badges(*)")
    .eq("player_id", playerId)
    .order("awarded_at", { ascending: false });
  if (error) return [];
  return (data || []).map((row) => ({ ...row, badge: row.badge as Badge }));
}

/** Check conditions and award any newly earned badges. Returns newly awarded badges. */
export async function checkAndAwardBadges(
  playerId: string,
  allTimeCount: number,
  yearCount: number,
): Promise<Badge[]> {
  const admin = createAdminClient();

  // Fetch all badges and what player already has
  const [{ data: allBadges }, { data: existingBadges }] = await Promise.all([
    admin.from("badges").select("*"),
    admin.from("player_badges").select("badge_id").eq("player_id", playerId),
  ]);

  if (!allBadges) return [];
  const existingIds = new Set((existingBadges || []).map((b) => b.badge_id));

  // Count ad fundums completed and assigned
  const [
    { count: fundumsDone },
    { count: fundumsAssigned },
    { count: cosmeticsOwned },
  ] = await Promise.all([
    admin
      .from("ad_fundums")
      .select("id", { count: "exact" })
      .eq("target_player_id", playerId)
      .eq("status", "completed"),
    admin
      .from("ad_fundums")
      .select("id", { count: "exact" })
      .eq("assigned_by_player_id", playerId),
    admin
      .from("player_cosmetics")
      .select("id", { count: "exact" })
      .eq("player_id", playerId),
  ]);

  const newlyAwarded: Badge[] = [];

  for (const badge of allBadges as Badge[]) {
    if (existingIds.has(badge.id)) continue;

    let earned = false;
    const val = badge.condition_value ?? 0;

    switch (badge.condition_type) {
      case "mexico_alltime":
        earned = allTimeCount >= val;
        break;
      case "mexico_year":
        earned = yearCount >= val;
        break;
      case "ad_fundum_completed":
        earned = (fundumsDone ?? 0) >= val;
        break;
      case "ad_fundum_assigned":
        earned = (fundumsAssigned ?? 0) >= val;
        break;
      case "cosmetics_owned":
        earned = (cosmeticsOwned ?? 0) >= val;
        break;
      case "manual":
        break;
    }

    if (earned) {
      const { error } = await admin
        .from("player_badges")
        .insert({ player_id: playerId, badge_id: badge.id });
      if (!error) newlyAwarded.push(badge);
    }
  }

  return newlyAwarded;
}

export interface BadgeHolder {
  player_id: string;
  player_name: string;
  awarded_at: string;
}

export interface BadgeWithHolders extends Badge {
  holders: BadgeHolder[];
}

export async function getAllBadgesWithHolders(): Promise<BadgeWithHolders[]> {
  const admin = createAdminClient();

  const [{ data: badges, error: badgesError }, { data: playerBadges, error: pbError }] =
    await Promise.all([
      admin.from("badges").select("*").order("condition_type").order("condition_value"),
      admin
        .from("player_badges")
        .select("badge_id, player_id, awarded_at, player:players(name)"),
    ]);

  if (badgesError || pbError || !badges) {
    console.error("Error fetching badges:", badgesError || pbError);
    return [];
  }

  const holdersByBadge = new Map<string, BadgeHolder[]>();
  for (const row of playerBadges || []) {
    const list = holdersByBadge.get(row.badge_id) ?? [];
    list.push({
      player_id: row.player_id,
      player_name: (row.player as any).name as string,
      awarded_at: row.awarded_at,
    });
    holdersByBadge.set(row.badge_id, list);
  }

  return badges.map((badge) => ({
    ...(badge as Badge),
    holders: holdersByBadge.get(badge.id) ?? [],
  }));
}

export async function createBadge(input: {
  name: string;
  description: string;
  emoji: string;
  condition_type: string;
  condition_value: number | null;
}): Promise<Badge | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("badges").insert(input).select("*").single();
  if (error) {
    console.error("Error creating badge:", error);
    return null;
  }
  return data as Badge;
}

export async function updateBadge(
  badgeId: string,
  input: {
    name: string;
    description: string;
    emoji: string;
    condition_type: string;
    condition_value: number | null;
  },
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("badges").update(input).eq("id", badgeId);
  if (error) {
    console.error("Error updating badge:", error);
    return false;
  }
  return true;
}

export async function deleteBadge(badgeId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("badges").delete().eq("id", badgeId);
  if (error) {
    console.error("Error deleting badge:", error);
    return false;
  }
  return true;
}

export async function revokeBadgeFromPlayer(
  badgeId: string,
  playerId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("player_badges")
    .delete()
    .eq("badge_id", badgeId)
    .eq("player_id", playerId);
  if (error) {
    console.error("Error revoking badge:", error);
    return false;
  }
  return true;
}

export async function awardBadgeToPlayer(
  badgeId: string,
  playerId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("player_badges")
    .upsert({ badge_id: badgeId, player_id: playerId }, { onConflict: "player_id,badge_id" });
  if (error) {
    console.error("Error awarding badge:", error);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// Ad Fundums
// ─────────────────────────────────────────────────────────────

/** Returns the set of player IDs that have at least one pending ad fundum */
export async function getPlayersWithPendingAdFundums(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_fundums")
    .select("target_player_id")
    .eq("status", "pending");
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.target_player_id));
}

export async function getAdFundums(): Promise<AdFundum[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_fundums")
    .select(
      `
      *,
      target_player:players!target_player_id(id, name, avatar_url),
      assigned_by_player:players!assigned_by_player_id(id, name, avatar_url),
      likes:ad_fundum_likes(id, player_id, created_at, player:players(name)),
      comments:ad_fundum_comments(id, player_id, content, created_at, player:players(id, name, avatar_url))
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ad fundums:", error);
    return [];
  }

  return (data || []) as unknown as AdFundum[];
}

export async function createAdFundum(
  targetPlayerId: string,
  assignedByPlayerId: string,
  reason?: string,
): Promise<AdFundum | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_fundums")
    .insert({
      target_player_id: targetPlayerId,
      assigned_by_player_id: assignedByPlayerId,
      reason: reason || null,
    })
    .select()
    .single();
  if (error) {
    console.error("Error creating ad fundum:", error);
    return null;
  }
  return data as AdFundum;
}

export async function declineAdFundum(
  id: string,
  assignedByPlayerId: string,
  reason?: string,
): Promise<AdFundum | null> {
  const admin = createAdminClient();
  // Mark old adje as declined
  const { data: old, error: fetchErr } = await admin
    .from("ad_fundums")
    .select("target_player_id, reason")
    .eq("id", id)
    .single();
  if (fetchErr || !old) return null;
  const { error: declineErr } = await admin
    .from("ad_fundums")
    .update({ status: "declined", decline_reason: reason || null })
    .eq("id", id);
  if (declineErr) return null;
  // Create a new adje — use provided reason or fall back to original
  const newReason = reason || old.reason;
  const { data: newAdje, error: createErr } = await admin
    .from("ad_fundums")
    .insert({
      target_player_id: old.target_player_id,
      assigned_by_player_id: assignedByPlayerId,
      reason: newReason,
    })
    .select(
      `*, target_player:players!target_player_id(id, name, avatar_url),
      assigned_by_player:players!assigned_by_player_id(id, name, avatar_url),
      likes:ad_fundum_likes(id, player_id, created_at, player:players(name)),
      comments:ad_fundum_comments(id, player_id, content, created_at, player:players(id, name, avatar_url))`,
    )
    .single();
  if (createErr) return null;
  return newAdje as AdFundum;
}

export async function completeAdFundum(
  id: string,
  mediaUrl: string,
  mediaType: "image" | "video",
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ad_fundums")
    .update({
      status: "completed",
      media_url: mediaUrl,
      media_type: mediaType,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
  return !error;
}

export async function toggleAdFundumLike(
  adFundumId: string,
  playerId: string,
): Promise<{ liked: boolean }> {
  const admin = createAdminClient();

  // Check if already liked
  const { data: existing } = await admin
    .from("ad_fundum_likes")
    .select("id")
    .eq("ad_fundum_id", adFundumId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (existing) {
    await admin.from("ad_fundum_likes").delete().eq("id", existing.id);
    return { liked: false };
  } else {
    await admin
      .from("ad_fundum_likes")
      .insert({ ad_fundum_id: adFundumId, player_id: playerId });
    return { liked: true };
  }
}

export async function addAdFundumComment(
  adFundumId: string,
  playerId: string,
  content: string,
): Promise<AdFundumComment | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_fundum_comments")
    .insert({ ad_fundum_id: adFundumId, player_id: playerId, content })
    .select("*, player:players(id, name, avatar_url)")
    .single();
  if (error) return null;
  return data as unknown as AdFundumComment;
}

export async function getPlayerInfo(playerId: string): Promise<{
  player: Player;
  allTimeCount: number;
  yearCount: number;
  badges: PlayerBadge[];
  cosmetics: PlayerCosmetic[];
  equippedCosmetic: Cosmetic | null;
} | null> {
  const supabase = await createClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error || !player) return null;

  const { getStartDateForRange } = await import("@/lib/time-ranges");
  const yearStart = getStartDateForRange("year");

  const [allTimeCount, yearCount, badges, cosmetics] = await Promise.all([
    getPlayerMexicoCount(playerId, null),
    getPlayerMexicoCount(playerId, yearStart),
    getPlayerBadges(playerId),
    getPlayerCosmetics(playerId),
  ]);

  const equippedCosmetic = cosmetics.find((c) => c.equipped)?.cosmetic ?? null;

  return {
    player,
    allTimeCount,
    yearCount,
    badges,
    cosmetics,
    equippedCosmetic,
  };
}
