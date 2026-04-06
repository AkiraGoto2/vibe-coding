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
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState(exercises.slice(0, 4));

  // Select random exercises based on break duration
  useEffect(() => {
    const numExercises = Math.min(Math.floor(breakDuration / 2), 6);
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    setSelectedExercises(shuffled.slice(0, numExercises));
  }, [breakDuration]);

  const currentExercise = selectedExercises[currentExerciseIndex];

  // Timer logic
  useEffect(() => {
    if (!isPlaying || !currentExercise) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= currentExercise.duration) {
          // Move to next exercise
          if (currentExerciseIndex < selectedExercises.length - 1) {
            setCurrentExerciseIndex((i) => i + 1);
            return 0;
          }
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentExercise, currentExerciseIndex, selectedExercises.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    if (currentExerciseIndex < selectedExercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentTime(0);
    }
  }, [currentExerciseIndex, selectedExercises.length]);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

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
          <h1 className="text-2xl font-semibold text-foreground">Break Time</h1>
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
            onComplete={handleComplete}
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
