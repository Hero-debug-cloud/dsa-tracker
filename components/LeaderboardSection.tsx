import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Activity } from "lucide-react";
import {
  LeaderboardData,
  LeaderboardEntry,
} from "@/lib/hooks/useCommunityStats";

interface LeaderboardSectionProps {
  leaderboards: LeaderboardData | null;
  loading?: boolean;
  error?: string;
  onUserSelect?: (username: string) => void;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  leaderboards,
  loading = false,
  error,
  onUserSelect,
}) => {
  const [activeTab, setActiveTab] = useState<string>("totalSolved");

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Error loading leaderboards: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboards) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No leaderboard data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderLeaderboard = (entries: LeaderboardEntry[], title: string) => (
    <div className="space-y-2">
      {entries.slice(0, 10).map((entry) => (
        <div
          key={`${entry.userId}-${entry.rank}`}
          className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
          onClick={() => onUserSelect?.(entry.username)}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-4">
              #{entry.rank}
            </span>
            <span className="text-sm">{entry.username}</span>
          </div>
          <span className="text-sm font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 mb-4">
            <TabsTrigger
              value="totalSolved"
              className="text-xs px-1 py-2 whitespace-nowrap"
            >
              Total
            </TabsTrigger>
            <TabsTrigger
              value="currentStreak"
              className="text-xs px-1 py-2 whitespace-nowrap"
            >
              Streak
            </TabsTrigger>
            <TabsTrigger
              value="weeklyActivity"
              className="text-xs px-1 py-2 whitespace-nowrap"
            >
              Weekly
            </TabsTrigger>
          </TabsList>

          <div className="space-y-0">
            <TabsContent value="totalSolved" className="mt-0">
              {renderLeaderboard(
                leaderboards.totalSolved,
                "Total Problems Solved",
              )}
            </TabsContent>

            <TabsContent value="currentStreak" className="mt-0">
              {renderLeaderboard(leaderboards.currentStreak, "Current Streak")}
            </TabsContent>

            <TabsContent value="weeklyActivity" className="mt-0">
              {renderLeaderboard(
                leaderboards.weeklyActivity,
                "Weekly Activity",
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeaderboardSection;
