/**
 * Time range utilities for leaderboard filtering
 * All times are in Europe/Brussels timezone
 */

export type TimeRange = "tonight" | "week" | "year" | "all";

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  mexico_count: number;
}

/**
 * Get start date for a given time range
 * Returns ISO string for Supabase filtering
 */
export function getStartDateForRange(range: TimeRange): string | null {
  const now = new Date();

  // Convert to Europe/Brussels timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(get("year")!);
  const month = parseInt(get("month")!);
  const day = parseInt(get("day")!);
  const hour = parseInt(get("hour")!);

  switch (range) {
    case "tonight": {
      // Noon-to-noon range (better for games played around midnight)
      // If before noon, use yesterday at noon. If after noon, use today at noon.
      let startDay = day;
      let startMonth = month;
      let startYear = year;

      if (hour < 12) {
        // Before noon - go back to yesterday at noon
        const yesterday = new Date(year, month - 1, day);
        yesterday.setDate(yesterday.getDate() - 1);
        startDay = yesterday.getDate();
        startMonth = yesterday.getMonth() + 1;
        startYear = yesterday.getFullYear();
      }

      return `${startYear}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}T12:00:00+01:00`;
    }
    case "week": {
      // Start of this week (Monday)
      const todayInBrussels = new Date(year, month - 1, day);
      const dayOfWeek = todayInBrussels.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(todayInBrussels);
      monday.setDate(monday.getDate() - daysToMonday);

      return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}T00:00:00+01:00`;
    }
    case "year": {
      // Start of this year
      return `${year}-01-01T00:00:00+01:00`;
    }
    case "all":
      return null; // No filter
    default:
      return null;
  }
}

/**
 * Get a human-readable label for a time range
 */
export function getRangeLabel(range: TimeRange): string {
  switch (range) {
    case "tonight":
      return "Tonight";
    case "week":
      return "This Week";
    case "year":
      return "This Year";
    case "all":
      return "All Time";
    default:
      return "";
  }
}
