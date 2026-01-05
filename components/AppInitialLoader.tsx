"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DSAFullScreenLoader } from "@/components/ui/DSALoader";
import { useMinimumLoadingTime } from "@/lib/hooks";

interface AppInitialLoaderProps {
  children: React.ReactNode;
}

export function AppInitialLoader({ children }: AppInitialLoaderProps) {
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const pathname = usePathname();

  // Show loader for minimum 2 seconds on initial load
  const showLoader = useMinimumLoadingTime(isInitialLoading, 2000);

  useEffect(() => {
    // Only check once when the component first mounts
    if (hasChecked) {
      return;
    }

    // Don't show loader on login page
    if (pathname === "/login") {
      setHasChecked(true);
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Not authenticated, don't show loader
      setHasChecked(true);
      return;
    }

    // Check if this is a hard refresh by looking at navigation type
    const navigation = window.performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const isHardRefresh = navigation && navigation.type === "reload";

    // Also check if this is the first load (no session storage flag)
    const isFirstLoad = !sessionStorage.getItem("dsaTrackerAppLoaded");

    if (isHardRefresh || isFirstLoad) {
      // This is a hard refresh or first visit - show the DSA loader
      setIsInitialLoading(true);
      sessionStorage.setItem("dsaTrackerAppLoaded", "true");

      // Simulate initial loading time
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 100);
    }

    setHasChecked(true);
  }, [pathname, hasChecked]);

  // Show loader only when loading
  if (showLoader) {
    return <DSAFullScreenLoader text="Initializing DSA Tracker..." />;
  }

  return <>{children}</>;
}
