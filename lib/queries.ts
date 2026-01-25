import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface Player {
  id: string;
  name: string;
  created_at: string;
  avatar_url?: string | null;
  user_id?: string | null;
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

export interface EventLogEntry {
  id: string;
  created_at: string;
  player_name: string;
  logged_by_email: string | null;
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
