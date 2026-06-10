import type { LeaderboardEntry } from "@/lib/monthly-recap";

interface MonthlyRecapEmailProps {
  playerName: string;
  monthLabel: string;
  personalSummary: string;
  honorableMentions: string[];
  leaderboard: LeaderboardEntry[];
  coinsEarned: number;
  rank: number | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function medalForRank(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}.`;
}

export function buildMonthlyRecapEmail(props: MonthlyRecapEmailProps): string {
  const {
    playerName,
    monthLabel,
    personalSummary,
    honorableMentions,
    leaderboard,
    coinsEarned,
    rank,
  } = props;

  const leaderboardRows = leaderboard
    .map((entry, i) => {
      const r = i + 1;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${medalForRank(r)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:${r <= 3 ? "600" : "400"};">${escapeHtml(entry.player_name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${entry.mexico_count}</td>
        </tr>`;
    })
    .join("");

  const mentionItems = honorableMentions
    .map(
      (m) =>
        `<li style="margin-bottom:8px;line-height:1.5;">${escapeHtml(m)}</li>`,
    )
    .join("");

  const coinBanner =
    coinsEarned > 0
      ? `
      <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #f59e0b;border-radius:12px;padding:16px;margin:24px 0;text-align:center;">
        <p style="margin:0;font-size:18px;font-weight:700;color:#92400e;">🪙 +${coinsEarned} coins added to your balance!</p>
        <p style="margin:8px 0 0;font-size:13px;color:#b45309;">Podium reward for finishing ${rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"} in ${escapeHtml(monthLabel)}</p>
      </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:32px 24px;text-align:center;">
        <p style="margin:0;font-size:32px;">🎲</p>
        <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">Mexico Monthly Recap</h1>
        <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px;">${escapeHtml(monthLabel)}</p>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 8px;font-size:16px;color:#18181b;">Hey ${escapeHtml(playerName)}! 👋</p>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">${escapeHtml(personalSummary)}</p>

        ${coinBanner}

        <h2 style="margin:0 0 12px;font-size:16px;color:#18181b;">🏆 ${escapeHtml(monthLabel)} Leaderboard</h2>
        ${
          leaderboard.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:14px;color:#3f3f46;margin-bottom:24px;">
            <thead>
              <tr style="background:#f4f4f5;">
                <th style="padding:8px 12px;text-align:left;">#</th>
                <th style="padding:8px 12px;text-align:left;">Player</th>
                <th style="padding:8px 12px;text-align:right;">Mexicos</th>
              </tr>
            </thead>
            <tbody>${leaderboardRows}</tbody>
          </table>`
            : `<p style="color:#71717a;font-size:14px;margin-bottom:24px;">No Mexicos logged this month.</p>`
        }

        <h2 style="margin:0 0 12px;font-size:16px;color:#18181b;">✨ Honorable Mentions</h2>
        <ul style="margin:0 0 24px;padding-left:20px;color:#52525b;font-size:14px;">
          ${mentionItems}
        </ul>

        <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">
          Keep rolling — see you on the leaderboard next month! 🎲
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
