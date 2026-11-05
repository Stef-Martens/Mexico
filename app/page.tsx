import {
  checkAppMembership,
  getCurrentUser,
  getPlayers,
  getLeaderboard,
  ensureCurrentUserAsPlayer,
  getEquippedCosmeticsForAllPlayers,
  getPlayersWithPendingAdFundums,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";
import { buildStandings } from "@/lib/standings";
import { redirect } from "next/navigation";
import { PlayerCard } from "@/components/player-card";
import { SignOutButton } from "@/components/sign-out-button";
import { RefreshButton } from "@/components/refresh-button";

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

  const [
    players,
    allTimeLeaderboard,
    tonightLeaderboard,
    equippedCosmetics,
    pendingFundumPlayerIds,
  ] = await Promise.all([
    getPlayers(),
    getLeaderboard(getStartDateForRange("all")),
    getLeaderboard(getStartDateForRange("tonight")),
    getEquippedCosmeticsForAllPlayers(),
    getPlayersWithPendingAdFundums(),
  ]);

  const standings = buildStandings(
    players,
    allTimeLeaderboard,
    tonightLeaderboard,
  );
  const tonightTotal = tonightLeaderboard.reduce(
    (sum, entry) => sum + entry.mexico_count,
    0,
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background py-2 pl-3 pr-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Mexico</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="tabular-nums">{tonightTotal} tonight</span>
          <RefreshButton iconOnly />
        </div>
      </header>

      <main className="grid grid-cols-2 gap-2.5 px-3 pb-4 pt-1">
        {standings.map(({ player, allTimeCount, tonightCount }, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            allTimeCount={allTimeCount}
            tonightCount={tonightCount}
            isLeader={index === 0}
            equippedCosmetics={equippedCosmetics[player.id] ?? []}
            hasPendingAdFundum={pendingFundumPlayerIds.has(player.id)}
          />
        ))}
      </main>
    </div>
  );
}
