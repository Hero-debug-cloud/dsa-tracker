import { useState, useEffect } from 'react';

export interface CommunityStats {
  totalProblems: number;
  activeUsersThisWeek: number;
  communityStreak: number;
  averageProblemsPerUser: number;
  totalUsers: number;
  problemsThisWeek: number;
  mostPopularDifficulty: "easy" | "medium" | "hard";
  weeklyGrowth: number;
}

export interface DailyActivity {
  date: string;
  problemsSolved: number;
  activeUsers: number;
  intensity: number;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  value: number;
  rank: number;
  avatar?: string;
}

export interface LeaderboardData {
  totalSolved: LeaderboardEntry[];
  currentStreak: LeaderboardEntry[];
  weeklyActivity: LeaderboardEntry[];
}

export interface ActivityItem {
  id: string;
  userId: number;
  username: string;
  type: "problem_solved" | "streak_milestone" | "difficulty_milestone";
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CommunityGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  startDate: string;
  endDate: string;
  type: "problems" | "users" | "streak";
  isActive: boolean;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/community/stats', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch community stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

export const useCommunityActivity = (year?: number, days?: number) => {
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (days) params.append('days', days.toString());
      
      const response = await fetch(`/api/community/activity?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch community activity');
      }
      const data = await response.json();
      setActivity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [year, days]);

  return { activity, loading, error, refetch: fetchActivity };
};

export const useCommunityLeaderboards = (type?: string, limit?: number) => {
  const [leaderboards, setLeaderboards] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboards = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`/api/community/leaderboards?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboards');
      }
      const data = await response.json();
      setLeaderboards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [type, limit]);

  return { leaderboards, loading, error, refetch: fetchLeaderboards };
};

export const useCommunityFeed = (limit?: number, since?: string) => {
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (since) params.append('since', since);
      
      const response = await fetch(`/api/community/feed?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed');
      }
      const data = await response.json();
      setFeed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [limit, since]);

  return { feed, loading, error, refetch: fetchFeed };
};

export const useCommunityGoals = () => {
  const [goals, setGoals] = useState<CommunityGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/community/goals', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch community goals');
      }
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return { goals, loading, error, refetch: fetchGoals };
};