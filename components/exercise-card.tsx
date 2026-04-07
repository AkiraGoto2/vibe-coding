"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Check } from "lucide-react";
import { Translations } from "@/lib/i18n";
import { Exercise } from "@/lib/exercises";
import Image from "next/image";

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
  // FIX: cap progress at 100%
  const progress = Math.min((currentTime / exercise.duration) * 100, 100);

  const remaining = Math.max(exercise.duration - currentTime, 0);
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;

  const categoryColors: Record<string, string> = {
    stretch: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    strength: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    cardio: "bg-red-500/20 text-red-400 border-red-500/30",
    relax: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <Card className="w-full max-w-lg bg-card/90 backdrop-blur-sm border-border/50 shadow-2xl">
      <CardContent className="p-0 overflow-hidden rounded-xl">
        {/* GIF area */}
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {/* FIX: Use img tag for GIFs (Next Image doesn't animate GIFs well) */}
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback: show exercise icon if GIF fails to load
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector(".gif-fallback") as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }
            }}
          />
          {/* Fallback when GIF can't load */}
          <div
            className="gif-fallback absolute inset-0 hidden items-center justify-center flex-col gap-3 bg-muted"
          >
            <div className="text-6xl">🏃</div>
            <p className="text-sm text-muted-foreground">{exercise.name}</p>
          </div>

          {/* Countdown overlay */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-white text-sm font-mono tabular-nums font-medium">
              {String(remainingMin).padStart(2, "0")}:{String(remainingSec).padStart(2, "0")}
            </span>
          </div>

          {/* Category badge */}
          <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColors[exercise.category] ?? ""}`}>
            {exercise.category}
          </div>

          {/* Progress bar overlay at bottom of GIF */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info + controls */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t.breakScreen.exercise} {exerciseIndex + 1} {t.breakScreen.of} {totalExercises}
              </p>
              <h3 className="text-xl font-semibold text-foreground">{exercise.name}</h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            {exercise.description}
          </p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onPlayPause}
              className="w-12 h-12 rounded-full"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            {isLast ? (
              <Button
                size="lg"
                onClick={onComplete}
                className="px-6 h-12 rounded-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
                {t.exerciseCard.complete}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={onSkip}
                className="px-6 h-12 rounded-full gap-2"
              >
                <SkipForward className="h-4 w-4" />
                {t.exerciseCard.next}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
