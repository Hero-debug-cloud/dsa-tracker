import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Flame, Target } from "lucide-react";
import { CommunityStats } from "@/lib/hooks/useCommunityStats";

interface CommunityStatsCardsProps {
  stats: CommunityStats | null;
  loading?: boolean;
  error?: string;
}

const CommunityStatsCards: React.FC<CommunityStatsCardsProps> = ({ 
  stats, 
  loading = false,
  error 
}) => {
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6 text-center text-destructive">
            Error loading stats
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6 text-center text-destructive">
            Error loading stats
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6 text-center text-destructive">
            Error loading stats
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-6 text-center text-destructive">
            Error loading stats
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted"></div>
              </div>
              <div className="h-3 w-32 bg-muted rounded mt-4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            No stats available
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            No stats available
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            No stats available
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            No stats available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Solved
              </p>
              <h3 className="text-3xl font-bold mt-2 text-primary">
                {stats.totalProblems}
              </h3>
            </div>
            <div className="p-2 bg-primary/20 rounded-full text-primary">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-emerald-500 font-medium">
              {stats.problemsThisWeek}
            </span>{" "}
            this week
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Users
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.activeUsersThisWeek}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Active this week
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Community Streak
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.communityStreak}
              </h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Days with activity
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg per User
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.averageProblemsPerUser}
              </h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <span
              className={`font-medium ${
                stats.weeklyGrowth >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {stats.weeklyGrowth >= 0 ? "+" : ""}
              {stats.weeklyGrowth}%
            </span>{" "}
            weekly growth
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityStatsCards;