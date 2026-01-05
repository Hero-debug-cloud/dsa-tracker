import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Types
export type Problem = {
  id: number;
  platform: string;
  name: string;
  link: string;
  topic: string;
  difficulty: string;
  status?: string;
  time_taken?: number;
  first_try?: number;
  date?: string;
  solved_by_users?: string;
};

type UseProblemsReturn = {
  problems: Problem[];
  loading: boolean;
  error: string | null;
  loadProblems: (user?: string) => Promise<void>;
  addProblem: (problemData: Omit<Problem, 'id'>) => Promise<boolean>;
};

export const useProblems = (): UseProblemsReturn => {
  const [problems, setProblems] = useState<Problem[]>([]);
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

  const loadProblems = useCallback(async (user?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = user && user !== "all" ? `/api/problems?user=${encodeURIComponent(user)}` : '/api/problems';
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load problems");
      }

      const problemsData = await response.json();
      setProblems(problemsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(`Failed to load problems: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, router]);

  const addProblem = useCallback(async (problemData: Omit<Problem, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch("/api/problems", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(problemData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return false;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add problem');
      }

      toast.success("Problem added successfully!");
      // Reload problems after adding
      await loadProblems();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Error adding problem: ${errorMessage}`);
      return false;
    }
  }, [getAuthHeaders, loadProblems, router]);

  return {
    problems,
    loading,
    error,
    loadProblems,
    addProblem
  };
};