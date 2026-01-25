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
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No Mexicos recorded yet!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.player_id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground w-8">
                  {index + 1}
                </span>
                <span className="font-medium">{entry.player_name}</span>
              </div>
              <span className="text-xl font-bold">{entry.mexico_count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
