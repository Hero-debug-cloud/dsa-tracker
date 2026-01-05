import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types
export type LeaderboardEntry = {
  user: string;
  solved: number;
  medium_hard: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
};

type UseLeaderboardReturn = {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  loadLeaderboard: () => Promise<void>;
};

export const useLeaderboard = (): UseLeaderboardReturn => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leaderboard", {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load leaderboard");
      }

      const leaderboardData = await response.json();
      setLeaderboard(leaderboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(`Failed to load leaderboard: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, router]);

  return {
    leaderboard,
    loading,
    error,
    loadLeaderboard
  };
};