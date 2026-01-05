"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Target, TrendingUp, Users as UsersIcon } from "lucide-react";

export default function DSATracker() {
  const router = useRouter();

  // Check authentication on component mount
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
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">DSA Tracker Dashboard</CardTitle>
          <p className="text-muted-foreground">Track your Data Structures & Algorithms progress</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('/problems')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Problems</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">View and add problems</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('/attempts')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Attempts</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track</div>
                <p className="text-xs text-muted-foreground">Log your problem attempts</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('/stats')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Statistics</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Analyze</div>
                <p className="text-xs text-muted-foreground">View your performance metrics</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('/leaderboard')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rank</div>
                <p className="text-xs text-muted-foreground">See how you compare</p>
              </CardContent>
            </Card>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}