import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Calendar, Trophy, RotateCcw } from "lucide-react";
import { CommunityGoal } from "@/lib/hooks/useCommunityStats";

interface CommunityGoalsProps {
  goals: CommunityGoal[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

const CommunityGoals: React.FC<CommunityGoalsProps> = ({ 
  goals = [], 
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
            <Target className="h-5 w-5 text-primary" />
            Community Goals
          </CardTitle>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm">
            <RotateCcw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Error loading goals: {error}
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
            <Target className="h-5 w-5 text-primary" />
            Community Goals
          </CardTitle>
          <Button onClick={handleRefresh} disabled={refreshing} size="sm">
            <RotateCcw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Function to calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Community Goals
        </CardTitle>
        <Button onClick={handleRefresh} disabled={refreshing} size="sm">
          <RotateCcw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals
              .filter((goal) => goal.isActive)
              .map((goal) => {
                const progress = Math.min((goal.current / goal.target) * 100, 100);
                const daysRemaining = getDaysRemaining(goal.endDate);
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-1">
                          {goal.type === 'streak' ? <Trophy className="h-3 w-3" /> : 
                           goal.type === 'users' ? <Calendar className="h-3 w-3" /> : 
                           <Target className="h-3 w-3" />}
                          {goal.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                      <span className="text-xs font-medium">
                        {goal.current}/{goal.target}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ending soon!'}
                      </span>
                      <span>
                        {Math.round(progress)}% complete
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No active challenges</p>
            <p className="text-sm mt-2">
              Check back soon for new community goals!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityGoals;