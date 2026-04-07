"use client";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  remainingSeconds: number;
  isRunning: boolean;
  totalSeconds: number;
}

export function TimerDisplay({ remainingSeconds, isRunning, totalSeconds }: TimerDisplayProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  // Avoid division by zero
  const safeTotal = totalSeconds > 0 ? totalSeconds : 1;
  const progress = ((safeTotal - remainingSeconds) / safeTotal) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isLowTime = remainingSeconds <= 300; // 5 minutes or less

  return (
    <div className="relative flex items-center justify-center">
      {/* Background circle */}
      <svg className="w-72 h-72 -rotate-90" viewBox="0 0 256 256">
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-1000 ease-linear",
            isLowTime ? "text-orange-400" : "text-primary"
          )}
        />
      </svg>

      {/* Timer text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-6xl font-light tracking-tight tabular-nums",
            isLowTime ? "text-orange-400" : "text-foreground"
          )}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="text-sm text-muted-foreground mt-2">
          {isRunning ? "Until break" : "Paused"}
        </span>
      </div>
    </div>
  );
}
