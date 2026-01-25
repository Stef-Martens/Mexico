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

  switch (range) {
    case "tonight": {
      // Start of today in Brussels timezone
      const startOfDay = new Date(
        Date.UTC(year, month - 1, day, -1, 0, 0, 0), // Adjust for Brussels UTC+1/+2
      );
      // Better: construct date string and let Supabase handle timezone
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+01:00`;
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
