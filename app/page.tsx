import {
  checkAppMembership,
  checkIsAdmin,
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
import { RefreshButton } from "@/components/refresh-button";
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
          <p className="text-muted-foreground">Vraag de patron voor toegang</p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  // Ensure current user is in the players list
  await ensureCurrentUserAsPlayer();

  const isAdmin = await checkIsAdmin();
  const players = await getPlayers();
  const tonightStart = getStartDateForRange("tonight");
  const tonightLeaderboard = await getLeaderboard(tonightStart);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="mr-2">🎲</span>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Mexico
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/regels">
                <Button variant="ghost" size="sm">
                  Rules
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  Leaderboards
                </Button>
              </Link>
              <Link href="/log">
                <Button variant="ghost" size="sm">
                  Log
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <RefreshButton />
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Players Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Player</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>

        {/* Tonight's Leaderboard */}
        <div className="max-w-2xl mx-auto">
          <Leaderboard
            entries={tonightLeaderboard}
            title="🏆 Tonight's Leaderboard"
          />
        </div>
      </div>
    </div>
  );
}
