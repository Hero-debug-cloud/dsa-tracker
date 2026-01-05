import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types
export type Stats = {
  attempted: number;
  solved: number;
  completion_percent: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  first_try_accuracy: number;
  early_failure_rate: number;
  avg_medium_time: number | null;
  pending_revisits: number;
  ressolve_success: number | null;
  active_days: number;
  problems_per_day: number;
  solved_last_7_days: number;
  difficulty_progression_index: number;
  activity_log: { date: string; count: number }[];
};

type UseStatsReturn = {
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  loadStats: (user: string) => Promise<void>;
};

export const useStats = (): UseStatsReturn => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }, []);

  const loadStats = useCallback(async (user: string) => {
    if (!user) {
      toast.error("Please select a user to load stats");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stats/${user}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load stats");
      }

      const statsData = await response.json();
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(`Failed to load stats: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, router]);

  return {
    stats,
    loading,
    error,
    loadStats
  };
};