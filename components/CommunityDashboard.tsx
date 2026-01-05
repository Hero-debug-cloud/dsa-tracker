"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowInlineLoader } from "@/components/ui/ArrowLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommunityHeatmap from "./CommunityHeatmap";
import CommunityStatsCards from "./CommunityStatsCards";
import LeaderboardSection from "./LeaderboardSection";
import ActivityFeed from "./ActivityFeed";
import CommunityGoals from "./CommunityGoals";
import {
  useCommunityStats,
  useCommunityActivity,
  useCommunityLeaderboards,
  useCommunityFeed,
  useCommunityGoals,
} from "@/lib/hooks";
import {
  Users,
  Trophy,
  Target,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  Calendar,
  Flame,
} from "lucide-react";

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32 mt-4" />
    </CardContent>
  </Card>
);

const SectionSkeleton = ({ title }: { title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

interface CommunityDashboardProps {
  onUserSelect?: (username: string) => void;
}

export default function CommunityDashboard({
  onUserSelect,
}: CommunityDashboardProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useCommunityStats();
  const {
    activity,
    loading: activityLoading,
    error: activityError,
  } = useCommunityActivity();
  const {
    leaderboards,
    loading: leaderboardsLoading,
    error: leaderboardsError,
  } = useCommunityLeaderboards();
  const { feed, loading: feedLoading, error: feedError } = useCommunityFeed(10);
  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
  } = useCommunityGoals();

  const [users, setUsers] = useState<
    { id: number; name: string; created_at: string }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("/api/users", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized access
            return;
          }
          throw new Error("Failed to load users");
        }
        const userData = await response.json();
        setUsers(userData);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchStats();
    setRefreshing(false);
  };

  const handleUserChange = (username: string) => {
    setSelectedUser(username);
    if (onUserSelect) {
      onUserSelect(username);
    }
  };

  const hasAnyError =
    statsError || activityError || leaderboardsError || feedError || goalsError;
  const isLoading =
    statsLoading ||
    activityLoading ||
    leaderboardsLoading ||
    feedLoading ||
    goalsLoading;

  // Fallback UI for when no data is available
  if (hasAnyError && !stats && !leaderboards && !feed.length && !goals.length) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Community Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover what the community is working on together.
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Welcome to the community! Start solving problems to see community
            activity and join the leaderboards. Your progress will help motivate
            others and contribute to our shared goals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Community Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover what the community is working on together.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="user-select"
              className="text-xs text-muted-foreground"
            >
              View User Stats
            </label>
            <Select
              value={selectedUser || undefined}
              onValueChange={handleUserChange}
              disabled={usersLoading}
            >
              <SelectTrigger id="user-select" className="w-[180px]">
                <SelectValue
                  placeholder={
                    usersLoading ? "Loading users..." : "Select a user"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Community Stats Cards */}
      <CommunityStatsCards
        stats={stats}
        loading={statsLoading}
        error={statsError || undefined}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Activity Heatmap */}
        <div className="lg:col-span-2 w-full">
          {activityLoading ? (
            <SectionSkeleton title="Community Activity" />
          ) : (
            <CommunityHeatmap
              activity={activity}
              loading={activityLoading}
              error={activityError || undefined}
            />
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="w-full">
          <LeaderboardSection
            leaderboards={leaderboards}
            loading={leaderboardsLoading}
            error={leaderboardsError || undefined}
            onUserSelect={onUserSelect}
          />
        </div>
      </div>

      {/* Activity Feed and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div>
          <ActivityFeed
            feed={feed}
            loading={feedLoading}
            error={feedError || undefined}
            onRefresh={refetchStats}
          />
        </div>

        {/* Community Goals */}
        <div>
          <CommunityGoals
            goals={goals}
            loading={goalsLoading}
            error={goalsError || undefined}
            onRefresh={refetchStats}
          />
        </div>
      </div>
    </div>
  );
}
