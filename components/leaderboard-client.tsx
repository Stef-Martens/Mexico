"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { Leaderboard } from "@/components/leaderboard";
import { useState } from "react";

interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  mexico_count: number;
}

interface LeaderboardClientProps {
  tonightEntries: LeaderboardEntry[];
  weekEntries: LeaderboardEntry[];
  yearEntries: LeaderboardEntry[];
  allTimeEntries: LeaderboardEntry[];
}

export function LeaderboardClient({
  tonightEntries,
  weekEntries,
  yearEntries,
  allTimeEntries,
}: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState("tonight");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="tonight">Tonight</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="year">Year</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>

      <TabsContent value="tonight">
        <Leaderboard entries={tonightEntries} title="Tonight" />
      </TabsContent>

      <TabsContent value="week">
        <Leaderboard entries={weekEntries} title="This Week" />
      </TabsContent>

      <TabsContent value="year">
        <Leaderboard entries={yearEntries} title="This Year" />
      </TabsContent>

      <TabsContent value="all">
        <Leaderboard entries={allTimeEntries} title="All Time" />
      </TabsContent>
    </Tabs>
  );
}
