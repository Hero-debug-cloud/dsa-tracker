import { useEffect, useState } from 'react';

/**
 * Custom hook to ensure loading state shows for a minimum duration
 * @param isLoading - The actual loading state
 * @param minimumDuration - Minimum time to show loading (in milliseconds)
 * @returns boolean - Whether to show loading state
 */
export function useMinimumLoadingTime(isLoading: boolean, minimumDuration: number = 2000): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && startTime === null) {
      // Start loading - record the start time
      setStartTime(Date.now());
      setShowLoading(true);
    } else if (!isLoading && startTime !== null) {
      // Loading finished - check if minimum time has passed
      const elapsed = Date.now() - startTime;
      const remaining = minimumDuration - elapsed;

      if (remaining > 0) {
        // Wait for the remaining time
        const timer = setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, remaining);

        return () => clearTimeout(timer);
      } else {
        // Minimum time already passed
        setShowLoading(false);
        setStartTime(null);
      }
    }
  }, [isLoading, startTime, minimumDuration]);

  // Reset when loading starts again
  useEffect(() => {
    if (isLoading && !showLoading) {
      setStartTime(Date.now());
      setShowLoading(true);
    }
  }, [isLoading, showLoading]);

  return showLoading;
}