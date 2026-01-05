"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, HelpCircle, Settings } from "lucide-react";

interface CircularProgressProps {
  solved: number;
  total: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  platform?: string;
}

export function CircularProgress({
  solved,
  total,
  easyCount,
  mediumCount,
  hardCount,
  platform = "NeetCode 150",
}: CircularProgressProps) {
  const percentage = total > 0 ? (solved / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // smaller radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {/* Difficulty Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-muted-foreground">Easy</span>
            </div>
            <span className="text-xs font-medium">{easyCount}/28</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-muted-foreground">Med</span>
            </div>
            <span className="text-xs font-medium">{mediumCount}/101</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-xs text-muted-foreground">Hard</span>
            </div>
            <span className="text-xs font-medium">{hardCount}/21</span>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{solved}</span>
              <span className="text-sm text-muted-foreground">/{total}</span>
              <span className="text-xs text-muted-foreground">Solved</span>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="mb-3">
          <Button variant="outline" size="sm" className="w-full text-xs">
            🚀 {platform} ▼
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-1">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <HelpCircle className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
