import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types
export type Attempt = {
  id: number;
  user: string;
  problem_id: number;
  date: string;
  status: string;
  time_taken?: number;
  first_try: number;
  notes?: string;
  problem_name?: string;
  topic?: string;
  difficulty?: string;
};

type UseAttemptsReturn = {
  attempts: Attempt[];
  loading: boolean;
  error: string | null;
  loadAttempts: (user: string) => Promise<void>;
  addAttempt: (attemptData: Omit<Attempt, 'id'>) => Promise<boolean>;
};

export const useAttempts = (): UseAttemptsReturn => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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

  const loadAttempts = useCallback(async (user: string) => {
    if (!user) {
      toast.error("Please select a user to load attempts");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/attempts?user=${encodeURIComponent(user)}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load attempts");
      }

      const attemptsData = await response.json();
      setAttempts(attemptsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(`Failed to load attempts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, router]);

  const addAttempt = useCallback(async (attemptData: Omit<Attempt, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(attemptData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return false;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add attempt');
      }

      toast.success("Attempt added successfully!");
      // Reload attempts after adding
      await loadAttempts(attemptData.user);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Error adding attempt: ${errorMessage}`);
      return false;
    }
  }, [getAuthHeaders, loadAttempts, router]);

  return {
    attempts,
    loading,
    error,
    loadAttempts,
    addAttempt
  };
};