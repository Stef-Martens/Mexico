export interface PlayerCount {
  player_id: string;
  mexico_count: number;
}

export interface Standing<P> {
  player: P;
  allTimeCount: number;
  tonightCount: number;
}

function toCountMap(counts: PlayerCount[]): Map<string, number> {
  return new Map(counts.map((c) => [c.player_id, c.mexico_count]));
}

/**
 * Combine players with their counts, highest all-time count first.
 * Ties go alphabetically; players with no Mexicos count as 0.
 */
export function buildStandings<P extends { id: string; name: string }>(
  players: P[],
  allTime: PlayerCount[],
  tonight: PlayerCount[],
): Standing<P>[] {
  const allTimeById = toCountMap(allTime);
  const tonightById = toCountMap(tonight);

  return players
    .map((player) => ({
      player,
      allTimeCount: allTimeById.get(player.id) ?? 0,
      tonightCount: tonightById.get(player.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.allTimeCount - a.allTimeCount ||
        a.player.name.localeCompare(b.player.name, undefined, {
          sensitivity: "base",
        }),
    );
}
