"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ActivityCalendarProps {
  activityData: { [key: string]: number };
  currentStreak: number;
  bestStreak: number;
}

export function ActivityCalendar({
  activityData,
  currentStreak,
  bestStreak,
}: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const problemCount = activityData[dateStr] || 0;
      days.push({
        day,
        dateStr,
        problemCount,
        isToday:
          day === new Date().getDate() &&
          month === new Date().getMonth() &&
          year === new Date().getFullYear(),
      });
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Calculate time left in day (mock data)
  const timeLeft = "02:30:01 left";

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth("prev")}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <h3 className="text-sm font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth("next")}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day Info */}
        <div className="text-center mb-3">
          <div className="text-lg font-bold">Day {dayOfMonth}</div>
          <div className="text-xs text-muted-foreground">{timeLeft}</div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="aspect-square sm:aspect-[0.8] md:aspect-square" />;
            }

            const { day: dayNum, problemCount, isToday } = day;

            return (
              <div
                key={dayNum}
                className={`
                  flex items-center justify-center text-xs rounded cursor-pointer
                  transition-colors duration-200
                  ${
                    isToday
                      ? "bg-primary text-primary-foreground font-bold"
                      : problemCount > 0
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "text-muted-foreground hover:bg-muted"
                  }
                  aspect-square sm:aspect-[0.8] md:aspect-square
                `}
                title={
                  problemCount > 0
                    ? `${problemCount} problems solved`
                    : "No problems solved"
                }
              >
                <span className="sm:hidden text-[8px]">{dayNum}</span>
                <span className="hidden sm:block">{dayNum}</span>
              </div>
            );
          })}
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-xs text-muted-foreground">
                Current Streak
              </span>
            </div>
            <div className="text-lg font-bold">
              {currentStreak}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                days
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-muted-foreground">Best Streak</span>
            </div>
            <div className="text-lg font-bold">
              {bestStreak}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                days
              </span>
            </div>
          </div>
        </div>

        {/* Streak Message */}
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Solve one problem a day to keep your streak
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
