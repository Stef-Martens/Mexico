/**
 * Time range utilities for leaderboard filtering
 * All times are in Europe/Brussels timezone
 */

export type TimeRange = "tonight" | "week" | "month" | "year" | "all";

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  mexico_count: number;
}

/**
 * Get start date for a given time range
 * Returns ISO string for Supabase filtering
 */
/**
 * Brussels UTC offset on a calendar date, e.g. "+02:00" in summer.
 * Measured at noon. Clocks only change overnight on a Sunday, so this is also
 * right for the midnights used below: a Monday, or the 1st of a month.
 */
function getBrusselsOffset(year: number, month: number, day: number): string {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date(Date.UTC(year, month - 1, day, 12)))
    .find((p) => p.type === "timeZoneName")?.value;

  return offset?.replace("GMT", "") || "+01:00";
}

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

      return `${startYear}-${String(startMonth).padStart(2, "0")}-${String(startDay).padStart(2, "0")}T12:00:00${getBrusselsOffset(startYear, startMonth, startDay)}`;
    }
    case "week": {
      // Start of this week (Monday)
      const todayInBrussels = new Date(year, month - 1, day);
      const dayOfWeek = todayInBrussels.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(todayInBrussels);
      monday.setDate(monday.getDate() - daysToMonday);

      return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}T00:00:00${getBrusselsOffset(monday.getFullYear(), monday.getMonth() + 1, monday.getDate())}`;
    }
    case "month": {
      return `${year}-${String(month).padStart(2, "0")}-01T00:00:00${getBrusselsOffset(year, month, 1)}`;
    }
    case "year": {
      // Start of this year
      return `${year}-01-01T00:00:00${getBrusselsOffset(year, 1, 1)}`;
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
/** Get Brussels calendar year/month for a date */
export function getBrusselsYearMonth(date = new Date()): {
  year: number;
  month: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return {
    year: parseInt(get("year")!),
    month: parseInt(get("month")!),
  };
}

/** ISO range for a calendar month in Europe/Brussels */
export function getMonthRange(
  year: number,
  month: number,
): { start: string; end: string; label: string; yearMonth: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01T00:00:00${getBrusselsOffset(year, month, 1)}`;
  const endYear = month === 12 ? year + 1 : year;
  const endMonth = month === 12 ? 1 : month + 1;
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00${getBrusselsOffset(endYear, endMonth, 1)}`;
  const label = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  return { start, end, label, yearMonth: `${year}-${String(month).padStart(2, "0")}` };
}

/** Previous calendar month in Europe/Brussels */
export function getPreviousMonthRange(date = new Date()) {
  const { year, month } = getBrusselsYearMonth(date);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  return getMonthRange(prevYear, prevMonth);
}

/** Month before a given year-month string (e.g. "2026-05" → April 2026) */
export function getMonthBefore(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  return getMonthRange(prevYear, prevMonth);
}

export function getRangeLabel(range: TimeRange): string {
  switch (range) {
    case "tonight":
      return "Tonight";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "year":
      return "This Year";
    case "all":
      return "All Time";
    default:
      return "";
  }
}
