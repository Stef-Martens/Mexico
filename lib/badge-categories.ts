export const BADGE_CONDITION_TYPES = [
  "mexico_alltime",
  "mexico_year",
  "ad_fundum_completed",
  "ad_fundum_assigned",
  "cosmetics_owned",
  "manual",
] as const;

export type BadgeConditionType = (typeof BADGE_CONDITION_TYPES)[number];

export const BADGE_CATEGORY_LABELS: Record<
  BadgeConditionType,
  { label: string; hint: string }
> = {
  mexico_alltime: {
    label: "Mexico (all time)",
    hint: "Auto-awarded at X total Mexicos",
  },
  mexico_year: {
    label: "Mexico (this year)",
    hint: "Auto-awarded at X Mexicos this year",
  },
  ad_fundum_completed: {
    label: "Adjes completed",
    hint: "Auto-awarded after completing X adjes",
  },
  ad_fundum_assigned: {
    label: "Adjes assigned",
    hint: "Auto-awarded after assigning X adjes",
  },
  cosmetics_owned: {
    label: "Cosmetics",
    hint: "Auto-awarded when owning X cosmetics",
  },
  manual: {
    label: "Manual only",
    hint: "Only assigned by admin — never auto-awarded",
  },
};

export function formatBadgeCondition(
  conditionType: string,
  conditionValue: number | null,
): string {
  if (conditionType === "manual") return "Admin assigned only";
  const val = conditionValue ?? 0;
  switch (conditionType) {
    case "mexico_alltime":
      return `${val} Mexico${val !== 1 ? "s" : ""} all time`;
    case "mexico_year":
      return `${val} Mexico${val !== 1 ? "s" : ""} this year`;
    case "ad_fundum_completed":
      return `${val} adje${val !== 1 ? "s" : ""} completed`;
    case "ad_fundum_assigned":
      return `${val} adje${val !== 1 ? "s" : ""} assigned`;
    case "cosmetics_owned":
      return `${val} cosmetic${val !== 1 ? "s" : ""} owned`;
    default:
      return conditionType;
  }
}
