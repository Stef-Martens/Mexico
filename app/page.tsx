import {
  checkAppMembership,
  checkIsAdmin,
  getCurrentUser,
  getPlayers,
  getLeaderboard,
  ensureCurrentUserAsPlayer,
  getEquippedCosmeticsForAllPlayers,
  getPlayersWithPendingAdFundums,
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
  const [tonightLeaderboard, equippedCosmetics, pendingFundumPlayerIds] =
    await Promise.all([
      getLeaderboard(tonightStart),
      getEquippedCosmeticsForAllPlayers(),
      getPlayersWithPendingAdFundums(),
    ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header Bar - Mobile Optimized */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-2.5">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold flex items-center">
                <span className="text-2xl mr-1.5">🎲</span>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Mexico
                </span>
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <RefreshButton />
              <SignOutButton />
            </div>
          </div>

          {/* Navigation Row */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <Link href="/regels" className="flex-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-1.5 text-xs"
              >
                📖 Rules
              </Button>
            </Link>
            <Link href="/profile" className="flex-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-1.5 text-xs"
              >
                👤 Profile
              </Button>
            </Link>
            <Link href="/leaderboard" className="flex-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-1.5 text-xs"
              >
                🏆 Board
              </Button>
            </Link>
            <Link href="/shop" className="flex-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-1.5 text-xs"
              >
                🛒 Shop
              </Button>
            </Link>
            <Link href="/ad-fundums" className="flex-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-1.5 text-xs"
              >
                🍺 Adjes
              </Button>
            </Link>
            <Link href="/log" className="flex-1 min-w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-1.5 text-xs"
              >
                📋 Log
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex-1 min-w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 px-1.5 text-xs"
                >
                  ⚙️ Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-4 space-y-6">
        {/* Players Section */}
        <div>
          <h2 className="text-lg font-bold mb-3">Select Player</h2>
          <div className="grid grid-cols-2 gap-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                equippedCosmetics={equippedCosmetics[player.id] ?? []}
                hasPendingAdFundum={pendingFundumPlayerIds.has(player.id)}
              />
            ))}
          </div>
        </div>

        {/* Tonight's Leaderboard */}
        <div>
          <Leaderboard
            entries={tonightLeaderboard}
            title="🏆 Tonight's Leaderboard"
          />
        </div>
      </div>
    </div>
  );
}
