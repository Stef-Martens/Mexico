import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

interface LeaderboardProps {
  entries: {
    player_id: string;
    player_name: string;
    mexico_count: number;
  }[];
  title: string;
}

export function Leaderboard({ entries, title }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No Mexicos recorded yet! 🎲
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const medal = getMedalEmoji(index);
            return (
              <div
                key={entry.player_id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-2 border-yellow-500/20"
                    : index === 1
                      ? "bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-2 border-gray-400/20"
                      : index === 2
                        ? "bg-gradient-to-r from-orange-600/10 to-orange-600/5 border-2 border-orange-600/20"
                        : "bg-muted/50 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-muted-foreground w-8 flex-shrink-0">
                    {medal || `#${index + 1}`}
                  </span>
                  <span className="font-semibold text-lg">
                    {entry.player_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {entry.mexico_count}
                  </span>
                  <span className="text-xl">🎲</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
