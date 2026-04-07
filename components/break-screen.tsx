"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseCard } from "./exercise-card";
import { exercises } from "@/lib/exercises";
import { motion, AnimatePresence } from "framer-motion";

interface BreakScreenProps {
  breakDuration: number;
  onComplete: () => void;
}

export function BreakScreen({ breakDuration, onComplete }: BreakScreenProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // FIX: initialize currentTime at 0, not stale value
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState(exercises.slice(0, 4));

  // Select random exercises based on break duration
  useEffect(() => {
    const numExercises = Math.max(1, Math.min(Math.floor(breakDuration / 2), 6));
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    setSelectedExercises(shuffled.slice(0, numExercises));
    // Reset state when break starts
    setCurrentExerciseIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [breakDuration]);

  const currentExercise = selectedExercises[currentExerciseIndex];

  // FIX: reset currentTime when exercise changes
  useEffect(() => {
    setCurrentTime(0);
  }, [currentExerciseIndex]);

  // Timer logic
  useEffect(() => {
    if (!isPlaying || !currentExercise) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= currentExercise.duration) {
          // Auto-advance to next exercise
          if (currentExerciseIndex < selectedExercises.length - 1) {
            setCurrentExerciseIndex((i) => i + 1);
            // currentTime will be reset by the effect above
            return 0;
          }
          // Last exercise finished — auto complete
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentExercise, currentExerciseIndex, selectedExercises.length]);

  // FIX: auto-complete when last exercise finishes
  useEffect(() => {
    if (!currentExercise) return;
    const isLastExercise = currentExerciseIndex === selectedExercises.length - 1;
    if (isLastExercise && currentTime >= currentExercise.duration) {
      const timeout = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentTime, currentExercise, currentExerciseIndex, selectedExercises.length, onComplete]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    if (currentExerciseIndex < selectedExercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentTime(0);
    }
  }, [currentExerciseIndex, selectedExercises.length]);

  // FIX: keyboard shortcut for break screen Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!currentExercise) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8"
    >
      {/* Header */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Break Time 🧘</h1>
          <p className="text-muted-foreground">Time to stretch and move</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {selectedExercises.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentExerciseIndex
                  ? "bg-primary"
                  : index === currentExerciseIndex
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <ExerciseCard
            exercise={currentExercise}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
            onComplete={onComplete}
            isLast={currentExerciseIndex === selectedExercises.length - 1}
            exerciseIndex={currentExerciseIndex}
            totalExercises={selectedExercises.length}
          />
        </motion.div>
      </AnimatePresence>

      {/* Keyboard shortcut hint */}
      <p className="absolute bottom-8 text-sm text-muted-foreground">
        Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to pause/resume
      </p>
    </motion.div>
  );
}
