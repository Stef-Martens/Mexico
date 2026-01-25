import {
  checkAppMembership,
  getCurrentUser,
  getPlayers,
  getLeaderboard,
  ensureCurrentUserAsPlayer,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";
import { redirect } from "next/navigation";
import { PlayerCard } from "@/components/player-card";
import { Leaderboard } from "@/components/leaderboard";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isMember = await checkAppMembership();

  if (!isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have access to this app. Please contact an administrator.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  // Ensure current user is in the players list
  await ensureCurrentUserAsPlayer();

  const players = await getPlayers();
  const tonightStart = getStartDateForRange("tonight");
  const tonightLeaderboard = await getLeaderboard(tonightStart);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🎲 Mexico</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/profile">
              <Button variant="outline" size="sm">Profile</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="sm">Leaderboards</Button>
            </Link>
            <Link href="/log">
              <Button variant="outline" size="sm">Log</Button>
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Players Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Log a Mexico</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>

        {/* Tonight's Leaderboard */}
        <div className="pb-8">
          <Leaderboard
            entries={tonightLeaderboard}
            title="Tonight's Leaderboard"
          />
        </div>
      </div>
    </div>
  );
}
