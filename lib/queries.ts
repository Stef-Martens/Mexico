import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface Player {
  id: string;
  name: string;
  created_at: string;
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
 * Insert a Mexico event for a player
 */
export async function logMexico(playerId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("mexico_events").insert({
    player_id: playerId,
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
