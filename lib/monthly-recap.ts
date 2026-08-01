import {
  awardCoins,
  getLeaderboardForRange,
  getMemberPlayersWithEmails,
  type MemberPlayerWithEmail,
} from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  getMonthBefore,
  getMonthRange,
  getPreviousMonthRange,
} from "@/lib/time-ranges";
import { buildMonthlyRecapEmail } from "@/lib/email/monthly-recap-email";
import { isEmailConfigured, sendEmail } from "@/lib/email/send-email";

export const MONTHLY_COIN_AWARDS: Record<number, number> = {
  1: 20,
  2: 10,
  3: 5,
};

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  mexico_count: number;
}

export interface MonthlyRecapResult {
  yearMonth: string;
  monthLabel: string;
  emailsSent: number;
  recipientCount: number;
  honorableMentions: string[];
  coinsAwarded: { playerId: string; playerName: string; rank: number; coins: number }[];
  skipped: boolean;
  error?: string;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRank(
  leaderboard: LeaderboardEntry[],
  playerId: string,
): number | null {
  const idx = leaderboard.findIndex((e) => e.player_id === playerId);
  return idx === -1 ? null : idx + 1;
}

export function buildHonorableMentions(
  current: LeaderboardEntry[],
  previous: LeaderboardEntry[],
): string[] {
  const mentions: string[] = [];

  if (current.length === 0) {
    return ["A quiet month — no Mexicos logged. Time to roll some dice! 🎲"];
  }

  const champion = current[0];
  mentions.push(
    `🏆 Monthly champion: ${champion.player_name} with ${champion.mexico_count} Mexico${champion.mexico_count !== 1 ? "s" : ""}!`,
  );

  if (current.length >= 2) {
    const second = current[1];
    mentions.push(
      `🥈 Runner-up: ${second.player_name} (${second.mexico_count} Mexico${second.mexico_count !== 1 ? "s" : ""})`,
    );
  }

  if (current.length >= 3) {
    const third = current[2];
    mentions.push(
      `🥉 Third place: ${third.player_name} (${third.mexico_count} Mexico${third.mexico_count !== 1 ? "s" : ""})`,
    );
  }

  if (current.length >= 2 && current[0].mexico_count - current[1].mexico_count <= 1) {
    mentions.push(
      `🔥 Nail-biter: ${current[0].player_name} and ${current[1].player_name} were only 1 Mexico apart!`,
    );
  }

  let bestClimber: {
    name: string;
    oldRank: number;
    newRank: number;
    delta: number;
  } | null = null;

  for (const entry of current) {
    const newRank = getRank(current, entry.player_id)!;
    const oldRank = getRank(previous, entry.player_id);
    if (oldRank === null) continue;
    const delta = oldRank - newRank;
    if (delta > 0 && (!bestClimber || delta > bestClimber.delta)) {
      bestClimber = {
        name: entry.player_name,
        oldRank,
        newRank,
        delta,
      };
    }
  }

  if (bestClimber && bestClimber.delta > 0) {
    mentions.push(
      `📈 Biggest climber: ${bestClimber.name} went from ${ordinal(bestClimber.oldRank)} to ${ordinal(bestClimber.newRank)} place!`,
    );
  }

  const newcomers = current.filter(
    (e) => getRank(previous, e.player_id) === null,
  );
  if (newcomers.length > 0 && previous.length > 0) {
    const names = newcomers.map((e) => e.player_name).join(", ");
    mentions.push(`🆕 New on the leaderboard: ${names}`);
  }

  const mostActive = [...current].sort(
    (a, b) => b.mexico_count - a.mexico_count,
  )[0];
  if (mostActive && mostActive.mexico_count >= 10) {
    mentions.push(
      `💪 Mexico machine: ${mostActive.player_name} logged ${mostActive.mexico_count} Mexicos — absolute legend!`,
    );
  }

  return mentions;
}

async function hasRecapAlreadyRun(yearMonth: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("monthly_recap_runs")
    .select("year_month")
    .eq("year_month", yearMonth)
    .maybeSingle();
  return !!data;
}

async function recordRecapRun(
  yearMonth: string,
  emailsSent: number,
  coinsAwarded: MonthlyRecapResult["coinsAwarded"],
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("monthly_recap_runs").insert({
    year_month: yearMonth,
    emails_sent: emailsSent,
    coins_awarded: coinsAwarded,
  });
}

function getPersonalSummary(
  player: MemberPlayerWithEmail,
  leaderboard: LeaderboardEntry[],
  coinsEarned: number,
  monthLabel: string,
): string {
  const rank = getRank(leaderboard, player.id);
  const entry = leaderboard.find((e) => e.player_id === player.id);

  if (!entry) {
    return `You didn't log any Mexicos in ${monthLabel}, but there's always next month! 🎲`;
  }

  const rankText = rank ? `${ordinal(rank)} place` : "unranked";
  let summary = `You logged ${entry.mexico_count} Mexico${entry.mexico_count !== 1 ? "s" : ""} in ${monthLabel}, finishing in ${rankText}.`;

  if (coinsEarned > 0) {
    summary += ` You earned ${coinsEarned} coins for your podium finish! 🪙`;
  }

  return summary;
}

export async function runMonthlyRecap(options?: {
  yearMonth?: string;
  dryRun?: boolean;
  force?: boolean;
  /** Send a single preview email only — no coins, no run record */
  testEmailOnly?: string;
}): Promise<MonthlyRecapResult> {
  const monthRange = options?.yearMonth
    ? getMonthRange(
        parseInt(options.yearMonth.split("-")[0]),
        parseInt(options.yearMonth.split("-")[1]),
      )
    : getPreviousMonthRange();

  const { start, end, label, yearMonth } = monthRange;
  const previousMonthRange = getMonthBefore(yearMonth);

  const isTestSend = !!options?.testEmailOnly;

  if (!isTestSend && !options?.force && (await hasRecapAlreadyRun(yearMonth))) {
    return {
      yearMonth,
      monthLabel: label,
      emailsSent: 0,
      recipientCount: 0,
      honorableMentions: [],
      coinsAwarded: [],
      skipped: true,
    };
  }

  const [leaderboard, previousLeaderboard, members] = await Promise.all([
    getLeaderboardForRange(start, end),
    getLeaderboardForRange(previousMonthRange.start, previousMonthRange.end),
    getMemberPlayersWithEmails(),
  ]);

  const honorableMentions = buildHonorableMentions(
    leaderboard,
    previousLeaderboard,
  );

  if (!(await isEmailConfigured())) {
    const { getEmailConfigError } = await import("@/lib/email/send-email");
    return {
      yearMonth,
      monthLabel: label,
      emailsSent: 0,
      recipientCount: members.length,
      honorableMentions,
      coinsAwarded: [],
      skipped: false,
      error:
        getEmailConfigError() ??
        "Email not configured. Set GMAIL_APP_PASSWORD and EMAIL_FROM in environment variables.",
    };
  }

  const coinsAwarded: MonthlyRecapResult["coinsAwarded"] = [];

  if (!options?.dryRun && !isTestSend) {
    for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
      const entry = leaderboard[i];
      const rank = i + 1;
      const coins = MONTHLY_COIN_AWARDS[rank];
      if (!coins) continue;

      await awardCoins(entry.player_id, coins);
      coinsAwarded.push({
        playerId: entry.player_id,
        playerName: entry.player_name,
        rank,
        coins,
      });
    }
  } else {
    for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
      const entry = leaderboard[i];
      const rank = i + 1;
      const coins = MONTHLY_COIN_AWARDS[rank];
      if (!coins) continue;
      coinsAwarded.push({
        playerId: entry.player_id,
        playerName: entry.player_name,
        rank,
        coins,
      });
    }
  }

  let emailsSent = 0;

  const recipients = isTestSend
    ? (() => {
        const match = members.find(
          (m) =>
            m.email.toLowerCase() === options.testEmailOnly!.toLowerCase(),
        );
        if (match) return [match];
        return [
          {
            id: "preview",
            name: "Stef",
            user_id: "preview",
            email: options.testEmailOnly!,
            coins: 0,
          } satisfies MemberPlayerWithEmail,
        ];
      })()
    : members;

  for (const member of recipients) {
    const rank = getRank(leaderboard, member.id);
    const coinsEarned = isTestSend
      ? (rank && rank <= 3 ? MONTHLY_COIN_AWARDS[rank] : 0)
      : (coinsAwarded.find((c) => c.playerId === member.id)?.coins ?? 0);

    const html = buildMonthlyRecapEmail({
      playerName: member.name,
      monthLabel: label,
      personalSummary:
        member.id === "preview"
          ? `This is a preview of the ${label} monthly recap. Your personal stats would appear here.`
          : getPersonalSummary(member, leaderboard, coinsEarned, label),
      honorableMentions,
      leaderboard: leaderboard.slice(0, 10),
      coinsEarned,
      rank: member.id === "preview" ? null : rank,
    });

    if (options?.dryRun) continue;

    const { success, error } = await sendEmail({
      to: isTestSend ? options.testEmailOnly! : member.email,
      subject: isTestSend
        ? `🎲 [Preview] Mexico Monthly Recap — ${label}`
        : `🎲 Mexico Monthly Recap — ${label}`,
      html,
    });

    if (!success) {
      console.error(`Failed to send recap to ${member.email}:`, error);
      if (isTestSend) {
        return {
          yearMonth,
          monthLabel: label,
          emailsSent: 0,
          recipientCount: 1,
          honorableMentions,
          coinsAwarded,
          skipped: false,
          error,
        };
      }
      continue;
    }

    emailsSent++;
    if (isTestSend) break;
  }

  if (!options?.dryRun && !isTestSend) {
    await recordRecapRun(yearMonth, emailsSent, coinsAwarded);
  }

  return {
    yearMonth,
    monthLabel: label,
    emailsSent,
    recipientCount: isTestSend ? 1 : members.length,
    honorableMentions,
    coinsAwarded,
    skipped: false,
  };
}
