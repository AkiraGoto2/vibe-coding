"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Check, Target } from "lucide-react";
import { Translations } from "@/lib/i18n";
import { Exercise } from "@/lib/exercises";

interface ExerciseCardProps {
  exercise: Exercise;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isLast: boolean;
  exerciseIndex: number;
  totalExercises: number;
  t: Translations;
}

const categoryColors: Record<string, string> = {
  stretch:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  strength: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  cardio:   "bg-red-500/15 text-red-400 border-red-500/30",
  relax:    "bg-green-500/15 text-green-400 border-green-500/30",
};

export function ExerciseCard({
  exercise, currentTime, isPlaying,
  onPlayPause, onSkip, onComplete,
  isLast, exerciseIndex, totalExercises, t,
}: ExerciseCardProps) {
  const progress  = Math.min((currentTime / exercise.duration) * 100, 100);
  const remaining = Math.max(exercise.duration - currentTime, 0);
  const remMin    = Math.floor(remaining / 60);
  const remSec    = remaining % 60;
  const remStr    = `${String(remMin).padStart(2, "0")}:${String(remSec).padStart(2, "0")}`;

  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto">

      {/* ── LEFT: GIF ────────────────────────────────────────── */}
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-muted min-h-[260px] lg:min-h-0">

        <img
          src={exercise.gifUrl}
          alt={exercise.name}
          className="w-full h-full object-cover"
          loading="eager"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fb = e.currentTarget.parentElement?.querySelector(".gif-fallback") as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }}
        />

        {/* Fallback when GIF unavailable */}
        <div className="gif-fallback absolute inset-0 hidden items-center justify-center flex-col gap-3 bg-muted">
          <span className="text-6xl">🏃</span>
          <p className="text-sm text-muted-foreground font-medium">{exercise.name}</p>
        </div>

        {/* Category badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${categoryColors[exercise.category] ?? ""}`}>
          {exercise.category}
        </div>

        {/* Countdown overlay */}
        <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-sm rounded-full px-3.5 py-1.5">
          <span className="text-white text-base font-mono font-semibold tabular-nums">
            {remStr}
          </span>
        </div>

        {/* Progress bar at bottom of GIF */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/25">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── RIGHT: Info + controls ───────────────────────────── */}
      <div className="flex flex-col justify-between lg:w-80 xl:w-96 shrink-0 min-h-0">

        {/* Exercise info */}
        <div className="overflow-hidden">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            {t.breakScreen.exercise} {exerciseIndex + 1} {t.breakScreen.of} {totalExercises}
          </p>
          <h2 className="text-2xl xl:text-3xl font-bold text-foreground leading-tight mb-3 capitalize">
            {exercise.name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {exercise.description}
          </p>
        </div>

        {/* Circular progress ring + timer + buttons */}
        <div className="flex flex-col items-center gap-5 mt-5">

          {/* SVG ring */}
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52"
                fill="none" stroke="currentColor" strokeWidth="7"
                className="text-muted" />
              <circle cx="60" cy="60" r="52"
                fill="none" stroke="currentColor" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-primary transition-all duration-1000 ease-linear" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-semibold tabular-nums">{remStr}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {isPlaying ? "left" : "paused"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline" size="icon"
              onClick={onPlayPause}
              className="w-12 h-12 rounded-full shrink-0"
              title={isPlaying ? "Pause" : "Resume"}
            >
              {isPlaying
                ? <Pause className="h-5 w-5" />
                : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            {isLast ? (
              <Button
                onClick={onComplete}
                className="flex-1 h-12 rounded-full gap-2 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                <Check className="h-4 w-4" />
                {t.exerciseCard.complete}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={onSkip}
                className="flex-1 h-12 rounded-full gap-2 font-medium"
              >
                <SkipForward className="h-4 w-4" />
                {t.exerciseCard.next}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
