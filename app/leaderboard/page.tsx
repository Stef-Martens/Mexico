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
          <p className="text-muted-foreground">
            You do not have access to this app. Please contact an administrator.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  // Fetch all leaderboards in parallel
  const [tonightEntries, weekEntries, yearEntries, allTimeEntries] =
    await Promise.all([
      getLeaderboard(getStartDateForRange("tonight")),
      getLeaderboard(getStartDateForRange("week")),
      getLeaderboard(getStartDateForRange("year")),
      getLeaderboard(getStartDateForRange("all")),
    ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">📊 Leaderboards</h1>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* Leaderboard Tabs */}
        <div className="pb-8">
          <LeaderboardClient
            tonightEntries={tonightEntries}
            weekEntries={weekEntries}
            yearEntries={yearEntries}
            allTimeEntries={allTimeEntries}
          />
        </div>
      </div>
    </div>
  );
}
