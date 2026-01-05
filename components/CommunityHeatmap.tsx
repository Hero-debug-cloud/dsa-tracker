"use client";

import React, { useState, useEffect } from "react";
import { DailyActivity } from "@/lib/hooks/useCommunityStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface CommunityHeatmapProps {
  activity: DailyActivity[];
  loading?: boolean;
  error?: string;
}

const CommunityHeatmap: React.FC<CommunityHeatmapProps> = ({
  activity = [],
  loading = false,
  error,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate all dates for the current year
  const generateYearDates = (year: number): string[] => {
    const dates: string[] = [];
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toISOString().split("T")[0]);
    }

    return dates;
  };

  const yearDates = generateYearDates(currentYear);

  // Create a map of activity by date for quick lookup
  const activityMap = new Map<string, DailyActivity>();
  activity.forEach((item) => {
    activityMap.set(item.date, item);
  });

  // Get intensity level for a date (0-4)
  const getIntensityLevel = (date: string): number => {
    const activityData = activityMap.get(date);
    if (!activityData) return 0;
    return activityData.intensity;
  };

  // Get intensity color based on level
  const getIntensityColor = (level: number): string => {
    const colors = [
      "bg-muted", // 0 - no activity
      "bg-green-200", // 1 - low activity
      "bg-green-400", // 2 - medium activity
      "bg-green-600", // 3 - high activity
      "bg-green-800", // 4 - very high activity
    ];
    return colors[level] || "bg-muted";
  };

  // Get tooltip text for a date
  const getTooltipText = (date: string): string => {
    const activityData = activityMap.get(date);
    if (!activityData) {
      return `${date}: No activity`;
    }
    return `${date}: ${activityData.problemsSolved} problems solved by ${activityData.activeUsers} users`;
  };

  // Handle year navigation
  const handlePrevYear = () => setCurrentYear((prev) => prev - 1);
  const handleNextYear = () => setCurrentYear((prev) => prev + 1);

  // Handle date selection
  const handleDateClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  // Group dates by month for labels
  const getMonthLabels = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, i, 1);
      months.push({
        name: monthDate.toLocaleString("default", { month: "short" }),
        startDay: Math.floor(
          (new Date(currentYear, i, 1).getTime() -
            new Date(currentYear, 0, 1).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      });
    }
    return months;
  };

  const monthLabels = getMonthLabels();

  // Generate weekday labels (starting from Sunday)
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Community Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevYear}
            disabled={currentYear <= 2020}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{currentYear}</span>
          <Button variant="outline" size="sm" onClick={handleNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-4 text-muted-foreground">
            Error loading activity data: {error}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <div className="h-4 w-4 rounded-full bg-primary animate-pulse mx-1"></div>
            <div className="h-4 w-4 rounded-full bg-primary animate-pulse mx-1 delay-75"></div>
            <div className="h-4 w-4 rounded-full bg-primary animate-pulse mx-1 delay-150"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Weekday labels */}
            <div className="flex">
              <div className="w-12" /> {/* Empty space for month labels */}
              <div className="flex-1 grid grid-cols-7 gap-1">
                {weekdayLabels.map((day, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-center text-muted-foreground h-6 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar grid */}
            <div className="space-y-2 overflow-x-auto">
              {/* Month labels */}
              <div className="flex items-center min-w-fit">
                <div className="w-12 flex-shrink-0" />{" "}
                {/* Empty space for weekday labels */}
                <div className="flex gap-1 min-w-fit">
                  {monthLabels.map((month, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-muted-foreground text-center w-12"
                    >
                      {month.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity grid */}
              <div className="flex items-start min-w-fit">
                <div className="w-12 flex-shrink-0 flex flex-col justify-between py-1 h-24">
                  {["Jan", "Apr", "Jul", "Oct"].map((month, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      {month}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1 max-w-full">
                  {/* Create weeks */}
                  {Array.from({ length: 53 }, (_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const dateIndex = weekIndex * 7 + dayIndex;
                        const date = yearDates[dateIndex];

                        if (!date)
                          return <div key={dayIndex} className="w-3 h-3" />;

                        const intensity = getIntensityLevel(date);
                        const isToday =
                          date === new Date().toISOString().split("T")[0];
                        const isSelected = selectedDate === date;

                        return (
                          <div
                            key={date}
                            className={`
                              w-3 h-3 rounded-sm cursor-pointer transition-all duration-200
                              ${getIntensityColor(intensity)}
                              ${isToday ? "border border-primary" : ""}
                              ${isSelected ? "ring-2 ring-ring" : ""}
                              hover:opacity-75 hover:scale-110
                            `}
                            title={getTooltipText(date)}
                            onClick={() => handleDateClick(date)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Intensity legend */}
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2 text-xs">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`w-4 h-4 rounded-sm ${getIntensityColor(level)}`}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityHeatmap;
