"use client";

import { cn } from "@/lib/utils";
import { Translations } from "@/lib/i18n";

interface TimerDisplayProps {
  remainingSeconds: number;
  isRunning: boolean;
  totalSeconds: number;
  t: Translations;
}

export function TimerDisplay({ remainingSeconds, isRunning, totalSeconds, t }: TimerDisplayProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const safeTotal = totalSeconds > 0 ? totalSeconds : 1;
  const progress = Math.min(((safeTotal - remainingSeconds) / safeTotal) * 100, 100);
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isLowTime = remainingSeconds <= 300;
  const isVeryLow = remainingSeconds <= 60;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
        {/* Track */}
        <circle cx="128" cy="128" r="110" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/60" />
        {/* Progress */}
        <circle
          cx="128"
          cy="128"
          r="110"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-1000 ease-linear",
            isVeryLow ? "text-red-500" : isLowTime ? "text-orange-400" : "text-primary"
          )}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-5xl font-light tracking-tight tabular-nums font-mono",
            isVeryLow ? "text-red-500" : isLowTime ? "text-orange-400" : "text-foreground"
          )}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">
          {isRunning ? t.untilBreak : t.paused}
        </span>
      </div>
    </div>
  );
}
