"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useLeaderboard } from "@/lib/hooks";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const router = useRouter();
  const { leaderboard, loading, error, loadLeaderboard } = useLeaderboard();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Load leaderboard when component mounts
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankIcon = (index: number) => {
    const rank = index + 1;
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-muted-foreground font-medium w-5 text-center inline-block">{rank}</span>;
    }
  };

  const getRankStyles = (index: number) => {
    if (index === 0) return "bg-yellow-500/5 hover:bg-yellow-500/10";
    if (index === 1) return "bg-slate-500/5 hover:bg-slate-500/10";
    if (index === 2) return "bg-amber-500/5 hover:bg-amber-500/10";
    return "hover:bg-muted/50";
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Global Leaderboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See who's leading the charts in solving DSA problems.
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-card/60 backdrop-blur-xl ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Top Solvers
                </CardTitle>
                <CardDescription>
                  Rankings are updated in real-time based on problems solved
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full border">
                Total Parameters: {leaderboard.length} users
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px] text-center font-bold">Rank</TableHead>
                  <TableHead className="font-bold">User</TableHead>
                  <TableHead className="text-right font-bold text-emerald-600 dark:text-emerald-400">Easy</TableHead>
                  <TableHead className="text-right font-bold text-amber-600 dark:text-amber-400">Medium</TableHead>
                  <TableHead className="text-right font-bold text-rose-600 dark:text-rose-400">Hard</TableHead>
                  <TableHead className="text-right font-bold pr-8">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="h-16 text-center"><div className="h-6 w-6 bg-muted/50 rounded-full animate-pulse mx-auto" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-muted/50 rounded animate-pulse" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-8 bg-muted/50 rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-8 bg-muted/50 rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-8 bg-muted/50 rounded animate-pulse ml-auto" /></TableCell>
                      <TableCell className="text-right pr-8"><div className="h-4 w-12 bg-muted/50 rounded animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <TableRow key={entry.user} className={cn("transition-colors cursor-default", getRankStyles(index))}>
                      <TableCell className="text-center font-medium">
                        <div className="flex items-center justify-center">
                          {getRankIcon(index)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                            {entry.user.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground/90">{entry.user}</span>
                            {index === 0 && <span className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-400">Leader</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-500 font-medium">{entry.easy_solved}</TableCell>
                      <TableCell className="text-right font-mono text-amber-600 dark:text-amber-500 font-medium">{entry.medium_solved}</TableCell>
                      <TableCell className="text-right font-mono text-rose-600 dark:text-rose-500 font-medium">{entry.hard_solved}</TableCell>
                      <TableCell className="text-right pr-8">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-primary/10 text-primary">
                          {entry.solved}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Trophy className="h-10 w-10 text-muted-foreground/30" />
                        <p>No leaderboard data found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}