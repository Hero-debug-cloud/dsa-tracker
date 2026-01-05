import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw } from "lucide-react";
import { ActivityItem } from "@/lib/hooks/useCommunityStats";

interface ActivityFeedProps {
  feed: ActivityItem[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  feed = [], 
  loading = false,
  error,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm">
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Error loading activity: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm">
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm">
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent>
        {feed.length > 0 ? (
          <div className="space-y-3">
            {feed.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.timestamp)} • {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No recent activity</p>
            <p className="text-sm mt-2">
              Start solving problems to see community activity!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;