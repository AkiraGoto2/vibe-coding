"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Check } from "lucide-react";
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
  exercise,
  currentTime,
  isPlaying,
  onPlayPause,
  onSkip,
  onComplete,
  isLast,
  exerciseIndex,
  totalExercises,
  t,
}: ExerciseCardProps) {
  const progress  = Math.min((currentTime / exercise.duration) * 100, 100);
  const remaining = Math.max(exercise.duration - currentTime, 0);
  const remMin    = Math.floor(remaining / 60);
  const remSec    = remaining % 60;

  return (
    /* Full-height flex layout so the card fills the parent */
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto">

      {/* ── LEFT / GIF ─────────────────────────────────────── */}
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-muted min-h-[280px] lg:min-h-0">

        <img
          src={exercise.gifUrl}
          alt={exercise.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fb = e.currentTarget.parentElement?.querySelector(".gif-fallback") as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }}
        />

        {/* Fallback */}
        <div className="gif-fallback absolute inset-0 hidden items-center justify-center flex-col gap-3 bg-muted">
          <span className="text-7xl">🏃</span>
          <p className="text-sm text-muted-foreground">{exercise.name}</p>
        </div>

        {/* Category badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${categoryColors[exercise.category] ?? ""}`}>
          {exercise.category}
        </div>

        {/* Countdown pill */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5">
          <span className="text-white text-lg font-mono font-semibold tabular-nums">
            {String(remMin).padStart(2, "0")}:{String(remSec).padStart(2, "0")}
          </span>
        </div>

        {/* Progress bar at bottom of GIF */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── RIGHT / INFO + CONTROLS ─────────────────────────── */}
      <div className="flex flex-col justify-between lg:w-80 xl:w-96 shrink-0">

        {/* Top info */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            {t.breakScreen.exercise} {exerciseIndex + 1} {t.breakScreen.of} {totalExercises}
          </p>
          <h2 className="text-3xl xl:text-4xl font-bold text-foreground leading-tight mb-4">
            {exercise.name}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {exercise.description}
          </p>
        </div>

        {/* Circular progress + controls */}
        <div className="flex flex-col items-center gap-6 mt-6">

          {/* Circular progress ring */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor"
                strokeWidth="8" className="text-muted" />
              <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - progress / 100)}
                className="text-primary transition-all duration-1000 ease-linear" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-mono font-semibold tabular-nums">
                {String(remMin).padStart(2,"0")}:{String(remSec).padStart(2,"0")}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                {isPlaying ? "left" : "paused"}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={onPlayPause}
              className="w-12 h-12 rounded-full shrink-0"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
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
