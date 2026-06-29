import {
  checkAppMembership,
  getCurrentUser,
  getLeaderboard,
} from "@/lib/queries";
import { getStartDateForRange } from "@/lib/time-ranges";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui";
import Link from "next/link";
import { LeaderboardClient } from "@/components/leaderboard-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
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

  // Fetch all leaderboards in parallel
  const [tonightEntries, weekEntries, monthEntries, yearEntries, allTimeEntries] =
    await Promise.all([
      getLeaderboard(getStartDateForRange("tonight")),
      getLeaderboard(getStartDateForRange("week")),
      getLeaderboard(getStartDateForRange("month")),
      getLeaderboard(getStartDateForRange("year")),
      getLeaderboard(getStartDateForRange("all")),
    ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                📊 Leaderboards
              </h1>
            </div>
          </div>
          {/* <SignOutButton /> */}
        </div>

        {/* Leaderboard Tabs */}
        <div className="pb-8">
          <LeaderboardClient
            tonightEntries={tonightEntries}
            weekEntries={weekEntries}
            monthEntries={monthEntries}
            yearEntries={yearEntries}
            allTimeEntries={allTimeEntries}
          />
        </div>
      </div>
    </div>
  );
}
