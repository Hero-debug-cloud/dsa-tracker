"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useStats } from "@/lib/hooks";
import {
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Activity,
  CheckCircle2,
  CircleDashed,
  XCircle,
  BarChart3,
  Flame // For streak/activity
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const [users, setUsers] = useState<{ id: number; name: string; created_at: string }[]>([]);
  const [statsUser, setStatsUser] = useState<string>("");

  const router = useRouter();
  const { stats, loading, error, loadStats } = useStats();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    } else {
      loadUsers();
    }
  }, [router]);

  // Auto-select first user or current user logic could go here
  // For now, let user select manually

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load users");
      }
      const userData = await response.json();
      setUsers(userData);

      // Auto-select logged in user if possible, or just default to something? 
      // For now, let's look for a user that matches the logged in one if possible, 
      // but we don't have the logged in user's name easily accessible without another call or context.
      // So we wait for manual selection.
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleLoadStats = async () => {
    if (!statsUser) {
      toast.error("Please select a user to load stats");
      return;
    }
    await loadStats(statsUser);
  };

  // Colors for Pie Chart
  const COLORS = ['#10b981', '#f59e0b', '#f43f5e']; // Emerald, Amber, Rose

  const difficultyData = stats ? [
    { name: 'Easy', value: stats.easy_solved },
    { name: 'Medium', value: stats.medium_solved },
    { name: 'Hard', value: stats.hard_solved },
  ] : [];

  const activityData = stats?.activity_log || [];

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl space-y-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into your problem solving metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border backdrop-blur-sm">
          <Select value={statsUser} onValueChange={setStatsUser}>
            <SelectTrigger className="w-[180px] border-0 bg-transparent focus:ring-0">
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleLoadStats} size="sm" className="shadow-sm">
            Load Stats
          </Button>
        </div>
      </div>

      {stats ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Solved</p>
                    <h3 className="text-3xl font-bold mt-2 text-primary">{stats.solved}</h3>
                  </div>
                  <div className="p-2 bg-primary/20 rounded-full text-primary">
                    <Trophy className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-emerald-500 font-medium">+{stats.solved_last_7_days}</span> in last 7 days
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                    <h3 className="text-3xl font-bold mt-2">{stats.first_try_accuracy}%</h3>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  First try success rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Days</p>
                    <h3 className="text-3xl font-bold mt-2">{stats.active_days}</h3>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                    <Flame className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Days with at least 1 solve
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consistency</p>
                    <h3 className="text-3xl font-bold mt-2">{stats.problems_per_day}</h3>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Avg. problems per active day
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Activity Chart */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  30 Day Activity
                </CardTitle>
                <CardDescription>Problems solved over the last month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Pie Chart */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Difficulty Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {difficultyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{stats.solved}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span>Easy</span>
                    </div>
                    <span className="font-medium">{stats.easy_solved}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span>Medium</span>
                    </div>
                    <span className="font-medium">{stats.medium_solved}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500" />
                      <span>Hard</span>
                    </div>
                    <span className="font-medium">{stats.hard_solved}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revisit Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CircleDashed className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-medium">Pending Revisits</span>
                    </div>
                    <span className="font-bold">{stats.pending_revisits}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium">Re-solve Success</span>
                    </div>
                    <span className="font-bold">{stats.ressolve_success ? `${stats.ressolve_success}%` : "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium">Avg. Time (Medium)</span>
                    </div>
                    <span className="font-bold">{stats.avg_medium_time ? `${stats.avg_medium_time} min` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-rose-500" />
                      <span className="text-sm font-medium">Early Failure Rate</span>
                    </div>
                    <span className="font-bold">{stats.early_failure_rate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a user to view detailed statistics</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}