"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseCard } from "./exercise-card";
import { exercises } from "@/lib/exercises";
import { motion, AnimatePresence } from "framer-motion";
import { Translations } from "@/lib/i18n";

interface BreakScreenProps {
  breakDuration: number; // in minutes
  onComplete: () => void;
  t: Translations;
  exerciseTranslations: Translations["exercises"];
}

export function BreakScreen({ breakDuration, onComplete, t, exerciseTranslations }: BreakScreenProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState(exercises.slice(0, 3));

  // Select exercises that fit within breakDuration
  useEffect(() => {
    const totalBreakSeconds = breakDuration * 60;
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);

    // Pick exercises until we fill the break duration
    const selected = [];
    let accumulated = 0;
    for (const ex of shuffled) {
      if (accumulated + ex.duration <= totalBreakSeconds || selected.length === 0) {
        selected.push(ex);
        accumulated += ex.duration;
        if (accumulated >= totalBreakSeconds) break;
      }
    }

    setSelectedExercises(selected.length > 0 ? selected : shuffled.slice(0, 2));
    setCurrentExerciseIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [breakDuration]);

  const currentExercise = selectedExercises[currentExerciseIndex];

  // FIX: reset timer when exercise changes
  useEffect(() => {
    setCurrentTime(0);
  }, [currentExerciseIndex]);

  // Countdown timer — tied to exercise.duration (the ACTUAL time)
  useEffect(() => {
    if (!isPlaying || !currentExercise) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= currentExercise.duration) {
          // Auto advance
          if (currentExerciseIndex < selectedExercises.length - 1) {
            setCurrentExerciseIndex((i) => i + 1);
            return 0;
          }
          return currentExercise.duration; // clamp
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentExercise, currentExerciseIndex, selectedExercises.length]);

  // Auto-complete when last exercise finishes
  useEffect(() => {
    if (!currentExercise) return;
    const isLast = currentExerciseIndex === selectedExercises.length - 1;
    if (isLast && currentTime >= currentExercise.duration) {
      const t = setTimeout(() => onComplete(), 800);
      return () => clearTimeout(t);
    }
  }, [currentTime, currentExercise, currentExerciseIndex, selectedExercises.length, onComplete]);

  // Keyboard shortcut inside break screen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), []);

  const handleSkip = useCallback(() => {
    if (currentExerciseIndex < selectedExercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentTime(0);
    }
  }, [currentExerciseIndex, selectedExercises.length]);

  if (!currentExercise) return null;

  // Apply i18n translations to exercise
  const exTranslation = exerciseTranslations[currentExercise.id as keyof typeof exerciseTranslations];
  const translatedExercise = exTranslation
    ? { ...currentExercise, name: exTranslation.name, description: exTranslation.description }
    : currentExercise;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6"
    >
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t.breakScreen.title}</h1>
          <p className="text-sm text-muted-foreground">{t.breakScreen.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {selectedExercises.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index < currentExerciseIndex
                  ? "bg-primary scale-90"
                  : index === currentExerciseIndex
                  ? "bg-primary w-6 rounded-full"
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
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ExerciseCard
            exercise={translatedExercise}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
            onComplete={onComplete}
            isLast={currentExerciseIndex === selectedExercises.length - 1}
            exerciseIndex={currentExerciseIndex}
            totalExercises={selectedExercises.length}
            t={t}
          />
        </motion.div>
      </AnimatePresence>

      {/* Keyboard hint */}
      <p className="absolute bottom-6 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd>{" "}
        {t.breakScreen.spaceHint}
      </p>
    </motion.div>
  );
}
