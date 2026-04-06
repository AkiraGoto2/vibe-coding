"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Check } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  videoUrl: string;
}

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
}: ExerciseCardProps) {
  const progress = (currentTime / exercise.duration) * 100;

  return (
    <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Exercise {exerciseIndex + 1} of {totalExercises}
            </span>
            <h3 className="text-2xl font-semibold text-foreground mt-1">
              {exercise.name}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-3xl font-light tabular-nums text-primary">
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
            </span>
            <span className="text-muted-foreground">
              {" / "}
              {Math.floor(exercise.duration / 60)}:{String(exercise.duration % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">{exercise.description}</p>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-primary transition-all duration-300 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Video placeholder */}
        <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center overflow-hidden">
          <iframe
            src={exercise.videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onPlayPause}
            className="w-14 h-14 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          {isLast ? (
            <Button
              size="lg"
              onClick={onComplete}
              className="px-8 h-14 rounded-full gap-2"
            >
              <Check className="h-5 w-5" />
              Complete Break
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              onClick={onSkip}
              className="px-6 h-14 rounded-full gap-2"
            >
              <SkipForward className="h-5 w-5" />
              Next Exercise
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
