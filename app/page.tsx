"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Target,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";

export default function DSATracker() {
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 max-w-6xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">DSA Tracker Dashboard</CardTitle>
          <p className="text-muted-foreground">
            Track your Data Structures & Algorithms progress
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow p-4 sm:p-6"
              onClick={() => navigateTo("/problems")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium">Problems</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-xl sm:text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">
                  View and add problems
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow p-4 sm:p-6"
              onClick={() => navigateTo("/attempts")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium">Attempts</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-xl sm:text-2xl font-bold">Track</div>
                <p className="text-xs text-muted-foreground">
                  Log your problem attempts
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow p-4 sm:p-6"
              onClick={() => navigateTo("/stats")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium">
                  Statistics
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-xl sm:text-2xl font-bold">Analyze</div>
                <p className="text-xs text-muted-foreground">
                  View your performance metrics
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow p-4 sm:p-6"
              onClick={() => navigateTo("/leaderboard")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium">
                  Leaderboard
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-xl sm:text-2xl font-bold">Rank</div>
                <p className="text-xs text-muted-foreground">
                  See how you compare
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
